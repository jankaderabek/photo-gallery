<template>
  <div>
    <UHeader class="border-b border-gray-200 dark:border-gray-800">
      <template #left>
        <NuxtLink to="/" class="font-bold text-xl">Photo Gallery</NuxtLink>
      </template>
      <template #right>
        <UButton
            to="/albums"
            variant="ghost"
            color="gray"
        >
          Albums
        </UButton>
        <UButton
            to="/upload"
            variant="ghost"
            color="gray"
        >
          Upload
        </UButton>
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
</template>
