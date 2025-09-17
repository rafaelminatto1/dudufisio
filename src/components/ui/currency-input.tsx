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

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCurrency(value, { showSymbol }))
      }
    }, [value, showSymbol])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value

      inputValue = inputValue.replace(/R\$\s?/g, '')
      inputValue = inputValue.replace(/[^0-9.,]/g, '')

      if (!allowNegative) {
        inputValue = inputValue.replace(/-/g, '')
      }

      let numericValue = parseCurrency(inputValue)

      if (maxValue !== undefined && numericValue > maxValue) {
        numericValue = maxValue
      }
      if (minValue !== undefined && numericValue < minValue) {
        numericValue = minValue
      }

      const formatted = formatCurrency(numericValue, { showSymbol })
      setDisplayValue(formatted)

      onChange?.(numericValue)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const numericValue = parseCurrency(displayValue)
      const formatted = formatCurrency(numericValue, { showSymbol })
      setDisplayValue(formatted)

      props.onBlur?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
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