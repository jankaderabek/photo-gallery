export default defineEventHandler(async () => {
    const { blobs } = await hubBlob().list({ limit: 10 })

    return blobs
})
