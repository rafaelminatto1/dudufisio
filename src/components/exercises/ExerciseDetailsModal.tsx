'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import logger from '../../../lib/logger';
import {
  Clock,
  Target,
  Repeat,
  Timer,
  AlertTriangle,
  XCircle,
  Heart,
  Play,
  Edit,
  Trash2,
  UserPlus,
  Copy
} from 'lucide-react'

interface Exercise {
  id: string
  name: string
  description: string
  category: string
  body_regions: string[]
  difficulty_level: string
  duration_minutes: number
  repetitions?: number
  sets?: number
  hold_time_seconds?: number
  equipment_needed?: string[]
  instructions: string
  precautions?: string
  contraindications?: string
  video_url?: string
  thumbnail_url?: string
  tags?: string[]
  is_active: boolean
  is_template: boolean
  created_at: string
  updated_at: string
  created_by: {
    full_name: string
  }
}

interface ExerciseDetailsModalProps {
  exercise: Exercise
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

const CATEGORIES = {
  'fortalecimento': 'Fortalecimento',
  'alongamento': 'Alongamento',
  'mobilizacao': 'Mobilização',
  'equilibrio': 'Equilíbrio',
  'coordenacao': 'Coordenação',
  'respiratorio': 'Respiratório',
  'cardiovascular': 'Cardiovascular',
  'propriocepcao': 'Propriocepção'
}

const DIFFICULTY_LEVELS = {
  'iniciante': { label: 'Iniciante', color: 'bg-green-100 text-green-800' },
  'intermediario': { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800' },
  'avancado': { label: 'Avançado', color: 'bg-red-100 text-red-800' }
}

export function ExerciseDetailsModal({ exercise, open, onOpenChange, onUpdate }: ExerciseDetailsModalProps) {
  const [loading, setLoading] = useState(false)

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}min`
        : `${hours}h`
    }
    return `${minutes}min`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handlePrescribe = () => {
    // TODO: Open prescription modal
    logger.info('Prescrevendo exercício:', exercise.id)
  }

  const handleEdit = () => {
    // TODO: Open edit modal
    logger.info('Editando exercício:', exercise.id)
  }

  const handleDuplicate = () => {
    // TODO: Duplicate exercise
    logger.info('Duplicando exercício:', exercise.id)
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este exercício?')) return

    setLoading(true)
    try {
      // TODO: Implement delete API call
      logger.info('Excluindo exercício:', exercise.id)
    } catch (error) {
      logger.error('Erro ao excluir exercício:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl">{exercise.name}</DialogTitle>
                {exercise.is_template && (
                  <Heart className="h-5 w-5 text-red-500 fill-current" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {CATEGORIES[exercise.category as keyof typeof CATEGORIES]}
                </Badge>
                <Badge
                  variant="secondary"
                  className={DIFFICULTY_LEVELS[exercise.difficulty_level as keyof typeof DIFFICULTY_LEVELS]?.color}
                >
                  {DIFFICULTY_LEVELS[exercise.difficulty_level as keyof typeof DIFFICULTY_LEVELS]?.label}
                </Badge>
              </div>
              <DialogDescription className="text-base">
                {exercise.description}
              </DialogDescription>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button onClick={handlePrescribe} size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Prescrever
              </Button>
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button onClick={handleDuplicate} variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exercise Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parâmetros do Exercício</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duração</p>
                    <p className="font-medium">{formatDuration(exercise.duration_minutes)}</p>
                  </div>
                </div>

                {exercise.sets && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Séries</p>
                      <p className="font-medium">{exercise.sets}</p>
                    </div>
                  </div>
                )}

                {exercise.repetitions && (
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Repetições</p>
                      <p className="font-medium">{exercise.repetitions}</p>
                    </div>
                  </div>
                )}

                {exercise.hold_time_seconds && (
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sustentação</p>
                      <p className="font-medium">{exercise.hold_time_seconds}s</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Body Regions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Regiões Corporais</h3>
            <div className="flex flex-wrap gap-2">
              {exercise.body_regions.map((region) => (
                <Badge key={region} variant="outline">
                  {region}
                </Badge>
              ))}
            </div>
          </div>

          {/* Equipment */}
          {exercise.equipment_needed && exercise.equipment_needed.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Equipamentos Necessários</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment_needed.map((equipment) => (
                  <Badge key={equipment} variant="secondary">
                    {equipment}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instruções de Execução</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {exercise.instructions}
              </p>
            </CardContent>
          </Card>

          {/* Media */}
          {(exercise.video_url || exercise.thumbnail_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mídia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exercise.video_url && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Vídeo Demonstrativo
                    </h4>
                    <Button
                      variant="outline"
                      onClick={() => window.open(exercise.video_url, '_blank')}
                    >
                      Assistir Vídeo
                    </Button>
                  </div>
                )}

                {exercise.thumbnail_url && (
                  <div>
                    <h4 className="font-medium mb-2">Imagem</h4>
                    <img
                      src={exercise.thumbnail_url}
                      alt={exercise.name}
                      className="max-w-full h-auto max-h-64 rounded-md border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Safety Information */}
          {(exercise.precautions || exercise.contraindications) && (
            <div className="space-y-4">
              {exercise.precautions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                      Precauções
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {exercise.precautions}
                    </p>
                  </CardContent>
                </Card>
              )}

              {exercise.contraindications && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      Contraindicações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {exercise.contraindications}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tags */}
          {exercise.tags && exercise.tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p><strong>Criado por:</strong> {exercise.created_by.full_name}</p>
              <p><strong>Data de criação:</strong> {formatDate(exercise.created_at)}</p>
            </div>
            <div>
              <p><strong>Última atualização:</strong> {formatDate(exercise.updated_at)}</p>
              <p><strong>Status:</strong> {exercise.is_active ? 'Ativo' : 'Inativo'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}