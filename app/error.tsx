'use client'

import { useEffect } from 'react'
import logger from '../lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">!</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Algo deu errado
        </h2>
        <p className="text-gray-600 mb-8">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}