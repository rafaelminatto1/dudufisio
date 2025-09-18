'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff, 
  Phone, 
  PhoneOff,
  Users,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface VideoCallComponentProps {
  sessionId: string
  participantId: string
  participantName: string
  role: 'patient' | 'therapist' | 'observer'
  onCallEnd?: () => void
}

export function VideoCallComponent({
  sessionId,
  participantId,
  participantName,
  role,
  onCallEnd
}: VideoCallComponentProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent')
  const [participants, setParticipants] = useState<string[]>([])
  const [callDuration, setCallDuration] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [technicalIssues, setTechnicalIssues] = useState<string[]>([])

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Inicializar chamada de vídeo
    initializeCall()

    // Atualizar duração da chamada
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      // Cleanup da chamada
      cleanup()
    }
  }, [])

  const initializeCall = async () => {
    try {
      // Simular inicialização da chamada
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsConnected(true)
      setParticipants([participantName, 'Dr. Maria Santos'])
      
      // Configurar stream de vídeo local (simulado)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = await getLocalVideoStream()
      }

      toast.success('Chamada iniciada com sucesso!')
    } catch (error) {
      toast.error('Erro ao iniciar chamada de vídeo')
      console.error('Erro na inicialização:', error)
    }
  }

  const getLocalVideoStream = async (): Promise<MediaStream> => {
    try {
      // Em produção, usar navigator.mediaDevices.getUserMedia()
      // Por agora, simular um stream
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.fillStyle = '#3b82f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'white'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${participantName}`, canvas.width / 2, canvas.height / 2)
      }
      
      return canvas.captureStream(30)
    } catch (error) {
      console.error('Erro ao obter stream:', error)
      throw error
    }
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    toast.info(`Vídeo ${!isVideoEnabled ? 'ativado' : 'desativado'}`)
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    toast.info(`Áudio ${!isAudioEnabled ? 'ativado' : 'desativado'}`)
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Iniciar compartilhamento de tela
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
        }
        
        setIsScreenSharing(true)
        toast.success('Compartilhamento de tela iniciado')
      } else {
        // Parar compartilhamento de tela
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
          const stream = remoteVideoRef.current.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
        }
        
        setIsScreenSharing(false)
        toast.info('Compartilhamento de tela finalizado')
      }
    } catch (error) {
      toast.error('Erro ao compartilhar tela')
      console.error('Erro no compartilhamento:', error)
    }
  }

  const endCall = async () => {
    try {
      // Parar todos os streams
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        const stream = remoteVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      
      setIsConnected(false)
      
      // Chamar API para finalizar sessão
      await fetch(`/api/telemedicine/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: callDuration,
          notes: 'Sessão finalizada pelo usuário'
        })
      })
      
      toast.success('Chamada finalizada')
      onCallEnd?.()
    } catch (error) {
      toast.error('Erro ao finalizar chamada')
      console.error('Erro ao finalizar:', error)
    }
  }

  const reportTechnicalIssue = async (issue: string) => {
    try {
      await fetch(`/api/telemedicine/sessions/${sessionId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue, severity: 'medium' })
      })
      
      setTechnicalIssues(prev => [...prev, issue])
      toast.info('Problema técnico reportado')
    } catch (error) {
      toast.error('Erro ao reportar problema')
    }
  }

  const downloadRecording = async () => {
    try {
      // Simular download da gravação
      toast.info('Iniciando download da gravação...')
      
      // Em produção, fazer download real da gravação
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Download da gravação concluído')
    } catch (error) {
      toast.error('Erro ao baixar gravação')
    }
  }

  const cleanup = () => {
    // Cleanup de recursos
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'fair': return 'bg-yellow-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getQualityColor(connectionQuality)}`} />
            <span className="text-white text-sm">
              {connectionQuality === 'excellent' ? 'Excelente' :
               connectionQuality === 'good' ? 'Boa' :
               connectionQuality === 'fair' ? 'Regular' : 'Ruim'}
            </span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-gray-600" />
          <Clock className="w-4 h-4 text-white" />
          <span className="text-white font-mono">{formatDuration(callDuration)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-white" />
          <span className="text-white text-sm">{participants.length} participantes</span>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video */}
        <div className="absolute inset-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                <p>Conectando...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Participants List */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Participantes</span>
          </div>
          {participants.map((participant, index) => (
            <div key={index} className="flex items-center space-x-2 text-white text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{participant}</span>
            </div>
          ))}
        </div>

        {/* Technical Issues */}
        {technicalIssues.length > 0 && (
          <div className="absolute top-4 right-4 bg-red-900 bg-opacity-80 rounded-lg p-3 max-w-xs">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">Problemas Técnicos</span>
            </div>
            {technicalIssues.map((issue, index) => (
              <div key={index} className="text-red-300 text-xs mb-1">
                • {issue}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Toggle */}
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12"
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* Video Toggle */}
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12"
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          {/* Screen Share */}
          {role === 'therapist' && (
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="lg"
              onClick={toggleScreenShare}
              className="rounded-full w-12 h-12"
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSettings(true)}
            className="rounded-full w-12 h-12"
          >
            <Settings className="w-6 h-6" />
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-12 h-12"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-center space-x-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => reportTechnicalIssue('Problema de áudio')}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Reportar Problema
          </Button>

          {role === 'therapist' && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadRecording}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Gravação
            </Button>
          )}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações da Chamada</DialogTitle>
            <DialogDescription>
              Ajuste as configurações de áudio e vídeo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Qualidade do Vídeo</span>
              <select className="px-3 py-1 border rounded">
                <option>Alta</option>
                <option>Média</option>
                <option>Baixa</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Microfone</span>
              <select className="px-3 py-1 border rounded">
                <option>Microfone Padrão</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Câmera</span>
              <select className="px-3 py-1 border rounded">
                <option>Câmera Padrão</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Gravação Automática</span>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
