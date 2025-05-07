<script setup lang="ts">
const route = useRoute()
const albumId = route.params.album as string

// Extract display name from album ID (remove timestamp if present)
const displayName = computed(() => {
  const match = albumId.match(/^\d{8}_\d{6}_(.+)$/)
  return match ? match[1] : albumId
})

// Fetch images for this album
const { data: images, refresh: refreshImages } = await useFetch(`/api/albums/${albumId}/images`)

// Define header links
const links = [
  {
    label: 'Back to Albums',
    to: '/albums',
    icon: 'i-heroicons-arrow-left',
    color: 'gray',
    variant: 'ghost'
  },
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
    <UPageHeader :title="displayName" :links="links" />

    <UPageBody>
      <UAlert
          v-if="!images || images.length === 0"
          icon="i-heroicons-photo"
          color="gray"
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
            v-for="image in images"
            :key="image.id"
            class="overflow-hidden"
        >
          <img
              :src="image.previewUrl"
              :alt="image.name"
              class="w-full h-48 object-cover"
          />
        </UCard>
      </UPageGrid>
    </UPageBody>
  </UPage>
</template>
