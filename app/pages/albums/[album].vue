<script setup lang="ts">
const route = useRoute()
const albumId = route.params.album as string
const img = useImage()

// Fetch album details
const { data: album, error: albumError } = await useFetch(`/api/albums/${albumId}`)

// Display name is the album title
const displayName = computed(() => {
  return album.value?.name || albumId
})

// Check if we have access to this album
const hasAccess = computed(() => !!album.value && !albumError.value)

// Define image type
interface ImageItem {
  id: string
  url: string
  previewUrl: string
  uploadedAt: string
  imageId?: number
  originalWidth: number | null
  originalHeight: number | null
}

interface ImagesResponse {
  images: ImageItem[]
  page: number
  totalPages: number
  totalCount: number
  hasMore: boolean
}

// State for images and pagination
const allImages = ref<ImageItem[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const hasMore = ref(true)
const pageSize = 10

// Function to load images
async function loadImages(reset = false) {
  if (isLoading.value || (!hasMore.value && !reset)) return

  isLoading.value = true

  if (reset) {
    allImages.value = []
    currentPage.value = 1
    hasMore.value = true
  }

  try {
    // Only fetch if we have access to the album
    if (hasAccess.value) {
      // Build the URL with pagination parameters
      const url = `/api/albums/${albumId}/images?limit=${pageSize}&page=${currentPage.value}`

      const response = await $fetch<ImagesResponse>(url)

      if (reset) {
        // Replace images array
        allImages.value = response.images
      }
      else {
        // Add new images to the array
        allImages.value = [...allImages.value, ...response.images]
      }

      // Update pagination state
      totalPages.value = response.totalPages
      totalCount.value = response.totalCount
      hasMore.value = response.hasMore

      // Increment page for next load
      if (hasMore.value) {
        currentPage.value++
      }
    }
  }
  catch (error) {
    console.error('Error loading images:', error)
  }
  finally {
    isLoading.value = false
  }
}

// Initial load of images
await loadImages()

// Image modal state
const isImageModalOpen = ref(false)
const selectedImage = ref<ImageItem | null>(null)

// Open image modal with selected image
function openImageModal(image: ImageItem) {
  selectedImage.value = image
  isImageModalOpen.value = true
}

// Define keyboard shortcuts for the modal
defineShortcuts({
  escape: {
    handler: () => {
      isImageModalOpen.value = false
    },
  },
})

// Get user session to check role
const { user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')

// Define header links - only for admin users
const links = computed(() => {
  if (!isAdmin.value) return []

  return [
    {
      label: 'Upload to this album',
      to: `/upload?album=${albumId}`,
      icon: 'i-heroicons-arrow-up-tray',
      color: 'primary',
    },
    {
      label: 'Delete album',
      icon: 'i-heroicons-trash',
      color: 'error',
      onClick: () => showDeleteAlbumConfirm.value = true,
    },
  ]
})

// Delete album confirmation
const showDeleteAlbumConfirm = ref(false)
const isDeletingAlbum = ref(false)
const deleteAlbumError = ref('')

// Delete album and all its images
async function deleteAlbum() {
  isDeletingAlbum.value = true
  deleteAlbumError.value = ''

  try {
    const response = await $fetch(`/api/albums/${albumId}`, {
      method: 'DELETE',
    })

    if (response.success) {
      // Navigate back to albums list
      navigateTo('/albums')
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_) {
    deleteAlbumError.value = 'Failed to delete album'
  }
  finally {
    isDeletingAlbum.value = false
  }
}
</script>

<template>
  <div class="px-2">
    <UPage>
      <UPageHeader
        :title="displayName"
        :links="links"
      >
        <template #headline>
          <UButton
            :to="`/albums`"
            icon="i-heroicons-arrow-left"
            variant="link"
          >
            Back to Albums
          </UButton>
        </template>
      </UPageHeader>

      <UPageBody>
        <!-- Access denied message -->
        <template v-if="!hasAccess">
          <UAlert
            icon="i-heroicons-lock-closed"
            color="warning"
            title="Access Denied"
            description="You don't have permission to view this private album."
            class="mb-4"
          >
            <template #actions>
              <UButton
                to="/albums"
                color="neutral"
              >
                Back to Albums
              </UButton>
              <UButton
                v-if="!user"
                to="/auth/login"
                color="primary"
              >
                Login
              </UButton>
            </template>
          </UAlert>
        </template>

        <!-- Album content when access is granted -->
        <template v-else>
          <ClientOnly>
            <UAlert
              v-if="!allImages || allImages.length === 0"
              icon="i-heroicons-photo"
              title="No images in this album"
              description="Upload your first image to get started."
              class="mb-4"
            >
              <template #actions>
                <UButton
                  v-if="isAdmin"
                  :to="`/upload?album=${albumId}`"
                  color="primary"
                >
                  Upload to this album
                </UButton>
              </template>
            </UAlert>

            <div
              v-else
              class="grid md:grid-cols-[repeat(auto-fill,minmax(600px,1fr))] gap-2 items-center"
            >
              <div
                v-for="image in allImages"
                :key="image.id"
              >
                <NuxtImg

                  :placeholder="img(image.url, { w: 100, f: 'auto', blur: 2, q: 20 })"
                  :src="image.url"
                  :alt="image.id"
                  class="w-full h-full object-contain  cursor-pointer transition-shadow max-w-4xl"
                  :style="{
                    aspectRatio: image.originalWidth && image.originalHeight ? `${image.originalWidth} / ${image.originalHeight}` : 'auto',
                  }"
                  sizes="640px sm:1200px"
                  format="auto"
                  quality="90"
                  loading="lazy"
                  :width="image.originalWidth || undefined"
                  :height="image.originalHeight || undefined"
                  @click="openImageModal(image)"
                />
              </div>

              <!-- Load more button -->
              <div
                v-if="hasMore"
                class="col-span-full flex justify-center my-4"
              >
                <UButton
                  :loading="isLoading"
                  :disabled="isLoading"
                  @click="() => loadImages()"
                >
                  Load More Images
                </UButton>
              </div>
            </div>
          </ClientOnly>
        </template>

        <!-- Delete Album Confirmation Modal -->
        <UButton
          v-if="false"
          label="Delete Album"
          color="error"
          @click="showDeleteAlbumConfirm = true"
        />
      </UPageBody>
    </UPage>

    <!-- Simple Image Modal -->
    <UModal
      v-model:open="isImageModalOpen"
      fullscreen
      :ui="{
        wrapper: 'flex flex-col',
        body: 'flex-1 flex items-center justify-center p-0 relative bg-gray-900',
      }"
      :close="false"
    >
      <template #body>
        <div
          v-if="selectedImage"
          class="w-full h-full flex flex-col items-center justify-center relative"
        >
          <!-- Close button -->
          <div class="absolute top-4 right-4 z-10">
            <UButton
              aria-label="Close image"
              icon="i-heroicons-x-mark"
              variant="ghost"
              size="xl"
              class="cursor-pointer"
              @click="isImageModalOpen = false"
            />
          </div>

          <!-- Main image -->
          <div class="w-full h-full flex items-center justify-center relative">
            <NuxtImg
              v-if="selectedImage"
              :key="selectedImage.id"
              :src="selectedImage.url"
              :alt="selectedImage.id.split('/').pop()"
              class="max-h-full max-w-full w-full h-auto object-contain"
              :style="{
                aspectRatio: selectedImage.originalWidth && selectedImage.originalHeight ? `${selectedImage.originalWidth} / ${selectedImage.originalHeight}` : 'auto',
              }"
              format="auto"
              :width="selectedImage.originalWidth || undefined"
              :height="selectedImage.originalHeight || undefined"
              :placeholder="img(selectedImage.url, { w: 100, f: 'auto', blur: 2, q: 20 })"
            />
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="showDeleteAlbumConfirm"
      title="Delete Album"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">
          <p>Are you sure you want to delete the album <strong>{{ displayName }}</strong> and all its images?</p>
          <p class="text-red-500 font-medium">
            This action cannot be undone.
          </p>

          <UAlert
            v-if="deleteAlbumError"
            color="error"
            variant="soft"
            class="mt-4"
          >
            {{ deleteAlbumError }}
          </UAlert>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="soft"
            :disabled="isDeletingAlbum"
            label="Cancel"
            @click="showDeleteAlbumConfirm = false"
          />
          <UButton
            color="error"
            :loading="isDeletingAlbum"
            :disabled="isDeletingAlbum"
            label="Delete Album"
            @click="deleteAlbum"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
