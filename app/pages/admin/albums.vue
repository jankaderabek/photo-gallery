<script setup lang="ts">
// Apply admin middleware
// Import required functions for table
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  middleware: ['admin'],
})

// Fetch albums
const { data: albums, refresh: refreshAlbums } = await useFetch('/api/albums')

// Define album type
type Album = {
  id: string
  name: string
  path: string
  dateCreated: string
}

// Define table columns
const UButton = resolveComponent('UButton')

const columns: TableColumn<Album>[] = [
  { accessorKey: 'name', header: 'Album Name' },
  {
    accessorKey: 'dateCreated',
    header: 'Created Date',
    cell: ({ row }) => {
      return new Date(row.getValue('dateCreated')).toLocaleString()
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return h('div', { class: 'flex space-x-2' }, [
        h(UButton, {
          color: 'primary',
          variant: 'soft',
          icon: 'i-heroicons-pencil-square',
          size: 'sm',
          onClick: () => startEditAlbum(row.original),
        }, () => 'Edit'),
        h(UButton, {
          color: 'gray',
          variant: 'soft',
          icon: 'i-heroicons-eye',
          size: 'sm',
          to: `/albums/${row.original.id}`,
        }, () => 'View'),
        h(UButton, {
          color: 'red',
          variant: 'soft',
          icon: 'i-heroicons-trash',
          size: 'sm',
          onClick: () => confirmDeleteAlbum(row.original),
        }, () => 'Delete'),
      ])
    },
  },
]

// New album form
const showNewAlbumForm = ref(false)
const newAlbumName = ref('')
const isCreatingAlbum = ref(false)
const createAlbumError = ref('')

// Edit album form
const editingAlbum = ref<{ id: string, name: string } | null>(null)
const editAlbumName = ref('')
const isEditingAlbum = ref(false)
const editAlbumError = ref('')
const showEditModal = ref(false)

// Delete album confirmation
const albumToDelete = ref<{ id: string, name: string } | null>(null)
const isDeletingAlbum = ref(false)
const deleteAlbumError = ref('')
const showDeleteModal = ref(false)

// Create new album
async function createAlbum() {
  if (!newAlbumName.value.trim()) {
    createAlbumError.value = 'Album name cannot be empty'
    return
  }

  isCreatingAlbum.value = true
  createAlbumError.value = ''

  try {
    const response = await $fetch('/api/albums', {
      method: 'POST',
      body: { name: newAlbumName.value },
    })

    if (response.success) {
      // Reset form and refresh albums
      newAlbumName.value = ''
      showNewAlbumForm.value = false
      await refreshAlbums()
    }
  }
  catch (e: Error | { data?: { message?: string } }) {
    createAlbumError.value = e.data?.message || 'Failed to create album'
  }
  finally {
    isCreatingAlbum.value = false
  }
}

// Start editing album
function startEditAlbum(album: Album) {
  editingAlbum.value = album
  editAlbumName.value = album.name
  editAlbumError.value = ''
  showEditModal.value = true
}

// Cancel editing
function cancelEditAlbum() {
  showEditModal.value = false
  editingAlbum.value = null
  editAlbumName.value = ''
  editAlbumError.value = ''
}

// Save album edit
async function saveAlbumEdit() {
  if (!editingAlbum.value) return
  if (!editAlbumName.value.trim()) {
    editAlbumError.value = 'Album name cannot be empty'
    return
  }

  isEditingAlbum.value = true
  editAlbumError.value = ''

  try {
    const response = await $fetch(`/api/albums/${editingAlbum.value.id}`, {
      method: 'PUT',
      body: { title: editAlbumName.value },
    })

    if (response.success) {
      // Reset form and refresh albums
      showEditModal.value = false
      editingAlbum.value = null
      editAlbumName.value = ''
      await refreshAlbums()
    }
  }
  catch (e: Error | { data?: { message?: string } }) {
    editAlbumError.value = e.data?.message || 'Failed to update album'
  }
  finally {
    isEditingAlbum.value = false
  }
}

