'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, User } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { useToast } from '@/src/hooks/use-toast'
import { cn } from '@/src/lib/utils'
import logger from '../../../lib/logger';

interface PatientPhotoUploadProps {
  patientId: string
  patientName: string
  currentPhotoUrl?: string | null
  onPhotoUploaded?: (photoUrl: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function PatientPhotoUpload({
  patientId,
  patientName,
  currentPhotoUrl,
  onPhotoUploaded,
  className,
  size = 'md'
}: PatientPhotoUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null)

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione apenas arquivos de imagem.',
        variant: 'destructive'
      })
      return
    }

    // Validar tamanho do arquivo (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive'
      })
      return
    }

    await uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true)

      // Criar FormData para upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'patient-photos')
      formData.append('patient_id', patientId)
      formData.append('file_type', 'profile_photo')
      formData.append('description', `Foto do perfil - ${patientName}`)

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer upload da foto')
      }

      const result = await response.json()
      const newPhotoUrl = result.data.public_url

      // Atualizar foto do paciente no banco de dados
      const updateResponse = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photo_url: newPhotoUrl
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || 'Erro ao atualizar foto do paciente')
      }

      setPhotoUrl(newPhotoUrl)
      onPhotoUploaded?.(newPhotoUrl)

      toast({
        title: 'Sucesso',
        description: 'Foto do paciente atualizada com sucesso!'
      })

    } catch (error) {
      logger.error('Erro no upload da foto:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao fazer upload da foto',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    try {
      setUploading(true)

      // Remover foto do paciente no banco de dados
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photo_url: null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao remover foto do paciente')
      }

      setPhotoUrl(null)
      onPhotoUploaded?.(null as any)

      toast({
        title: 'Sucesso',
        description: 'Foto removida com sucesso!'
      })

    } catch (error) {
      logger.error('Erro ao remover foto:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao remover foto',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const initials = patientName
    .split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className="relative group">
        <Avatar className={cn(sizeClasses[size], 'border-2 border-gray-200')}>
          <AvatarImage src={photoUrl || undefined} />
          <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay com botões */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={openFileDialog}
              disabled={uploading}
              className="h-8 w-8 p-0"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </Button>

            {photoUrl && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Botões de ação (sempre visíveis em telas menores) */}
      <div className="flex space-x-2 md:hidden">
        <Button
          size="sm"
          variant="outline"
          onClick={openFileDialog}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {photoUrl ? 'Alterar' : 'Adicionar'} Foto
            </>
          )}
        </Button>

        {photoUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemovePhoto}
            disabled={uploading}
          >
            <X className="mr-2 h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {/* Input oculto para seleção de arquivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Texto de ajuda */}
      <p className="text-xs text-gray-500 text-center max-w-48">
        {photoUrl
          ? 'Passe o mouse sobre a foto para editar ou remover'
          : 'Clique para adicionar uma foto do paciente'}
      </p>
    </div>
  )
}