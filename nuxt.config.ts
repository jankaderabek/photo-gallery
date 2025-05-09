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
    '@nuxthub/core'
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
  }
})
