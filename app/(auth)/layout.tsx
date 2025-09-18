export const metadata = {
  title: 'FisioFlow - Autenticação',
  description: 'Sistema de autenticação do FisioFlow',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  )
}
