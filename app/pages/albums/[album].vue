<script setup lang="ts">
import AlbumImage from '~/components/AlbumImage.vue'
import ImageModal from '~/components/ImageModal.vue'

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
const pageSize = 6

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

// Ref for intersection observer
const loadMoreTrigger = ref<HTMLElement | null>(null)

// For debouncing the intersection observer callback
let loadImagesTimeout: NodeJS.Timeout | null = null

// Setup intersection observer for infinite scrolling
onMounted(() => {
  // Wait for images to render before initializing the observer
  setTimeout(() => {
    // Don't initialize if there are no images or we're still loading the first batch
    if (allImages.value.length === 0) return
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
      // If the load more trigger is visible and we're not already loading
      if (entries.length > 0 && entries[0]?.isIntersecting && !isLoading.value && hasMore.value) {
        // Debounce the loadImages call to prevent multiple rapid calls
        if (loadImagesTimeout) clearTimeout(loadImagesTimeout)
        loadImagesTimeout = setTimeout(() => {
          loadImages()
          loadImagesTimeout = null
        }, 200)
      }
    }, {
      rootMargin: '50px', // Start loading a bit before the element is visible
      threshold: 0.1, // Trigger when at least 10% of the element is visible
    })

    // Watch for the loadMoreTrigger element to be available
    if (loadMoreTrigger.value) {
      observer.observe(loadMoreTrigger.value)
    }

    // Cleanup on component unmount
    onUnmounted(() => {
      if (loadMoreTrigger.value) {
        observer.unobserve(loadMoreTrigger.value)
      }
      observer.disconnect()

      // Clear any pending timeout
      if (loadImagesTimeout) {
        clearTimeout(loadImagesTimeout)
        loadImagesTimeout = null
      }
    })
  }, 1000) // 1000ms delay to allow images to render
})

// Watch for changes in allImages to reinitialize observer
let observerInitialized = false
watch(allImages, (newImages) => {
  // If we have images and observer isn't initialized yet, trigger the initialization
  if (newImages.length > 0 && !observerInitialized && !isLoading.value) {
    observerInitialized = true
  }
})

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

// We don't need to define keyboard shortcuts here anymore
// The ImageModal component handles its own keyboard shortcuts

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
      color: 'primary' as const,
    },
    {
      label: 'Delete album',
      icon: 'i-heroicons-trash',
      color: 'error' as const,
      onClick: () => { showDeleteAlbumConfirm.value = true },
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
            <!-- Loading state for initial load -->
            <div
              v-if="isLoading && allImages.length === 0"
              class="py-8"
            >
              <div class="flex flex-col items-center justify-center space-y-4">
                <UIcon
                  name="i-lineicons-spinner-arrow"
                  class="animate-spin text-primary"
                  size="lg"
                />
                <p class="text-gray-500">
                  Loading images...
                </p>
              </div>
            </div>

            <!-- No images message -->
            <UAlert
              v-else-if="!allImages || allImages.length === 0"
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
              <AlbumImage
                v-for="image in allImages"
                :key="image.id"
                :image="image"
                @click="openImageModal"
              />

              <!-- Infinite scroll trigger element -->
              <div
                v-if="hasMore"
                ref="loadMoreTrigger"
                class="col-span-full flex justify-center my-6 h-16"
              >
                <span
                  v-if="!isLoading"
                  class="text-gray-400 text-sm"
                >Scroll for more images</span>
              </div>

              <!-- End of content message -->
              <div
                v-if="!hasMore && allImages.length > 0"
                class="col-span-full text-center text-gray-500 my-6"
              >
                <p>End of album</p>
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

    <!-- Image Modal Component -->
    <ImageModal
      v-model:open="isImageModalOpen"
      :image="selectedImage"
    />

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
