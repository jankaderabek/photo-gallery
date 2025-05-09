export default defineEventHandler(async () => {
  // Get albums from database
  const dbAlbums = await useDrizzle().select().from(tables.albums).all()

  // Map database albums to the expected format
  return dbAlbums.map((album) => {
    return {
      id: album.pathname,
      name: album.title,
      path: `albums/${album.pathname}`,
      dateCreated: album.dateCreated,
    }
  })
})
