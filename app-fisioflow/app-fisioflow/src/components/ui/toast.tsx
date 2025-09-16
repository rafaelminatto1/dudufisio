import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X
} from "lucide-react"
import { toast as sonnerToast, ExternalToast } from "sonner"

// Toast types with icons
const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
} as const

type ToastType = keyof typeof toastIcons

interface ToastOptions extends ExternalToast {
  type?: ToastType
}

// Custom toast function with Portuguese defaults
function toast(message: string, options?: ToastOptions) {
  const { type = "info", ...rest } = options || {}
  const Icon = toastIcons[type]

  return sonnerToast(message, {
    icon: <Icon className="h-4 w-4" />,
    duration: 4000,
    ...rest
  })
}

// Convenience methods for different toast types
toast.success = (message: string, options?: ExternalToast) =>
  toast(message, { ...options, type: "success" })

toast.error = (message: string, options?: ExternalToast) =>
  toast(message, { ...options, type: "error" })

toast.warning = (message: string, options?: ExternalToast) =>
  toast(message, { ...options, type: "warning" })

toast.info = (message: string, options?: ExternalToast) =>
  toast(message, { ...options, type: "info" })

// Promise toast for async operations
toast.promise = function<T>(
  promise: Promise<T>,
  options: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
) {
  return sonnerToast.promise(promise, {
    loading: options.loading,
    success: options.success,
    error: options.error,
  })
}

// Healthcare-specific toast messages
export const TOAST_MESSAGES = {
  patients: {
    created: "Paciente cadastrado com sucesso!",
    updated: "Dados do paciente atualizados com sucesso!",
    deleted: "Paciente removido com sucesso!",
    error: "Erro ao processar dados do paciente.",
    notFound: "Paciente não encontrado.",
    duplicateCpf: "CPF já cadastrado no sistema.",
    invalidCpf: "CPF inválido. Verifique os dados informados.",
    photoUploaded: "Foto do paciente enviada com sucesso!",
    photoError: "Erro ao enviar foto do paciente.",
    consentRequired: "Consentimento LGPD é obrigatório.",
    dataExported: "Dados do paciente exportados com sucesso!",
    exportError: "Erro ao exportar dados do paciente."
  },
  appointments: {
    scheduled: "Consulta agendada com sucesso!",
    updated: "Consulta reagendada com sucesso!",
    canceled: "Consulta cancelada com sucesso!",
    error: "Erro ao processar agendamento.",
    conflict: "Conflito de horário. Escolha outro horário.",
    reminderSent: "Lembrete enviado ao paciente!",
    reminderError: "Erro ao enviar lembrete.",
    pastDate: "Não é possível agendar para data passada.",
    noAvailability: "Não há horários disponíveis para este período.",
    confirmed: "Consulta confirmada!",
    patientNotified: "Paciente notificado sobre alteração."
  },
  sessions: {
    saved: "Evolução da sessão salva com sucesso!",
    updated: "Dados da sessão atualizados!",
    deleted: "Sessão removida com sucesso!",
    error: "Erro ao salvar dados da sessão.",
    painPointAdded: "Ponto de dor adicionado!",
    painPointUpdated: "Ponto de dor atualizado!",
    painPointRemoved: "Ponto de dor removido!",
    exerciseAdded: "Exercício adicionado à sessão!",
    exerciseRemoved: "Exercício removido da sessão!",
    reportGenerated: "Relatório de evolução gerado!",
    reportError: "Erro ao gerar relatório de evolução."
  },
  exercises: {
    created: "Exercício cadastrado com sucesso!",
    updated: "Exercício atualizado com sucesso!",
    deleted: "Exercício removido com sucesso!",
    error: "Erro ao processar exercício.",
    prescribed: "Exercícios prescritos com sucesso!",
    prescriptionUpdated: "Prescrição de exercícios atualizada!",
    prescriptionError: "Erro ao atualizar prescrição.",
    videoUploaded: "Vídeo do exercício enviado com sucesso!",
    videoError: "Erro ao enviar vídeo do exercício.",
    feedbackSubmitted: "Feedback do exercício enviado!",
    feedbackError: "Erro ao enviar feedback."
  },
  auth: {
    loginSuccess: "Login realizado com sucesso!",
    loginError: "Erro ao fazer login. Verifique suas credenciais.",
    logoutSuccess: "Logout realizado com sucesso!",
    sessionExpired: "Sessão expirada. Faça login novamente.",
    unauthorized: "Acesso não autorizado.",
    passwordChanged: "Senha alterada com sucesso!",
    passwordError: "Erro ao alterar senha.",
    profileUpdated: "Perfil atualizado com sucesso!",
    profileError: "Erro ao atualizar perfil.",
    accountLocked: "Conta bloqueada. Entre em contato com o administrador.",
    invalidCredentials: "Credenciais inválidas."
  },
  payments: {
    processed: "Pagamento processado com sucesso!",
    failed: "Erro ao processar pagamento.",
    refunded: "Reembolso processado com sucesso!",
    refundError: "Erro ao processar reembolso.",
    receiptSent: "Comprovante enviado por email!",
    receiptError: "Erro ao enviar comprovante.",
    installmentCreated: "Parcela criada com sucesso!",
    installmentPaid: "Parcela paga com sucesso!",
    overdue: "Pagamento em atraso.",
    reminder: "Lembrete de pagamento enviado!"
  },
  reports: {
    generated: "Relatório gerado com sucesso!",
    generationError: "Erro ao gerar relatório.",
    exported: "Relatório exportado com sucesso!",
    exportError: "Erro ao exportar relatório.",
    emailSent: "Relatório enviado por email!",
    emailError: "Erro ao enviar relatório por email.",
    saved: "Relatório salvo com sucesso!",
    saveError: "Erro ao salvar relatório."
  },
  general: {
    saveSuccess: "Dados salvos com sucesso!",
    saveError: "Erro ao salvar dados.",
    deleteSuccess: "Item removido com sucesso!",
    deleteError: "Erro ao remover item.",
    updateSuccess: "Dados atualizados com sucesso!",
    updateError: "Erro ao atualizar dados.",
    uploadSuccess: "Arquivo enviado com sucesso!",
    uploadError: "Erro ao enviar arquivo.",
    networkError: "Erro de conexão. Tente novamente.",
    unexpectedError: "Erro inesperado. Tente novamente.",
    permissionDenied: "Permissão negada para esta ação.",
    validationError: "Dados inválidos. Verifique os campos obrigatórios.",
    loading: "Carregando...",
    processing: "Processando...",
    copying: "Copiando para área de transferência...",
    copied: "Copiado para área de transferência!",
    searchNoResults: "Nenhum resultado encontrado.",
    confirmAction: "Confirme a ação para continuar.",
    actionCanceled: "Ação cancelada pelo usuário."
  },
  lgpd: {
    consentGiven: "Consentimento LGPD registrado com sucesso!",
    consentRevoked: "Consentimento LGPD revogado com sucesso!",
    dataDeleted: "Dados pessoais excluídos conforme solicitado!",
    dataPortability: "Dados exportados para portabilidade!",
    accessRequest: "Solicitação de acesso aos dados registrada!",
    correctionRequest: "Solicitação de correção de dados registrada!",
    processingRestricted: "Processamento de dados restringido!",
    auditLogged: "Ação registrada no log de auditoria.",
    privacyPolicyUpdated: "Política de privacidade atualizada!",
    cookiePreferencesSaved: "Preferências de cookies salvas!"
  }
} as const

export { toast }