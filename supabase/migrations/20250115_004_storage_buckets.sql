-- Migration: Storage Buckets for FisioFlow
-- Description: Create Supabase Storage buckets for patient photos and documents
-- Date: 2025-01-15

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'patient-photos',
    'patient-photos',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'patient-documents',
    'patient-documents', 
    false,
    52428800, -- 50MB
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]
  ),
  (
    'exercise-videos',
    'exercise-videos',
    false,
    104857600, -- 100MB
    ARRAY['video/mp4', 'video/webm', 'video/avi', 'video/quicktime']
  ),
  (
    'exercise-thumbnails',
    'exercise-thumbnails',
    false,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'clinical-reports',
    'clinical-reports',
    false,
    52428800, -- 50MB
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'org-logos',
    'org-logos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'data-exports',
    'data-exports',
    false,
    104857600, -- 100MB
    ARRAY[
      'application/json',
      'application/zip',
      'text/csv',
      'application/pdf'
    ]
  )
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for patient-photos bucket
CREATE POLICY "Users can view patient photos from their org" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'patient-photos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can upload patient photos to their org" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'patient-photos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update patient photos from their org" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'patient-photos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete patient photos from their org" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'patient-photos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create RLS policies for patient-documents bucket
CREATE POLICY "Users can view patient documents from their org" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'patient-documents' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can upload patient documents to their org" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'patient-documents' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update patient documents from their org" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'patient-documents' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete patient documents from their org" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'patient-documents' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create RLS policies for exercise-videos bucket
CREATE POLICY "Users can view exercise videos from their org" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exercise-videos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can upload exercise videos to their org" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exercise-videos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update exercise videos from their org" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exercise-videos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete exercise videos from their org" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exercise-videos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create RLS policies for exercise-thumbnails bucket
CREATE POLICY "Users can view exercise thumbnails from their org" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exercise-thumbnails' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can upload exercise thumbnails to their org" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exercise-thumbnails' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update exercise thumbnails from their org" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exercise-thumbnails' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete exercise thumbnails from their org" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exercise-thumbnails' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create RLS policies for clinical-reports bucket
CREATE POLICY "Users can view clinical reports from their org" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'clinical-reports' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can upload clinical reports to their org" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'clinical-reports' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update clinical reports from their org" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'clinical-reports' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete clinical reports from their org" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'clinical-reports' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create RLS policies for org-logos bucket (public)
CREATE POLICY "Anyone can view org logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'org-logos');

CREATE POLICY "Users can upload org logos to their org" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'org-logos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update org logos from their org" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'org-logos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete org logos from their org" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'org-logos' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create RLS policies for data-exports bucket
CREATE POLICY "Users can view data exports from their org" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'data-exports' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can upload data exports to their org" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'data-exports' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update data exports from their org" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'data-exports' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete data exports from their org" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'data-exports' AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create function to generate file path with organization structure
CREATE OR REPLACE FUNCTION generate_file_path(
  p_bucket_id TEXT,
  p_org_id UUID,
  p_patient_id UUID DEFAULT NULL,
  p_file_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_org_slug TEXT;
  v_path TEXT;
BEGIN
  -- Get organization slug
  SELECT slug INTO v_org_slug
  FROM orgs
  WHERE id = p_org_id;
  
  -- Generate path based on bucket type
  CASE p_bucket_id
    WHEN 'patient-photos' THEN
      v_path := 'orgs/' || v_org_slug || '/patients/' || p_patient_id || '/photos/' || p_file_name;
    WHEN 'patient-documents' THEN
      v_path := 'orgs/' || v_org_slug || '/patients/' || p_patient_id || '/documents/' || p_file_name;
    WHEN 'exercise-videos' THEN
      v_path := 'orgs/' || v_org_slug || '/exercises/videos/' || p_file_name;
    WHEN 'exercise-thumbnails' THEN
      v_path := 'orgs/' || v_org_slug || '/exercises/thumbnails/' || p_file_name;
    WHEN 'clinical-reports' THEN
      v_path := 'orgs/' || v_org_slug || '/reports/' || p_file_name;
    WHEN 'org-logos' THEN
      v_path := 'orgs/' || v_org_slug || '/logo/' || p_file_name;
    WHEN 'data-exports' THEN
      v_path := 'orgs/' || v_org_slug || '/exports/' || p_file_name;
    ELSE
      v_path := 'orgs/' || v_org_slug || '/misc/' || p_file_name;
  END CASE;
  
  RETURN v_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate file upload
CREATE OR REPLACE FUNCTION validate_file_upload(
  p_bucket_id TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_bucket RECORD;
BEGIN
  -- Get bucket configuration
  SELECT * INTO v_bucket
  FROM storage.buckets
  WHERE id = p_bucket_id;
  
  -- Check if bucket exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check file size
  IF p_file_size > v_bucket.file_size_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Check MIME type
  IF NOT (p_mime_type = ANY(v_bucket.allowed_mime_types)) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get signed URL for file access
CREATE OR REPLACE FUNCTION get_signed_file_url(
  p_bucket_id TEXT,
  p_file_path TEXT,
  p_expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  v_url TEXT;
BEGIN
  -- This would typically call Supabase's storage API
  -- For now, return a placeholder URL
  v_url := '/api/storage/' || p_bucket_id || '/' || p_file_path;
  
  RETURN v_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
