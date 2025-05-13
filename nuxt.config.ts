// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui-pro',
    '@nuxthub/core',
    'nuxt-auth-utils',
    'nuxt-mcp',
    'nuxt-resend',
  ],
  $development: {
    hub: {
      remote: true,
    },
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  // Authentication configuration
  runtimeConfig: {
    authUtils: {
      session: {
        name: 'photo-gallery-session',
        password: 'complex-password-at-least-32-chars-long',
        cookie: {
          maxAge: 60 * 60 * 24 * 7, // 1 week
        },
      },
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      defaultFrom: 'Photo Gallery <info@gallery.jankaderabek.eu>',
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-05-07',
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
      },
    },
  },
  image: {
    provider: 'cloudflare',
    cloudflare: {
      baseURL: '/private',
    },
    presets: {
      preview: {
        modifiers: {
          format: 'webp',
          width: 300,
        },
      },
    },
  },
})
