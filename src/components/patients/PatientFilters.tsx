'use client'

import { useState } from 'react'
import { Calendar, MapPin, Users, Heart } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { DatePicker } from '@/src/components/ui/date-picker'

interface PatientFiltersProps {
  onFiltersChange: (filters: PatientFilterValues) => void
}

export interface PatientFilterValues {
  ageRange?: { min?: number; max?: number }
  gender?: string
  city?: string
  status?: string
  hasHealthInsurance?: boolean
  lastVisitDate?: { from?: Date; to?: Date }
  createdDate?: { from?: Date; to?: Date }
}

export function PatientFilters({ onFiltersChange }: PatientFiltersProps) {
  const [filters, setFilters] = useState<PatientFilterValues>({})

  const handleFilterChange = (key: keyof PatientFilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Age Range */}
        <div className="space-y-2">
          <Label className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Faixa Etária
          </Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.ageRange?.min || ''}
              onChange={(e) =>
                handleFilterChange('ageRange', {
                  ...filters.ageRange,
                  min: e.target.value ? parseInt(e.target.value) : undefined
                })
              }
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.ageRange?.max || ''}
              onChange={(e) =>
                handleFilterChange('ageRange', {
                  ...filters.ageRange,
                  max: e.target.value ? parseInt(e.target.value) : undefined
                })
              }
            />
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label>Sexo</Label>
          <Select
            value={filters.gender || ''}
            onValueChange={(value) => handleFilterChange('gender', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Cidade
          </Label>
          <Input
            placeholder="Nome da cidade"
            value={filters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
          />
        </div>

        {/* Health Insurance */}
        <div className="space-y-2">
          <Label className="flex items-center">
            <Heart className="w-4 h-4 mr-2" />
            Convênio
          </Label>
          <Select
            value={filters.hasHealthInsurance?.toString() || ''}
            onValueChange={(value) =>
              handleFilterChange('hasHealthInsurance', value === 'true' ? true : value === 'false' ? false : undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tem convênio?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="true">Com convênio</SelectItem>
              <SelectItem value="false">Particular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Last Visit Date Range */}
        <div className="space-y-2">
          <Label className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Última Consulta
          </Label>
          <div className="flex space-x-2">
            <DatePicker
              date={filters.lastVisitDate?.from}
              onSelect={(date) =>
                handleFilterChange('lastVisitDate', {
                  ...filters.lastVisitDate,
                  from: date
                })
              }
              placeholder="De"
            />
            <DatePicker
              date={filters.lastVisitDate?.to}
              onSelect={(date) =>
                handleFilterChange('lastVisitDate', {
                  ...filters.lastVisitDate,
                  to: date
                })
              }
              placeholder="Até"
            />
          </div>
        </div>

        {/* Created Date Range */}
        <div className="space-y-2">
          <Label className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Data de Cadastro
          </Label>
          <div className="flex space-x-2">
            <DatePicker
              date={filters.createdDate?.from}
              onSelect={(date) =>
                handleFilterChange('createdDate', {
                  ...filters.createdDate,
                  from: date
                })
              }
              placeholder="De"
            />
            <DatePicker
              date={filters.createdDate?.to}
              onSelect={(date) =>
                handleFilterChange('createdDate', {
                  ...filters.createdDate,
                  to: date
                })
              }
              placeholder="Até"
            />
          </div>
        </div>
      </div>

      {/* Filter Actions */}
      {hasActiveFilters && (
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            Filtros aplicados: {Object.keys(filters).length}
          </span>
          <Button variant="outline" onClick={clearFilters}>
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  )
}