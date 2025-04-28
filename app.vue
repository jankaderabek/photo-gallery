<script lang="ts" setup>
  const { data: images } = await useFetch('/api/images');
</script>

<template>
  <div v-if="images">
    <div v-for="image in images" :key="image.pathname">
      <img :src="`/images/${image.pathname}`" :alt="image.pathname" width="400px" />
    </div>
  </div>
</template>
