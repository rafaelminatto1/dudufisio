/**
 * Lazy Loading Components for Performance
 * Implements code splitting for heavy components
 */

import { lazy } from 'react'

// Heavy Dashboard Components
export const LazyAdminDashboard = lazy(() => import('@/app/dashboard/admin/page'))
export const LazyReportsPage = lazy(() => import('@/app/relatorios/page'))
export const LazyFinancialPage = lazy(() => import('@/app/financeiro/page'))

// Heavy Exercise Components
export const LazyExercisePage = lazy(() => import('@/app/exercises/page'))
export const LazyPrescriptionPage = lazy(() => import('@/app/prescriptions/page'))
export const LazyCreateExerciseModal = lazy(() => import('@/components/exercises/CreateExerciseModal'))
export const LazyCreatePrescriptionModal = lazy(() => import('@/components/prescriptions/CreatePrescriptionModal'))

// Heavy Patient Components
export const LazyPatientDetailsPage = lazy(() => import('@/app/patients/[id]/page'))
export const LazyBodyMapSVG = lazy(() => import('@/components/bodymap/BodyMapSVG'))
export const LazyPainTimeline = lazy(() => import('@/components/bodymap/PainTimeline'))

// Heavy Calendar Components
export const LazyAppointmentCalendar = lazy(() => import('@/components/calendar/AppointmentCalendar'))
export const LazyAppointmentBookingModal = lazy(() => import('@/components/appointments/AppointmentBookingModal'))

// Patient Portal Components
export const LazyPatientPortalExercises = lazy(() => import('@/app/portal-paciente/exercicios/page'))
export const LazyExerciseExecutionModal = lazy(() => import('@/components/patient-portal/ExerciseExecutionModal'))