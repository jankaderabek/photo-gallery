<script setup lang="ts">
const route = useRoute()
const albumId = route.params.album as string

// Fetch album details
const { data: album } = await useFetch(`/api/albums/${albumId}`)

// Display name is the album title
const displayName = computed(() => {
  return album.value?.name || albumId
})

// Fetch images for this album
const { data: images, refresh: refreshImages } = await useFetch(`/api/albums/${albumId}/images`)

// Gallery state
const isGalleryOpen = ref(false)
const selectedImageIndex = ref(0)

// Open gallery with selected image
function openGallery(index: number) {
  selectedImageIndex.value = index
  isGalleryOpen.value = true
}

// Get user session to check role
const { user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')

// Define header links - only for admin users
const links = computed(() => {
  if (!isAdmin.value) return []

  return [
    {
      label: 'Upload to this album',
      to: `/upload?album=${albumId}`,
      icon: 'i-heroicons-arrow-up-tray',
      color: 'primary' as const,
    },
    {
      label: 'Delete album',
      icon: 'i-heroicons-trash',
      color: 'red' as const,
      onClick: () => showDeleteAlbumConfirm.value = true,
    },
  ]
})

// Delete album confirmation
const showDeleteAlbumConfirm = ref(false)
const isDeletingAlbum = ref(false)
const deleteAlbumError = ref('')

// Handle image deletion
async function handleImageDeleted() {
  await refreshImages()
}

// Delete album and all its images
async function deleteAlbum() {
  isDeletingAlbum.value = true
  deleteAlbumError.value = ''

  try {
    const response = await $fetch(`/api/albums/${albumId}`, {
      method: 'DELETE',
    })

    if (response.success) {
      // Navigate back to albums list
      navigateTo('/albums')
    }
  }
  catch (error) {
    console.error('Error deleting album:', error)
    deleteAlbumError.value = 'Failed to delete album'
  }
  finally {
    isDeletingAlbum.value = false
  }
}
</script>

<template>
  <div>
    <UPage>
      <UPageHeader
        :title="displayName"
        :links="links"
      >
        <template #headline>
          <UButton
            :to="`/albums`"
            icon="i-heroicons-arrow-left"
            variant="link"
          >
            Back to Albums
          </UButton>
        </template>
      </UPageHeader>

      <UPageBody>
        <UAlert
          v-if="!images || images.length === 0"
          icon="i-heroicons-photo"
          title="No images in this album"
          description="Upload your first image to get started."
          class="mb-4"
        >
          <template #actions>
            <UButton
              v-if="isAdmin"
              :to="`/upload?album=${albumId}`"
              color="primary"
            >
              Upload to this album
            </UButton>
          </template>
        </UAlert>

        <UPageGrid
          v-else
          cols="1:4"
          class="gap-4"
        >
          <UCard
            v-for="(image, index) in images"
            :key="image.id"
            class="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            @click="openGallery(index)"
          >
            <img
              :src="image.previewUrl"
              :alt="image.id"
              class="w-full h-48 object-cover"
            >
          </UCard>
        </UPageGrid>

        <!-- Image Gallery Modal -->
        <ImageGallery
          v-if="images && images.length > 0"
          :images="images"
          :initial-index="selectedImageIndex"
          :open="isGalleryOpen"
          :album-id="albumId"
          @update:open="isGalleryOpen = $event"
          @image-deleted="handleImageDeleted"
        />
        <!-- Delete Album Confirmation Modal -->
        <UButton
          v-if="false"
          label="Delete Album"
          color="red"
          @click="showDeleteAlbumConfirm = true"
        />
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="showDeleteAlbumConfirm"
      title="Delete Album"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">
          <p>Are you sure you want to delete the album <strong>{{ displayName }}</strong> and all its images?</p>
          <p class="text-red-500 font-medium">
            This action cannot be undone.
          </p>

          <UAlert
            v-if="deleteAlbumError"
            color="red"
            variant="soft"
            class="mt-4"
          >
            {{ deleteAlbumError }}
          </UAlert>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="soft"
            :disabled="isDeletingAlbum"
            label="Cancel"
            @click="showDeleteAlbumConfirm = false"
          />
          <UButton
            color="red"
            :loading="isDeletingAlbum"
            :disabled="isDeletingAlbum"
            label="Delete Album"
            @click="deleteAlbum"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
