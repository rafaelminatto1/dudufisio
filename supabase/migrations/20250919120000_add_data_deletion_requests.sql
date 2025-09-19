-- Add data_deletion_requests table for LGPD compliance
-- This table tracks user data deletion requests as required by Brazilian privacy law

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('full_deletion', 'partial_deletion', 'anonymization')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  data_backup_path TEXT, -- Path to backup before deletion
  verification_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_org_id ON data_deletion_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_token ON data_deletion_requests(verification_token);

-- Enable RLS
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own deletion requests" ON data_deletion_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT user_id FROM v_user_orgs
      WHERE org_id = data_deletion_requests.org_id
    )
  );

CREATE POLICY "Admins can manage deletion requests" ON data_deletion_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN org_memberships om ON p.id = om.user_id
      WHERE p.id = auth.uid()
      AND om.org_id = data_deletion_requests.org_id
      AND om.role IN ('admin', 'owner')
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_deletion_requests_updated_at
  BEFORE UPDATE ON data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add audit logging
CREATE TRIGGER audit_data_deletion_requests
  AFTER INSERT OR UPDATE OR DELETE ON data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();