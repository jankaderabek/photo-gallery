<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { loggedIn, user, clear: logout } = useUserSession()

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await logout()
  navigateTo('/auth/login')
}

// Get current route for active state detection
const route = useRoute()

// Define navigation menu items
const menuItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: 'Albums',
      to: '/albums',
      active: route.path === '/albums' || route.path.startsWith('/albums/'),
    },
  ]

  // Add admin-only items
  if (user.value?.role === 'admin') {
    items.push({
      label: 'Upload',
      to: '/upload',
      active: route.path === '/upload',
    })

    items.push({
      label: 'Admin',
      trailingIcon: 'i-heroicons-chevron-down',
      active: route.path.startsWith('/admin/'),
      children: [
        {
          label: 'Users',
          icon: 'i-heroicons-user-group',
          to: '/admin/users',
          active: route.path === '/admin/users',
        },
        {
          label: 'Albums',
          icon: 'i-heroicons-photo-stack',
          to: '/admin/albums',
          active: route.path === '/admin/albums',
        },
      ],
    })
  }

  return items
})
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <UHeader class="border-b border-gray-200 dark:border-gray-800">
        <template #left>
          <NuxtLink
            to="/"
            class="font-bold text-xl"
          >Photo Gallery</NuxtLink>
        </template>

        <UNavigationMenu
          :items="menuItems"
          color="neutral"
          variant="pill"
          highlight
        />

        <template #body>
          <UNavigationMenu
            :items="menuItems"
            orientation="vertical"
            class="-mx-2.5"
          />
        </template>

        <template #right>
          <!-- Auth buttons -->
          <template v-if="loggedIn">
            <UPopover>
              <UUser
                :avatar="{
                  icon: 'i-heroicons-user-circle',
                }"
              />

              <template #content>
                <div class="p-2 w-64 divide-gray-100 flex flex-col gap-2">
                  <div class="flex items-center gap-2 justify-center p-2">
                    <UIcon
                      name="i-heroicons-envelope"
                      class="text-gray-500"
                    />
                    <span class="text-sm text-gray-500">{{ user?.email }}</span>
                  </div>

                  <UButton
                    block
                    color="neutral"
                    variant="soft"
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
        <slot />
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
