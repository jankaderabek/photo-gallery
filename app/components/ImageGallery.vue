<script setup lang="ts">
interface Image {
  id: string
  url: string
  previewUrl: string
  uploadedAt: string
}

const props = defineProps<{
  images: Image[]
  initialIndex?: number
  open: boolean
  albumId?: string
}>()

const emit = defineEmits(['update:open', 'image-deleted'])

// Get user session to check if admin
const { user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')

// Delete confirmation
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')

// Current image index
const currentIndex = ref(props.initialIndex || 0)

// Loading state
const isLoading = ref(false)

// Computed properties for navigation
const currentImage = computed(() => props.images[currentIndex.value])
const hasNext = computed(() => currentIndex.value < props.images.length - 1)
const hasPrevious = computed(() => currentIndex.value > 0)
const imageCount = computed(() => props.images.length)

// Image loading handler
function handleImageLoad() {
  isLoading.value = false
}

function handleImageError() {
  isLoading.value = false
  // Could add error handling here
}

// Navigation methods
function next() {
  if (hasNext.value) {
    isLoading.value = true
    currentIndex.value++
  }
}

function previous() {
  if (hasPrevious.value) {
    isLoading.value = true
    currentIndex.value--
  }
}

function close() {
  emit('update:open', false)
  showDeleteConfirm.value = false
}

async function deleteCurrentImage() {
  if (!currentImage.value || !props.albumId) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    const response = await $fetch(`/api/albums/${props.albumId}/images/${encodeURIComponent(currentImage.value.id)}`, {
      method: 'DELETE',
    })

    if (response.success) {
      // Emit event to parent to refresh images
      emit('image-deleted', currentImage.value.id)

      // Close modal if this was the last image
      if (props.images.length <= 1) {
        close()
      }
      else if (currentIndex.value === props.images.length - 1) {
        // If we deleted the last image, go to the previous one
        currentIndex.value--
      }
      // Otherwise stay on the same index (which will show the next image)
    }
  }
  catch (error) {
    console.error('Error deleting image:', error)
    deleteError.value = 'Failed to delete image'
  }
  finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

// Watch for initialIndex changes
watch(() => props.initialIndex, (newIndex) => {
  if (newIndex !== undefined) {
    isLoading.value = true
    currentIndex.value = newIndex
  }
})

// Watch for open changes to reset index if closed
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Set loading state when opened
    isLoading.value = true
  }
  else {
    // Reset to initial index when closed
    currentIndex.value = props.initialIndex || 0
  }
})

defineShortcuts({
  arrowright: {
    handler: () => next(),
  },
  arrowleft: {
    handler: () => previous(),
  },
  escape: {
    handler: () => close(),
  },
})
</script>

<template>
  <UModal
    :open="open"
    fullscreen
    :ui="{
      wrapper: 'flex flex-col',
      body: 'flex-1 flex items-center justify-center p-0 relative bg-gray-900',
    }"
    :close="false"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <div
        v-if="currentImage"
        class="w-full h-full flex flex-col items-center justify-center relative"
      >
        <div class="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm z-10">
          {{ currentIndex + 1 }} / {{ imageCount }}
        </div>

        <!-- Top right buttons -->
        <div class="absolute top-4 right-4 z-10 flex space-x-2">
          <!-- Delete button (admin only) -->
          <UButton
            v-if="isAdmin"
            aria-label="Delete image"
            icon="i-heroicons-trash"
            color="red"
            variant="ghost"
            size="lg"
            class="cursor-pointer"
            :disabled="isDeleting"
            @click="showDeleteConfirm = true"
          />

          <!-- Close button -->
          <UButton
            aria-label="Close gallery"
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="lg"
            class="cursor-pointer"
            @click="close"
          />
        </div>

        <!-- Delete confirmation modal -->
        <UModal
          v-model:open="showDeleteConfirm"
          title="Delete Image"
          :ui="{ footer: 'justify-end' }"
        >
          <template #body>
            <div class="space-y-4">
              <p>Are you sure you want to delete this image?</p>
              <p class="text-red-500 font-medium">
                This action cannot be undone.
              </p>

              <UAlert
                v-if="deleteError"
                color="red"
                variant="soft"
                class="mt-4"
              >
                {{ deleteError }}
              </UAlert>
            </div>
          </template>

          <template #footer>
            <div class="flex gap-2">
              <UButton
                color="gray"
                variant="soft"
                :disabled="isDeleting"
                label="Cancel"
                @click="showDeleteConfirm = false"
              />
              <UButton
                color="red"
                :loading="isDeleting"
                :disabled="isDeleting"
                label="Delete"
                @click="deleteCurrentImage"
              />
            </div>
          </template>
        </UModal>

        <!-- Main image -->
        <div class="w-full h-full flex items-center justify-center p-4 relative">
          <!-- Loading indicator -->
          <div
            v-if="isLoading"
            class="absolute inset-0 flex items-center justify-center z-10"
          >
            <USkeleton class="h-64 w-64 rounded-md" />
          </div>

          <Transition
            name="fade"
            mode="out-in"
          >
            <NuxtImg
              :src="currentImage.url"
              :alt="currentImage.id.split('/').pop()"
              class="max-h-full max-w-full object-contain"
              sizes="100vw sm:50vw md:400px"
              @load="handleImageLoad"
              @error="handleImageError"
            />
          </Transition>
        </div>

        <!-- Navigation buttons -->
        <div class="absolute inset-y-0 left-4 flex items-center">
          <UButton
            v-if="hasPrevious"
            aria-label="Previous image"
            icon="i-heroicons-chevron-left"
            variant="soft"
            class="rounded-full cursor-pointer"
            size="xl"
            @click="previous"
          />
        </div>

        <div class="absolute inset-y-0 right-4 flex items-center">
          <UButton
            v-if="hasNext"
            aria-label="Next image"
            icon="i-heroicons-chevron-right"
            variant="soft"
            class="rounded-full cursor-pointer"
            size="xl"
            @click="next"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
