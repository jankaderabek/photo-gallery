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

interface ImageProps {
  image: ImageItem
  onClick?: (image: ImageItem) => void
}

const props = defineProps<ImageProps>()

// Track image loading and error states
const isLoading = ref(true)
const hasError = ref(false)
const retryCount = ref(0)
const maxRetries = 3

// Generate a unique key for the image to force re-render on retry
const imageKey = ref(`${props.image.id}-${Date.now()}`)

// Reset states when image changes
watch(() => props.image, () => {
  if (props.image) {
    isLoading.value = true
    hasError.value = false
    retryCount.value = 0
    imageKey.value = `${props.image.id}-${Date.now()}`
  }
})

// Handle image load event
function handleImageLoad() {
  isLoading.value = false
  hasError.value = false
}

// Handle image error event
function handleImageError() {
  console.error('Image failed to load')
  isLoading.value = false
  hasError.value = true

  // Auto-retry loading the image
  if (retryCount.value < maxRetries) {
    retryLoadImage()
  }
}

// Retry loading the image
function retryLoadImage() {
  // Set a delay that increases with each retry attempt
  const retryDelay = 1000 * retryCount.value

  // Show loading state during delay
  isLoading.value = true

  setTimeout(() => {
    hasError.value = false
    retryCount.value++

    // Generate a new key to force component re-render
    imageKey.value = `${props.image.id}-${Date.now()}`

    console.log(`Retrying image load (${retryCount.value}/${maxRetries})...`)
  }, retryDelay)
}

// Handle manual retry button click
function handleRetry() {
  retryCount.value = 0
  retryLoadImage()
}

// Handle click event
function handleClick() {
  if (!hasError.value && props.onClick) {
    props.onClick(props.image)
  }
}
</script>

<template>
  <div>
    <!-- Image placeholder while loading -->
    <div
      v-if="isLoading "
      class="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md flex items-center justify-center aspect-[16/10]"
    >
      <UIcon
        name="i-lineicons-spinner-arrow"
        class="animate-spin text-primary"
        size="lg"
      />
    </div>

    <!-- Error state with retry button -->
    <div
      v-else-if="hasError"
      class="w-full h-full bg-red-50 dark:bg-red-900/20 rounded-md flex flex-col items-center justify-center aspect-[16/10] border border-red-200 dark:border-red-800"
    >
      <UIcon
        name="i-heroicons-exclamation-triangle"
        class="text-red-500 mb-2"
        size="lg"
      />
      <p class="text-sm text-red-600 dark:text-red-400 mb-2">
        Failed to load image
      </p>
      <UButton
        v-if="retryCount >= maxRetries"
        size="sm"
        color="error"
        variant="soft"
        icon="i-heroicons-arrow-path"
        @click="handleRetry"
      >
        Retry
      </UButton>
      <p
        v-else
        class="text-xs text-red-500 dark:text-red-400"
      >
        Retrying in {{ retryCount }} second(s)... ({{ retryCount }}/{{ maxRetries }})
      </p>
    </div>

    <!-- Actual image -->
    <NuxtImg
      v-show="!hasError"
      :key="imageKey"
      :src="image.url"
      :alt="image.id"
      class="w-full h-full object-contain cursor-pointer transition-opacity rounded-md overflow-hidden"
      sizes="800px sm:1200px"
      format="auto"
      quality="90"
      loading="lazy"
      @load="handleImageLoad"
      @error="handleImageError"
      @click="handleClick"
    />
  </div>
</template>
