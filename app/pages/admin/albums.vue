<script setup lang="ts">
// Apply admin middleware
// Import required functions for table
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UBadge, USwitch } from '#components'

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
  isPublic: boolean
}

// Define table columns
const UButton = resolveComponent('UButton')

const columns: TableColumn<Album>[] = [
  { id: 'name', accessorKey: 'name', header: 'Album Name' },
  {
    id: 'dateCreated',
    accessorKey: 'dateCreated',
    header: 'Created Date',
    cell: ({ row }) => {
      return new Date(row.getValue('dateCreated')).toLocaleString()
    },
  },
  {
    id: 'isPublic',
    accessorKey: 'isPublic',
    header: 'Visibility',
    cell: ({ row }) => {
      return h('div', {}, [
        h(UBadge, {
          color: row.getValue('isPublic') ? 'success' : 'warning',
          variant: 'subtle',
          size: 'sm',
          icon: row.getValue('isPublic') ? 'i-heroicons-globe-alt' : 'i-heroicons-lock-closed',
        }, () => row.getValue('isPublic') ? 'Public' : 'Private'),
      ])
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
          color: 'blue',
          variant: 'soft',
          icon: 'i-heroicons-user-group',
          size: 'sm',
          onClick: () => manageAlbumAccess(row.original),
        }, () => 'Access'),
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
const newAlbumIsPublic = ref(true)
const isCreatingAlbum = ref(false)
const createAlbumError = ref('')

// Edit album form
const editingAlbum = ref<Album | null>(null)
const editAlbumName = ref('')
const editAlbumIsPublic = ref(true)
const isEditingAlbum = ref(false)
const editAlbumError = ref('')
const showEditModal = ref(false)

// Album access management
const showAccessModal = ref(false)
const managingAccessForAlbum = ref<Album | null>(null)
const albumUsers = ref<Array<{ userId: number, email: string, accessId: number }>>([])
const availableUsers = ref<Array<{ id: number, email: string, name: string }>>([])
const selectedUserIds = ref<(number | { value: number, label: string })[]>([])
const isAddingUser = ref(false)
const addUserError = ref('')

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
      body: {
        name: newAlbumName.value,
        isPublic: newAlbumIsPublic.value,
      },
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
  editAlbumIsPublic.value = album.isPublic
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
      body: {
        title: editAlbumName.value,
        isPublic: editAlbumIsPublic.value,
      },
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

// Manage album access
async function manageAlbumAccess(album: Album) {
  managingAccessForAlbum.value = album
  showAccessModal.value = true
  addUserError.value = ''
  selectedUserIds.value = []

  // Fetch users with access to this album
  try {
    const response = await $fetch(`/api/albums/${album.id}/access`)
    albumUsers.value = response.users || []

    // Fetch available users (all users except those who already have access)
    const allUsers = await $fetch('/api/admin/users-for-album-access')

    if (Array.isArray(allUsers)) {
      const existingUserIds = new Set(albumUsers.value.map(u => u.userId))
      availableUsers.value = allUsers.filter(u => !existingUserIds.has(u.id))
    }
    else {
      availableUsers.value = []
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_) {
    availableUsers.value = []
  }
}

// Add multiple users to album access
async function addUsersToAlbum() {
  if (!managingAccessForAlbum.value || selectedUserIds.value.length === 0) return

  isAddingUser.value = true
  addUserError.value = ''

  try {
    // Add each user sequentially
    const results = []
    const errors = []

    // Extract user IDs from the selected values
    const userIds = selectedUserIds.value.map((item) => {
      // If the item is an object with a value property, use that
      if (item && typeof item === 'object' && 'value' in item) {
        return item.value
      }
      // Otherwise use the item directly
      return item
    })

    for (const userId of userIds) {
      try {
        // The API expects a number
        const numericUserId = Number(userId)

        if (isNaN(numericUserId)) {
          throw new Error(`Invalid user ID: ${userId}`)
        }

        // Use the album ID for the API call
        const albumId = managingAccessForAlbum.value.id
        if (!albumId) {
          throw new Error('Album ID is missing')
        }

        const response = await $fetch(`/api/albums/${albumId}/access`, {
          method: 'POST',
          body: { userId: numericUserId },
        })
        results.push(response)
      }
      catch (error: unknown) {
        // Skip users that already have access or other errors
        const errorObj = error as { data?: { message?: string } }
        errors.push({ userId, message: errorObj.data?.message || 'Unknown error' })
      }
    }

    // Show success/error message
    if (results.length > 0) {
      if (errors.length > 0) {
        addUserError.value = `Added ${results.length} user(s). ${errors.length} failed.`
      }
      else {
        addUserError.value = `Added ${results.length} user(s) successfully.`
      }

      // Refresh the user lists
      await manageAlbumAccess(managingAccessForAlbum.value)
      selectedUserIds.value = []
    }
    else if (errors.length > 0) {
      addUserError.value = 'Failed to add any users. They may already have access.'
    }
  }
  catch (e: unknown) {
    const errorObj = e as { data?: { message?: string } }
    addUserError.value = errorObj.data?.message || 'Failed to add users to album'
  }
  finally {
    isAddingUser.value = false
  }
}

// Toggle album visibility
async function toggleAlbumVisibility(val: boolean) {
  if (managingAccessForAlbum.value) {
    try {
      const { error } = await useFetch(`/api/albums/${managingAccessForAlbum.value.id}`, {
        method: 'PUT',
        body: {
          title: managingAccessForAlbum.value.name,
          isPublic: val,
        },
      })

      if (!error.value) {
        refreshAlbums()
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (_) {
      // Handle error silently
    }
  }
}

// Remove user from album access
async function removeUserFromAlbum(accessId: number) {
  if (!managingAccessForAlbum.value) return

  try {
    const response = await $fetch(`/api/albums/${managingAccessForAlbum.value.id}/access/${accessId}`, {
      method: 'DELETE',
    })

    if (response.success) {
      // Refresh the user lists
      await manageAlbumAccess(managingAccessForAlbum.value)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_) {
    // Handle error silently
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

    <USeparator class="my-6" />

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

          <UFormField
            label="Visibility"
            name="isPublic"
            help="Toggle to set album as public or private"
          >
            <div class="space-y-4">
              <div class="flex items-center">
                <USwitch
                  v-model="newAlbumIsPublic"
                  :checked-icon="'i-heroicons-globe-alt'"
                  :unchecked-icon="'i-heroicons-lock-closed'"
                  :color="newAlbumIsPublic ? 'success' : 'warning'"
                  @update:model-value="(val) => newAlbumIsPublic = val"
                />
                <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {{ newAlbumIsPublic ? 'Public' : 'Private' }}
                </span>
              </div>
            </div>
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

          <UFormField
            label="Visibility"
            name="isPublic"
            help="Toggle to set album as public or private"
          >
            <div class="space-y-4">
              <div class="flex items-center">
                <USwitch
                  v-model="editAlbumIsPublic"
                  :checked-icon="'i-heroicons-globe-alt'"
                  :unchecked-icon="'i-heroicons-lock-closed'"
                  :color="editAlbumIsPublic ? 'success' : 'warning'"
                  @update:model-value="(val) => editAlbumIsPublic = val"
                />
                <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {{ editAlbumIsPublic ? 'Public' : 'Private' }}
                </span>
              </div>
            </div>
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

    <!-- Album Access Management Modal -->
    <UModal
      v-model:open="showAccessModal"
      :title="`Manage Access: ${managingAccessForAlbum?.name}`"
      :ui="{ width: 'md', footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-6">
          <!-- Album visibility toggle -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium">
                Album Visibility
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ managingAccessForAlbum?.isPublic ? 'This album is public and visible to everyone' : 'This album is private and only visible to specific users' }}
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <USwitch
                v-if="managingAccessForAlbum"
                v-model="managingAccessForAlbum.isPublic"
                :checked-icon="'i-heroicons-globe-alt'"
                :unchecked-icon="'i-heroicons-lock-closed'"
                :color="managingAccessForAlbum.isPublic ? 'success' : 'warning'"
                @update:model-value="toggleAlbumVisibility"
              />
              <span class="text-sm">
                {{ managingAccessForAlbum?.isPublic ? 'Public' : 'Private' }}
              </span>
            </div>
          </div>

          <USeparator />

          <!-- User access management -->
          <div v-if="!managingAccessForAlbum?.isPublic">
            <h3 class="text-lg font-medium mb-4">
              User Access
            </h3>

            <!-- Add user form -->
            <div class="mb-6">
              <UFormField
                label="Add User"
                name="userId"
                help="Select a user to grant access to this album"
              >
                <div class="flex space-x-2">
                  <USelectMenu
                    v-model="selectedUserIds"
                    :items="availableUsers.map(user => ({ label: user.email, value: user.id }))"
                    placeholder="Select users"
                    :disabled="availableUsers.length === 0"
                    class="flex-grow"
                    icon="i-heroicons-user"
                    multiple
                  />

                  <UButton
                    color="primary"
                    :loading="isAddingUser"
                    :disabled="isAddingUser || selectedUserIds.length === 0 || availableUsers.length === 0"
                    @click="addUsersToAlbum"
                  >
                    Add Selected
                  </UButton>
                </div>
                <div
                  v-if="availableUsers.length === 0"
                  class="mt-2 text-sm text-red-500"
                >
                  No users available. <NuxtLink
                    to="/admin/users"
                    class="underline"
                  >Create users in the User Management section</NuxtLink> first.
                </div>
                <div
                  v-else
                  class="mt-2 text-xs text-gray-500"
                >
                  {{ availableUsers.length }} user(s) available
                </div>
              </UFormField>

              <UAlert
                v-if="addUserError"
                :color="addUserError.includes('Added') ? 'info' : 'error'"
                variant="soft"
                class="mt-2"
              >
                {{ addUserError }}
              </UAlert>
            </div>

            <!-- Users with access -->
            <div>
              <h4 class="text-md font-medium mb-2">
                Users with access
              </h4>

              <div
                v-if="albumUsers.length === 0"
                class="text-gray-500 dark:text-gray-400 text-sm p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div class="flex items-center">
                  <UIcon
                    name="i-heroicons-information-circle"
                    class="mr-2 text-blue-500"
                  />
                  <span>No users have been granted access to this album yet.</span>
                </div>
                <p class="mt-2 ml-6">
                  Use the form above to add users who can access this private album.
                </p>
              </div>

              <UTable
                v-else
                :data="albumUsers"
                :columns="[
                  { id: 'email', accessorKey: 'email', header: 'Email' },
                  { id: 'name', accessorKey: 'name', header: 'Name' },
                  {
                    id: 'dateGranted',
                    accessorKey: 'dateGranted',
                    header: 'Access Granted',
                    cell: ({ row }) => new Date(row.getValue('dateGranted')).toLocaleString(),
                  },
                  {
                    id: 'actions',
                    header: 'Actions',
                    cell: ({ row }) => {
                      return h('div', { class: 'flex justify-end' }, [
                        h(UButton, {
                          color: 'error',
                          variant: 'soft',
                          icon: 'i-heroicons-trash',
                          size: 'xs',
                          onClick: () => removeUserFromAlbum(row.original.accessId),
                        }, () => 'Remove'),
                      ])
                    },
                  },
                ]"
              />
            </div>
          </div>

          <div v-else>
            <UAlert
              icon="i-heroicons-information-circle"
              color="info"
              title="Public Album"
            >
              <p>This album is public. All users can view it.</p>
              <p class="mt-2">
                Toggle the visibility switch above to make it private, then you can manage user access.
              </p>
              <p class="mt-2">
                <NuxtLink
                  to="/admin/users"
                  class="text-blue-500 underline"
                >Manage users</NuxtLink>
              </p>
            </UAlert>
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          color="gray"
          @click="showAccessModal = false"
        >
          Close
        </UButton>
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
