<script setup lang="ts">
// Apply admin middleware
definePageMeta({
  middleware: ['admin']
})

// Fetch users
const {data: users, refresh: refreshUsers} = await useFetch('/api/admin/users')

// New user form
const showNewUserForm = ref(false)
const newUser = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user'
})

const isLoading = ref(false)
const error = ref('')
// Always show password in plaintext

// Function to generate a random password
function generatePassword() {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' // No special chars
  let password = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }

  newUser.password = password
}

async function createUser() {
  isLoading.value = true
  error.value = ''

  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: newUser
    })

    // Reset form and refresh users
    newUser.name = ''
    newUser.email = ''
    newUser.password = ''
    newUser.role = 'user'
    // Always keep password visible
    showNewUserForm.value = false

    await refreshUsers()
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to create user'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UContainer class="py-8">
    <UPageHeader title="User Management">
      <template #right>
        <UButton
            @click="showNewUserForm = !showNewUserForm"
            color="primary"
            :icon="showNewUserForm ? 'i-heroicons-x-mark' : 'i-heroicons-plus'"
        >
          {{ showNewUserForm ? 'Cancel' : 'Add User' }}
        </UButton>
      </template>
    </UPageHeader>

    <UDivider class="my-6"/>

    <!-- New User Form -->
    <UCollapsible v-model="showNewUserForm">
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Add New User</h2>
        </template>

        <UForm :state="newUser" @submit="createUser" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Name" name="name">
              <UInput v-model="newUser.name" placeholder="Enter name"/>
            </UFormField>

            <UFormField label="Email" name="email">
              <UInput v-model="newUser.email" type="email" placeholder="Enter email"/>
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Password" name="password">
              <div class="flex items-center space-x-2">
                <UInput
                    v-model="newUser.password"
                    type="text"
                    placeholder="Enter password"
                />
                <UButton
                    color="primary"
                    variant="soft"
                    @click="generatePassword"
                    class="whitespace-nowrap"
                >
                  Generate
                </UButton>
              </div>
            </UFormField>

            <UFormField label="Role" name="role">
              <USelect
                  v-model="newUser.role"
                  :items="[
                    { label: 'User', value: 'user' },
                    { label: 'Admin', value: 'admin' }
                  ]"
              />
            </UFormField>
          </div>

          <UAlert v-if="error" color="error" variant="soft" class="my-4">
            {{ error }}
          </UAlert>

          <div class="flex justify-start mt-4">
            <UButton type="submit" color="primary" :loading="isLoading">
              Create User
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UCollapsible>

    <!-- Users Table -->
    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">Users</h2>
      </template>

      <UTable
          :data="users || []"
      >
        <template #cell-role="{ row }">
          <UBadge :color="row.getValue('role') === 'admin' ? 'error' : 'info'">
            {{ row.getValue('role') }}
          </UBadge>
        </template>

        <template #cell-createdAt="{ row }">
          {{ new Date(row.getValue('createdAt')).toLocaleString() }}
        </template>
      </UTable>
    </UCard>
  </UContainer>
</template>
