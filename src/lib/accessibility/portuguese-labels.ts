/**
 * Portuguese Accessibility Labels and ARIA Attributes
 * Comprehensive accessibility support for Brazilian Portuguese
 */

// ARIA labels for common UI elements
export const ARIA_LABELS = {
  // Navigation
  navigation: {
    main: "Navegação principal",
    secondary: "Navegação secundária",
    breadcrumb: "Trilha de navegação",
    pagination: "Navegação de páginas",
    tabs: "Abas de navegação",
    menu: "Menu",
    menuButton: "Abrir menu",
    closeMenu: "Fechar menu",
    skipToContent: "Pular para o conteúdo principal",
    home: "Página inicial",
    back: "Voltar",
    next: "Próximo",
    previous: "Anterior",
    first: "Primeiro",
    last: "Último"
  },

  // Forms
  forms: {
    required: "Campo obrigatório",
    optional: "Campo opcional",
    search: "Buscar",
    searchFor: (term: string) => `Buscar por ${term}`,
    clearSearch: "Limpar busca",
    submit: "Enviar",
    cancel: "Cancelar",
    save: "Salvar",
    edit: "Editar",
    delete: "Excluir",
    add: "Adicionar",
    remove: "Remover",
    select: "Selecionar",
    selectAll: "Selecionar todos",
    deselectAll: "Desmarcar todos",
    showPassword: "Mostrar senha",
    hidePassword: "Ocultar senha",
    uploadFile: "Enviar arquivo",
    removeFile: "Remover arquivo",
    chooseFile: "Escolher arquivo",
    dropFile: "Soltar arquivo aqui"
  },

  // Data tables
  tables: {
    table: "Tabela de dados",
    sortAscending: "Ordenar crescente",
    sortDescending: "Ordenar decrescente",
    sortColumn: (column: string) => `Ordenar por ${column}`,
    filterColumn: (column: string) => `Filtrar ${column}`,
    rowsPerPage: "Linhas por página",
    pagination: "Paginação da tabela",
    pageInfo: (current: number, total: number) => `Página ${current} de ${total}`,
    noData: "Nenhum dado disponível",
    loading: "Carregando dados",
    selectRow: "Selecionar linha",
    selectedRows: (count: number) => `${count} linha${count !== 1 ? 's' : ''} selecionada${count !== 1 ? 's' : ''}`,
    totalRows: (count: number) => `Total: ${count} registro${count !== 1 ? 's' : ''}`
  },

  // Modals and dialogs
  modals: {
    dialog: "Caixa de diálogo",
    modal: "Modal",
    close: "Fechar",
    closeDialog: "Fechar caixa de diálogo",
    confirm: "Confirmar",
    confirmAction: "Confirmar ação",
    alertDialog: "Alerta",
    errorDialog: "Erro",
    warningDialog: "Aviso",
    infoDialog: "Informação"
  },

  // Status and feedback
  status: {
    loading: "Carregando",
    success: "Sucesso",
    error: "Erro",
    warning: "Aviso",
    info: "Informação",
    completed: "Concluído",
    inProgress: "Em andamento",
    pending: "Pendente",
    cancelled: "Cancelado",
    expired: "Expirado",
    active: "Ativo",
    inactive: "Inativo"
  },

  // Media controls
  media: {
    play: "Reproduzir",
    pause: "Pausar",
    stop: "Parar",
    mute: "Silenciar",
    unmute: "Ativar som",
    volumeUp: "Aumentar volume",
    volumeDown: "Diminuir volume",
    fullscreen: "Tela cheia",
    exitFullscreen: "Sair da tela cheia",
    replay: "Reproduzir novamente",
    forward: "Avançar",
    backward: "Retroceder"
  },

  // Calendar and date picker
  calendar: {
    calendar: "Calendário",
    datePicker: "Seletor de data",
    timePicker: "Seletor de hora",
    previousMonth: "Mês anterior",
    nextMonth: "Próximo mês",
    previousYear: "Ano anterior",
    nextYear: "Próximo ano",
    selectDate: "Selecionar data",
    selectedDate: (date: string) => `Data selecionada: ${date}`,
    today: "Hoje",
    chooseDate: "Escolher data",
    dateFormat: "Formato: DD/MM/AAAA",
    timeFormat: "Formato: HH:MM"
  }
} as const

