'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

const createExerciseSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.enum(['fortalecimento', 'alongamento', 'mobilizacao', 'equilibrio', 'coordenacao', 'respiratorio', 'cardiovascular', 'propriocepcao']),
  body_regions: z.array(z.string()).min(1, 'Pelo menos uma região corporal é obrigatória'),
  difficulty_level: z.enum(['iniciante', 'intermediario', 'avancado']),
  duration_minutes: z.number().min(1, 'Duração mínima de 1 minuto').max(120, 'Duração máxima de 2 horas'),
  repetitions: z.number().min(1).max(100).optional(),
  sets: z.number().min(1).max(10).optional(),
  hold_time_seconds: z.number().min(1).max(300).optional(),
  equipment_needed: z.array(z.string()).optional(),
  instructions: z.string().min(20, 'Instruções devem ter pelo menos 20 caracteres'),
  precautions: z.string().optional(),
  contraindications: z.string().optional(),
  video_url: z.string().url().optional().or(z.literal('')),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  is_template: z.boolean().default(false)
})

type CreateExerciseForm = z.infer<typeof createExerciseSchema>

interface CreateExerciseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
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
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' }
]

const BODY_REGIONS = [
  'Cabeça e pescoço', 'Ombros', 'Braços', 'Antebraços', 'Mãos', 'Tórax',
  'Abdome', 'Coluna cervical', 'Coluna torácica', 'Coluna lombar',
  'Quadris', 'Coxas', 'Joelhos', 'Pernas', 'Tornozelos', 'Pés'
]

const COMMON_EQUIPMENT = [
  'Theraband', 'Halteres', 'Bola suíça', 'Colchonete', 'Bastão', 'Step',
  'Bosu', 'Cones', 'Elásticos', 'Peso corporal', 'Cadeira', 'Parede'
]

export function CreateExerciseModal({ open, onOpenChange, onSuccess }: CreateExerciseModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [newBodyRegion, setNewBodyRegion] = useState('')
  const [newEquipment, setNewEquipment] = useState('')
  const [newTag, setNewTag] = useState('')

  const form = useForm<CreateExerciseForm>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: '',
      description: '',
      category: undefined,
      body_regions: [],
      difficulty_level: undefined,
      duration_minutes: 15,
      repetitions: undefined,
      sets: undefined,
      hold_time_seconds: undefined,
      equipment_needed: [],
      instructions: '',
      precautions: '',
      contraindications: '',
      video_url: '',
      thumbnail_url: '',
      tags: [],
      is_template: false
    }
  })

  const handleSubmit = async (data: CreateExerciseForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Exercício criado com sucesso',
          description: `${data.name} foi adicionado à biblioteca`
        })
        form.reset()
        onSuccess()
      } else {
        throw new Error(result.error || 'Erro ao criar exercício')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar exercício',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addBodyRegion = (region: string) => {
    const currentRegions = form.getValues('body_regions')
    if (!currentRegions.includes(region)) {
      form.setValue('body_regions', [...currentRegions, region])
    }
  }

  const removeBodyRegion = (region: string) => {
    const currentRegions = form.getValues('body_regions')
    form.setValue('body_regions', currentRegions.filter(r => r !== region))
  }

  const addEquipment = (equipment: string) => {
    const currentEquipment = form.getValues('equipment_needed') || []
    if (!currentEquipment.includes(equipment)) {
      form.setValue('equipment_needed', [...currentEquipment, equipment])
    }
  }

  const removeEquipment = (equipment: string) => {
    const currentEquipment = form.getValues('equipment_needed') || []
    form.setValue('equipment_needed', currentEquipment.filter(e => e !== equipment))
  }

  const addTag = (tag: string) => {
    const currentTags = form.getValues('tags') || []
    if (!currentTags.includes(tag)) {
      form.setValue('tags', [...currentTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags') || []
    form.setValue('tags', currentTags.filter(t => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Exercício</DialogTitle>
          <DialogDescription>
            Crie um novo exercício para a biblioteca
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Exercício *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do exercício" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição detalhada do exercício"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Dificuldade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Body Regions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Regiões Corporais *</h3>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={newBodyRegion} onValueChange={setNewBodyRegion}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_REGIONS.filter(region => !form.watch('body_regions').includes(region)).map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newBodyRegion) {
                        addBodyRegion(newBodyRegion)
                        setNewBodyRegion('')
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form.watch('body_regions').map((region) => (
                    <Badge key={region} variant="secondary" className="gap-1">
                      {region}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeBodyRegion(region)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
              {form.formState.errors.body_regions && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.body_regions.message}
                </p>
              )}
            </div>

            {/* Exercise Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parâmetros do Exercício</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Séries</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="Opcional"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repetitions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repetições</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="Opcional"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hold_time_seconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo de Sustentação (seg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="300"
                          placeholder="Opcional"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Equipamentos Necessários</h3>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={newEquipment} onValueChange={setNewEquipment}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_EQUIPMENT.filter(equipment => !(form.watch('equipment_needed') || []).includes(equipment)).map((equipment) => (
                        <SelectItem key={equipment} value={equipment}>
                          {equipment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newEquipment) {
                        addEquipment(newEquipment)
                        setNewEquipment('')
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(form.watch('equipment_needed') || []).map((equipment) => (
                    <Badge key={equipment} variant="outline" className="gap-1">
                      {equipment}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEquipment(equipment)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Instruções e Observações</h3>

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções de Execução *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva como executar o exercício"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precautions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precauções</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cuidados especiais durante a execução"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contraindications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraindicações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Situações em que o exercício não deve ser realizado"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Media URLs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mídia (Opcional)</h3>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Vídeo</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://exemplo.com/video"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thumbnail_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://exemplo.com/imagem"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tags (Opcional)</h3>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newTag.trim()) {
                          addTag(newTag.trim())
                          setNewTag('')
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newTag.trim()) {
                        addTag(newTag.trim())
                        setNewTag('')
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(form.watch('tags') || []).map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Option */}
            <FormField
              control={form.control}
              name="is_template"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Marcar como template favorito
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Este exercício será destacado na biblioteca para acesso rápido
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Exercício'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}