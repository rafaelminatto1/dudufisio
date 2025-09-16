/**
 * Dashboard do Estagiário - FisioFlow
 * Acesso supervisionado com foco no aprendizado e observação
 */

export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, Users, BookOpen, Eye, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard Estagiário | FisioFlow',
  description: 'Painel do estagiário para acompanhamento supervisionado'
}

export default function EstagiarioDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Cabeçalho com informações do estagiário */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard do Estagiário</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe seu aprendizado e atividades supervisionadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Acesso Supervisionado
          </Badge>
        </div>
      </div>

      {/* Aviso sobre limitações de acesso */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <div>
            <p className="text-orange-800 font-medium">
              Acesso de Estagiário
            </p>
            <p className="text-orange-700 text-sm">
              Você possui acesso somente leitura. Para modificações, solicite supervisão.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Métricas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pacientes Observados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sessões Acompanhadas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Horas de Estágio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24h</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudos Realizados
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo principal em abas */}
      <Tabs defaultValue="observacoes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="estudos">Estudos</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="observacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes em Observação</CardTitle>
              <CardDescription>
                Pacientes que você está acompanhando durante o estágio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    nome: 'Maria Silva',
                    idade: 45,
                    condicao: 'Lombalgia crônica',
                    supervisor: 'Dr. João Santos',
                    proximaSessao: '15/09/2025 14:00'
                  },
                  {
                    nome: 'Carlos Oliveira',
                    idade: 32,
                    condicao: 'Lesão de joelho',
                    supervisor: 'Dra. Ana Costa',
                    proximaSessao: '16/09/2025 09:30'
                  },
                  {
                    nome: 'Helena Rodrigues',
                    idade: 28,
                    condicao: 'Síndrome do túnel do carpo',
                    supervisor: 'Dr. Pedro Alves',
                    proximaSessao: '16/09/2025 16:00'
                  }
                ].map((paciente, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{paciente.nome}</p>
                      <p className="text-sm text-gray-600">
                        {paciente.idade} anos • {paciente.condicao}
                      </p>
                      <p className="text-xs text-gray-500">
                        Supervisor: {paciente.supervisor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Próxima Sessão</p>
                      <p className="text-sm text-gray-600">{paciente.proximaSessao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de Estágio</CardTitle>
              <CardDescription>
                Suas atividades programadas sob supervisão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    horario: '08:00 - 10:00',
                    atividade: 'Observação de sessões',
                    local: 'Sala 1',
                    supervisor: 'Dr. João Santos'
                  },
                  {
                    horario: '10:30 - 11:30',
                    atividade: 'Estudo de caso',
                    local: 'Biblioteca',
                    supervisor: 'Autodirigido'
                  },
                  {
                    horario: '14:00 - 16:00',
                    atividade: 'Assistência supervisionada',
                    local: 'Sala 2',
                    supervisor: 'Dra. Ana Costa'
                  },
                  {
                    horario: '16:30 - 17:30',
                    atividade: 'Reunião de supervisão',
                    local: 'Sala de reuniões',
                    supervisor: 'Dr. Pedro Alves'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{item.atividade}</p>
                      <p className="text-sm text-gray-600">{item.local}</p>
                      <p className="text-xs text-gray-500">
                        Supervisor: {item.supervisor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.horario}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estudos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material de Estudo</CardTitle>
              <CardDescription>
                Recursos para aprofundar seus conhecimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    titulo: 'Anatomia do Sistema Musculoesquelético',
                    tipo: 'Vídeo Aula',
                    duracao: '45 min',
                    status: 'Não iniciado'
                  },
                  {
                    titulo: 'Técnicas de Avaliação Postural',
                    tipo: 'Artigo',
                    duracao: '20 min',
                    status: 'Em progresso'
                  },
                  {
                    titulo: 'Exercícios Terapêuticos para Lombalgia',
                    tipo: 'Caso Clínico',
                    duracao: '30 min',
                    status: 'Concluído'
                  },
                  {
                    titulo: 'Reabilitação de Lesões Esportivas',
                    tipo: 'Webinar',
                    duracao: '60 min',
                    status: 'Agendado'
                  }
                ].map((estudo, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{estudo.titulo}</h4>
                      <Badge variant={
                        estudo.status === 'Concluído' ? 'default' :
                        estudo.status === 'Em progresso' ? 'secondary' :
                        'outline'
                      }>
                        {estudo.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{estudo.tipo} • {estudo.duracao}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Estágio</CardTitle>
              <CardDescription>
                Documentação do seu progresso e observações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    titulo: 'Relatório Semanal - Semana 1',
                    data: '11/09/2025',
                    supervisor: 'Dr. João Santos',
                    status: 'Aprovado'
                  },
                  {
                    titulo: 'Estudo de Caso - Lombalgia',
                    data: '13/09/2025',
                    supervisor: 'Dra. Ana Costa',
                    status: 'Em revisão'
                  },
                  {
                    titulo: 'Observações Clínicas - Semana 2',
                    data: '15/09/2025',
                    supervisor: 'Dr. Pedro Alves',
                    status: 'Pendente'
                  }
                ].map((relatorio, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{relatorio.titulo}</p>
                      <p className="text-sm text-gray-600">
                        Supervisor: {relatorio.supervisor}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-gray-600">{relatorio.data}</p>
                      <Badge variant={
                        relatorio.status === 'Aprovado' ? 'default' :
                        relatorio.status === 'Em revisão' ? 'secondary' :
                        'outline'
                      }>
                        {relatorio.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}