// Healthcare-specific ARIA labels
export const HEALTHCARE_ARIA_LABELS = {
  // Patient management
  patient: {
    patientList: "Lista de pacientes",
    patientCard: "Cartão do paciente",
    patientProfile: "Perfil do paciente",
    addPatient: "Adicionar novo paciente",
    editPatient: "Editar dados do paciente",
    removePatient: "Remover paciente",
    patientPhoto: "Foto do paciente",
    uploadPhoto: "Enviar foto do paciente",
    patientAge: (age: number) => `Idade: ${age} anos`,
    patientCPF: "CPF do paciente",
    patientPhone: "Telefone do paciente",
    emergencyContact: "Contato de emergência",
    medicalHistory: "Histórico médico",
    consentStatus: "Status do consentimento LGPD"
  },

  // Appointments
  appointment: {
    appointmentList: "Lista de consultas",
    calendar: "Calendário de consultas",
    scheduleAppointment: "Agendar consulta",
    editAppointment: "Editar consulta",
    cancelAppointment: "Cancelar consulta",
    confirmAppointment: "Confirmar consulta",
    appointmentTime: (time: string) => `Horário: ${time}`,
    appointmentDuration: (duration: number) => `Duração: ${duration} minutos`,
    appointmentType: "Tipo de consulta",
    therapist: "Fisioterapeuta responsável",
    availableSlots: "Horários disponíveis",
    conflictWarning: "Aviso de conflito de horário"
  },

  // Sessions
  session: {
    sessionList: "Lista de sessões",
    sessionHistory: "Histórico de sessões",
    addSession: "Adicionar nova sessão",
    editSession: "Editar sessão",
    sessionEvolution: "Evolução da sessão",
    painLevel: "Nível de dor",
    painScale: "Escala de dor de 0 a 10",
    painPoint: "Ponto de dor",
    bodyMap: "Mapa corporal",
    exercisesPrescribed: "Exercícios prescritos",
    sessionNotes: "Observações da sessão",
    sessionDuration: (duration: number) => `Duração: ${duration} minutos`
  },

  // Exercises
  exercise: {
    exerciseLibrary: "Biblioteca de exercícios",
    exerciseCard: "Cartão do exercício",
    addExercise: "Adicionar exercício",
    editExercise: "Editar exercício",
    removeExercise: "Remover exercício",
    exerciseVideo: "Vídeo demonstrativo do exercício",
    playVideo: "Reproduzir vídeo do exercício",
    exerciseInstructions: "Instruções do exercício",
    exerciseDifficulty: (level: number) => `Dificuldade: ${level} de 5`,
    exerciseCategory: "Categoria do exercício",
    exerciseDuration: (duration: number) => `Duração: ${duration} minutos`,
    repetitions: (reps: number) => `${reps} repetições`,
    sets: (sets: number) => `${sets} séries`,
    prescribeExercise: "Prescrever exercício",
    exerciseFeedback: "Feedback do exercício"
  },

  // Reports
  reports: {
    reportsList: "Lista de relatórios",
    generateReport: "Gerar relatório",
    downloadReport: "Baixar relatório",
    shareReport: "Compartilhar relatório",
    reportPeriod: "Período do relatório",
    reportType: "Tipo de relatório",
    reportFormat: "Formato do relatório",
    reportData: "Dados do relatório",
    printReport: "Imprimir relatório",
    exportReport: "Exportar relatório",
    reportChart: "Gráfico do relatório",
    reportSummary: "Resumo do relatório"
  },

  // Payments
  payments: {
    paymentsList: "Lista de pagamentos",
    addPayment: "Adicionar pagamento",
    editPayment: "Editar pagamento",
    paymentMethod: "Forma de pagamento",
    paymentAmount: "Valor do pagamento",
    paymentDate: "Data do pagamento",
    paymentStatus: "Status do pagamento",
    dueDate: "Data de vencimento",
    installments: (count: number) => `Parcelado em ${count}x`,
    paymentHistory: "Histórico de pagamentos",
    outstandingBalance: "Saldo devedor",
    receipt: "Comprovante de pagamento"
  }
} as const

// Screen reader announcements
export const SCREEN_READER_ANNOUNCEMENTS = {
  // Page changes
  pageLoaded: (pageName: string) => `Página ${pageName} carregada`,
  pageChanged: (pageName: string) => `Navegou para ${pageName}`,

  // Form actions
  formSaved: "Formulário salvo com sucesso",
  formError: "Erro no formulário. Verifique os campos destacados",
  fieldError: (field: string, error: string) => `Erro no campo ${field}: ${error}`,

  // Data updates
  dataLoaded: "Dados carregados",
  dataUpdated: "Dados atualizados",
  dataDeleted: "Item removido",
  dataAdded: "Item adicionado",

  // Search and filtering
  searchResults: (count: number) => `${count} resultado${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`,
  noResults: "Nenhum resultado encontrado",
  filterApplied: "Filtro aplicado",
  filterRemoved: "Filtro removido",

  // Healthcare-specific
  appointmentScheduled: "Consulta agendada com sucesso",
  appointmentCancelled: "Consulta cancelada",
  sessionCompleted: "Sessão concluída",
  exercisePrescribed: "Exercício prescrito ao paciente",
  painPointAdded: "Ponto de dor adicionado ao mapa corporal",

  // System notifications
  connectionLost: "Conexão perdida. Tentando reconectar",
  connectionRestored: "Conexão restaurada",
  sessionExpiring: "Sua sessão expirará em breve",
  sessionExpired: "Sessão expirada. Faça login novamente"
} as const

