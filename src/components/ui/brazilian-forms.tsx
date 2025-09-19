"use client"

import * as React from "react"
import { cn } from '@/src/lib/utils'
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import logger from '../../../lib/logger';

interface BrazilianFormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
  helpText?: string
}

interface CPFInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  error?: string
}

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  error?: string
  type?: "mobile" | "landline" | "both"
}

interface CEPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onAddressLoad?: (address: any) => void
  error?: string
}

interface BrazilianDateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  error?: string
  minAge?: number
  maxAge?: number
}

// Utility functions for Brazilian formatting
const formatCPF = (value: string) => {
  const cleaned = value.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`
  }
  return cleaned
}

const formatPhone = (value: string, type: "mobile" | "landline" | "both" = "both") => {
  const cleaned = value.replace(/\D/g, '')

  if (cleaned.length <= 10) {
    // Landline format: (11) 1234-5678
    const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
  } else {
    // Mobile format: (11) 91234-5678
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
  }

  return cleaned
}

const formatCEP = (value: string) => {
  const cleaned = value.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{5})(\d{3})$/)
  if (match) {
    return `${match[1]}-${match[2]}`
  }
  return cleaned
}

const formatBrazilianDate = (value: string) => {
  const cleaned = value.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`
  }
  return cleaned
}

function BrazilianFormField({
  label,
  required = false,
  error,
  children,
  className,
  helpText
}: BrazilianFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

function CPFInput({ value = "", onChange, error, className, ...props }: CPFInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    onChange?.(formatted)
  }

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      placeholder="000.000.000-00"
      maxLength={14}
      className={cn(error && "border-destructive", className)}
    />
  )
}

function PhoneInput({
  value = "",
  onChange,
  error,
  type = "both",
  className,
  ...props
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value, type)
    onChange?.(formatted)
  }

  const placeholder = type === "mobile" ? "(11) 91234-5678" :
                     type === "landline" ? "(11) 1234-5678" :
                     "(11) 91234-5678"

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={15}
      className={cn(error && "border-destructive", className)}
    />
  )
}

function CEPInput({
  value = "",
  onChange,
  onAddressLoad,
  error,
  className,
  ...props
}: CEPInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    onChange?.(formatted)

    // Auto-fetch address when CEP is complete
    if (formatted.length === 9) {
      fetchAddress(formatted.replace(/\D/g, ''))
    }
  }

  const fetchAddress = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        onAddressLoad?.(data)
      }
    } catch (error) {
      logger.error('Erro ao buscar CEP:', error)
    }
  }

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      placeholder="00000-000"
      maxLength={9}
      className={cn(error && "border-destructive", className)}
    />
  )
}

function BrazilianDateInput({
  value = "",
  onChange,
  error,
  minAge,
  maxAge,
  className,
  ...props
}: BrazilianDateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBrazilianDate(e.target.value)
    onChange?.(formatted)
  }

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      placeholder="DD/MM/AAAA"
      maxLength={10}
      className={cn(error && "border-destructive", className)}
    />
  )
}

function BrazilianAddressForm({
  onAddressChange,
  initialValues = {},
  className
}: {
  onAddressChange?: (address: any) => void
  initialValues?: any
  className?: string
}) {
  const [address, setAddress] = React.useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    ...initialValues
  })

  const handleAddressLoad = (addressData: any) => {
    const newAddress = {
      ...address,
      street: addressData.logradouro || "",
      neighborhood: addressData.bairro || "",
      city: addressData.localidade || "",
      state: addressData.uf || ""
    }
    setAddress(newAddress)
    onAddressChange?.(newAddress)
  }

  const handleChange = (field: string, value: string) => {
    const newAddress = { ...address, [field]: value }
    setAddress(newAddress)
    onAddressChange?.(newAddress)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BrazilianFormField label="CEP" required>
          <CEPInput
            value={address.cep}
            onChange={(value) => handleChange("cep", value)}
            onAddressLoad={handleAddressLoad}
          />
        </BrazilianFormField>

        <div className="md:col-span-2">
          <BrazilianFormField label="Logradouro" required>
            <Input
              value={address.street}
              onChange={(e) => handleChange("street", e.target.value)}
              placeholder="Rua, Avenida, etc."
            />
          </BrazilianFormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BrazilianFormField label="Número" required>
          <Input
            value={address.number}
            onChange={(e) => handleChange("number", e.target.value)}
            placeholder="123"
          />
        </BrazilianFormField>

        <div className="md:col-span-3">
          <BrazilianFormField label="Complemento">
            <Input
              value={address.complement}
              onChange={(e) => handleChange("complement", e.target.value)}
              placeholder="Apartamento, sala, etc."
            />
          </BrazilianFormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BrazilianFormField label="Bairro" required>
          <Input
            value={address.neighborhood}
            onChange={(e) => handleChange("neighborhood", e.target.value)}
            placeholder="Bairro"
          />
        </BrazilianFormField>

        <BrazilianFormField label="Cidade" required>
          <Input
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Cidade"
          />
        </BrazilianFormField>

        <BrazilianFormField label="Estado" required>
          <Input
            value={address.state}
            onChange={(e) => handleChange("state", e.target.value)}
            placeholder="UF"
            maxLength={2}
          />
        </BrazilianFormField>
      </div>
    </div>
  )
}

// Healthcare-specific form components
function PatientPersonalDataForm({
  onDataChange,
  initialValues = {},
  className
}: {
  onDataChange?: (data: any) => void
  initialValues?: any
  className?: string
}) {
  const [data, setData] = React.useState({
    name: "",
    cpf: "",
    rg: "",
    birthDate: "",
    phone: "",
    email: "",
    emergencyContact: "",
    emergencyPhone: "",
    ...initialValues
  })

  const handleChange = (field: string, value: string) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    onDataChange?.(newData)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <BrazilianFormField label="Nome Completo" required>
        <Input
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Nome completo do paciente"
        />
      </BrazilianFormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BrazilianFormField label="CPF" required>
          <CPFInput
            value={data.cpf}
            onChange={(value) => handleChange("cpf", value)}
          />
        </BrazilianFormField>

        <BrazilianFormField label="RG">
          <Input
            value={data.rg}
            onChange={(e) => handleChange("rg", e.target.value)}
            placeholder="00.000.000-0"
          />
        </BrazilianFormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BrazilianFormField label="Data de Nascimento" required>
          <BrazilianDateInput
            value={data.birthDate}
            onChange={(value) => handleChange("birthDate", value)}
          />
        </BrazilianFormField>

        <BrazilianFormField label="Telefone" required>
          <PhoneInput
            value={data.phone}
            onChange={(value) => handleChange("phone", value)}
          />
        </BrazilianFormField>
      </div>

      <BrazilianFormField label="Email">
        <Input
          type="email"
          value={data.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="email@exemplo.com"
        />
      </BrazilianFormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BrazilianFormField label="Contato de Emergência">
          <Input
            value={data.emergencyContact}
            onChange={(e) => handleChange("emergencyContact", e.target.value)}
            placeholder="Nome do contato"
          />
        </BrazilianFormField>

        <BrazilianFormField label="Telefone de Emergência">
          <PhoneInput
            value={data.emergencyPhone}
            onChange={(value) => handleChange("emergencyPhone", value)}
          />
        </BrazilianFormField>
      </div>
    </div>
  )
}

export {
  BrazilianFormField,
  CPFInput,
  PhoneInput,
  CEPInput,
  BrazilianDateInput,
  BrazilianAddressForm,
  PatientPersonalDataForm,
  formatCPF,
  formatPhone,
  formatCEP,
  formatBrazilianDate,
}