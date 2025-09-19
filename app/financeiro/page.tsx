'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Separator } from '@/src/components/ui/separator'
import logger from '../../lib/logger';
import {
  DollarSign,
  CreditCard,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Receipt,
  Calendar,
  User,
  FileText,
  Eye,
  Edit,
  CheckCircle
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface BillingSummary {
  totalBilled: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  countPaid: number
  countPending: number
  countOverdue: number
  averageTicket: number
  paymentRate: number
  overdueRate: number
}

interface BillingRecord {
  id: string
  patient_id: string
  procedure_id: string
  service_date: string
  quantity: number
  unit_price: number
  total_amount: number
  payment_method: string
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
  due_date: string
  notes?: string
  patient: {
    id: string
    name: string
    cpf: string
    phone: string
  }
  procedure: {
    id: string
    code: string
    name: string
    category: string
  }
  payments: Array<{
    id: string
    amount_paid: number
    payment_date: string
    payment_method: string
  }>
  therapist: {
    id: string
    full_name: string
  }
}

interface ChartData {
  revenueByMonth: Array<{
    month: string
    revenue: number
    projected: number
  }>
  paymentMethods: Array<{
    method: string
    count: number
    amount: number
  }>
  procedureRevenue: Array<{
    procedure: string
    revenue: number
    count: number
  }>
  overdueByAge: Array<{
    age: string
    amount: number
    count: number
  }>
}

export default function FinanceiroPage() {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchFinancialData()
  }, [selectedStatus, selectedPaymentMethod, selectedPeriod, searchTerm])

  const fetchFinancialData = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API calls
      const mockSummary: BillingSummary = {
        totalBilled: 89650,
        totalPaid: 72340,
        totalPending: 12450,
        totalOverdue: 4860,
        countPaid: 287,
        countPending: 45,
        countOverdue: 18,
        averageTicket: 125.5,
        paymentRate: 80.7,
        overdueRate: 5.4
      }

      const mockChartData: ChartData = {
        revenueByMonth: [
          { month: 'Jan', revenue: 12850, projected: 13000 },
          { month: 'Fev', revenue: 14200, projected: 14000 },
          { month: 'Mar', revenue: 15100, projected: 15500 },
          { month: 'Abr', revenue: 16800, projected: 16200 },
          { month: 'Mai', revenue: 17900, projected: 17800 },
          { month: 'Jun', revenue: 18650, projected: 18900 }
        ],
        paymentMethods: [
          { method: 'PIX', count: 145, amount: 28900 },
          { method: 'Cartão de Crédito', count: 98, amount: 24500 },
          { method: 'Dinheiro', count: 67, amount: 8950 },
          { method: 'Cartão de Débito', count: 42, amount: 6890 },
          { method: 'Transferência', count: 23, amount: 4800 },
          { method: 'Convênio', count: 18, amount: 15600 }
        ],
        procedureRevenue: [
          { procedure: 'Fisioterapia Ortopédica', revenue: 32450, count: 186 },
          { procedure: 'Avaliação Fisioterapêutica', revenue: 18200, count: 91 },
          { procedure: 'Reeducação Postural', revenue: 15600, count: 78 },
          { procedure: 'Terapia Manual', revenue: 12800, count: 64 },
          { procedure: 'Eletroterapia', revenue: 8900, count: 45 }
        ],
        overdueByAge: [
          { age: '1-30 dias', amount: 2450, count: 8 },
          { age: '31-60 dias', amount: 1680, count: 6 },
          { age: '61-90 dias', amount: 520, count: 3 },
          { age: '90+ dias', amount: 210, count: 1 }
        ]
      }

      const mockBillingRecords: BillingRecord[] = [
        {
          id: 'bill-001',
          patient_id: 'pat-001',
          procedure_id: 'proc-001',
          service_date: '2025-01-15',
          quantity: 1,
          unit_price: 120,
          total_amount: 120,
          payment_method: 'pix',
          payment_status: 'paid',
          due_date: '2025-01-25',
          patient: {
            id: 'pat-001',
            name: 'Maria Silva',
            cpf: '123.456.789-00',
            phone: '(11) 99999-9999'
          },
          procedure: {
            id: 'proc-001',
            code: 'FISIO-001',
            name: 'Fisioterapia Ortopédica',
            category: 'fisioterapia'
          },
          payments: [
            {
              id: 'pay-001',
              amount_paid: 120,
              payment_date: '2025-01-20',
              payment_method: 'pix'
            }
          ],
          therapist: {
            id: 'ther-001',
            full_name: 'Dr. João Santos'
          }
        },
        {
          id: 'bill-002',
          patient_id: 'pat-002',
          procedure_id: 'proc-002',
          service_date: '2025-01-14',
          quantity: 1,
          unit_price: 80,
          total_amount: 80,
          payment_method: 'credit_card',
          payment_status: 'overdue',
          due_date: '2025-01-20',
          patient: {
            id: 'pat-002',
            name: 'Carlos Oliveira',
            cpf: '987.654.321-00',
            phone: '(11) 88888-8888'
          },
          procedure: {
            id: 'proc-002',
            code: 'AVAL-001',
            name: 'Avaliação Fisioterapêutica',
            category: 'avaliacao'
          },
          payments: [],
          therapist: {
            id: 'ther-002',
            full_name: 'Dra. Ana Costa'
          }
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      setSummary(mockSummary)
      setChartData(mockChartData)
      setBillingRecords(mockBillingRecords)
    } catch (error) {
      logger.error('Erro ao buscar dados financeiros:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago'
      case 'pending':
        return 'Pendente'
      case 'partially_paid':
        return 'Parcialmente Pago'
      case 'overdue':
        return 'Vencido'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'pix':
        return 'PIX'
      case 'credit_card':
        return 'Cartão de Crédito'
      case 'debit_card':
        return 'Cartão de Débito'
      case 'cash':
        return 'Dinheiro'
      case 'bank_transfer':
        return 'Transferência'
      case 'health_insurance':
        return 'Convênio'
      case 'installment':
        return 'Parcelado'
      default:
        return method
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  if (loading || !summary || !chartData) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">Controle financeiro e cobrança</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro e cobrança</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalBilled)}</div>
            <div className="flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">15.8%</span>
              <span className="text-muted-foreground ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.paymentRate}% da receita total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.countPending} cobranças pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.countOverdue} cobranças vencidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageTicket)}</div>
            <p className="text-xs text-muted-foreground">por atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.paymentRate}%</div>
            <p className="text-xs text-muted-foreground">cobranças pagas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overdueRate}%</div>
            <p className="text-xs text-muted-foreground">cobranças vencidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Pagos</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.countPaid}</div>
            <p className="text-xs text-muted-foreground">este mês</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="billing">Cobranças</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Receita Mensal</CardTitle>
                <CardDescription>Receita real vs projetada</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Real" />
                    <Line type="monotone" dataKey="projected" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Projetado" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>Distribuição por forma de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, amount }) => `${method}: ${formatCurrency(amount)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {chartData.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Procedure Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Procedimento</CardTitle>
                <CardDescription>Top 5 procedimentos mais rentáveis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.procedureRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="procedure" angle={-45} textAnchor="end" height={80} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Overdue Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Análise de Inadimplência</CardTitle>
                <CardDescription>Valores em atraso por idade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.overdueByAge}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="amount" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente, procedimento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="partially_paid">Parcialmente Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Método de Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os métodos</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="health_insurance">Convênio</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="this_week">Esta semana</SelectItem>
                    <SelectItem value="this_month">Este mês</SelectItem>
                    <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                    <SelectItem value="this_year">Este ano</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing Records */}
          <div className="space-y-3">
            {billingRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{record.procedure.name}</h3>
                          <Badge variant="outline">{record.procedure.code}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {record.patient.name}
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(record.service_date)}
                          </div>
                          <span>•</span>
                          <span>Venc: {formatDate(record.due_date)}</span>
                          <span>•</span>
                          <span>{record.therapist.full_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(record.total_amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {getPaymentMethodLabel(record.payment_method)}
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className={getStatusColor(record.payment_status)}
                      >
                        {getStatusLabel(record.payment_status)}
                      </Badge>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {record.payment_status !== 'paid' && (
                          <Button size="sm">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Receber
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {record.notes && (
                    <>
                      <Separator className="my-3" />
                      <div className="text-sm text-muted-foreground">
                        <strong>Observações:</strong> {record.notes}
                      </div>
                    </>
                  )}

                  {record.payments.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Pagamentos Registrados:</h4>
                        {record.payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between text-sm">
                            <span>
                              {formatDate(payment.payment_date)} - {getPaymentMethodLabel(payment.payment_method)}
                            </span>
                            <span className="font-medium">{formatCurrency(payment.amount_paid)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {billingRecords.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma cobrança encontrada</h3>
                <p className="text-muted-foreground text-center">
                  Não há cobranças que correspondam aos filtros selecionados.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Gere relatórios detalhados sobre o desempenho financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 mb-4">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Relatório de Receitas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Análise detalhada de receitas por período, terapeuta e procedimento
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Relatório de Recebimentos</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Controle de pagamentos recebidos e métodos de pagamento
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Gerar Excel
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Relatório de Inadimplência</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Análise de cobranças vencidas e ações de cobrança
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}