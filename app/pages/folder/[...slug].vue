<script setup lang="ts">
  const route = useRoute()

  const folderPath = (route.params.slug as string []).join('/')
  const { data } = await useFetch('/api/images/list/' + folderPath)
</script>

<template>
  <UContainer class="py-8">
    <UPageHeader :title="`Folder: ${folderPath || 'Root'}`" />

    <UDivider class="my-4" />

    <UCard v-if="data && data.folders && data.folders.length > 0" class="mb-6">
      <template #header>
        <h2 class="text-lg font-medium">Folders</h2>
      </template>

      <UList>
        <UListItem v-for="folder in data.folders" :key="folder.pathname">
          <ULink :to="`/folder/${folder}`" class="flex items-center gap-2">
            <UIcon name="i-heroicons-folder" class="text-amber-500" />
            {{ folder }}
          </ULink>
        </UListItem>
      </UList>
    </UCard>

    <UCard v-if="data && data.blobs && data.blobs.length > 0">
      <template #header>
        <h2 class="text-lg font-medium">Images</h2>
      </template>

      <UPageGrid cols="1:3" class="gap-4">
        <UCard v-for="image in data.blobs" :key="image.pathname" class="overflow-hidden">
          <img
            :src="`/images/${image.pathname}`"
            :alt="image.pathname"
            class="w-full h-48 object-cover"
          />
        </UCard>
      </UPageGrid>
    </UCard>

    <UAlert
      v-if="!data || (!data.blobs?.length && !data.folders?.length)"
      icon="i-heroicons-information-circle"
      color="gray"
      title="No content"
      description="This folder is empty."
    />
  </UContainer>
</template>
