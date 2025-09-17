'use client'

import { useState } from 'react'
import { Calendar, MapPin, Phone, Mail, MoreHorizontal, Eye, Edit2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatCPF, formatPhone, formatDate } from '@/lib/utils/brazilian-formatting'
import { calculateAge } from '@/lib/utils'
import type { Patient } from '@/lib/supabase/database.types'
import Link from 'next/link'

interface PatientCardProps {
  patient: Patient
  viewMode: 'grid' | 'list'
  onEdit?: (patient: Patient) => void
  onDelete?: (patientId: string) => void
}

export function PatientCard({ patient, viewMode, onEdit, onDelete }: PatientCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const age = calculateAge(new Date(patient.date_of_birth))
  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const getStatusBadge = (status: Patient['status']) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inativo', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      discharged: { label: 'Alta', variant: 'outline' as const, className: 'bg-blue-100 text-blue-800' }
    }

    const config = statusConfig[status] || statusConfig.active
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(patient.id)
    }
    setShowDeleteDialog(false)
  }

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={patient.photo_url || undefined} alt={patient.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{patient.name}</h3>
                  {getStatusBadge(patient.status)}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{formatCPF(patient.cpf)}</span>
                  <span>{age} anos</span>
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {formatPhone(patient.phone)}
                  </span>
                  {patient.email && (
                    <span className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {patient.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link href={`/patients/${patient.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/patients/${patient.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalhes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEdit?.(patient)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={patient.photo_url || undefined} alt={patient.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{patient.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                {formatCPF(patient.cpf)} • {age} anos
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(patient.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="h-4 w-4 mr-2" />
            {formatPhone(patient.phone)}
          </div>
          {patient.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              {patient.email}
            </div>
          )}
          {(patient.city || patient.state) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {[patient.city, patient.state].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {/* Last Activity */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          Cadastrado em {formatDate(patient.created_at)}
        </div>

        {/* Emergency Contact */}
        {patient.emergency_contact_name && patient.emergency_contact_phone && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Contato de emergência</p>
            <p className="text-sm">
              {patient.emergency_contact_name} • {formatPhone(patient.emergency_contact_phone)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Link href={`/patients/${patient.id}`}>
            <Button variant="outline" size="sm" className="flex-1 mr-2">
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/patients/${patient.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/patients/${patient.id}/edit`}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/appointments/new?patient=${patient.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar consulta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente <strong>{patient.name}</strong>?
              Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}