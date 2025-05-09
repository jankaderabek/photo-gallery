// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-05-07',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui-pro',
    '@nuxthub/core',
    'nuxt-auth-utils'
  ],
  css: ['~/assets/css/main.css'],
  hub: {
    blob: true,
    workers: true,
    database: true,
    bindings: {
      observability: {
        logs: true,
      },
      images: {
        IMAGES: {},
      }
    }
  },

  // Authentication configuration
  runtimeConfig: {
    authUtils: {
      session: {
        name: 'photo-gallery-session',
        password: 'complex-password-at-least-32-chars-long',
        cookie: {
          maxAge: 60 * 60 * 24 * 7, // 1 week
        }
      }
    }
  }
})
