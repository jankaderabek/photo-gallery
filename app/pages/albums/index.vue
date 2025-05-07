<script setup lang="ts">
// Fetch all albums
const { data: albums } = await useFetch('/api/albums')
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-6">Albums</h1>

    <div v-if="!albums || albums.length === 0" class="p-8 text-center bg-gray-50 rounded">
      <p class="text-gray-500 mb-4">No albums found</p>
      <NuxtLink to="/upload" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Create your first album
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="album in albums"
        :key="album.id"
        :to="`/albums/${album.id}`"
        class="block p-4 border rounded hover:shadow-md transition-shadow"
      >
        <h2 class="text-xl font-semibold mb-2">{{ album.name }}</h2>
      </NuxtLink>
    </div>

    <div class="mt-8">
      <NuxtLink to="/upload" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Upload Images
      </NuxtLink>
    </div>
  </div>
</template>
