/**
 * Server middleware to add headers that prevent search engines from indexing the site
 */
export default defineEventHandler((event) => {
  // Add X-Robots-Tag header to prevent indexing
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
})
