"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { formatCurrency, parseCurrency } from "@/lib/utils/brazilian-currency"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number
  onChange?: (value: number) => void
  showSymbol?: boolean
  allowNegative?: boolean
  maxValue?: number
  minValue?: number
  error?: string
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({
    value = 0,
    onChange,
    showSymbol = true,
    allowNegative = false,
    maxValue,
    minValue = 0,
    error,
    className,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("")

    // Update display value when value prop changes
    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCurrency(value, { showSymbol }))
      }
    }, [value, showSymbol])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value

      // Remove currency symbol if present
      inputValue = inputValue.replace(/R\$\s?/g, '')

      // Only allow numbers, commas, and dots
      inputValue = inputValue.replace(/[^0-9.,]/g, '')

      // Handle negative values
      if (!allowNegative) {
        inputValue = inputValue.replace(/-/g, '')
      }

      // Parse the numeric value
      let numericValue = parseCurrency(inputValue)

      // Apply min/max constraints
      if (maxValue !== undefined && numericValue > maxValue) {
        numericValue = maxValue
      }
      if (minValue !== undefined && numericValue < minValue) {
        numericValue = minValue
      }

      // Format and update display
      const formatted = formatCurrency(numericValue, { showSymbol })
      setDisplayValue(formatted)

      // Call onChange with numeric value
      onChange?.(numericValue)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ensure proper formatting on blur
      const numericValue = parseCurrency(displayValue)
      const formatted = formatCurrency(numericValue, { showSymbol })
      setDisplayValue(formatted)

      props.onBlur?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Remove formatting for easier editing
      const numericValue = parseCurrency(displayValue)
      if (numericValue === 0) {
        setDisplayValue("")
      } else {
        setDisplayValue(formatCurrency(numericValue, { showSymbol: false }))
      }

      props.onFocus?.(e)
    }

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={showSymbol ? "R$ 0,00" : "0,00"}
        className={cn(
          error && "border-destructive",
          className
        )}
      />
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }