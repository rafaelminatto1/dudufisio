'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Checkbox } from '@/src/components/ui/checkbox'
import { useToast } from '@/src/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import logger from '../../../../lib/logger';

const patientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  rg: z.string().optional(),
  date_of_birth: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['masculino', 'feminino', 'outro']),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional(),
  emergency_contact_name: z.string().min(2, 'Nome do contato de emergência é obrigatório'),
  emergency_contact_phone: z.string().min(10, 'Telefone de emergência é obrigatório'),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  health_insurance: z.string().optional(),
  health_insurance_number: z.string().optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  observations: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']),
  consent_lgpd: z.boolean()
})

type PatientFormData = z.infer<typeof patientSchema>

interface Patient extends PatientFormData {
  id: string
  cpf: string
  created_at: string
  updated_at: string
}

export default function EditPatientPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const patientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [patient, setPatient] = useState<Patient | null>(null)

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      rg: '',
      date_of_birth: '',
      gender: 'masculino',
      phone: '',
      email: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      health_insurance: '',
      health_insurance_number: '',
      medical_history: '',
      current_medications: '',
      allergies: '',
      observations: '',
      status: 'active',
      consent_lgpd: true
    }
  })

  // Carregar dados do paciente
  useEffect(() => {
    const loadPatient = async () => {
      try {
        setLoading(true)

        const response = await fetch(`/api/patients/${patientId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao carregar paciente')
        }

        const result = await response.json()
        const patientData = result.data

        setPatient(patientData)

        // Preencher formulário com dados do paciente
        form.reset({
          name: patientData.name || '',
          rg: patientData.rg || '',
          date_of_birth: patientData.date_of_birth ? patientData.date_of_birth.split('T')[0] : '',
          gender: patientData.gender || 'masculino',
          phone: patientData.phone || '',
          email: patientData.email || '',
          emergency_contact_name: patientData.emergency_contact_name || '',
          emergency_contact_phone: patientData.emergency_contact_phone || '',
          address_line1: patientData.address_line1 || '',
          address_line2: patientData.address_line2 || '',
          city: patientData.city || '',
          state: patientData.state || '',
          postal_code: patientData.postal_code || '',
          health_insurance: patientData.health_insurance || '',
          health_insurance_number: patientData.health_insurance_number || '',
          medical_history: patientData.medical_history || '',
          current_medications: patientData.current_medications || '',
          allergies: patientData.allergies || '',
          observations: patientData.observations || '',
          status: patientData.status || 'active',
          consent_lgpd: patientData.consent_lgpd || false
        })

      } catch (error) {
        logger.error('Erro ao carregar paciente:', error)
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao carregar paciente',
          variant: 'destructive'
        })
        router.push('/patients')
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      loadPatient()
    }
  }, [patientId, form, router, toast])

  const onSubmit = async (data: PatientFormData) => {
    try {
      setSaving(true)

      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.details) {
          // Mostrar erros de validação
          errorData.details.forEach((detail: any) => {
            form.setError(detail.field as any, {
              type: 'server',
              message: detail.message
            })
          })
          return
        }
        throw new Error(errorData.error || 'Erro ao atualizar paciente')
      }

      const result = await response.json()

      toast({
        title: 'Sucesso',
        description: result.message || 'Paciente atualizado com sucesso'
      })

      // Redirecionar para a página de detalhes
      router.push(`/patients/${patientId}`)

    } catch (error) {
      logger.error('Erro ao atualizar paciente:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar paciente',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Paciente não encontrado</p>
          <Button onClick={() => router.push('/patients')} className="mt-4">
            Voltar para Pacientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/patients/${patientId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Paciente</h1>
            <p className="text-gray-600">
              {patient.name} - {patient.cpf}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/patients/${patientId}`)}
            disabled={saving}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Dados básicos do paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Nome completo do paciente"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label>CPF (não editável)</Label>
                <Input value={patient.cpf} disabled />
              </div>

              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  {...form.register('rg')}
                  placeholder="RG do paciente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_birth">Data de Nascimento *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...form.register('date_of_birth')}
                  />
                  {form.formState.errors.date_of_birth && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.date_of_birth.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gênero *</Label>
                  <Select
                    value={form.watch('gender')}
                    onValueChange={(value) => form.setValue('gender', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    placeholder="(00) 00000-0000"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="email@exemplo.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contato de Emergência */}
          <Card>
            <CardHeader>
              <CardTitle>Contato de Emergência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergency_contact_name">Nome do Contato *</Label>
                <Input
                  id="emergency_contact_name"
                  {...form.register('emergency_contact_name')}
                  placeholder="Nome do contato de emergência"
                />
                {form.formState.errors.emergency_contact_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.emergency_contact_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="emergency_contact_phone">Telefone do Contato *</Label>
                <Input
                  id="emergency_contact_phone"
                  {...form.register('emergency_contact_phone')}
                  placeholder="(00) 00000-0000"
                />
                {form.formState.errors.emergency_contact_phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.emergency_contact_phone.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address_line1">Rua/Avenida</Label>
              <Input
                id="address_line1"
                {...form.register('address_line1')}
                placeholder="Rua, número"
              />
            </div>

            <div>
              <Label htmlFor="address_line2">Complemento</Label>
              <Input
                id="address_line2"
                {...form.register('address_line2')}
                placeholder="Apartamento, bloco, etc."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="Cidade"
                />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="UF"
                />
              </div>

              <div>
                <Label htmlFor="postal_code">CEP</Label>
                <Input
                  id="postal_code"
                  {...form.register('postal_code')}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Saúde */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Saúde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="health_insurance">Plano de Saúde</Label>
                <Input
                  id="health_insurance"
                  {...form.register('health_insurance')}
                  placeholder="Nome do plano de saúde"
                />
              </div>

              <div>
                <Label htmlFor="health_insurance_number">Número da Carteirinha</Label>
                <Input
                  id="health_insurance_number"
                  {...form.register('health_insurance_number')}
                  placeholder="Número da carteirinha"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="medical_history">Histórico Médico</Label>
              <Textarea
                id="medical_history"
                {...form.register('medical_history')}
                placeholder="Histórico médico relevante"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="current_medications">Medicações Atuais</Label>
              <Textarea
                id="current_medications"
                {...form.register('current_medications')}
                placeholder="Medicações em uso"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="allergies">Alergias</Label>
              <Textarea
                id="allergies"
                {...form.register('allergies')}
                placeholder="Alergias conhecidas"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                {...form.register('observations')}
                placeholder="Observações gerais"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* LGPD */}
        <Card>
          <CardHeader>
            <CardTitle>Consentimento LGPD</CardTitle>
            <CardDescription>
              Gerenciar consentimento para processamento de dados pessoais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent_lgpd"
                checked={form.watch('consent_lgpd')}
                onCheckedChange={(checked) => form.setValue('consent_lgpd', checked as boolean)}
              />
              <Label htmlFor="consent_lgpd">
                Paciente consente com o processamento de dados pessoais conforme LGPD
              </Label>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}