// Confirm album deletion
function confirmDeleteAlbum(album: Album) {
  albumToDelete.value = album
  deleteAlbumError.value = ''
  showDeleteModal.value = true
}

// Delete album
async function deleteAlbum() {
  if (!albumToDelete.value) return

  isDeletingAlbum.value = true
  deleteAlbumError.value = ''

  try {
    const response = await $fetch(`/api/albums/${albumToDelete.value.id}`, {
      method: 'DELETE',
    })

    if (response.success) {
      // Reset and refresh albums
      showDeleteModal.value = false
      albumToDelete.value = null
      await refreshAlbums()
    }
  }
  catch (e: Error | { data?: { message?: string } }) {
    deleteAlbumError.value = e.data?.message || 'Failed to delete album'
  }
  finally {
    isDeletingAlbum.value = false
  }
}
</script>

<template>
  <UContainer class="py-8">
    <UPageHeader title="Album Management">
      <template #right>
        <UButton
          color="primary"
          :icon="showNewAlbumForm ? 'i-heroicons-x-mark' : 'i-heroicons-plus'"
          @click="showNewAlbumForm = !showNewAlbumForm"
        >
          {{ showNewAlbumForm ? 'Cancel' : 'Add Album' }}
        </UButton>
      </template>
    </UPageHeader>

    <UDivider class="my-6" />

    <!-- New Album Form -->
    <UCollapsible v-model="showNewAlbumForm">
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">
            Add New Album
          </h2>
        </template>

        <UForm
          class="space-y-4"
          @submit="createAlbum"
        >
          <UFormField
            label="Album Name"
            name="name"
          >
            <UInput
              v-model="newAlbumName"
              placeholder="Enter album name"
            />
          </UFormField>

          <UAlert
            v-if="createAlbumError"
            color="error"
            variant="soft"
            class="my-4"
          >
            {{ createAlbumError }}
          </UAlert>

          <div class="flex justify-start mt-4">
            <UButton
              type="submit"
              color="primary"
              :loading="isCreatingAlbum"
            >
              Create Album
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UCollapsible>

    <!-- Albums Table -->
    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">
          Albums
        </h2>
      </template>

      <div
        v-if="!albums || albums.length === 0"
        class="p-4 text-center"
      >
        <UAlert
          icon="i-heroicons-photo-stack"
          color="neutral"
          title="No albums found"
          description="Create your first album to get started."
        />
      </div>

      <UTable
        v-if="albums && albums.length > 0"
        :data="albums"
        :columns="columns"
        class="w-full"
      />
    </UCard>

    <!-- Edit Album Modal -->
    <UModal
      v-model:open="showEditModal"
      :title="`Edit Album: ${editingAlbum?.name}`"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <UForm class="space-y-4">
          <UFormField
            label="Album Name"
            name="name"
          >
            <UInput
              v-model="editAlbumName"
              placeholder="Enter album name"
            />
          </UFormField>

          <UAlert
            v-if="editAlbumError"
            color="error"
            variant="soft"
            class="my-4"
          >
            {{ editAlbumError }}
          </UAlert>
        </UForm>
      </template>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="soft"
            :disabled="isEditingAlbum"
            label="Cancel"
            @click="cancelEditAlbum"
          />
          <UButton
            color="primary"
            :loading="isEditingAlbum"
            :disabled="isEditingAlbum"
            label="Save"
            @click="saveAlbumEdit"
          />
        </div>
      </template>
    </UModal>

    <!-- Delete Album Confirmation Modal -->
    <UModal
      v-model:open="showDeleteModal"
      title="Delete Album"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">
          <p>Are you sure you want to delete the album "{{ albumToDelete?.name }}"?</p>
          <p class="text-red-500 font-medium">
            This will delete all images in this album. This action cannot be undone.
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
            @click="albumToDelete = null"
          />
          <UButton
            color="red"
            :loading="isDeletingAlbum"
            :disabled="isDeletingAlbum"
            label="Delete"
            @click="deleteAlbum"
          />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
