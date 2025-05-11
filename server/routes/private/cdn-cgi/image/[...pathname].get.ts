import { encodeQueryItem } from 'ufo'
import type { OperationGeneratorConfig } from '@nuxt/image'

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
  const originalImage = await hubBlob().get(imagePath)

  if (!originalImage) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  const operationsGenerator = createOperationsGenerator({
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
  })

  const transformedCloudflareParametersString = operationsGenerator(cloudflareImagesParameters)
  const transformedCloudflareParameters = transformedCloudflareParametersString
    .split(',')
    .reduce((acc, param) => {
      const [key, value] = param.split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

  if (env.IMAGES) {
    // check if already in resized cache
    const resizedImage = await hubBlob().get(`resized/${pathname}`)
    if (resizedImage) {
      return resizedImage
    }

    const imageResponse = await (
      await env.IMAGES.input(originalImage)
        .transform(transformedCloudflareParameters)
        .output({ format: 'image/webp' })
    ).response() as Response

    // put into resized cache
    await hubBlob().put(pathname, await imageResponse.arrayBuffer(), {
      prefix: 'resized',
      contentType: 'image/webp',
    })

    return imageResponse
  }

  return originalImage
})
