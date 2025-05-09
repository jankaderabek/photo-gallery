<script setup lang="ts">
const route = useRoute()
const albumId = route.params.album as string

// Fetch album details
const {data: album} = await useFetch(`/api/albums/${albumId}`)

// Display name is the album title
const displayName = computed(() => {
  return album.value?.name || albumId
})

// Fetch images for this album
const {data: images, refresh: refreshImages} = await useFetch(`/api/albums/${albumId}/images`)

// Gallery state
const isGalleryOpen = ref(false)
const selectedImageIndex = ref(0)

// Open gallery with selected image
function openGallery(index: number) {
  selectedImageIndex.value = index
  isGalleryOpen.value = true
}

// Define header links
const links = [
  {
    label: 'Upload to this album',
    to: `/upload?album=${albumId}`,
    icon: 'i-heroicons-arrow-up-tray',
    color: 'primary',
    size: 'lg'
  }
]
</script>

<template>
  <UPage>
    <UPageHeader :title="displayName" :links="links">
      <template #headline>
        <UButton :to="`/albums`" icon="i-heroicons-arrow-left" variant="link">Back to Albums</UButton>
      </template>
    </UPageHeader>

    <UPageBody>
      <UAlert
          v-if="!images || images.length === 0"
          icon="i-heroicons-photo"
          title="No images in this album"
          description="Upload your first image to get started."
          class="mb-4"
      >
        <template #actions>
          <UButton
              :to="`/upload?album=${albumId}`"
              color="primary"
          >
            Upload to this album
          </UButton>
        </template>
      </UAlert>

      <UPageGrid v-else cols="1:4" class="gap-4">
        <UCard
            v-for="(image, index) in images"
            :key="image.id"
            class="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            @click="openGallery(index)"
        >
          <img
              :src="image.previewUrl"
              :alt="image.id"
              class="w-full h-48 object-cover"
          />
        </UCard>
      </UPageGrid>

      <!-- Image Gallery Modal -->
      <ImageGallery
          v-if="images && images.length > 0"
          :images="images"
          :initial-index="selectedImageIndex"
          :open="isGalleryOpen"
          @update:open="isGalleryOpen = $event"
      />
    </UPageBody>
  </UPage>
</template>