// Keyboard navigation instructions
export const KEYBOARD_INSTRUCTIONS = {
  general: {
    tab: "Use Tab para navegar entre elementos",
    enter: "Pressione Enter para ativar",
    escape: "Pressione Esc para fechar",
    arrows: "Use as setas para navegar",
    space: "Pressione Espaço para selecionar",
    home: "Pressione Home para ir ao início",
    end: "Pressione End para ir ao final"
  },

  forms: {
    navigation: "Use Tab/Shift+Tab para navegar entre campos",
    submit: "Pressione Enter para enviar o formulário",
    cancel: "Pressione Esc para cancelar",
    dropdown: "Use setas para navegar no dropdown",
    checkbox: "Pressione Espaço para marcar/desmarcar",
    radio: "Use setas para selecionar opção"
  },

  tables: {
    navigation: "Use setas para navegar pela tabela",
    sort: "Pressione Enter para ordenar coluna",
    select: "Pressione Espaço para selecionar linha",
    pagination: "Use Tab para navegar na paginação"
  },

  calendar: {
    navigation: "Use setas para navegar pelas datas",
    select: "Pressione Enter para selecionar data",
    month: "Use Page Up/Down para mudar mês",
    year: "Use Ctrl+Page Up/Down para mudar ano"
  }
} as const

// Accessibility helpers
export const ACCESSIBILITY_HELPERS = {
  /**
   * Generate ARIA label for form field
   */
  getFieldLabel: (label: string, required: boolean = false) => {
    return required ? `${label} (obrigatório)` : label
  },

  /**
   * Generate ARIA description for field validation
   */
  getFieldDescription: (validation: string) => {
    return `Este campo ${validation}`
  },

  /**
   * Generate ARIA label for button with context
   */
  getButtonLabel: (action: string, context?: string) => {
    return context ? `${action} ${context}` : action
  },

  /**
   * Generate ARIA label for data item
   */
  getDataItemLabel: (type: string, name: string, status?: string) => {
    return status ? `${type} ${name}, ${status}` : `${type} ${name}`
  },

  /**
   * Generate ARIA live region announcement
   */
  getLiveAnnouncement: (action: string, result: 'success' | 'error' | 'info' = 'info') => {
    const resultText = {
      success: 'realizada com sucesso',
      error: 'falhou',
      info: 'em andamento'
    }
    return `${action} ${resultText[result]}`
  },

  /**
   * Generate progress indicator text
   */
  getProgressText: (current: number, total: number, item: string = 'item') => {
    return `${current} de ${total} ${item}${total !== 1 ? 's' : ''}`
  },

  /**
   * Generate status text with context
   */
  getStatusText: (status: string, context?: string) => {
    return context ? `${context}: ${status}` : status
  }
} as const

// Focus management utilities
export const FOCUS_MANAGEMENT = {
  /**
   * Skip link configuration
   */
  skipLinks: [
    { href: "#main-content", text: "Pular para o conteúdo principal" },
    { href: "#navigation", text: "Pular para a navegação" },
    { href: "#search", text: "Pular para a busca" },
    { href: "#footer", text: "Pular para o rodapé" }
  ],

  /**
   * Focus trap instructions
   */
  trapInstructions: {
    modal: "Modal aberto. Use Tab para navegar e Esc para fechar",
    dropdown: "Menu aberto. Use setas para navegar e Esc para fechar",
    dialog: "Diálogo aberto. Use Tab para navegar e Esc para fechar"
  },

  /**
   * Landmark roles in Portuguese
   */
  landmarks: {
    banner: "Cabeçalho principal",
    navigation: "Navegação",
    main: "Conteúdo principal",
    search: "Busca",
    form: "Formulário",
    contentinfo: "Informações do rodapé",
    complementary: "Conteúdo complementar",
    region: "Região"
  }
} as const

// Color contrast and visual accessibility
export const VISUAL_ACCESSIBILITY = {
  /**
   * High contrast mode labels
   */
  highContrast: {
    enable: "Ativar alto contraste",
    disable: "Desativar alto contraste",
    description: "Melhora a visibilidade para pessoas com baixa visão"
  },

  /**
   * Font size controls
   */
  fontSize: {
    increase: "Aumentar tamanho da fonte",
    decrease: "Diminuir tamanho da fonte",
    reset: "Tamanho padrão da fonte",
    description: "Ajustar tamanho do texto para melhor legibilidade"
  },

  /**
   * Color indicators with text alternatives
   */
  colorAlternatives: {
    required: "obrigatório",
    error: "erro",
    success: "sucesso",
    warning: "aviso",
    info: "informação",
    active: "ativo",
    inactive: "inativo",
    selected: "selecionado",
    disabled: "desabilitado"
  }
} as const

export type AriaLabel = keyof typeof ARIA_LABELS
export type HealthcareAriaLabel = keyof typeof HEALTHCARE_ARIA_LABELS
export type ScreenReaderAnnouncement = keyof typeof SCREEN_READER_ANNOUNCEMENTS