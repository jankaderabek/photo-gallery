<script setup lang="ts">
// Apply auth middleware
definePageMeta({
  middleware: ['admin'],
})
const route = useRoute()
const selectedAlbum = ref('')
const newAlbumName = ref('')
const showNewAlbumInput = ref(false) // Controls visibility of new album form
const isUploading = ref(false)
const isCreatingAlbum = ref(false)
interface UploadResult {
  id?: string
  name?: string
  path?: string
  size?: number
  type?: string
  error?: string
  status?: string
}

const uploadResults = ref<UploadResult[]>([])
const uploadError = ref('')
const processingStatus = ref('')
const MAX_WIDTH = 4096 // Fixed maximum width for resized images
const QUALITY = 1.0 // Fixed JPEG/WebP quality

// Fetch available albums
const { data: albums, refresh: refreshAlbums } = await useFetch('/api/albums')

// Watch for albums data to be loaded, then set the selected album from URL query parameter
watchEffect(() => {
  if (albums.value && albums.value.length > 0 && route.query.album) {
    // Find the album in the list to ensure it exists
    const albumId = route.query.album as string
    const albumExists = albums.value.some(album => album.id === albumId)

    if (albumExists) {
      selectedAlbum.value = albumId
    }
  }
})

// Hide new album section when an album is selected
watch(selectedAlbum, (newValue) => {
  if (newValue) {
    showNewAlbumInput.value = false
  }
})

/**
 * Resize an image file to reduce its size before uploading
 */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    processingStatus.value = `Resizing ${file.name}...`

    // Create a FileReader to read the file
    const reader = new FileReader()

    // Set up the FileReader onload event
    reader.onload = (readerEvent) => {
      // Create an image element to load the file data
      const img = new Image()

      // Set up the image onload event
      img.onload = () => {
        // Only resize if width exceeds MAX_WIDTH
        if (img.width <= MAX_WIDTH) {
          // No need to resize, return the original file
          resolve(file)
          return
        }

        // Calculate new dimensions while maintaining aspect ratio
        const ratio = MAX_WIDTH / img.width
        const width = MAX_WIDTH
        const height = img.height * ratio

        // Create a canvas element to draw the resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        // Draw the image on the canvas
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert the canvas to a Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            }
            else {
              reject(new Error('Failed to create blob from canvas'))
            }
          },
          'image/jpeg', // Convert all images to JPEG for consistency
          QUALITY,
        )
      }

      // Set up image error handling
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${file.name}`))
      }

      // Set the image source to the FileReader result
      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string
      }
      else {
        reject(new Error('Failed to read file'))
      }
    }

    // Set up FileReader error handling
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`))
    }

    // Read the file as a data URL
    reader.readAsDataURL(file)
  })
}

