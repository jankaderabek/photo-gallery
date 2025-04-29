<script lang="ts" setup>
const { data } = await useFetch('/api/images/list/root');
</script>

<template>
  <ul v-if="data">
    <li v-for="folder in (data.folders ?? [])" :key="folder.pathname">
      <NuxtLink :to="`/folder/${folder}`">{{ folder }}</NuxtLink>
    </li>
  </ul>
</template>
