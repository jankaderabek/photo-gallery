<script setup lang="ts">
  const route = useRoute()
  const { data } = await useFetch('/api/images/list/' + route.params.name)
</script>

<template>
  <div v-if="data">
    <div v-for="image in data.blobs" :key="image.pathname">
      <img :src="`/images/${image.pathname}`" :alt="image.pathname" width="400px" />
      <NuxtImg :src="`/${image.pathname}`" :alt="image.pathname" width="400px" />
    </div>
  </div>

  <ul v-if="data">
    <li v-for="folder in (data.folders ?? [])" :key="folder.pathname">
      <NuxtLink :to="`/folder/${folder}`">{{ folder }}</NuxtLink>
    </li>
  </ul>
</template>
