/**
 * Image Optimization Utilities
 * Handles responsive images, lazy loading, and format optimization
 */

export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  quality?: number
  sizes?: string
}

// Image size presets for different use cases
export const IMAGE_SIZES = {
  avatar: { width: 40, height: 40 },
  thumbnail: { width: 150, height: 150 },
  card: { width: 300, height: 200 },
  hero: { width: 1200, height: 600 },
  full: { width: 1920, height: 1080 }
} as const

// Common responsive image sizes
export const RESPONSIVE_SIZES = {
  mobile: '(max-width: 768px) 100vw',
  tablet: '(max-width: 1024px) 50vw',
  desktop: '25vw'
} as const

// Generate optimized image URL for Supabase Storage
export function getOptimizedImageUrl(
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
  } = {}
): string {
  if (!path) return ''

  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options

  // If it's a Supabase Storage URL, add transformation parameters
  if (path.includes('supabase')) {
    const url = new URL(path)
    const params = new URLSearchParams()

    if (width) params.set('width', width.toString())
    if (height) params.set('height', height.toString())
    params.set('quality', quality.toString())
    params.set('format', format)

    url.search = params.toString()
    return url.toString()
  }

  return path
}

// Generate srcSet for responsive images
export function generateSrcSet(
  basePath: string,
  sizes: number[] = [400, 800, 1200, 1600]
): string {
  return sizes
    .map(size => `${getOptimizedImageUrl(basePath, { width: size })} ${size}w`)
    .join(', ')
}

// Patient photo optimization
export function optimizePatientPhoto(
  photoUrl: string,
  context: 'avatar' | 'thumbnail' | 'card' | 'full' = 'card'
): OptimizedImageProps {
  const sizeConfig = IMAGE_SIZES[context]

  return {
    src: getOptimizedImageUrl(photoUrl, {
      width: sizeConfig.width,
      height: sizeConfig.height,
      format: 'webp'
    }),
    alt: 'Foto do paciente',
    width: sizeConfig.width,
    height: sizeConfig.height,
    priority: context === 'hero',
    quality: context === 'avatar' ? 60 : 80,
    sizes: context === 'full'
      ? '100vw'
      : `(max-width: 768px) 100vw, ${sizeConfig.width}px`
  }
}

// Exercise media optimization
export function optimizeExerciseMedia(
  mediaUrl: string,
  type: 'image' | 'video' = 'image',
  context: 'thumbnail' | 'card' | 'hero' = 'card'
): OptimizedImageProps {
  if (type === 'video') {
    // For videos, return poster image optimization
    return {
      src: getOptimizedImageUrl(mediaUrl, {
        width: IMAGE_SIZES[context].width,
        height: IMAGE_SIZES[context].height,
        format: 'webp'
      }),
      alt: 'Preview do exercício',
      width: IMAGE_SIZES[context].width,
      height: IMAGE_SIZES[context].height,
      priority: false,
      quality: 70
    }
  }

  const sizeConfig = IMAGE_SIZES[context]

  return {
    src: getOptimizedImageUrl(mediaUrl, {
      width: sizeConfig.width,
      height: sizeConfig.height,
      format: 'webp'
    }),
    alt: 'Demonstração do exercício',
    width: sizeConfig.width,
    height: sizeConfig.height,
    priority: context === 'hero',
    quality: 80,
    sizes: context === 'hero'
      ? '100vw'
      : `(max-width: 768px) 100vw, ${sizeConfig.width}px`
  }
}

// Lazy loading intersection observer
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.1,
    ...options
  })
}

// Preload critical images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Batch preload multiple images
export async function preloadImages(sources: string[]): Promise<void> {
  const promises = sources.map(preloadImage)
  await Promise.allSettled(promises)
}

// Check if WebP is supported
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
}

// Get optimal format based on browser support
export function getOptimalFormat(): 'webp' | 'jpg' {
  return supportsWebP() ? 'webp' : 'jpg'
}