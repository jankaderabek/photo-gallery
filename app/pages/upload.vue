<script setup lang="ts">
const route = useRoute()
const selectedAlbum = ref('')
const newAlbumName = ref('')
const showNewAlbumInput = ref(false)
const isUploading = ref(false)
const isCreatingAlbum = ref(false)
const uploadResults = ref<any[]>([])
const uploadError = ref('')
const processingStatus = ref('')
const MAX_WIDTH = 2000 // Fixed maximum width for resized images
const QUALITY = 0.85 // Fixed JPEG/WebP quality

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
            } else {
              reject(new Error('Failed to create blob from canvas'))
            }
          },
          'image/jpeg', // Convert all images to JPEG for consistency
          QUALITY
        )
      }

      // Set up image error handling
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${file.name}`))
      }

      // Set the image source to the FileReader result
      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string
      } else {
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
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create album')
    }

    const result = await response.json()

    // Refresh the albums list
    await refreshAlbums()

    // Select the newly created album
    selectedAlbum.value = result.name

    // Reset and hide the new album input
    newAlbumName.value = ''
    showNewAlbumInput.value = false
  } catch (error) {
    console.error('Error creating album:', error)
    uploadError.value = error instanceof Error ? error.message : 'Unknown error occurred'
  } finally {
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
      const file = input.files[i]

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
      } catch (error) {
        console.warn(`Failed to resize ${file.name}, uploading original:`, error)
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
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Upload failed')
    }

    // Process the response
    const results = await response.json()
    uploadResults.value = results
    processingStatus.value = ''
  } catch (error) {
    console.error('Upload error:', error)
    uploadError.value = error instanceof Error ? error.message : 'Unknown error occurred'
  } finally {
    isUploading.value = false
    // Reset the file input
    input.value = ''
  }
}
</script>

<template>
  <div class="p-4">
    <!-- Album Selection -->
    <div class="mb-4">
      <label for="album-select" class="block mb-2">Select Album:</label>
      <div class="flex space-x-2">
        <select
          id="album-select"
          v-model="selectedAlbum"
          class="flex-grow p-2 border rounded"
          :disabled="isUploading || showNewAlbumInput"
        >
          <option value="" disabled>Select an album</option>
          <option v-for="album in albums" :key="album.id" :value="album.id">
            {{ album.name }}
          </option>
        </select>

        <button
          @click="showNewAlbumInput = !showNewAlbumInput"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="isUploading"
        >
          {{ showNewAlbumInput ? 'Cancel' : 'New Album' }}
        </button>
      </div>
    </div>

    <!-- New Album Input -->
    <div v-if="showNewAlbumInput" class="mb-4 p-4 border rounded bg-gray-50">
      <label for="new-album-name" class="block mb-2">New Album Name:</label>
      <div class="flex space-x-2">
        <input
          id="new-album-name"
          v-model="newAlbumName"
          type="text"
          placeholder="Enter album name"
          class="flex-grow p-2 border rounded"
          :disabled="isCreatingAlbum"
        />
        <button
          @click="createNewAlbum"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          :disabled="isCreatingAlbum || !newAlbumName.trim()"
        >
          {{ isCreatingAlbum ? 'Creating...' : 'Create' }}
        </button>
      </div>
    </div>

    <!-- Image Optimization Info -->
    <div class="mb-4 p-4 bg-gray-50 rounded">
      <h3 class="font-semibold mb-2">Image Optimization</h3>
      <p class="text-sm text-gray-600">Images larger than 2000px wide will be automatically resized before upload to reduce data transfer.</p>
    </div>

    <div class="mb-4">
      <label for="file-upload" class="block mb-2">Select Images:</label>
      <input
        id="file-upload"
        accept="image/jpeg, image/png"
        type="file"
        name="file"
        multiple
        @change="onFileSelect"
        class="w-full p-2 border rounded"
        :disabled="isUploading || !selectedAlbum"
      >
      <p v-if="!selectedAlbum" class="text-sm text-amber-600 mt-1">Please select or create an album first</p>
    </div>

    <!-- Processing status -->
    <div v-if="processingStatus" class="my-4 p-4 bg-blue-50 rounded">
      <p>{{ processingStatus }}</p>
    </div>

    <!-- Loading indicator -->
    <div v-if="isUploading && !processingStatus" class="my-4 p-4 bg-blue-50 rounded">
      <p>Uploading files... Please wait.</p>
    </div>

    <!-- Error message -->
    <div v-if="uploadError" class="my-4 p-4 bg-red-50 text-red-700 rounded">
      <p>{{ uploadError }}</p>
    </div>

    <!-- Results -->
    <div v-if="uploadResults.length > 0" class="my-4">
      <h3 class="text-lg font-semibold mb-2">Upload Results:</h3>
      <ul class="list-disc pl-5">
        <li v-for="(result, index) in uploadResults" :key="index" class="mb-1">
          <span v-if="result.success" class="text-green-600">
            ✓ {{ result.filename }} uploaded successfully
          </span>
          <span v-else class="text-red-600">
            ✗ {{ result.filename }}: {{ result.error }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
