'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateExerciseModal } from '@/components/exercises/CreateExerciseModal'
import { ExerciseDetailsModal } from '@/components/exercises/ExerciseDetailsModal'
import { Skeleton } from '@/components/ui/skeleton'

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

interface ExercisesResponse {
  success: boolean
  data: Exercise[]
  meta: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

const CATEGORIES = [
  { value: 'fortalecimento', label: 'Fortalecimento' },
  { value: 'alongamento', label: 'Alongamento' },
  { value: 'mobilizacao', label: 'Mobilização' },
  { value: 'equilibrio', label: 'Equilíbrio' },
  { value: 'coordenacao', label: 'Coordenação' },
  { value: 'respiratorio', label: 'Respiratório' },
  { value: 'cardiovascular', label: 'Cardiovascular' },
  { value: 'propriocepcao', label: 'Propriocepção' }
]

const DIFFICULTY_LEVELS = [
  { value: 'iniciante', label: 'Iniciante', color: 'bg-green-100 text-green-800' },
  { value: 'intermediario', label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'avancado', label: 'Avançado', color: 'bg-red-100 text-red-800' }
]

const BODY_REGIONS = [
  'Cabeça e pescoço', 'Ombros', 'Braços', 'Antebraços', 'Mãos', 'Tórax',
  'Abdome', 'Coluna cervical', 'Coluna torácica', 'Coluna lombar',
  'Quadris', 'Coxas', 'Joelhos', 'Pernas', 'Tornozelos', 'Pés'
]

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  const fetchExercises = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedDifficulty) params.append('difficulty_level', selectedDifficulty)
      if (selectedBodyRegion) params.append('body_region', selectedBodyRegion)

      const response = await fetch(`/api/exercises?${params}`)
      const data: ExercisesResponse = await response.json()

      if (data.success) {
        setExercises(data.data)
        setTotalPages(data.meta.total_pages)
      }
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExercises()
  }, [currentPage, searchTerm, selectedCategory, selectedDifficulty, selectedBodyRegion])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedDifficulty('')
    setSelectedBodyRegion('')
    setCurrentPage(1)
  }

  const getDifficultyColor = (difficulty: string) => {
    return DIFFICULTY_LEVELS.find(d => d.value === difficulty)?.color || 'bg-gray-100 text-gray-800'
  }

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Exercícios</h1>
          <p className="text-muted-foreground">
            Gerencie exercícios e crie prescrições personalizadas
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Exercício
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exercícios..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBodyRegion} onValueChange={setSelectedBodyRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Região Corporal" />
              </SelectTrigger>
              <SelectContent>
                {BODY_REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedExercise(exercise)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                        {exercise.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {CATEGORIES.find(c => c.value === exercise.category)?.label}
                      </CardDescription>
                    </div>
                    {exercise.is_template && (
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-3">
                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {exercise.description}
                  </p>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getDifficultyColor(exercise.difficulty_level)}`}
                    >
                      {DIFFICULTY_LEVELS.find(d => d.value === exercise.difficulty_level)?.label}
                    </Badge>

                    {/* Body Regions */}
                    {exercise.body_regions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {exercise.body_regions.slice(0, 2).map((region) => (
                          <Badge key={region} variant="outline" className="text-xs">
                            {region}
                          </Badge>
                        ))}
                        {exercise.body_regions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{exercise.body_regions.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Exercise Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Duração: {formatDuration(exercise.duration_minutes)}</div>
                    {exercise.sets && (
                      <div>{exercise.sets} séries</div>
                    )}
                    {exercise.repetitions && (
                      <div>{exercise.repetitions} rep.</div>
                    )}
                    {exercise.equipment_needed && exercise.equipment_needed.length > 0 && (
                      <div>Equipamentos: {exercise.equipment_needed.length}</div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-3">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Ver Detalhes
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}

          {/* Empty State */}
          {exercises.length === 0 && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum exercício encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Não há exercícios que correspondam aos filtros selecionados.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modals */}
      <CreateExerciseModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchExercises()
        }}
      />

      {selectedExercise && (
        <ExerciseDetailsModal
          exercise={selectedExercise}
          open={!!selectedExercise}
          onOpenChange={(open) => !open && setSelectedExercise(null)}
          onUpdate={fetchExercises}
        />
      )}
    </div>
  )
}