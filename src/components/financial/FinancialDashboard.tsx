'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Textarea } from '@/src/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
  FileText,
  Download,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CurrencyInput } from '@/src/components/ui/currency-input'

interface Payment {
  id: string
  patientId: string
  patientName: string
  amount: number
  method: 'pix' | 'card' | 'cash' | 'transfer' | 'insurance'
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  dueDate: string
  paidDate?: string
  description: string
  installments?: {
    current: number
    total: number
  }
  metadata?: {
    pixKey?: string
    cardLast4?: string
    insuranceProvider?: string
  }
}

interface FinancialSummary {
  totalRevenue: number
  monthlyRevenue: number
  pendingAmount: number
  overdueAmount: number
  averageTicket: number
  paymentsThisMonth: number
  growthRate: number
}

interface PaymentMethodStats {
  method: string
  amount: number
  count: number
  percentage: number
}

const PAYMENT_METHOD_LABELS = {
  pix: 'PIX',
  card: 'Cartão',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  insurance: 'Convênio'
}

const STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado'
}

export function FinancialDashboard() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false)

  // Mock data (substituir por API real)
  useEffect(() => {
    const mockPayments: Payment[] = [
      {
        id: '1',
        patientId: 'p1',
        patientName: 'Maria Silva',
        amount: 12000, // R$ 120,00
        method: 'pix',
        status: 'paid',
        dueDate: '2024-01-15',
        paidDate: '2024-01-15',
        description: 'Sessão de fisioterapia',
        metadata: { pixKey: '***@email.com' }
      },
      {
        id: '2',
        patientId: 'p2',
        patientName: 'João Santos',
        amount: 15000, // R$ 150,00
        method: 'card',
        status: 'paid',
        dueDate: '2024-01-16',
        paidDate: '2024-01-16',
        description: 'Pacote 4 sessões',
        installments: { current: 1, total: 4 },
        metadata: { cardLast4: '1234' }
      },
      {
        id: '3',
        patientId: 'p3',
        patientName: 'Ana Costa',
        amount: 8000, // R$ 80,00
        method: 'insurance',
        status: 'pending',
        dueDate: '2024-01-20',
        description: 'Fisioterapia respiratória',
        metadata: { insuranceProvider: 'Unimed' }
      },
      {
        id: '4',
        patientId: 'p4',
        patientName: 'Carlos Lima',
        amount: 10000, // R$ 100,00
        method: 'cash',
        status: 'overdue',
        dueDate: '2024-01-10',
        description: 'Avaliação + Sessão'
      }
    ]

    setPayments(mockPayments)
    setLoading(false)
  }, [])

  // Cálculos financeiros
  const financialSummary = useMemo((): FinancialSummary => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const totalRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)

    const monthlyPayments = payments.filter(p => {
      const dueDate = new Date(p.dueDate)
      return dueDate >= monthStart && dueDate <= monthEnd
    })

    const monthlyRevenue = monthlyPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingAmount = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0)

    const overdueAmount = payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0)

    const averageTicket = totalRevenue / Math.max(payments.filter(p => p.status === 'paid').length, 1)

    return {
      totalRevenue,
      monthlyRevenue,
      pendingAmount,
      overdueAmount,
      averageTicket,
      paymentsThisMonth: monthlyPayments.length,
      growthRate: 12.5 // Mock growth rate
    }
  }, [payments])

  // Estatísticas por método de pagamento
  const paymentMethodStats = useMemo((): PaymentMethodStats[] => {
    const stats = Object.entries(PAYMENT_METHOD_LABELS).map(([method, label]) => {
      const methodPayments = payments.filter(p => p.method === method && p.status === 'paid')
      const amount = methodPayments.reduce((sum, p) => sum + p.amount, 0)
      const count = methodPayments.length

      return {
        method: label,
        amount,
        count,
        percentage: count > 0 ? (amount / financialSummary.totalRevenue) * 100 : 0
      }
    })

    return stats.filter(s => s.count > 0)
  }, [payments, financialSummary.totalRevenue])

  // Dados para gráfico temporal
  const revenueChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i)
      const dayPayments = payments.filter(p => {
        const paidDate = p.paidDate ? new Date(p.paidDate) : null
        return paidDate &&
               paidDate.toDateString() === date.toDateString() &&
               p.status === 'paid'
      })

      return {
        date: format(date, 'dd/MM'),
        revenue: dayPayments.reduce((sum, p) => sum + p.amount, 0) / 100, // Convert to reais
        count: dayPayments.length
      }
    })

    return last30Days
  }, [payments])

  // Filtros
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = payment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
      const matchesMethod = methodFilter === 'all' || payment.method === methodFilter

      return matchesSearch && matchesStatus && matchesMethod
    })
  }, [payments, searchTerm, statusFilter, methodFilter])

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100 border-green-200'
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'overdue': return 'text-red-600 bg-red-100 border-red-200'
      case 'cancelled': return 'text-gray-600 bg-gray-100 border-gray-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'overdue': return <AlertCircle className="h-4 w-4" />
      case 'cancelled': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) {
    return <div>Carregando dados financeiros...</div>
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Controle de pagamentos, faturamento e analytics financeiros
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewPaymentDialog} onOpenChange={setShowNewPaymentDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Pagamento</DialogTitle>
                <DialogDescription>
                  Adicione um novo pagamento ao sistema
                </DialogDescription>
              </DialogHeader>
              <NewPaymentForm onClose={() => setShowNewPaymentDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <TrendingUp className="mr-1 h-3 w-3" />
                +{financialSummary.growthRate}%
              </Badge>
              {" "}vs. período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.paymentsThisMonth} pagamentos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              A receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita Diária</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>Distribuição por método</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ method, percentage }) => `${method}: ${percentage.toFixed(1)}%`}
                    >
                      {paymentMethodStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lista de Pagamentos */}
        <TabsContent value="payments" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome do paciente ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paid">Pagos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="overdue">Vencidos</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="method">Método</Label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="insurance">Convênio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
              <CardDescription>
                {filteredPayments.length} de {payments.length} pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.patientName}</div>
                          <div className="text-sm text-muted-foreground">{payment.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        {payment.installments && (
                          <div className="text-sm text-muted-foreground">
                            {payment.installments.current}/{payment.installments.total}x
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PAYMENT_METHOD_LABELS[payment.method]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">{STATUS_LABELS[payment.status]}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.dueDate), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          {payment.status === 'pending' && (
                            <Button size="sm">
                              Marcar como Pago
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Gere relatórios detalhados para análise e controle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button className="h-20 flex-col space-y-2">
                  <FileText className="h-6 w-6" />
                  <span>Relatório Mensal</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Download className="h-6 w-6" />
                  <span>Exportar Excel</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Análise de Tendências</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <DollarSign className="h-6 w-6" />
                  <span>Fluxo de Caixa</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Pagamento</CardTitle>
              <CardDescription>
                Configure métodos de pagamento e políticas financeiras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Configurações de integração financeira em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente para novo pagamento
function NewPaymentForm({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<Payment['method']>('pix')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementar lógica de criação
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Valor</Label>
        <CurrencyInput
          value={amount}
          onChange={setAmount}
          placeholder="R$ 0,00"
        />
      </div>

      <div>
        <Label htmlFor="method">Método de Pagamento</Label>
        <Select value={method} onValueChange={(value) => setMethod(value as Payment['method'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="card">Cartão</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="transfer">Transferência</SelectItem>
            <SelectItem value="insurance">Convênio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição do pagamento..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Criar Pagamento
        </Button>
      </DialogFooter>
    </form>
  )
}