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
  </UContainer>
</template>
