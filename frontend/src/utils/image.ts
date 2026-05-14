/**
 * 图片处理工具
 */

const BASE_URL = 'http://localhost:3000'

const hasInvalidChars = (path: string): boolean => {
  if (path.includes('%EF%BF%BD') || path.includes('�')) {
    return true
  }

  const invalidPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
  return invalidPattern.test(path)
}

const safeDecodePath = (path: string): string => {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

const normalizeUploadsPath = (imagePath: string): string | null => {
  const normalizedPath = safeDecodePath(imagePath.trim().replace(/\\/g, '/'))
  const lowerPath = normalizedPath.toLowerCase()

  const absoluteUploadsIndex = lowerPath.indexOf('/uploads/')
  if (absoluteUploadsIndex >= 0) {
    return normalizedPath.slice(absoluteUploadsIndex).replace(/\/\/+/g, '/')
  }

  const relativeUploadsIndex = lowerPath.indexOf('uploads/')
  if (relativeUploadsIndex >= 0) {
    return `/${normalizedPath.slice(relativeUploadsIndex)}`.replace(/\/\/+/g, '/')
  }

  return null
}

export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath || typeof imagePath !== 'string') {
    return '/static/logo.png'
  }

  const normalizedImagePath = imagePath.trim().replace(/\\/g, '/')

  if (!normalizedImagePath || hasInvalidChars(normalizedImagePath)) {
    return '/static/logo.png'
  }

  if (normalizedImagePath.startsWith('http://') || normalizedImagePath.startsWith('https://')) {
    return normalizedImagePath
  }

  if (normalizedImagePath.startsWith('/static/')) {
    return normalizedImagePath
  }

  const uploadsPath = normalizeUploadsPath(normalizedImagePath)
  if (uploadsPath) {
    if (uploadsPath === '/uploads/test.png') {
      return '/static/logo.png'
    }

    return `${BASE_URL}${uploadsPath}`
  }

  const cleanPath = normalizedImagePath.startsWith('/') ? normalizedImagePath.slice(1) : normalizedImagePath
  return `${BASE_URL}/${cleanPath}`
}
