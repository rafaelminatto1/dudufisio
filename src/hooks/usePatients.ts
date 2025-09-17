'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client-simple'
import type { Patient, PatientInsert, PatientUpdate } from '@/lib/supabase/database.types'
import { toast } from 'sonner'

interface PatientsFilter {
  search?: string
  status?: string
  page?: number
  limit?: number
}

interface PatientsHookReturn {
  patients: Patient[] | null
  loading: boolean
  error: string | null
  totalCount: number | undefined
  fetchPatients: (filters?: PatientsFilter) => Promise<void>
  createPatient: (patientData: PatientInsert) => Promise<Patient | null>
  updatePatient: (id: string, patientData: PatientUpdate) => Promise<Patient | null>
  deletePatient: (id: string) => Promise<boolean>
  getPatient: (id: string) => Promise<Patient | null>
}

export function usePatients(): PatientsHookReturn {
  const [patients, setPatients] = useState<Patient[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined)

  const supabase = createClient()

  const fetchPatients = useCallback(async (filters: PatientsFilter = {}) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as 'active' | 'inactive' | 'discharged')
      }

      // Apply pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit
        const to = from + filters.limit - 1
        query = query.range(from, to)
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) {
        throw fetchError
      }

      setPatients(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pacientes'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createPatient = useCallback(async (patientData: PatientInsert): Promise<Patient | null> => {
    setLoading(true)
    setError(null)

    try {
      // Add consent timestamp and IP
      const patientWithConsent = {
        ...patientData,
        consent_date: new Date().toISOString(),
        consent_ip_address: 'system', // In a real app, capture actual IP
        status: 'active' as const
      }

      const { data, error: createError } = await supabase
        .from('patients')
        .insert([patientWithConsent])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // Update local state
      if (patients) {
        setPatients([data, ...patients])
        setTotalCount((prev) => (prev || 0) + 1)
      }

      toast.success('Paciente criado com sucesso!')
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar paciente'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, patients])

  const updatePatient = useCallback(async (id: string, patientData: PatientUpdate): Promise<Patient | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('patients')
        .update({
          ...patientData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update local state
      if (patients) {
        setPatients(patients.map(patient =>
          patient.id === id ? data : patient
        ))
      }

      toast.success('Paciente atualizado com sucesso!')
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar paciente'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, patients])

  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      if (patients) {
        setPatients(patients.filter(patient => patient.id !== id))
        setTotalCount((prev) => Math.max(0, (prev || 0) - 1))
      }

      toast.success('Paciente removido com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover paciente'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase, patients])

  const getPatient = useCallback(async (id: string): Promise<Patient | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar paciente'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    patients,
    loading,
    error,
    totalCount,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    getPatient
  }
}