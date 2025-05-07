export default defineEventHandler(async () => {
    const result = await hubBlob().list({
        prefix: 'albums/',
        folded: true
    })

    return (result.folders || [])
        .map(folder => {
            const fullName = folder.replace('albums/', '')

            // Extract the display name (remove timestamp prefix if present)
            // Format: YYYYMMDD_HHMMSS_albumname
            const timestampMatch = fullName.match(/^\d{8}_\d{6}_(.+)$/)
            const displayName = timestampMatch ? timestampMatch[1] : fullName

            return {
                id: fullName.replace('/', ''),
                name: displayName,
                path: folder
            }
        })
})
