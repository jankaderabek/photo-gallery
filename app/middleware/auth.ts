export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()

  // Redirect to login if not authenticated
  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }
})
