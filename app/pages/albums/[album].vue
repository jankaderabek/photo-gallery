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
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Album: {{ displayName }}</h1>
      <div class="flex space-x-2">
        <NuxtLink to="/albums" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Back to Albums
        </NuxtLink>
        <NuxtLink
          :to="`/upload?album=${albumId}`"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Images
        </NuxtLink>
      </div>
    </div>

    <div v-if="!images || images.length === 0" class="p-8 text-center bg-gray-50 rounded">
      <p class="text-gray-500 mb-4">No images in this album</p>
      <NuxtLink
        :to="`/upload?album=${albumId}`"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Upload your first image
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="image in images"
        :key="image.id"
        class="border rounded overflow-hidden"
      >
        <img
          :src="image.previewUrl"
          :alt="image.name"
          class="w-full h-48 object-cover"
        />
      </div>
    </div>
  </div>
</template>
