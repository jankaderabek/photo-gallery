<script setup lang="ts">
const { loggedIn, user, clear: logout } = useUserSession()

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await logout()
  navigateTo('/auth/login')
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <UHeader class="border-b border-gray-200 dark:border-gray-800">
        <template #left>
          <NuxtLink to="/" class="font-bold text-xl">Photo Gallery</NuxtLink>
        </template>
        <template #right>
          <UButton
              to="/albums"
              variant="ghost"
              color="neutral"
          >
            Albums
          </UButton>
          <UButton
              v-if="user?.role === 'admin'"
              to="/upload"
              variant="ghost"
              color="neutral"
          >
            Upload
          </UButton>

          <!-- Auth buttons -->
          <template v-if="loggedIn">
            <!-- Admin link -->
            <UButton
              v-if="user?.role === 'admin'"
              to="/admin/users"
              variant="ghost"
              color="neutral"
            >
              Admin
            </UButton>

            <!-- User menu -->
            <UPopover>
              <UButton color="neutral" variant="ghost" trailing-icon="i-heroicons-chevron-down">
                {{ user?.email }}
              </UButton>

              <template #content>
                <div class="p-2 w-64">
                  <div class="p-2 mb-2 border-b">

                    <div class="flex items-center gap-2 mt-1">
                      <UIcon name="i-heroicons-envelope" class="text-gray-500" />
                      <span class="text-sm text-gray-500">{{ user?.email }}</span>
                    </div>
                  </div>
                  <UButton
                    block
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-arrow-right-on-rectangle"
                    @click="handleLogout"
                  >
                    Logout
                  </UButton>
                </div>
              </template>
            </UPopover>
          </template>

          <template v-else>
            <UButton
              to="/auth/login"
              color="primary"
            >
              Login
            </UButton>
          </template>

          <UColorModeButton />
        </template>
      </UHeader>

      <UMain>
        <UContainer>
          <slot />
        </UContainer>
      </UMain>

      <UFooter class="border-t border-gray-200 dark:border-gray-800">
        <template #left>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            &copy; {{ new Date().getFullYear() }} Photo Gallery
          </div>
        </template>
      </UFooter>
    </div>
  </UApp>
</template>
