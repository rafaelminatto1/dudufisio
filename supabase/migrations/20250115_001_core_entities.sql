-- Migration: Core Entities for FisioFlow
-- Description: Create core organizational and user management tables
-- Date: 2025-01-15

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create organizations table
CREATE TABLE IF NOT EXISTS orgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    cnes_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    postal_code VARCHAR(10),
    logo_url TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    business_hours JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'fisioterapeuta', 'estagiario', 'paciente')),
    crefito_number VARCHAR(20),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create org_memberships table for multi-tenant access
CREATE TABLE IF NOT EXISTS org_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'fisioterapeuta', 'estagiario', 'paciente')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- Create audit_logs table for LGPD compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    operation VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    additional_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON orgs(slug);
CREATE INDEX IF NOT EXISTS idx_orgs_cnpj ON orgs(cnpj);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_user ON org_memberships(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON orgs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_memberships_updated_at BEFORE UPDATE ON org_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own organization's data
CREATE POLICY "Users can view their own org data" ON orgs
    FOR ALL USING (
        id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can view profiles in their organization
CREATE POLICY "Users can view org profiles" ON profiles
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can view their own memberships
CREATE POLICY "Users can view their memberships" ON org_memberships
    FOR ALL USING (user_id = auth.uid());

-- RLS Policy: Users can view audit logs for their organization
CREATE POLICY "Users can view org audit logs" ON audit_logs
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role, org_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'paciente'),
        COALESCE((NEW.raw_user_meta_data->>'org_id')::UUID, NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_table_name VARCHAR(100),
    p_record_id UUID,
    p_operation VARCHAR(50),
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_additional_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_org_id UUID;
    v_user_id UUID;
BEGIN
    -- Get current user's org and user ID
    SELECT om.org_id, om.user_id INTO v_org_id, v_user_id
    FROM org_memberships om
    WHERE om.user_id = auth.uid() AND om.is_active = true
    LIMIT 1;

    -- Insert audit log
    INSERT INTO audit_logs (
        org_id,
        user_id,
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        additional_data
    ) VALUES (
        v_org_id,
        v_user_id,
        p_table_name,
        p_record_id,
        p_operation,
        p_old_values,
        p_new_values,
        p_additional_data
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(
    p_user_role VARCHAR(50),
    p_action VARCHAR(20),
    p_resource VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Define permission matrix
    CASE p_user_role
        WHEN 'admin' THEN
            RETURN TRUE; -- Admin has all permissions
        WHEN 'fisioterapeuta' THEN
            CASE p_resource
                WHEN 'patients' THEN RETURN p_action IN ('read', 'write', 'delete');
                WHEN 'appointments' THEN RETURN p_action IN ('read', 'write', 'delete');
                WHEN 'sessions' THEN RETURN p_action IN ('read', 'write', 'delete');
                WHEN 'pain_points' THEN RETURN p_action IN ('read', 'write', 'delete');
                ELSE RETURN FALSE;
            END CASE;
        WHEN 'estagiario' THEN
            CASE p_resource
                WHEN 'patients' THEN RETURN p_action IN ('read', 'write');
                WHEN 'appointments' THEN RETURN p_action IN ('read', 'write');
                WHEN 'sessions' THEN RETURN p_action IN ('read', 'write');
                WHEN 'pain_points' THEN RETURN p_action IN ('read', 'write');
                ELSE RETURN FALSE;
            END CASE;
        WHEN 'paciente' THEN
            CASE p_resource
                WHEN 'patients' THEN RETURN p_action = 'read' AND p_user_role = 'paciente';
                WHEN 'appointments' THEN RETURN p_action = 'read';
                WHEN 'sessions' THEN RETURN p_action = 'read';
                WHEN 'pain_points' THEN RETURN p_action = 'read';
                ELSE RETURN FALSE;
            END CASE;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
