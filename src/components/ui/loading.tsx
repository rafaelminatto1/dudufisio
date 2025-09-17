import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

interface LoadingProps {
  className?: string
  size?: "sm" | "md" | "lg"
  message?: string
}

function Loading({ className, size = "md", message }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  )
}

function LoadingPage({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center space-y-4">
      <Loading size="lg" />
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  )
}

function LoadingButton({
  isLoading,
  children,
  loadingText = "Carregando...",
  className,
  ...props
}: {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

function LoadingCard({ title, message }: { title?: string; message?: string }) {
  return (
    <div className="rounded-xl border p-6 shadow-sm">
      <div className="space-y-4">
        {title && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-[200px]" />
          </div>
        )}
        <Loading message={message || "Carregando dados..."} />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

function LoadingTable({ message = "Carregando dados da tabela..." }: { message?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Loading size="sm" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LoadingCard title="Gráfico" />
        <LoadingTable />
      </div>
    </div>
  )
}

// Healthcare-specific loading messages
export const LOADING_MESSAGES = {
  patients: {
    loading: "Carregando dados dos pacientes...",
    saving: "Salvando dados do paciente...",
    deleting: "Removendo paciente...",
    updating: "Atualizando informações..."
  },
  appointments: {
    loading: "Carregando agenda...",
    saving: "Agendando consulta...",
    canceling: "Cancelando agendamento...",
    rescheduling: "Reagendando consulta..."
  },
  sessions: {
    loading: "Carregando sessões...",
    saving: "Salvando evolução...",
    generating: "Gerando relatório..."
  },
  exercises: {
    loading: "Carregando exercícios...",
    saving: "Salvando prescrição...",
    updating: "Atualizando exercícios..."
  },
  reports: {
    generating: "Gerando relatório...",
    exporting: "Exportando dados...",
    processing: "Processando informações..."
  },
  auth: {
    login: "Entrando no sistema...",
    logout: "Saindo do sistema...",
    verifying: "Verificando credenciais..."
  }
} as const

// LoadingSpinner alias for backward compatibility
const LoadingSpinner = Loading

export {
  Loading,
  LoadingSpinner,
  LoadingPage,
  LoadingButton,
  LoadingCard,
  LoadingTable,
  LoadingDashboard,
}