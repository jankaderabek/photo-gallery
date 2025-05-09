<script setup lang="ts">
// Fetch all albums for the homepage
const { data: albums } = await useFetch('/api/albums')

// Get user session to check role
const { user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')

// Define links based on user role
const heroLinks = computed(() => {
  const links = [
    { label: 'Browse Albums', to: '/albums', color: 'neutral' as const },
  ]

  if (isAdmin.value) {
    links.unshift({ label: 'Upload Images', to: '/upload', color: 'primary' as const })
  }

  return links
})
</script>

<template>
  <UContainer class="py-16">
    <UPageHero
      title="Photo Gallery"
      description="Store and organize your photos in albums"
      :links="heroLinks"
    />

    <UPageSection title="Your Albums">
      <UAlert
        v-if="!albums || albums.length === 0"
        icon="i-heroicons-information-circle"
        color="neutral"
        title="No albums yet"
        description="Create your first album to get started."
      />

      <UCard
        v-else
        class="mb-4"
      >
        <UPageGrid cols="1:3">
          <div
            v-for="album in albums.slice(0, 3)"
            :key="album.name"
            class="cursor-pointer"
          >
            <NuxtLink
              :to="`/albums/${album.name}`"
              class="block"
            >
              <UCard class="hover:shadow-lg transition-shadow">
                <template #header>
                  <h3 class="text-lg font-medium">{{ album.name }}</h3>
                </template>
              </UCard>
            </NuxtLink>
          </div>
        </UPageGrid>

        <template #footer>
          <UButton
            to="/albums"
            color="neutral"
            variant="ghost"
            trailing-icon="i-heroicons-arrow-right"
          >
            View all albums
          </UButton>
        </template>
      </UCard>
    </UPageSection>
  </UContainer>
</template>
