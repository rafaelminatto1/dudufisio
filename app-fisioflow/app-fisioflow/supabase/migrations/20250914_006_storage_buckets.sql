-- Migration: Supabase Storage Buckets
-- Description: Storage buckets for patient photos, exercise videos, and documents with LGPD compliance
-- Date: 2025-09-14
-- Author: FisioFlow Team

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Patient photos bucket (private, LGPD compliant)
  ('patient-photos', 'patient-photos', false, 10485760, ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]),

  -- Exercise videos bucket (private, for exercise library)
  ('exercise-videos', 'exercise-videos', false, 104857600, ARRAY[
    'video/mp4',
    'video/webm',
    'video/avi',
    'video/quicktime'
  ]),

  -- Exercise thumbnails bucket (public, for exercise previews)
  ('exercise-thumbnails', 'exercise-thumbnails', true, 2097152, ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]),

  -- Patient documents bucket (private, LGPD compliant)
  ('patient-documents', 'patient-documents', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]),

  -- Clinical reports bucket (private)
  ('clinical-reports', 'clinical-reports', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),

  -- Organization logos bucket (public)
  ('org-logos', 'org-logos', true, 5242880, ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ]),

  -- Backup exports bucket (private, for LGPD data exports)
  ('data-exports', 'data-exports', false, 104857600, ARRAY[
    'application/json',
    'application/zip',
    'text/csv',
    'application/pdf'
  ]);

-- Create storage policies for patient-photos bucket
CREATE POLICY "Patient photos: Healthcare professionals can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta')
    )
  );

CREATE POLICY "Patient photos: Healthcare professionals can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND (
          get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta', 'estagiario')
          OR (
            get_user_role_in_org(p.org_id) = 'paciente'
            AND can_access_patient(p.id)
          )
        )
    )
  );

CREATE POLICY "Patient photos: Healthcare professionals can update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta')
    )
  );

CREATE POLICY "Patient photos: Healthcare professionals can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta')
    )
  );

-- Create storage policies for exercise-videos bucket
CREATE POLICY "Exercise videos: Healthcare professionals can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exercise-videos'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('admin', 'fisioterapeuta')
    )
  );

CREATE POLICY "Exercise videos: Organization members can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exercise-videos'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

CREATE POLICY "Exercise videos: Healthcare professionals can manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'exercise-videos'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('admin', 'fisioterapeuta')
    )
  );

-- Create storage policies for exercise-thumbnails bucket (public)
CREATE POLICY "Exercise thumbnails: Organization members can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exercise-thumbnails'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('admin', 'fisioterapeuta')
    )
  );

CREATE POLICY "Exercise thumbnails: Anyone can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'exercise-thumbnails');

CREATE POLICY "Exercise thumbnails: Healthcare professionals can manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'exercise-thumbnails'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('admin', 'fisioterapeuta')
    )
  );

-- Create storage policies for patient-documents bucket
CREATE POLICY "Patient documents: Healthcare professionals can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta')
    )
  );

CREATE POLICY "Patient documents: Healthcare professionals can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND (
          get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta', 'estagiario')
          OR (
            get_user_role_in_org(p.org_id) = 'paciente'
            AND can_access_patient(p.id)
          )
        )
    )
  );

CREATE POLICY "Patient documents: Healthcare professionals can manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta')
    )
  );

-- Create storage policies for clinical-reports bucket
CREATE POLICY "Clinical reports: Healthcare professionals can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clinical-reports'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta')
    )
  );

CREATE POLICY "Clinical reports: Healthcare professionals can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'clinical-reports'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND (
          get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta', 'estagiario')
          OR (
            get_user_role_in_org(p.org_id) = 'paciente'
            AND can_access_patient(p.id)
          )
        )
    )
  );

CREATE POLICY "Clinical reports: Healthcare professionals can manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'clinical-reports'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM patients p
      WHERE user_has_org_access(p.org_id)
        AND get_user_role_in_org(p.org_id) IN ('admin', 'fisioterapeuta')
    )
  );

-- Create storage policies for org-logos bucket (public)
CREATE POLICY "Org logos: Admins can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = 'admin'
    )
  );

CREATE POLICY "Org logos: Anyone can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'org-logos');

CREATE POLICY "Org logos: Admins can manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = 'admin'
    )
  );

-- Create storage policies for data-exports bucket (LGPD compliance)
CREATE POLICY "Data exports: Admins can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'data-exports'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = 'admin'
    )
  );

CREATE POLICY "Data exports: Requesters can view their exports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'data-exports'
    AND (
      -- Admins can view all exports in their org
      (storage.foldername(name))[1] IN (
        SELECT om.org_id::text
        FROM org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.status = 'active'
          AND om.role = 'admin'
      )
      OR
      -- Users can view their own data exports
      (storage.foldername(name))[2] = auth.uid()::text
    )
  );

CREATE POLICY "Data exports: Admins can manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'data-exports'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = 'admin'
    )
  );

