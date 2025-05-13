<script setup lang="ts">
// Fetch all albums for the homepage
const { data: _albums } = await useFetch('/api/albums')

// Get user session to check role
const { user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')

// Check for login success message
const route = useRoute()
const showLoginSuccess = ref(false)

if (route.query.login_success === 'true') {
  showLoginSuccess.value = true

  // Auto-hide the success message after 5 seconds
  setTimeout(() => {
    showLoginSuccess.value = false
  }, 5000)
}

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
    <UAlert
      v-if="showLoginSuccess"
      color="success"
      variant="soft"
      title="Login Successful"
      description="You have been successfully logged in."
      class="mb-6"
      icon="i-heroicons-check-circle"
    />

    <UPageHero
      title="Photo Gallery"
      description="Store and organize your photos in albums"
      :links="heroLinks"
    />
  </UContainer>
</template>
