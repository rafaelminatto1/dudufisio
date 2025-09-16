/**
 * SVG Body Mapping Component - FisioFlow
 * Componente interativo de mapeamento corporal com regiões clicáveis
 * Permite registrar pontos de dor com intensidade e localização precisa
 */

'use client'

import { useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RotateCcw, Maximize2 } from 'lucide-react'
import type { PainPoint } from '@/lib/supabase/database.types'

interface BodyMapSVGProps {
  view: 'front' | 'back' | 'side'
  painPoints?: PainPoint[]
  onPainPointClick?: (x: number, y: number, region: string) => void
  onPainPointSelect?: (painPoint: PainPoint) => void
  readonly?: boolean
  className?: string
}

interface BodyRegion {
  id: string
  name: string
  path: string
  color: string
}

// Definição das regiões corporais com paths SVG
const bodyRegions: Record<string, BodyRegion[]> = {
  front: [
    {
      id: 'head',
      name: 'Cabeça',
      path: 'M400,50 C420,50 440,70 440,90 C440,110 430,130 400,140 C370,130 360,110 360,90 C360,70 380,50 400,50 Z',
      color: '#E3F2FD'
    },
    {
      id: 'neck',
      name: 'Pescoço',
      path: 'M385,140 L415,140 L415,170 L385,170 Z',
      color: '#E8F5E8'
    },
    {
      id: 'shoulder_left',
      name: 'Ombro Esquerdo',
      path: 'M320,170 C340,160 360,170 360,190 C360,210 350,220 330,220 C310,220 300,200 320,170 Z',
      color: '#FFF3E0'
    },
    {
      id: 'shoulder_right',
      name: 'Ombro Direito',
      path: 'M440,170 C460,160 480,170 480,190 C480,210 470,220 450,220 C430,220 420,200 440,170 Z',
      color: '#FFF3E0'
    },
    {
      id: 'chest',
      name: 'Tórax',
      path: 'M360,170 L440,170 L450,250 L350,250 Z',
      color: '#F3E5F5'
    },
    {
      id: 'arm_left',
      name: 'Braço Esquerdo',
      path: 'M320,220 L350,220 L355,320 L315,320 Z',
      color: '#E1F5FE'
    },
    {
      id: 'arm_right',
      name: 'Braço Direito',
      path: 'M450,220 L480,220 L485,320 L445,320 Z',
      color: '#E1F5FE'
    },
    {
      id: 'abdomen',
      name: 'Abdômen',
      path: 'M350,250 L450,250 L445,350 L355,350 Z',
      color: '#F1F8E9'
    },
    {
      id: 'forearm_left',
      name: 'Antebraço Esquerdo',
      path: 'M315,320 L355,320 L360,420 L310,420 Z',
      color: '#E0F2F1'
    },
    {
      id: 'forearm_right',
      name: 'Antebraço Direito',
      path: 'M445,320 L485,320 L490,420 L440,420 Z',
      color: '#E0F2F1'
    },
    {
      id: 'hip_left',
      name: 'Quadril Esquerdo',
      path: 'M355,350 L400,350 L395,400 L360,400 Z',
      color: '#FCE4EC'
    },
    {
      id: 'hip_right',
      name: 'Quadril Direito',
      path: 'M400,350 L445,350 L440,400 L405,400 Z',
      color: '#FCE4EC'
    },
    {
      id: 'hand_left',
      name: 'Mão Esquerda',
      path: 'M310,420 L360,420 L355,460 L305,460 Z',
      color: '#FFEBEE'
    },
    {
      id: 'hand_right',
      name: 'Mão Direita',
      path: 'M440,420 L490,420 L495,460 L445,460 Z',
      color: '#FFEBEE'
    },
    {
      id: 'thigh_left',
      name: 'Coxa Esquerda',
      path: 'M360,400 L395,400 L390,520 L365,520 Z',
      color: '#E8EAF6'
    },
    {
      id: 'thigh_right',
      name: 'Coxa Direita',
      path: 'M405,400 L440,400 L435,520 L410,520 Z',
      color: '#E8EAF6'
    },
    {
      id: 'knee_left',
      name: 'Joelho Esquerdo',
      path: 'M365,520 L390,520 L385,560 L370,560 Z',
      color: '#FFF8E1'
    },
    {
      id: 'knee_right',
      name: 'Joelho Direito',
      path: 'M410,520 L435,520 L430,560 L415,560 Z',
      color: '#FFF8E1'
    },
    {
      id: 'shin_left',
      name: 'Canela Esquerda',
      path: 'M370,560 L385,560 L380,680 L375,680 Z',
      color: '#E0F7FA'
    },
    {
      id: 'shin_right',
      name: 'Canela Direita',
      path: 'M415,560 L430,560 L425,680 L420,680 Z',
      color: '#E0F7FA'
    },
    {
      id: 'foot_left',
      name: 'Pé Esquerdo',
      path: 'M355,680 L395,680 L390,720 L350,720 Z',
      color: '#EFEBE9'
    },
    {
      id: 'foot_right',
      name: 'Pé Direito',
      path: 'M405,680 L445,680 L450,720 L410,720 Z',
      color: '#EFEBE9'
    }
  ],
  back: [
    // Definições das regiões para vista posterior
    {
      id: 'head',
      name: 'Cabeça',
      path: 'M400,50 C420,50 440,70 440,90 C440,110 430,130 400,140 C370,130 360,110 360,90 C360,70 380,50 400,50 Z',
      color: '#E3F2FD'
    },
    {
      id: 'neck',
      name: 'Pescoço',
      path: 'M385,140 L415,140 L415,170 L385,170 Z',
      color: '#E8F5E8'
    },
    {
      id: 'upper_back',
      name: 'Costas Superior',
      path: 'M360,170 L440,170 L450,300 L350,300 Z',
      color: '#F3E5F5'
    },
    {
      id: 'lower_back',
      name: 'Lombar',
      path: 'M350,300 L450,300 L445,400 L355,400 Z',
      color: '#F1F8E9'
    }
    // Adicionar mais regiões conforme necessário
  ],
  side: [
    // Definições das regiões para vista lateral
    {
      id: 'head',
      name: 'Cabeça',
      path: 'M400,50 C430,50 450,70 450,90 C450,110 430,130 400,140 L400,50 Z',
      color: '#E3F2FD'
    }
    // Adicionar mais regiões conforme necessário
  ]
}

