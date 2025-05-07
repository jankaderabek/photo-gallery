<script setup lang="ts">
// Fetch all albums for the homepage
const { data: albums } = await useFetch('/api/albums')
</script>

<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-8">Photo Gallery</h1>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Your Albums</h2>

      <div v-if="!albums || albums.length === 0" class="p-4 bg-gray-50 rounded mb-4">
        <p class="text-gray-500">No albums yet. Create your first album to get started.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <NuxtLink
          v-for="album in albums.slice(0, 3)"
          :key="album.name"
          :to="`/albums/${album.name}`"
          class="block p-4 border rounded hover:shadow-md transition-shadow"
        >
          <h3 class="font-medium">{{ album.name }}</h3>
        </NuxtLink>
      </div>

      <NuxtLink to="/albums" class="text-blue-500 hover:underline">
        View all albums →
      </NuxtLink>
    </div>

    <div class="flex space-x-4">
      <NuxtLink to="/upload" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Upload Images
      </NuxtLink>

      <NuxtLink to="/albums" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
        Browse Albums
      </NuxtLink>
    </div>
  </div>
</template>
