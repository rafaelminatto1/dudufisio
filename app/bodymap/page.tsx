'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import BodyMapSVG from '@/src/components/bodymap/BodyMapSVG'
import PainPointModal from '@/src/components/bodymap/PainPointModal'
import { RotateCcw, Save, Eye } from 'lucide-react'
import type { PainPoint } from '@/src/lib/supabase/database.types'

// Mock data for testing
const mockPainPoints: PainPoint[] = [
  {
    id: '1',
    org_id: 'org_123',
    patient_id: 'patient_1',
    session_id: 'session1',
    body_region: 'shoulder_left',
    x_coordinate: 32,
    y_coordinate: 22,
    pain_intensity: 7,
    pain_type: 'aguda',
    pain_description: 'Dor persistente no ombro esquerdo após movimento brusco',
    clinical_notes: 'Paciente relata dor que irradia para o braço',
    assessment_date: '2025-09-16T10:00:00Z',
    assessment_type: 'progress',
    improvement_notes: 'Ligeira melhora desde a última sessão',
    created_at: '2025-09-16T10:00:00Z',
    updated_at: '2025-09-16T10:00:00Z',
    created_by: 'user_123',
    updated_by: 'user_123'
  },
  {
    id: '2',
    org_id: 'org_123',
    patient_id: 'patient_1',
    session_id: 'session1',
    body_region: 'lower_back',
    x_coordinate: 50,
    y_coordinate: 45,
    pain_intensity: 9,
    pain_type: 'cronica',
    pain_description: 'Dor lombar crônica com irradiação para perna direita',
    clinical_notes: 'Possível compressão nervosa, requer acompanhamento',
    assessment_date: '2025-09-16T10:00:00Z',
    assessment_type: 'initial',
    improvement_notes: null,
    created_at: '2025-09-16T10:00:00Z',
    updated_at: '2025-09-16T10:00:00Z',
    created_by: 'user_123',
    updated_by: 'user_123'
  },
  {
    id: '3',
    org_id: 'org_123',
    patient_id: 'patient_1',
    session_id: 'session1',
    body_region: 'knee_right',
    x_coordinate: 55,
    y_coordinate: 67,
    pain_intensity: 4,
    pain_type: 'rigidez',
    pain_description: 'Rigidez matinal no joelho direito',
    clinical_notes: 'Responde bem aos exercícios de aquecimento',
    assessment_date: '2025-09-16T10:00:00Z',
    assessment_type: 'progress',
    improvement_notes: 'Melhora significativa na amplitude de movimento',
    created_at: '2025-09-16T10:00:00Z',
    updated_at: '2025-09-16T10:00:00Z',
    created_by: 'user_123',
    updated_by: 'user_123'
  }
]

