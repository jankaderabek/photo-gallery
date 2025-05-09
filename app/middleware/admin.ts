export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  // Redirect to login if not authenticated
  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }

  // Redirect to home if not admin
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
