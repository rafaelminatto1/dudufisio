"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: "sm" | "md" | "lg"
}

interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: {
    base?: "col" | "row"
    sm?: "col" | "row"
    md?: "col" | "row"
    lg?: "col" | "row"
  }
  spacing?: "sm" | "md" | "lg"
}

function ResponsiveContainer({
  children,
  className,
  maxWidth = "lg"
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full"
  }

  return (
    <div className={cn(
      "mx-auto w-full px-4 sm:px-6 lg:px-8",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}

function ResponsiveGrid({
  children,
  className,
  cols = { base: 1, md: 2, lg: 3 },
  gap = "md"
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6"
  }

  const gridCols = []
  if (cols.base) gridCols.push(`grid-cols-${cols.base}`)
  if (cols.sm) gridCols.push(`sm:grid-cols-${cols.sm}`)
  if (cols.md) gridCols.push(`md:grid-cols-${cols.md}`)
  if (cols.lg) gridCols.push(`lg:grid-cols-${cols.lg}`)
  if (cols.xl) gridCols.push(`xl:grid-cols-${cols.xl}`)

  return (
    <div className={cn(
      "grid",
      gapClasses[gap],
      gridCols.join(" "),
      className
    )}>
      {children}
    </div>
  )
}

function ResponsiveStack({
  children,
  className,
  direction = { base: "col", md: "row" },
  spacing = "md"
}: ResponsiveStackProps) {
  const spacingClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6"
  }

  const flexDirection = []
  if (direction.base) flexDirection.push(`flex-${direction.base}`)
  if (direction.sm) flexDirection.push(`sm:flex-${direction.sm}`)
  if (direction.md) flexDirection.push(`md:flex-${direction.md}`)
  if (direction.lg) flexDirection.push(`lg:flex-${direction.lg}`)

  return (
    <div className={cn(
      "flex",
      spacingClasses[spacing],
      flexDirection.join(" "),
      className
    )}>
      {children}
    </div>
  )
}

// Responsive visibility utilities
function ShowOn({
  children,
  breakpoint
}: {
  children: React.ReactNode
  breakpoint: "sm" | "md" | "lg" | "xl"
}) {
  const classes = {
    sm: "hidden sm:block",
    md: "hidden md:block",
    lg: "hidden lg:block",
    xl: "hidden xl:block"
  }

  return <div className={classes[breakpoint]}>{children}</div>
}

function HideOn({
  children,
  breakpoint
}: {
  children: React.ReactNode
  breakpoint: "sm" | "md" | "lg" | "xl"
}) {
  const classes = {
    sm: "sm:hidden",
    md: "md:hidden",
    lg: "lg:hidden",
    xl: "xl:hidden"
  }

  return <div className={classes[breakpoint]}>{children}</div>
}

// Mobile-first responsive text
interface ResponsiveTextProps {
  children: React.ReactNode
  size?: {
    base?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"
    sm?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"
    md?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"
    lg?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"
  }
  weight?: {
    base?: "normal" | "medium" | "semibold" | "bold"
    sm?: "normal" | "medium" | "semibold" | "bold"
    md?: "normal" | "medium" | "semibold" | "bold"
    lg?: "normal" | "medium" | "semibold" | "bold"
  }
  className?: string
}

function ResponsiveText({
  children,
  size = { base: "base" },
  weight = { base: "normal" },
  className
}: ResponsiveTextProps) {
  const sizeClasses = []
  const weightClasses = []

  // Size classes
  if (size.base) sizeClasses.push(`text-${size.base}`)
  if (size.sm) sizeClasses.push(`sm:text-${size.sm}`)
  if (size.md) sizeClasses.push(`md:text-${size.md}`)
  if (size.lg) sizeClasses.push(`lg:text-${size.lg}`)

  // Weight classes
  if (weight.base) weightClasses.push(`font-${weight.base}`)
  if (weight.sm) weightClasses.push(`sm:font-${weight.sm}`)
  if (weight.md) weightClasses.push(`md:font-${weight.md}`)
  if (weight.lg) weightClasses.push(`lg:font-${weight.lg}`)

  return (
    <span className={cn(
      sizeClasses.join(" "),
      weightClasses.join(" "),
      className
    )}>
      {children}
    </span>
  )
}

// Mobile-first spacing utilities
interface ResponsiveSpacingProps {
  children: React.ReactNode
  padding?: {
    base?: "0" | "1" | "2" | "3" | "4" | "6" | "8"
    sm?: "0" | "1" | "2" | "3" | "4" | "6" | "8"
    md?: "0" | "1" | "2" | "3" | "4" | "6" | "8"
    lg?: "0" | "1" | "2" | "3" | "4" | "6" | "8"
  }
  margin?: {
    base?: "0" | "1" | "2" | "3" | "4" | "6" | "8"
    sm?: "0" | "1" | "2" | "3" | "4" | "6" | "8"
    md?: "0" | "1" | "2" | "3" | "4" | "6" | "8"
    lg?: "0" | "1" | "2" | "3" | "4" | "6" | "8"
  }
  className?: string
}

function ResponsiveSpacing({
  children,
  padding,
  margin,
  className
}: ResponsiveSpacingProps) {
  const classes = []

  // Padding classes
  if (padding?.base) classes.push(`p-${padding.base}`)
  if (padding?.sm) classes.push(`sm:p-${padding.sm}`)
  if (padding?.md) classes.push(`md:p-${padding.md}`)
  if (padding?.lg) classes.push(`lg:p-${padding.lg}`)

  // Margin classes
  if (margin?.base) classes.push(`m-${margin.base}`)
  if (margin?.sm) classes.push(`sm:m-${margin.sm}`)
  if (margin?.md) classes.push(`md:m-${margin.md}`)
  if (margin?.lg) classes.push(`lg:m-${margin.lg}`)

  return (
    <div className={cn(classes.join(" "), className)}>
      {children}
    </div>
  )
}

export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveText,
  ResponsiveSpacing,
  ShowOn,
  HideOn,
}