/**
 * Loading Spinner Component
 * Used for lazy loading fallbacks and async operations
 */

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  text = 'Carregando...',
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3 p-8',
      className
    )}>
      <Loader2 className={cn(
        'animate-spin text-primary',
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}

// Specialized loading components
export function PageLoadingSpinner() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Carregando página..." />
    </div>
  )
}

export function ModalLoadingSpinner() {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <LoadingSpinner size="md" text="Carregando..." />
    </div>
  )
}

export function ComponentLoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <LoadingSpinner size="sm" text="" />
    </div>
  )
}