export default function BodyMapSVG({
  view = 'front',
  painPoints = [],
  onPainPointClick,
  onPainPointSelect,
  readonly = false,
  className = ''
}: BodyMapSVGProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const handleRegionClick = useCallback((event: React.MouseEvent<SVGPathElement>, region: BodyRegion) => {
    if (readonly) return

    const svg = event.currentTarget.closest('svg')
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setSelectedRegion(region.id)
    onPainPointClick?.(x, y, region.id)
  }, [onPainPointClick, readonly])

  const handlePainPointClick = useCallback((painPoint: PainPoint) => {
    onPainPointSelect?.(painPoint)
  }, [onPainPointSelect])

  const getPainPointIntensityColor = (intensity: number): string => {
    if (intensity <= 2) return '#4CAF50' // Verde - dor leve
    if (intensity <= 5) return '#FF9800' // Laranja - dor moderada
    if (intensity <= 7) return '#FF5722' // Vermelho claro - dor intensa
    return '#D32F2F' // Vermelho escuro - dor severa
  }

  const getRegionColor = (region: BodyRegion): string => {
    if (hoveredRegion === region.id) return '#BBDEFB'
    if (selectedRegion === region.id) return '#90CAF9'

    // Verificar se há pontos de dor nesta região
    const regionPainPoints = painPoints.filter(pp => pp.body_region === region.id)
    if (regionPainPoints.length > 0) {
      const avgIntensity = regionPainPoints.reduce((sum, pp) => sum + pp.pain_intensity, 0) / regionPainPoints.length
      return getPainPointIntensityColor(avgIntensity) + '40' // 25% opacity
    }

    return region.color
  }

  const regions = bodyRegions[view] || []

  return (
    <div className={`relative bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header com controles */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">
            Mapeamento Corporal - Vista {view === 'front' ? 'Frontal' : view === 'back' ? 'Posterior' : 'Lateral'}
          </h3>
          {painPoints.length > 0 && (
            <Badge variant="secondary">
              {painPoints.length} ponto{painPoints.length !== 1 ? 's' : ''} de dor
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedRegion(null)}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* SVG Body Map */}
      <div className="p-4">
        <TooltipProvider>
          <div className="flex justify-center">
            <svg
              width="400"
              height="500"
              viewBox="0 0 800 800"
              className="max-w-full h-auto border rounded-lg bg-gray-50"
              style={{ aspectRatio: '4/5' }}
            >
              {/* Definir gradientes e padrões */}
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.2"/>
                </filter>
                <pattern id="pain-pattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#FF5722" opacity="0.3"/>
                </pattern>
              </defs>

              {/* Renderizar regiões do corpo */}
              {regions.map((region) => (
                <Tooltip key={region.id}>
                  <TooltipTrigger asChild>
                    <path
                      d={region.path}
                      fill={getRegionColor(region)}
                      stroke="#666"
                      strokeWidth="1"
                      className={`transition-all duration-200 ${
                        readonly ? '' : 'hover:stroke-blue-500 hover:stroke-2 cursor-pointer'
                      }`}
                      filter="url(#shadow)"
                      onClick={(e) => handleRegionClick(e, region)}
                      onMouseEnter={() => setHoveredRegion(region.id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">{region.name}</p>
                      {painPoints.filter(pp => pp.body_region === region.id).length > 0 && (
                        <p className="text-xs text-red-600">
                          {painPoints.filter(pp => pp.body_region === region.id).length} ponto(s) de dor
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Renderizar pontos de dor */}
              {painPoints.map((painPoint) => (
                <g key={painPoint.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <circle
                        cx={(painPoint.x_coordinate / 100) * 800}
                        cy={(painPoint.y_coordinate / 100) * 800}
                        r="8"
                        fill={getPainPointIntensityColor(painPoint.pain_intensity)}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer hover:r-10 transition-all duration-200"
                        filter="url(#shadow)"
                        onClick={() => handlePainPointClick(painPoint)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-medium">
                          Intensidade: {painPoint.pain_intensity}/10
                        </p>
                        {painPoint.pain_type && (
                          <p className="text-xs capitalize">{painPoint.pain_type}</p>
                        )}
                        {painPoint.pain_description && (
                          <p className="text-xs max-w-48 break-words">
                            {painPoint.pain_description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(painPoint.assessment_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Pulsar para dor intensa */}
                  {painPoint.pain_intensity >= 8 && (
                    <circle
                      cx={(painPoint.x_coordinate / 100) * 800}
                      cy={(painPoint.y_coordinate / 100) * 800}
                      r="12"
                      fill="none"
                      stroke={getPainPointIntensityColor(painPoint.pain_intensity)}
                      strokeWidth="2"
                      opacity="0.5"
                      className="animate-ping"
                    />
                  )}
                </g>
              ))}

              {/* Indicador de região selecionada */}
              {selectedRegion && (
                <text
                  x="400"
                  y="30"
                  textAnchor="middle"
                  className="fill-blue-600 font-semibold text-sm"
                >
                  Região selecionada: {regions.find(r => r.id === selectedRegion)?.name}
                </text>
              )}
            </svg>
          </div>
        </TooltipProvider>
      </div>

      {/* Legenda de intensidade de dor */}
      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Escala de Intensidade da Dor:</p>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>0-2 Leve</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>3-5 Moderada</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>6-7 Intensa</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-800"></div>
              <span>8-10 Severa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instruções */}
      {!readonly && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-600 text-center">
            Clique em uma região do corpo para registrar um ponto de dor
          </p>
        </div>
      )}
    </div>
  )
}

// Skeleton loading component
export function BodyMapSkeleton() {
  return (
    <div className="relative bg-white rounded-lg border shadow-sm animate-pulse">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-10"></div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-center">
          <div className="w-80 h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-16"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}