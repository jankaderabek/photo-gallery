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
}>()

const emit = defineEmits(['update:open'])

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
  } else {
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
  }
})
</script>

<template>
  <UModal
    :open="open"
    fullscreen
    :ui="{
      wrapper: 'flex flex-col',
      body: 'flex-1 flex items-center justify-center p-0 relative bg-gray-900'
    }"
    @update:open="$emit('update:open', $event)"
    :close="false"
  >
    <template #body>
      <div v-if="currentImage" class="w-full h-full flex flex-col items-center justify-center relative">
        <div class="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm z-10">
          {{ currentIndex + 1 }} / {{ imageCount }}
        </div>

        <!-- Close button -->
        <div class="absolute top-4 right-4 z-10">
          <UButton
            @click="close"
            aria-label="Close gallery"
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="lg"
            class="cursor-pointer"
          />
        </div>

        <!-- Main image -->
        <div class="w-full h-full flex items-center justify-center p-4 relative">
          <!-- Loading indicator -->
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center z-10">
            <USkeleton class="h-64 w-64 rounded-md" />
          </div>

          <Transition name="fade" mode="out-in">
            <img
              :key="currentImage.id"
              :src="currentImage.url"
              :alt="currentImage.id.split('/').pop()"
              class="max-h-full max-w-full object-contain"
              @load="handleImageLoad"
              @error="handleImageError"
            />
          </Transition>
        </div>

        <!-- Navigation buttons -->
        <div class="absolute inset-y-0 left-4 flex items-center">
          <UButton
            v-if="hasPrevious"
            @click="previous"
            aria-label="Previous image"
            icon="i-heroicons-chevron-left"
            variant="soft"
            class="rounded-ful cursor-pointer"
            size="xl"
          />
        </div>

        <div class="absolute inset-y-0 right-4 flex items-center">
          <UButton
            v-if="hasNext"
            @click="next"
            aria-label="Next image"
            icon="i-heroicons-chevron-right"
            variant="soft"
            class="rounded-full cursor-pointer"
            size="xl"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
