import path from 'path'
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from 'src/shared/constants/media.constant'
import { MediaType } from 'src/shared/types/media.type'

export const normalizeExt = (ext?: string, fileName?: string) => {
  let e = ext?.replace(/^\./, '')
  if (!e && fileName) {
    const guessed = path.extname(fileName).replace(/^\./, '')
    e = guessed || undefined
  }
  return e
}

export function guessContentType(ext?: string, fileName?: string): string | undefined {
  const extension = (ext || fileName?.split('.').pop() || '').toLowerCase()

  const videoTypes: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    flv: 'video/x-flv',
    wmv: 'video/x-ms-wmv',
    m4v: 'video/x-m4v',
  }

  const imageTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
  }

  return videoTypes[extension] || imageTypes[extension]
}

export function isVideo(ext?: string, fileName?: string): boolean {
  const extension = (ext || fileName?.split('.').pop() || '').toLowerCase()
  return VIDEO_EXTENSIONS.includes(extension as any)
}

export function isImage(ext?: string, fileName?: string): boolean {
  const extension = (ext || fileName?.split('.').pop() || '').toLowerCase()
  return IMAGE_EXTENSIONS.includes(extension as any)
}

export function getMediaType(ext?: string, fileName?: string): MediaType {
  if (isVideo(ext, fileName)) return 'video'
  if (isImage(ext, fileName)) return 'image'
  return 'unknown'
}
