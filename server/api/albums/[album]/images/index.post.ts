import { eq } from 'drizzle-orm'
import exifr from 'exifr'
import sizeOf from 'image-size'
import { tables, useDrizzle } from '../../../../utils/drizzle'

export default defineEventHandler(async (event) => {
  const albumPathname = event.context.params?.album

  if (!albumPathname) {
    throw createError({
      statusCode: 400,
      message: 'Album pathname is required',
    })
  }

  // Check if album exists in database
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

  const form = await readFormData(event)
  const imagesPrefix = `albums/${albumPathname.replace('/', '')}`
  const files = form.getAll('files') as File[]

  if (files.length === 0) {
    throw createError({ statusCode: 400, message: 'No files provided' })
  }

  const env = event.context.cloudflare?.env || {}
  const results = []

  for (const file of files) {
    try {
      ensureBlob(file, {
        maxSize: '32MB',
        types: ['image'],
      })

      const arrayBuffer = await file.arrayBuffer()
      const imageType = 'image/webp'

      // Extract EXIF data to get photo creation date and image dimensions
      let photoCreatedAt = null
      let originalWidth = null
      let originalHeight = null

      try {
        // Parse EXIF data for date and dimensions
        const exifData = await exifr.parse(new Uint8Array(arrayBuffer), {
          // Only parse the specific EXIF tags we need for better performance
          pick: ['DateTimeOriginal', 'CreateDate', 'ExifImageWidth', 'ExifImageHeight', 'PixelXDimension', 'PixelYDimension'],
        })

        if (exifData) {
          // Extract photo creation date
          if (exifData.DateTimeOriginal || exifData.CreateDate) {
            photoCreatedAt = exifData.DateTimeOriginal || exifData.CreateDate
          }

          // Extract image dimensions
          // Try different EXIF tags that might contain dimensions
          if (exifData.ExifImageWidth && exifData.ExifImageHeight) {
            originalWidth = exifData.ExifImageWidth
            originalHeight = exifData.ExifImageHeight
          }
          else if (exifData.PixelXDimension && exifData.PixelYDimension) {
            originalWidth = exifData.PixelXDimension
            originalHeight = exifData.PixelYDimension
          }
        }
      }
      catch (exifError) {
        console.warn(`Could not extract EXIF data from ${file.name}:`, exifError)
        // Continue without EXIF data
      }

      // If we couldn't get dimensions from EXIF, try to get them from the image data
      if (!originalWidth || !originalHeight) {
        try {
          // Use image-size library to get dimensions from buffer
          const dimensions = sizeOf(Buffer.from(arrayBuffer))
          originalWidth = dimensions.width
          originalHeight = dimensions.height
        }
        catch (dimensionError) {
          console.warn(`Could not extract image dimensions from ${file.name}:`, dimensionError)
          // Continue without dimensions
        }
      }

      // Generate timestamp prefix for sorting (YYYYMMDD_HHMMSS_)
      const now = new Date()
      const timestamp = now.toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .split('.')[0] + '_'

      // Create timestamped filename
      const originalName = file.name
      const timestampedName = timestamp + originalName

      let fullSizeImageBuffer = arrayBuffer

      if (env.IMAGES) {
        // Process full-size image
        const fullSizeImageResponse = await (
          await env.IMAGES.input(arrayBuffer)
            .transform({ width: 4096 })
            .output({ format: imageType })
        ).response() as Response

        fullSizeImageBuffer = await fullSizeImageResponse.arrayBuffer()
      }

      // Save full-size image with timestamped name
      const result = await hubBlob().put(timestampedName, fullSizeImageBuffer, {
        addRandomSuffix: false,
        prefix: imagesPrefix,
        contentType: imageType,
      })

      // Store image information in the database
      const imagePath = `${imagesPrefix}/${timestampedName}`
      const imageRecord = await useDrizzle()
        .insert(tables.images)
        .values({
          albumId: album.id,
          pathname: imagePath,
          filename: timestampedName,
          originalFilename: originalName,
          uploadedAt: now,
          photoCreatedAt: photoCreatedAt ? new Date(photoCreatedAt) : null,
          originalWidth: originalWidth,
          originalHeight: originalHeight,
        })
        .returning()
        .get()

      results.push({
        filename: originalName,
        timestampedName: timestampedName,
        success: true,
        path: imagePath,
        result,
        imageId: imageRecord.id,
        photoCreatedAt: imageRecord.photoCreatedAt ? imageRecord.photoCreatedAt.toISOString() : null,
        originalWidth: imageRecord.originalWidth,
        originalHeight: imageRecord.originalHeight,
      })
    }
    catch (error) {
      console.error(`Error processing file ${file.name}:`, error)
      results.push({
        filename: file.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
})
