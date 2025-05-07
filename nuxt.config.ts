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
    '@nuxt/ui',
    '@nuxthub/core'
  ],
  hub: {
    blob: true,
    workers: true,
    bindings: {
      images: {
        IMAGES: {},
      }
    }
  }
})