-- Create function to generate patient photo path
CREATE OR REPLACE FUNCTION get_patient_photo_path(patient_id UUID, filename TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN patient_id::text || '/' || filename;
END;
$$;

-- Create function to generate exercise video path
CREATE OR REPLACE FUNCTION get_exercise_video_path(org_id UUID, exercise_id UUID, filename TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN org_id::text || '/exercises/' || exercise_id::text || '/' || filename;
END;
$$;

-- Create function to generate data export path
CREATE OR REPLACE FUNCTION get_data_export_path(org_id UUID, user_id UUID, filename TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN org_id::text || '/' || user_id::text || '/' || filename;
END;
$$;

-- Create function to clean up expired data exports (LGPD compliance)
CREATE OR REPLACE FUNCTION cleanup_expired_data_exports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
    export_record RECORD;
BEGIN
    -- Delete data exports older than 30 days
    FOR export_record IN
        SELECT name, bucket_id
        FROM storage.objects
        WHERE bucket_id = 'data-exports'
          AND created_at < NOW() - INTERVAL '30 days'
    LOOP
        -- Delete the file
        DELETE FROM storage.objects
        WHERE bucket_id = export_record.bucket_id
          AND name = export_record.name;

        deleted_count := deleted_count + 1;

        -- Log the cleanup for audit
        INSERT INTO audit_logs (
            table_name, operation, org_id,
            additional_data, timestamp
        ) VALUES (
            'storage_cleanup', 'DELETE', NULL,
            jsonb_build_object(
                'bucket', export_record.bucket_id,
                'file_name', export_record.name,
                'reason', 'expired_data_export',
                'retention_days', 30
            ),
            NOW()
        );
    END LOOP;

    RETURN deleted_count;
END;
$$;

-- Create scheduled task to run cleanup (requires pg_cron extension)
-- This would typically be run as a cron job or scheduled function
-- SELECT cron.schedule('cleanup-exports', '0 2 * * *', 'SELECT cleanup_expired_data_exports();');

-- Create function to validate file upload
CREATE OR REPLACE FUNCTION validate_file_upload(
    bucket_name TEXT,
    file_path TEXT,
    file_size BIGINT,
    mime_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    bucket_config RECORD;
    allowed_mime_types TEXT[];
BEGIN
    -- Get bucket configuration
    SELECT file_size_limit, allowed_mime_types
    INTO bucket_config
    FROM storage.buckets
    WHERE id = bucket_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bucket não encontrado: %', bucket_name;
    END IF;

    -- Check file size limit
    IF file_size > bucket_config.file_size_limit THEN
        RAISE EXCEPTION 'Arquivo muito grande. Limite: % bytes', bucket_config.file_size_limit;
    END IF;

    -- Check MIME type
    IF mime_type != ANY(bucket_config.allowed_mime_types) THEN
        RAISE EXCEPTION 'Tipo de arquivo não permitido: %. Tipos permitidos: %',
            mime_type, array_to_string(bucket_config.allowed_mime_types, ', ');
    END IF;

    RETURN TRUE;
END;
$$;

-- Create trigger to log file uploads for audit
CREATE OR REPLACE FUNCTION log_file_upload()
RETURNS TRIGGER AS $$
DECLARE
    org_id_value UUID;
    patient_id_value UUID;
BEGIN
    -- Extract org_id and patient_id from path for audit logging
    IF NEW.bucket_id = 'patient-photos' OR NEW.bucket_id = 'patient-documents' OR NEW.bucket_id = 'clinical-reports' THEN
        -- Path format: patient_id/filename
        patient_id_value := (storage.foldername(NEW.name))[1]::UUID;

        SELECT p.org_id INTO org_id_value
        FROM patients p
        WHERE p.id = patient_id_value;
    ELSIF NEW.bucket_id = 'exercise-videos' OR NEW.bucket_id = 'exercise-thumbnails' OR NEW.bucket_id = 'org-logos' THEN
        -- Path format: org_id/...
        org_id_value := (storage.foldername(NEW.name))[1]::UUID;
    END IF;

    -- Log the file upload
    INSERT INTO audit_logs (
        table_name, operation, org_id,
        additional_data, user_id, timestamp
    ) VALUES (
        'storage_objects', TG_OP, org_id_value,
        jsonb_build_object(
            'bucket_id', NEW.bucket_id,
            'file_name', NEW.name,
            'file_size', NEW.metadata->>'size',
            'mime_type', NEW.metadata->>'mimetype',
            'patient_id', patient_id_value
        ),
        auth.uid(), NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to storage objects
CREATE TRIGGER log_storage_uploads
    AFTER INSERT OR UPDATE OR DELETE ON storage.objects
    FOR EACH ROW EXECUTE FUNCTION log_file_upload();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_patient_photo_path(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exercise_video_path(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_data_export_path(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_file_upload(TEXT, TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_data_exports() TO service_role;

-- Comments for documentation
COMMENT ON FUNCTION get_patient_photo_path IS 'Gera caminho padronizado para fotos de pacientes';
COMMENT ON FUNCTION get_exercise_video_path IS 'Gera caminho padronizado para vídeos de exercícios';
COMMENT ON FUNCTION get_data_export_path IS 'Gera caminho padronizado para exportações de dados LGPD';
COMMENT ON FUNCTION cleanup_expired_data_exports IS 'Remove exportações de dados expiradas conforme LGPD';
COMMENT ON FUNCTION validate_file_upload IS 'Valida upload de arquivos conforme regras do bucket';