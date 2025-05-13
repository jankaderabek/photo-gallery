<script setup lang="ts">
const { loggedIn } = useUserSession()
const router = useRouter()
const route = useRoute()

// Redirect if already logged in
if (loggedIn.value) {
  router.push('/')
}

// Form states
const emailForm = reactive({
  email: '',
})
// Login states
const isLoading = ref(false)
const error = ref('')
const success = ref('')

// Check for error in query params (from verification link)
if (route.query.error === 'invalid_verification') {
  console.log('Invalid verification')
  error.value = 'The verification link is invalid or has expired. Please request a new login link.'

  // If there's an email in the query params, set it
  if (route.query.email) {
    emailForm.email = route.query.email as string
  }
}

// Request login link
async function requestLoginLink() {
  if (!emailForm.email) return

  isLoading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await $fetch('/api/auth/request-code', {
      method: 'POST',
      body: { email: emailForm.email },
    })

    // Set success message from API response or use default
    success.value = response?.message || 'Login link sent to your email'
  }
  catch (e: Error | { data?: { message?: string } }) {
    error.value = 'data' in e && e.data?.message ? e.data.message : 'Failed to send login link'
  }
  finally {
    isLoading.value = false
  }
}

// No longer need verification functions
</script>

<template>
  <UContainer class="py-16 max-w-md">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">
          Login
        </h1>
      </template>

      <div>
        <UForm
          :state="emailForm"
          class="space-y-4"
          @submit="requestLoginLink"
        >
          <UFormField
            label="Email"
            name="email"
          >
            <UInput
              v-model="emailForm.email"
              type="email"
              placeholder="Enter your email"
              required
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="success"
            color="success"
            variant="soft"
            class="mb-4"
            :description="success"
          />

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            class="my-4"
            :description="error"
          />

          <p
            v-if="success"
            class="text-sm text-gray-500 mb-4"
          >
            We've sent a secure login link to <strong>{{ emailForm.email }}</strong>.
            Please check your email and click the link to sign in.
          </p>

          <div class="flex justify-start items-center mt-6">
            <UButton
              type="submit"
              color="primary"
              :loading="isLoading"
            >
              Send Login Link
            </UButton>
          </div>
        </UForm>
      </div>
    </UCard>
  </UContainer>
</template>
