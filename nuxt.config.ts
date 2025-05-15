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
    'nuxt-security',
  ],
  $development: {
    hub: {
      remote: true,
    },
  },
  devtools: { enabled: true },
  app: {
    head: {
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'googlebot', content: 'noindex, nofollow' },
      ],
    },
  },
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
  routeRules: {
    '/api/auth/request-code': {
      security: {
        rateLimiter: {
          // Allow 5 requests per 15 minutes
          interval: 60 * 1000, // 15 minutes in milliseconds
          tokensPerInterval: 1,
        },
      },
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-05-07',
  hub: {
    cache: true,
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
  security: {
    rateLimiter: {
      driver: {
        name: 'cloudflareKVBinding',
        options: {
          binding: 'CACHE',
        },
      },
    },
  },
})
