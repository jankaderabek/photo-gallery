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

// Track image loading state
const isLoading = ref(true)

// Handle image load event
function handleImageLoad() {
  console.log('Image loaded')
  isLoading.value = false
}

// Handle click event
function handleClick() {
  if (props.onClick) {
    props.onClick(props.image)
  }
}
</script>

<template>
  <div>
    <!-- Image placeholder while loading -->
    <div
      v-if="isLoading"
      class="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md flex items-center justify-center aspect-[16/10]"
    >
      <UIcon
        name="i-lineicons-spinner-arrow"
        class="animate-spin text-primary"
        size="lg"
      />
    </div>

    <!-- Actual image -->
    <NuxtImg
      :src="image.url"
      :alt="image.id"
      class="w-full h-full object-contain cursor-pointer transition-opacity rounded-md overflow-hidden"
      sizes="800px sm:1200px"
      format="auto"
      quality="90"
      loading="lazy"
      @load="handleImageLoad"
      @click="handleClick"
    />
  </div>
</template>
