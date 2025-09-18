/**
 * SEO Metadata Utilities
 * Dynamic metadata generation for Brazilian healthcare
 */

import type { Metadata } from 'next'

// Base SEO configuration
export const BASE_SEO = {
  title: 'FisioFlow - Sistema de Gestão Fisioterapêutica',
  description: 'Sistema completo de gestão para clínicas de fisioterapia. Prontuário eletrônico, agendamento, prescrição de exercícios e muito mais.',
  siteName: 'FisioFlow',
  locale: 'pt_BR',
  type: 'website',
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000',
  author: 'FisioFlow Team',
  keywords: [
    'fisioterapia',
    'prontuário eletrônico',
    'agendamento médico',
    'gestão clínica',
    'exercícios terapêuticos',
    'LGPD',
    'sistema médico',
    'brasil'
  ]
} as const

// Medical schema.org types
export const MEDICAL_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'MedicalOrganization',
  name: 'FisioFlow',
  description: BASE_SEO.description,
  url: `https://${BASE_SEO.domain}`,
  specialty: 'Fisioterapia',
  serviceType: 'Software de Gestão Médica',
  areaServed: {
    '@type': 'Country',
    name: 'Brasil'
  },
  availableLanguage: 'pt-BR',
  medicalSpecialty: [
    'Fisioterapia',
    'Reabilitação',
    'Ortopedia',
    'Neurologia',
    'Cardiologia',
    'Pediatria'
  ],
  applicationCategory: 'HealthApplication',
  applicationSubCategory: 'MedicalManagement',
  operatingSystem: 'Web Browser',
  softwareRequirements: 'Navegador moderno com JavaScript',
  offers: {
    '@type': 'Offer',
    description: 'Sistema de gestão para clínicas de fisioterapia',
    category: 'Software as a Service'
  }
}

// Generate page-specific metadata
export function generateMetadata({
  title,
  description,
  path = '/',
  image,
  noIndex = false,
  keywords = [],
  schema
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
  schema?: object
}): Metadata {
  const fullTitle = title ? `${title} | ${BASE_SEO.title}` : BASE_SEO.title
  const fullDescription = description || BASE_SEO.description
  const fullUrl = `https://${BASE_SEO.domain}${path}`
  const fullKeywords = [...BASE_SEO.keywords, ...keywords].join(', ')

  const metadata: Metadata = {
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    authors: [{ name: BASE_SEO.author }],
    creator: BASE_SEO.author,
    publisher: BASE_SEO.author,
    alternates: {
      canonical: fullUrl
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: BASE_SEO.siteName,
      locale: BASE_SEO.locale,
      type: 'website',
      images: image ? [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle
        }
      ] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: image ? [image] : undefined
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  }

  // Add structured data if provided
  if (schema) {
    // Note: In Next.js 13+, structured data is typically added via script tags in layout
    metadata.other = {
      'structured-data': JSON.stringify(schema)
    }
  }

  return metadata
}

// Patient-specific metadata
export function generatePatientMetadata(patient: {
  name: string
  id: string
}) {
  return generateMetadata({
    title: `Paciente: ${patient.name}`,
    description: `Prontuário e histórico médico do paciente ${patient.name}`,
    path: `/patients/${patient.id}`,
    noIndex: true, // Patient data should not be indexed
    keywords: ['prontuário', 'paciente', 'histórico médico']
  })
}

// Appointment-specific metadata
export function generateAppointmentMetadata() {
  return generateMetadata({
    title: 'Agendamentos',
    description: 'Sistema de agendamento de consultas e sessões de fisioterapia',
    path: '/appointments',
    keywords: ['agendamento', 'consultas', 'horários', 'calendar']
  })
}

// Exercise library metadata
export function generateExerciseMetadata() {
  return generateMetadata({
    title: 'Biblioteca de Exercícios',
    description: 'Biblioteca completa de exercícios terapêuticos com demonstrações visuais',
    path: '/exercises',
    keywords: ['exercícios', 'terapêuticos', 'reabilitação', 'fisioterapia'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Biblioteca de Exercícios Terapêuticos',
      description: 'Coleção de exercícios para reabilitação fisioterapêutica',
      creator: BASE_SEO.author,
      license: 'Proprietary',
      inLanguage: 'pt-BR'
    }
  })
}

// Dashboard metadata
export function generateDashboardMetadata(userRole: string) {
  const roleNames = {
    admin: 'Administrador',
    fisioterapeuta: 'Fisioterapeuta',
    estagiario: 'Estagiário',
    paciente: 'Paciente'
  }

  return generateMetadata({
    title: `Dashboard ${roleNames[userRole as keyof typeof roleNames] || 'Usuário'}`,
    description: `Painel de controle personalizado para ${roleNames[userRole as keyof typeof roleNames] || 'usuário'}`,
    path: `/dashboard/${userRole}`,
    noIndex: true // Dashboards should not be indexed
  })
}

// Generate breadcrumb schema
export function generateBreadcrumbSchema(items: Array<{ name: string; url?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `https://${BASE_SEO.domain}${item.url}` : undefined
    }))
  }
}

// Healthcare organization schema
export function generateOrganizationSchema(orgData?: {
  name: string
  address?: string
  phone?: string
  email?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: orgData?.name || 'Clínica de Fisioterapia',
    address: orgData?.address ? {
      '@type': 'PostalAddress',
      addressLocality: orgData.address,
      addressCountry: 'BR'
    } : undefined,
    telephone: orgData?.phone,
    email: orgData?.email,
    specialty: 'Fisioterapia',
    serviceType: [
      'Fisioterapia',
      'Reabilitação',
      'Terapia Manual',
      'Exercícios Terapêuticos'
    ],
    availableService: {
      '@type': 'MedicalTherapy',
      name: 'Fisioterapia',
      serviceType: 'Reabilitação'
    }
  }
}