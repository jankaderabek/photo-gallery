<script setup lang="ts">
interface ImageItem {
  id: string
  url: string
  previewUrl: string
  uploadedAt: string
  imageId?: number
  originalWidth: number | null
  originalHeight: number | null
}

const props = withDefaults(defineProps<{
  open: boolean
  image: ImageItem | null
}>(), {
  open: false,
  image: null,
})

const emit = defineEmits(['update:open'])

// Create a computed property for the open state to support v-model
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

// Track image loading and error states
const isLoading = ref(true)
const imageError = ref(false)
const retryCount = ref(0)
const maxRetries = 3

// Generate a unique key for the image to force re-render on retry
const imageKey = ref('')

// Reset states when image changes
watch(() => props.image, () => {
  if (props.image) {
    isLoading.value = true
    imageError.value = false
    retryCount.value = 0
    imageKey.value = `${props.image.id}-${Date.now()}`
  }
})

// Handle image load event
function handleImageLoad() {
  isLoading.value = false
  imageError.value = false
}

// Handle image error
function handleImageError() {
  isLoading.value = false
  imageError.value = true

  // Auto-retry loading the image up to maxRetries
  if (retryCount.value < maxRetries) {
    retryLoadImage()
  }
  else {
    console.log('Maximum retry attempts reached')
  }
}

// Retry loading the image
function retryLoadImage() {
  // Increment retry count first
  retryCount.value++

  // Set a delay based on the current retry count (1s, 2s, 3s)
  const retryDelay = 1000 * Math.min(retryCount.value, 3)

  // Show loading state during delay
  isLoading.value = true
  imageError.value = false

  console.log(`Retrying image load in ${retryDelay}ms (attempt ${retryCount.value}/${maxRetries})`)

  // Generate a new key to force component re-render after delay
  setTimeout(() => {
    if (props.image) {
      imageKey.value = `${props.image.id}-${Date.now()}`
    }
  }, retryDelay)
}

// Handle manual retry button click
function handleManualRetry() {
  // Reset retry count and show loading state
  retryCount.value = 0
  isLoading.value = true
  imageError.value = false

  // Wait a moment before generating a new key to force re-render
  setTimeout(() => {
    if (props.image) {
      imageKey.value = `${props.image.id}-${Date.now()}`
    }
  }, 500)
}

// Close the modal
function closeModal() {
  emit('update:open', false)
}

// Define keyboard shortcuts for the modal
defineShortcuts({
  escape: {
    handler: closeModal,
  },
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    fullscreen
    :ui="{
      wrapper: 'flex flex-col',
      body: 'flex-1 flex items-center justify-center p-0 relative bg-gray-900',
    }"
    :close="false"
  >
    <template #body>
      <div
        v-if="image"
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
            @click="closeModal"
          />
        </div>

        <!-- Main image -->
        <div class="w-full h-full flex items-center justify-center relative">
          <!-- Loading state -->
          <div
            v-if="true"
            class="w-full h-full flex items-center justify-center aspect-[16/10]"
          >
            <div class="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md flex items-center justify-center p-20">
              <UIcon
                name="i-lineicons-spinner-arrow"
                class="animate-spin text-primary"
                size="xl"
              />
            </div>
          </div>

          <!-- Error state -->
          <div
            v-else-if="imageError"
            class="flex flex-col items-center justify-center space-y-4 text-white"
          >
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="text-red-500"
              size="xl"
            />
            <p>Failed to load image</p>
            <UButton
              v-if="retryCount >= maxRetries"
              color="error"
              variant="soft"
              icon="i-heroicons-arrow-path"
              @click="handleManualRetry"
            >
              Retry
            </UButton>
            <p
              v-else
              class="text-sm text-gray-400"
            >
              Retrying in {{ Math.min(retryCount, 3) }} second(s)... ({{ retryCount }}/{{ maxRetries }})
            </p>
          </div>

          <!-- Image -->
          <NuxtImg
            v-show="!isLoading && !imageError"
            :key="imageKey"
            :src="image.url"
            :alt="image.id.split('/').pop()"
            class="max-h-full max-w-full w-full h-auto object-contain"
            :style="{
              aspectRatio: image.originalWidth && image.originalHeight ? `${image.originalWidth} / ${image.originalHeight}` : 'auto',
            }"
            format="auto"
            :width="image.originalWidth || undefined"
            :height="image.originalHeight || undefined"
            sizes="800px md:100vw"
            @load="handleImageLoad"
            @error="handleImageError"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
