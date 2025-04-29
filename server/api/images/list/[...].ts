export default defineEventHandler(async (event) => {
    let prefix: string | undefined = event.context.params._;

    if (prefix === "root") {
        prefix = ''
    }

    return  await hubBlob().list({limit: 10, folded: true, prefix: prefix ? prefix + '/' : undefined})
})
