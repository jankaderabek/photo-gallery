import { encodeQueryItem } from 'ufo'
import type { OperationGeneratorConfig } from '@nuxt/image'
import { and, eq } from 'drizzle-orm'

export interface Mapper<Key, Value> {
  (key: Key): Value | Key
  (): undefined
}

export function createMapper<Key extends string, Value>(map: Partial<Record<Key, Value>> & { missingValue?: Value }): Mapper<Key, Value> {
  return (key => key !== undefined ? map[key as Extract<Key, string>] || key : map.missingValue) as Mapper<Key, Value>
}

export function createOperationsGenerator<ModifierKey extends string, ModifierValue = string | number, FinalKey = ModifierKey, FinalValue = ModifierValue>(config: OperationGeneratorConfig<ModifierKey, ModifierValue, FinalKey, FinalValue> = {}) {
  const formatter = config.formatter
  const keyMap = config.keyMap && typeof config.keyMap !== 'function' ? createMapper<ModifierKey, FinalKey>(config.keyMap) : config.keyMap

  const map: Record<string, Mapper<ModifierValue, FinalValue>> = {}
  for (const key in config.valueMap) {
    const valueKey = key as ModifierKey
    const value = config.valueMap[valueKey]!
    map[valueKey] = typeof value === 'object'
      ? createMapper<Extract<ModifierValue, string>, FinalValue>(value as Exclude<typeof value, (...args: never) => unknown>) as Mapper<ModifierValue, FinalValue>
      : value as Mapper<ModifierValue, FinalValue>
  }

  return (modifiers: Partial<Record<Extract<ModifierKey | FinalKey, string>, ModifierValue | FinalValue>>): string => {
    const operations: [key: FinalKey, value: FinalValue][] = []
    for (const _key in modifiers) {
      const key = _key as keyof typeof modifiers
      if (typeof modifiers[key] === 'undefined') {
        continue
      }
      const value = typeof map[key] === 'function'
        ? map[key](modifiers[key] as ModifierValue)
        : modifiers[key]

      operations.push([(keyMap ? keyMap(key as ModifierKey) : key) as FinalKey, value as FinalValue])
    }

    if (formatter) {
      return operations.map(entry => formatter(...entry)).join(config.joinWith ?? '&')
    }

    return new URLSearchParams(operations as [string, string][]).toString()
  }
}

const config = {
  keyMap: {
    width: 'w',
    height: 'h',
    dpr: 'dpr',
    fit: 'fit',
    gravity: 'g',
    quality: 'q',
    format: 'f',
    sharpen: 'sharpen',
  },
  valueMap: {
    fit: {
      cover: 'cover',
      contain: 'contain',
      fill: 'scale-down',
      outside: 'crop',
      inside: 'pad',
    },
    gravity: {
      auto: 'auto',
      side: 'side',
    },
  },
  joinWith: ',',
  formatter: (key, value) => encodeQueryItem(key, value),
}

// create reverse mapper for cloudflare images parameters
const reverseKeyMap = Object.entries(config.keyMap).reduce((acc, [key, value]) => {
  acc[value] = key
  return acc
}, {} as Record<string, string>)

const reverseValueMap = Object.entries(config.valueMap).reduce((acc, [key, value]) => {
  if (typeof value === 'object') {
    acc[key] = Object.entries(value).reduce((acc, [key, value]) => {
      acc[value] = key
      return acc
    }, {} as Record<string, string>)
  }
  return acc
}, {} as Record<string, Record<string, string>>)

export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  const env = event.context.cloudflare?.env || {}
  const cloudflareImagesParametersString = pathname.split('/')[0]
  const cloudflareImagesParameters = cloudflareImagesParametersString
    .split(',')
    .reduce((acc, param) => {
      const [key, value] = param.split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
  const imagePath = pathname.slice(cloudflareImagesParametersString.length + 1)

  // Check if the image exists
  const originalImage = await hubBlob().get(imagePath)

  if (!originalImage) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  // Extract album pathname from image path
  // Image path format: albums/{albumPathname}/{filename}
  const pathParts = imagePath.split('/')

  // Validate image path format
  if (pathParts.length < 3 || pathParts[0] !== 'albums') {
    throw createError({
      statusCode: 400,
      message: 'Invalid image path format',
    })
  }

  // Get album pathname (second-to-last element when splitting by /)
  const albumPathname = pathParts[pathParts.length - 1]

  // Get album from database to check access permissions
  const album = await useDrizzle()
    .select()
    .from(tables.albums)
    .where(eq(tables.albums.pathname, albumPathname))
    .get()

  if (!album) {
    throw createError({
      statusCode: 404,
      message: 'Album not found',
    })
  }

  // If album is public, allow access and continue
  if (!album.isPublic) {
    // For private albums, check user access
    try {
      // Try to get user session
      const session = await getUserSession(event)

      // Check if user is admin - admins can access all albums
      if (session?.user?.role === 'admin') {
        // Admin access granted - continue with the request
      }
      else if (!session?.user?.id) {
        // Not admin and not authenticated
        throw createError({
          statusCode: 401,
          message: 'Authentication required to access this image',
        })
      }
      else {
        // Regular user - check if they have access to this album
        const userAccess = await useDrizzle()
          .select()
          .from(tables.albumAccess)
          .where(
            and(
              eq(tables.albumAccess.albumId, album.id),
              eq(tables.albumAccess.userId, session.user.id),
            ),
          )
          .get()

        if (!userAccess) {
          throw createError({
            statusCode: 403,
            message: 'You do not have permission to access this image',
          })
        }
        // User has access - continue with the request
      }
    }
    catch (error: any) {
      // If error is already a HTTP error, rethrow it
      if (error.statusCode) {
        throw error
      }

      // Otherwise, throw a generic error
      throw createError({
        statusCode: 500,
        message: 'Error checking album access',
      })
    }
  }

  // server from cache if exists
  const cachedImage = await hubBlob().get(`cache/${pathname}`)

  if (cachedImage) {
    return cachedImage
  }

  const reverseOperationsGenerator = createOperationsGenerator({
    keyMap: reverseKeyMap,
    valueMap: reverseValueMap,
    joinWith: ',',
    formatter: (key, value) => encodeQueryItem(key, value),
  })

  const transformedCloudflareParametersString = reverseOperationsGenerator(cloudflareImagesParameters)
  const transformedCloudflareParameters = transformedCloudflareParametersString
    .split(',')
    .reduce((acc, param) => {
      const [key, value] = param.split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

  if (env.IMAGES) {
    const imageResponse = await (
      await env.IMAGES.input(originalImage)
        .transform(transformedCloudflareParameters)
        .output({ format: 'image/webp' })
    ).response() as Response

    const imageBuffer = await imageResponse.clone().arrayBuffer()

    // store to blob
    await hubBlob().put(pathname, imageBuffer, {
      prefix: 'cache',
      contentType: 'image/webp',
    })

    return imageResponse
  }

  return originalImage
})
