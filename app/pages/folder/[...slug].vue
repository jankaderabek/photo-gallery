<script setup lang="ts">
  const route = useRoute()

  const folderPath = (route.params.slug as string []).join('/')
  const { data } = await useFetch('/api/images/list/' + folderPath)
</script>

<template>
  <div v-if="data">
    <div v-for="image in data.blobs" :key="image.pathname">
      <img :src="`/images/${image.pathname}`" :alt="image.pathname" width="400px" />
    </div>
  </div>

  <ul v-if="data">
    <li v-for="folder in (data.folders ?? [])" :key="folder.pathname">
      <NuxtLink :to="`/folder/${folder}`">{{ folder }}</NuxtLink>
    </li>
  </ul>
</template>