export default function BodyMapTestPage() {
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'side'>('front')
  const [painPoints, setPainPoints] = useState<PainPoint[]>(mockPainPoints)
  const [selectedPainPoint, setSelectedPainPoint] = useState<PainPoint | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPainPointData, setNewPainPointData] = useState<{
    x: number
    y: number
    region: string
  } | null>(null)
  const [readOnlyMode, setReadOnlyMode] = useState(false)

  const handlePainPointClick = (x: number, y: number, region: string) => {
    if (readOnlyMode) return

    setNewPainPointData({ x, y, region })
    setSelectedPainPoint(null)
    setIsModalOpen(true)
  }

  const handlePainPointSelect = (painPoint: PainPoint) => {
    setSelectedPainPoint(painPoint)
    setNewPainPointData(null)
    setIsModalOpen(true)
  }

  const handleSavePainPoint = async (data: any) => {
    if (selectedPainPoint) {
      // Update existing pain point
      setPainPoints(prev =>
        prev.map(pp =>
          pp.id === selectedPainPoint.id
            ? { ...pp, ...data, updated_at: new Date().toISOString() }
            : pp
        )
      )
    } else if (newPainPointData) {
      // Create new pain point
      const newPainPoint: PainPoint = {
        id: `pain_${Date.now()}`,
        session_id: 'session1',
        body_region: newPainPointData.region,
        x_coordinate: newPainPointData.x,
        y_coordinate: newPainPointData.y,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setPainPoints(prev => [...prev, newPainPoint])
    }

    setIsModalOpen(false)
    setSelectedPainPoint(null)
    setNewPainPointData(null)
  }

  const handleClearPainPoints = () => {
    setPainPoints([])
  }

  const getPainSummary = () => {
    if (painPoints.length === 0) return null

    const avgIntensity = painPoints.reduce((sum, pp) => sum + pp.pain_intensity, 0) / painPoints.length
    const severeCount = painPoints.filter(pp => pp.pain_intensity >= 8).length
    const moderateCount = painPoints.filter(pp => pp.pain_intensity >= 5 && pp.pain_intensity < 8).length
    const mildCount = painPoints.filter(pp => pp.pain_intensity < 5).length

    return {
      total: painPoints.length,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      severe: severeCount,
      moderate: moderateCount,
      mild: mildCount
    }
  }

  const summary = getPainSummary()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mapeamento Corporal Interativo</h1>
          <p className="text-gray-600">
            Sistema avançado de registro e visualização de pontos de dor
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={readOnlyMode ? "outline" : "default"}
            onClick={() => setReadOnlyMode(!readOnlyMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {readOnlyMode ? 'Modo Edição' : 'Modo Visualização'}
          </Button>
          <Button variant="outline" onClick={handleClearPainPoints}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar Pontos
          </Button>
        </div>
      </div>

      {/* Pain Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Intensidade Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avgIntensity}/10</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dor Severa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.severe}</div>
              <p className="text-xs text-muted-foreground">8-10 intensidade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dor Moderada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.moderate}</div>
              <p className="text-xs text-muted-foreground">5-7 intensidade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dor Leve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.mild}</div>
              <p className="text-xs text-muted-foreground">0-4 intensidade</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Body Map Tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mapeamento Corporal</CardTitle>
              <CardDescription>
                {readOnlyMode
                  ? 'Visualize os pontos de dor registrados'
                  : 'Clique em uma região do corpo para registrar um ponto de dor'
                }
              </CardDescription>
            </div>
            {painPoints.length > 0 && (
              <Badge variant="secondary">
                {painPoints.length} ponto{painPoints.length !== 1 ? 's' : ''} registrado{painPoints.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="front">Vista Frontal</TabsTrigger>
              <TabsTrigger value="back">Vista Posterior</TabsTrigger>
              <TabsTrigger value="side">Vista Lateral</TabsTrigger>
            </TabsList>

            <TabsContent value="front" className="mt-6">
              <BodyMapSVG
                view="front"
                painPoints={painPoints.filter(pp => {
                  // Filter pain points that belong to front view regions
                  const frontRegions = ['head', 'neck', 'chest', 'abdomen', 'shoulder_left', 'shoulder_right',
                                      'arm_left', 'arm_right', 'forearm_left', 'forearm_right', 'hand_left', 'hand_right',
                                      'hip_left', 'hip_right', 'thigh_left', 'thigh_right', 'knee_left', 'knee_right',
                                      'shin_left', 'shin_right', 'foot_left', 'foot_right']
                  return frontRegions.includes(pp.body_region)
                })}
                onPainPointClick={handlePainPointClick}
                onPainPointSelect={handlePainPointSelect}
                readonly={readOnlyMode}
              />
            </TabsContent>

            <TabsContent value="back" className="mt-6">
              <BodyMapSVG
                view="back"
                painPoints={painPoints.filter(pp => {
                  const backRegions = ['head', 'neck', 'upper_back', 'lower_back']
                  return backRegions.includes(pp.body_region)
                })}
                onPainPointClick={handlePainPointClick}
                onPainPointSelect={handlePainPointSelect}
                readonly={readOnlyMode}
              />
            </TabsContent>

            <TabsContent value="side" className="mt-6">
              <BodyMapSVG
                view="side"
                painPoints={painPoints.filter(pp => {
                  const sideRegions = ['head']
                  return sideRegions.includes(pp.body_region)
                })}
                onPainPointClick={handlePainPointClick}
                onPainPointSelect={handlePainPointSelect}
                readonly={readOnlyMode}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pain Points List */}
      {painPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pontos de Dor Registrados</CardTitle>
            <CardDescription>
              Lista detalhada de todos os pontos de dor identificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {painPoints.map((painPoint, index) => (
                <div
                  key={painPoint.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePainPointSelect(painPoint)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {painPoint.body_region.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {painPoint.pain_description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {painPoint.pain_type || 'Não especificado'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(painPoint.assessment_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold mb-1">
                      {painPoint.pain_intensity}/10
                    </div>
                    <Badge
                      variant={painPoint.pain_intensity >= 8 ? 'destructive' :
                              painPoint.pain_intensity >= 5 ? 'default' : 'secondary'}
                    >
                      {painPoint.pain_intensity >= 8 ? 'Severa' :
                       painPoint.pain_intensity >= 5 ? 'Moderada' : 'Leve'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pain Point Modal */}
      <PainPointModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPainPoint(null)
          setNewPainPointData(null)
        }}
        onSave={handleSavePainPoint}
        painPoint={selectedPainPoint}
        coordinates={newPainPointData || undefined}
      />
    </div>
  )
}