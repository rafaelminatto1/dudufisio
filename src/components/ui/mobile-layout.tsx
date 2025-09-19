"use client"

import * as React from "react"
import { Menu, X, ChevronLeft, Home, Calendar, Users, FileText, Settings, User } from "lucide-react"
import { cn } from '@/src/lib/utils'
import { Button } from "./button"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"

interface MobileLayoutProps {
  children: React.ReactNode
  className?: string
}

interface MobileHeaderProps {
  title: string
  showBackButton?: boolean
  onBackClick?: () => void
  rightContent?: React.ReactNode
  className?: string
}

interface MobileNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
}

interface MobileBottomNavProps {
  items: MobileNavItem[]
  className?: string
}

interface MobileCardProps {
  children: React.ReactNode
  className?: string
  padding?: "sm" | "md" | "lg"
}

interface MobileFormProps {
  children: React.ReactNode
  className?: string
  onSubmit?: (e: React.FormEvent) => void
}

function MobileLayout({ children, className }: MobileLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background md:hidden", className)}>
      {children}
    </div>
  )
}

function MobileHeader({
  title,
  showBackButton = false,
  onBackClick,
  rightContent,
  className
}: MobileHeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackClick}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        {rightContent && (
          <div className="flex items-center space-x-2">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  )
}

function MobileBottomNav({ items, className }: MobileBottomNavProps) {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="grid grid-cols-4 h-16">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <a
              key={index}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs transition-colors",
                item.active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-[60px]">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}

function MobileCard({ children, className, padding = "md" }: MobileCardProps) {
  const paddingClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  }

  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

function MobileForm({ children, className, onSubmit }: MobileFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-4 p-4", className)}
    >
      {children}
    </form>
  )
}

function MobileContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 py-6 pb-20", className)}>
      {children}
    </div>
  )
}

function MobileStack({ children, spacing = "md", className }: {
  children: React.ReactNode
  spacing?: "sm" | "md" | "lg"
  className?: string
}) {
  const spacingClasses = {
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6"
  }

  return (
    <div className={cn("flex flex-col", spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}

function MobileGrid({
  children,
  cols = 2,
  gap = "md",
  className
}: {
  children: React.ReactNode
  cols?: 1 | 2 | 3
  gap?: "sm" | "md" | "lg"
  className?: string
}) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3"
  }

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6"
  }

  return (
    <div className={cn(
      "grid",
      gridClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

function MobileDrawer({
  trigger,
  children,
  title,
  className
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  title?: string
  className?: string
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="bottom" className={cn("rounded-t-lg", className)}>
        {title && (
          <div className="pb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        {children}
      </SheetContent>
    </Sheet>
  )
}

// Pre-configured navigation items for FisioFlow
export const FISIOFLOW_NAV_ITEMS: Record<string, MobileNavItem[]> = {
  admin: [
    { label: "Início", href: "/dashboard", icon: Home },
    { label: "Agenda", href: "/appointments", icon: Calendar },
    { label: "Pacientes", href: "/patients", icon: Users },
    { label: "Relatórios", href: "/reports", icon: FileText }
  ],
  fisioterapeuta: [
    { label: "Início", href: "/dashboard/fisioterapeuta", icon: Home },
    { label: "Agenda", href: "/appointments", icon: Calendar },
    { label: "Pacientes", href: "/patients", icon: Users },
    { label: "Exercícios", href: "/exercises", icon: FileText }
  ],
  estagiario: [
    { label: "Início", href: "/dashboard/estagiario", icon: Home },
    { label: "Agenda", href: "/appointments", icon: Calendar },
    { label: "Pacientes", href: "/patients", icon: Users },
    { label: "Perfil", href: "/profile", icon: User }
  ],
  paciente: [
    { label: "Início", href: "/dashboard/paciente", icon: Home },
    { label: "Consultas", href: "/appointments", icon: Calendar },
    { label: "Exercícios", href: "/exercises", icon: FileText },
    { label: "Perfil", href: "/profile", icon: User }
  ]
}

export {
  MobileLayout,
  MobileHeader,
  MobileBottomNav,
  MobileCard,
  MobileForm,
  MobileContainer,
  MobileStack,
  MobileGrid,
  MobileDrawer,
}