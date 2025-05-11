<script setup lang="ts">
import { UBadge } from '#components'

// Fetch all albums
const { data: albums } = await useFetch('/api/albums')

// Get user session to check role
const { user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')
</script>

<template>
  <UPage>
    <UPageHeader title="Albums">
      <template #right>
        <UButton
          v-if="isAdmin"
          to="/upload"
          color="primary"
          icon="i-heroicons-arrow-up-tray"
        >
          Upload Images
        </UButton>
      </template>
    </UPageHeader>

    <UPageBody>
      <UAlert
        v-if="!albums || albums.length === 0"
        icon="i-heroicons-photo-stack"
        color="neutral"
        title="No albums found"
        description="Create your first album to get started."
        class="mb-4"
      >
        <template #actions>
          <UButton
            v-if="isAdmin"
            to="/upload"
            color="primary"
          >
            Create your first album
          </UButton>
        </template>
      </UAlert>

      <UPageGrid
        v-else
        cols="1:3"
        class="gap-6"
      >
        <div
          v-for="album in albums"
          :key="album.id"
          class="cursor-pointer"
        >
          <NuxtLink
            :to="`/albums/${album.id}`"
            class="block"
          >
            <UCard class="hover:shadow-lg transition-shadow">
              <template #header>
                <div class="flex justify-between items-center">
                  <h2 class="text-xl font-semibold">{{ album.name }}</h2>
                  <UBadge
                    v-if="album.isPublic === false"
                    color="orange"
                    variant="subtle"
                    size="sm"
                    class="ml-2"
                  >
                    Private
                  </UBadge>
                </div>
              </template>
            </UCard>
          </NuxtLink>
        </div>
      </UPageGrid>
    </UPageBody>
  </UPage>
</template>
