/**
 * Toast Hook - FisioFlow
 * Hook para exibição de notificações toast usando shadcn/ui
 */

'use client'

import * as React from 'react'
import { toast as sonnerToast } from 'sonner'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const toast = React.useCallback(({
    title,
    description,
    variant = 'default',
    duration = 4000
  }: ToastProps) => {
    if (variant === 'destructive') {
      sonnerToast.error(title || 'Erro', {
        description,
        duration
      })
    } else {
      sonnerToast.success(title || 'Sucesso', {
        description,
        duration
      })
    }
  }, [])

  return { toast }
}