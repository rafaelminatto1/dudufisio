/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and custom metrics
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private isEnabled = process.env.NODE_ENV === 'production'

  constructor() {
    if (typeof window !== 'undefined' && this.isEnabled) {
      this.initializeWebVitals()
      this.initializeCustomMetrics()
    }
  }

  private initializeWebVitals() {
    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric('LCP', lastEntry.startTime)
      }).observe({ type: 'largest-contentful-paint', buffered: true })

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-input') {
            const fid = entry.processingStart - entry.startTime
            this.recordMetric('FID', fid)
          }
        })
      }).observe({ type: 'first-input', buffered: true })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.recordMetric('CLS', clsValue)
      }).observe({ type: 'layout-shift', buffered: true })
    }
  }

  private initializeCustomMetrics() {
    // Time to Interactive
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'navigation') {
            const tti = entry.loadEventEnd
            this.recordMetric('TTI', tti)
          }
        })
      }).observe({ type: 'navigation', buffered: true })
    }

    // Page Load Time
    window.addEventListener('load', () => {
      const loadTime = performance.now()
      this.recordMetric('PAGE_LOAD', loadTime)
    })
  }

  private recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname
    }

    this.metrics.push(metric)

    // Send to analytics if configured
    this.sendToAnalytics(metric)
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to Sentry or other monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.value),
        custom_map: {
          metric_name: metric.name,
          page_path: metric.url
        }
      })
    }
  }

  // Manual metric recording for custom events
  public recordCustomMetric(name: string, value: number) {
    this.recordMetric(name, value)
  }

  // Performance timing for functions
  public timeFunction<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    this.recordMetric(name, end - start)
    return result
  }

  // Async function timing
  public async timeAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    this.recordMetric(name, end - start)
    return result
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  public clearMetrics() {
    this.metrics = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Utility functions
export function measureAPICall<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.timeAsyncFunction(`API_${endpoint}`, fn)
}

export function measureComponentRender<T>(componentName: string, fn: () => T): T {
  return performanceMonitor.timeFunction(`RENDER_${componentName}`, fn)
}

// React hook for component performance
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now()

  return {
    markRenderComplete: () => {
      const renderTime = performance.now() - startTime
      performanceMonitor.recordCustomMetric(`COMPONENT_${componentName}`, renderTime)
    }
  }
}