async function createNewAlbum() {
  if (!newAlbumName.value.trim()) {
    uploadError.value = 'Album name cannot be empty'
    return
  }

  isCreatingAlbum.value = true
  uploadError.value = ''

  try {
    const response = await fetch('/api/albums', {
      method: 'POST',
      body: JSON.stringify({ name: newAlbumName.value }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create album')
    }

    const result = await response.json()

    // Refresh the albums list
    await refreshAlbums()

    // Select the newly created album
    selectedAlbum.value = result.id

    // Reset and hide the new album input
    newAlbumName.value = ''
    showNewAlbumInput.value = false
  }
  catch (error) {
    uploadError.value = error instanceof Error ? error.message : 'Unknown error occurred'
  }
  finally {
    isCreatingAlbum.value = false
  }
}

async function onFileSelect({ target }: Event) {
  const input = target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  if (!selectedAlbum.value) {
    uploadError.value = 'Please select or create an album first'
    return
  }

  isUploading.value = true
  uploadError.value = ''
  uploadResults.value = []
  processingStatus.value = ''

  try {
    // Create a FormData object to handle the files and album
    const formData = new FormData()

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i] as File

      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name} is not an image file`)
      }

      let fileToUpload: Blob | File = file

      // Always try to resize the image if needed
      try {
        fileToUpload = await resizeImage(file)

        // Only show processing message if the file was actually resized
        if (fileToUpload !== file) {
          processingStatus.value = `Processed ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB)`
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      catch (_) {
        processingStatus.value = `Could not resize ${file.name}, uploading original`
      }

      // Add the file to the form data with the original filename
      formData.append(`files`, fileToUpload, file.name)
    }

    // Update status
    processingStatus.value = 'Uploading files to server...'

    // Send the request
    const response = await fetch(`/api/albums/${selectedAlbum.value}/images`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Upload failed')
    }

    // Process the response
    const results = await response.json()
    uploadResults.value = results
    // Show success message instead of clearing processing status
    processingStatus.value = 'Upload completed successfully!'
  }
  catch (error) {
    uploadError.value = error instanceof Error ? error.message : 'Unknown error occurred'
  }
  finally {
    isUploading.value = false
    // Only clear processing status if there was an error
    if (uploadError.value) {
      processingStatus.value = ''
    }
  }
}

const albumOptions = computed(() => {
  return albums.value?.map(album => ({
    label: album.name,
    value: album.id,
  })) || []
})
</script>

<template>
  <UContainer class="py-8">
    <UPageHeader title="Upload Images" />

    <UCard class="my-6">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">
            {{ showNewAlbumInput ? 'Create New Album' : 'Album Selection' }}
          </h2>
          <UButton
            color="primary"
            variant="ghost"
            :icon="showNewAlbumInput ? 'i-heroicons-x-mark' : 'i-heroicons-plus'"
            :disabled="isUploading"
            @click="showNewAlbumInput = !showNewAlbumInput"
          >
            {{ showNewAlbumInput ? 'Select Existing Album' : 'New Album' }}
          </UButton>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Album Selection - Hidden when creating a new album -->
        <div v-if="!showNewAlbumInput">
          <UFormField
            label="Select Album"
            help="Choose an existing album for your photos"
          >
            <USelect
              v-model="selectedAlbum"
              :items="albumOptions"
              placeholder="Select an album"
              :disabled="isUploading"
            />
          </UFormField>
        </div>

        <!-- New Album Form - Only shown when showNewAlbumInput is true -->
        <div v-if="showNewAlbumInput">
          <UCard class="bg-gray-50 dark:bg-gray-800">
            <UFormField
              label="New Album Name"
              help="Enter a name for your new album"
            >
              <div class="flex space-x-2">
                <UInput
                  v-model="newAlbumName"
                  placeholder="Enter album name"
                  :disabled="isCreatingAlbum"
                  class="flex-grow"
                />
                <UButton
                  color="primary"
                  :loading="isCreatingAlbum"
                  :disabled="isCreatingAlbum || !newAlbumName.trim()"
                  @click="createNewAlbum"
                >
                  Create
                </UButton>
              </div>
            </UFormField>
          </UCard>
        </div>
      </div>
    </UCard>

    <UCard class="my-6">
      <template #header>
        <h2 class="text-xl font-semibold">
          Upload Images
        </h2>
      </template>

      <UAlert
        icon="i-heroicons-information-circle"
        color="info"
        title="Image Optimization"
        description="Images larger than 2000px wide will be automatically resized before upload to reduce data transfer."
        class="mb-4"
      />

      <UFormField
        label="Select Images"
        help="Choose images to upload to the selected album"
      >
        <UInput
          type="file"
          accept="image/jpeg, image/png"
          multiple
          :disabled="isUploading || !selectedAlbum"
          @change="onFileSelect"
        />
        <template #help>
          <p
            v-if="!selectedAlbum"
            class="text-amber-600 dark:text-amber-400"
          >
            Please select or create an album first
          </p>
        </template>
      </UFormField>

      <!-- Processing status -->
      <UAlert
        v-if="processingStatus && processingStatus.length > 0"
        :icon="processingStatus.includes('success') ? 'i-heroicons-check-circle' : 'i-heroicons-arrow-path'"
        :color="processingStatus.includes('success') ? 'success' : 'info'"
        :title="processingStatus"
        class="my-4"
      />

      <!-- Loading indicator -->
      <UAlert
        v-if="isUploading && (!processingStatus || processingStatus.length === 0)"
        icon="i-heroicons-arrow-path"
        color="info"
        title="Uploading files..."
        description="Please wait while your files are being uploaded."
        class="my-4"
      />

      <!-- Error message -->
      <UAlert
        v-if="uploadError"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        :title="uploadError"
        class="my-4"
      />

      <!-- Results -->
      <div
        v-if="uploadResults.length > 0"
        class="my-4"
      >
        <h3 class="text-lg font-semibold mb-2">
          Upload Results:
        </h3>
        <ul class="space-y-2">
          <li
            v-for="(result, index) in uploadResults"
            :key="index"
            class="flex items-center gap-2"
          >
            <UIcon
              v-if="result.success"
              name="i-heroicons-check-circle"
              class="text-green-500 dark:text-green-400"
            />
            <UIcon
              v-else
              name="i-heroicons-x-circle"
              class="text-red-500 dark:text-red-400"
            />
            <span
              v-if="result.success"
              class="text-green-600 dark:text-green-400"
            >
              {{ result.filename }} uploaded successfully
            </span>
            <span
              v-else
              class="text-red-600 dark:text-red-400"
            >
              {{ result.filename }}: {{ result.error }}
            </span>
          </li>
        </ul>
      </div>
    </UCard>
  </UContainer>
</template>
