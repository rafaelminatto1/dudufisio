-- Migration: Core Entities (Organizations, Profiles, Memberships)
-- Created: 2025-09-14
-- Description: Creates the foundational tables for multi-tenant healthcare organizations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table - Multi-tenant healthcare clinics
CREATE TABLE orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE, -- Brazilian tax ID
    address JSONB,
    phone TEXT,
    email TEXT,
    settings JSONB DEFAULT '{}', -- clinic preferences
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX orgs_cnpj_idx ON orgs(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX orgs_name_idx ON orgs USING GIN (to_tsvector('portuguese', name));

-- Profiles table - User profiles linking Supabase Auth to application roles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL, -- Supabase auth.users.id
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    crefito TEXT, -- physiotherapy license number
    specializations TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE UNIQUE INDEX profiles_auth_user_id_idx ON profiles(auth_user_id);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_name_idx ON profiles USING GIN (to_tsvector('portuguese', name));

-- Organization Memberships - Role-based access control linking users to organizations
CREATE TABLE org_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'fisioterapeuta', 'estagiario', 'paciente')) NOT NULL,
    status TEXT CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, profile_id)
);

-- Add indexes for performance
CREATE INDEX org_memberships_org_id_idx ON org_memberships(org_id);
CREATE INDEX org_memberships_profile_id_idx ON org_memberships(profile_id);
CREATE INDEX org_memberships_role_idx ON org_memberships(role);
CREATE INDEX org_memberships_status_idx ON org_memberships(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON orgs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_memberships_updated_at BEFORE UPDATE ON org_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE orgs IS 'Healthcare organizations (clinics) with multi-tenant isolation';
COMMENT ON COLUMN orgs.cnpj IS 'Brazilian tax identification number (CNPJ)';
COMMENT ON COLUMN orgs.settings IS 'JSON configuration: business hours, appointment duration, etc.';

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth users';
COMMENT ON COLUMN profiles.auth_user_id IS 'Foreign key to auth.users table in Supabase Auth';
COMMENT ON COLUMN profiles.crefito IS 'Brazilian physiotherapy license number (CREFITO)';

COMMENT ON TABLE org_memberships IS 'Role-based access control for users within organizations';
COMMENT ON COLUMN org_memberships.role IS 'User role: admin, fisioterapeuta, estagiario, paciente';
COMMENT ON COLUMN org_memberships.status IS 'Membership status: active, suspended, inactive';