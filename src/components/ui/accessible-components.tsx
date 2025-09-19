"use client"

import * as React from "react"
import { cn } from '@/src/lib/utils'
import { ARIA_LABELS, ACCESSIBILITY_HELPERS, FOCUS_MANAGEMENT } from '@/src/lib/accessibility/portuguese-labels'

// Skip Links Component
interface SkipLinksProps {
  links?: Array<{ href: string; text: string }>
  className?: string
}

function SkipLinks({ links = [...FOCUS_MANAGEMENT.skipLinks], className }: SkipLinksProps) {
  return (
    <div className={cn("sr-only focus-within:not-sr-only", className)}>
      <nav aria-label="Links de navegação rápida" className="fixed top-0 left-0 z-50 p-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="block mb-2 px-4 py-2 bg-primary text-primary-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {link.text}
          </a>
        ))}
      </nav>
    </div>
  )
}

// Accessible Form Field
interface AccessibleFormFieldProps {
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string
  helpText?: string
  className?: string
  fieldId?: string
}

function AccessibleFormField({
  label,
  children,
  required = false,
  error,
  helpText,
  className,
  fieldId
}: AccessibleFormFieldProps) {
  const generatedId = React.useId()
  const id = fieldId || generatedId
  const helpId = `${id}-help`
  const errorId = `${id}-error`

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {ACCESSIBILITY_HELPERS.getFieldLabel(label, required)}
      </label>

      {React.cloneElement(children as React.ReactElement, {
        id,
        "aria-required": required,
        "aria-invalid": !!error,
        "aria-describedby": [
          helpText ? helpId : null,
          error ? errorId : null
        ].filter(Boolean).join(' ') || undefined
      } as any)}

      {helpText && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible Button
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  loadingText?: string
  description?: string
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    variant = "primary",
    size = "md",
    loading = false,
    loadingText = "Carregando...",
    description,
    className,
    disabled,
    ...props
  }, ref) => {
    const variantClasses = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      ghost: "hover:bg-accent hover:text-accent-foreground"
    }

    const sizeClasses = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base"
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        aria-describedby={description ? `${props.id}-description` : undefined}
        {...props}
      >
        {loading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {loadingText}
          </>
        ) : (
          children
        )}
        {description && (
          <span id={`${props.id}-description`} className="sr-only">
            {description}
          </span>
        )}
      </button>
    )
  }
)

AccessibleButton.displayName = "AccessibleButton"

// Accessible Table
interface AccessibleTableProps {
  children: React.ReactNode
  caption: string
  className?: string
}

function AccessibleTable({ children, caption, className }: AccessibleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full border-collapse border border-border", className)}
        role="table"
        aria-label={ARIA_LABELS.tables.table}
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

// Accessible Modal
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className
}: AccessibleModalProps) {
  const titleId = React.useId()

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Trap focus within modal
      const modal = document.querySelector('[role="dialog"]')
      const focusableElements = modal?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements?.length) {
        (focusableElements[0] as HTMLElement).focus()
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={cn(
          "bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4",
          className
        )}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded"
            aria-label={ARIA_LABELS.modals.close}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Live Region for Announcements
interface LiveRegionProps {
  message: string
  priority?: "polite" | "assertive"
  className?: string
}

function LiveRegion({ message, priority = "polite", className }: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  )
}

// Progress Indicator
interface AccessibleProgressProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
}

function AccessibleProgress({
  value,
  max = 100,
  label,
  showPercentage = false,
  className
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          {showPercentage && (
            <span className="text-sm text-muted-foreground">{percentage}%</span>
          )}
        </div>
      )}
      <div
        className="w-full bg-secondary rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progresso: ${percentage}%`}
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Accessible Tabs
interface AccessibleTabsProps {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>
  defaultTab?: string
  className?: string
}

function AccessibleTabs({ tabs, defaultTab, className }: AccessibleTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id)

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label={ARIA_LABELS.navigation.tabs}
        className="flex border-b border-border"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="pt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}

// Status Badge with Accessible Colors
interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "info" | "pending"
  children: React.ReactNode
  className?: string
}

function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusConfig = {
    success: { color: "bg-green-100 text-green-800 border-green-200", icon: "✓", text: "sucesso" },
    error: { color: "bg-red-100 text-red-800 border-red-200", icon: "✗", text: "erro" },
    warning: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⚠", text: "aviso" },
    info: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: "ℹ", text: "informação" },
    pending: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: "⏳", text: "pendente" }
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
        config.color,
        className
      )}
      aria-label={`Status: ${config.text}`}
    >
      <span className="mr-1" aria-hidden="true">{config.icon}</span>
      {children}
    </span>
  )
}

export {
  SkipLinks,
  AccessibleFormField,
  AccessibleButton,
  AccessibleTable,
  AccessibleModal,
  LiveRegion,
  AccessibleProgress,
  AccessibleTabs,
  StatusBadge,
}