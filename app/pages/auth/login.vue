<script setup lang="ts">
const { loggedIn, fetch: refreshSession } = useUserSession()
const router = useRouter()

// Redirect if already logged in
if (loggedIn.value) {
  router.push('/')
}

const credentials = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const error = ref('')

async function login() {
  isLoading.value = true
  error.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })

    // Refresh the session and redirect to home
    await refreshSession()
    await navigateTo('/')
  }
  catch (e: Error | { data?: { message?: string } }) {
    error.value = 'data' in e && e.data?.message ? e.data.message : 'Failed to login'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UContainer class="py-16 max-w-md">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">
          Login
        </h1>
      </template>

      <UForm
        :state="credentials"
        class="space-y-4"
        @submit="login"
      >
        <UFormField
          label="Email"
          name="email"
        >
          <UInput
            v-model="credentials.email"
            type="email"
            placeholder="Enter your email"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
        >
          <UInput
            v-model="credentials.password"
            type="password"
            placeholder="Enter your password"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          class="my-4"
        >
          {{ error }}
        </UAlert>

        <div class="flex justify-start items-center mt-6">
          <UButton
            type="submit"
            color="primary"
            :loading="isLoading"
          >
            Login
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UContainer>
</template>
