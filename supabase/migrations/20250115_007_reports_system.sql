-- Migration: Reports System for FisioFlow
-- Description: Create report generation and scheduling tables
-- Date: 2025-01-15

-- Create generated_reports table
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    template_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('clinical', 'administrative', 'financial', 'quality')),
    format VARCHAR(10) NOT NULL CHECK (format IN ('pdf', 'excel', 'csv')),
    status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed', 'expired')),
    parameters JSONB DEFAULT '{}',
    file_size BIGINT,
    download_url TEXT,
    download_count INTEGER DEFAULT 0,
    error_message TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_downloaded_at TIMESTAMPTZ,
    generated_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_report_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scheduled_reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    template_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    parameters JSONB DEFAULT '{}',
    recipients TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_generated_at TIMESTAMPTZ,
    next_generation_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create report_templates table for custom templates
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    template_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('clinical', 'administrative', 'financial', 'quality')),
    default_format VARCHAR(10) DEFAULT 'pdf' CHECK (default_format IN ('pdf', 'excel', 'csv')),
    is_system_template BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    required_filters TEXT[] DEFAULT '{}',
    optional_filters TEXT[] DEFAULT '{}',
    template_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_org_id ON generated_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(org_id, status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_template_id ON generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_category ON generated_reports(org_id, category);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_expires_at ON generated_reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_by ON generated_reports(generated_by);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_org_id ON scheduled_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_generation ON scheduled_reports(next_generation_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_frequency ON scheduled_reports(frequency);

CREATE INDEX IF NOT EXISTS idx_report_templates_org_id ON report_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_template_id ON report_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(org_id, category);

-- Create updated_at triggers
CREATE TRIGGER update_generated_reports_updated_at 
    BEFORE UPDATE ON generated_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at 
    BEFORE UPDATE ON scheduled_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at 
    BEFORE UPDATE ON report_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access reports from their organization
CREATE POLICY "Users can access org reports" ON generated_reports
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can access org scheduled reports" ON scheduled_reports
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can access org report templates" ON report_templates
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        ) OR is_system_template = true
    );

-- Create function to cleanup expired reports
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired reports older than 30 days
    DELETE FROM generated_reports 
    WHERE status = 'expired' 
      AND expires_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Update status of reports that have expired but haven't been marked
    UPDATE generated_reports 
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'ready' 
      AND expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate next generation time for scheduled reports
CREATE OR REPLACE FUNCTION calculate_next_generation_time(
    p_frequency VARCHAR(20),
    p_last_generated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    base_time TIMESTAMPTZ;
BEGIN
    -- Use last generated time or current time as base
    base_time := COALESCE(p_last_generated_at, NOW());
    
    CASE p_frequency
        WHEN 'daily' THEN
            RETURN base_time + INTERVAL '1 day';
        WHEN 'weekly' THEN
            RETURN base_time + INTERVAL '1 week';
        WHEN 'monthly' THEN
            RETURN base_time + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            RETURN base_time + INTERVAL '3 months';
        WHEN 'annual' THEN
            RETURN base_time + INTERVAL '1 year';
        ELSE
            RETURN base_time + INTERVAL '1 week'; -- Default to weekly
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get report statistics
CREATE OR REPLACE FUNCTION get_report_statistics(
    p_org_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_reports INTEGER,
    ready_reports INTEGER,
    generating_reports INTEGER,
    failed_reports INTEGER,
    expired_reports INTEGER,
    total_downloads INTEGER,
    most_popular_template VARCHAR(100),
    avg_generation_time_minutes DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_reports,
        COUNT(CASE WHEN gr.status = 'ready' THEN 1 END)::INTEGER as ready_reports,
        COUNT(CASE WHEN gr.status = 'generating' THEN 1 END)::INTEGER as generating_reports,
        COUNT(CASE WHEN gr.status = 'failed' THEN 1 END)::INTEGER as failed_reports,
        COUNT(CASE WHEN gr.status = 'expired' THEN 1 END)::INTEGER as expired_reports,
        COALESCE(SUM(gr.download_count), 0)::INTEGER as total_downloads,
        (
            SELECT template_id 
            FROM generated_reports gr2 
            WHERE gr2.org_id = p_org_id
              AND (p_start_date IS NULL OR gr2.generated_at::date >= p_start_date)
              AND (p_end_date IS NULL OR gr2.generated_at::date <= p_end_date)
            GROUP BY template_id 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_popular_template,
        ROUND(
            AVG(
                CASE 
                    WHEN gr.completed_at IS NOT NULL AND gr.generated_at IS NOT NULL
                    THEN EXTRACT(EPOCH FROM (gr.completed_at - gr.generated_at)) / 60.0
                END
            ), 2
        ) as avg_generation_time_minutes
    FROM generated_reports gr
    WHERE gr.org_id = p_org_id
      AND (p_start_date IS NULL OR gr.generated_at::date >= p_start_date)
      AND (p_end_date IS NULL OR gr.generated_at::date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system templates
INSERT INTO report_templates (
    template_id, 
    name, 
    description, 
    category, 
    default_format, 
    is_system_template, 
    required_filters, 
    optional_filters,
    template_config,
    org_id
) VALUES 
(
    'clinical-evolution',
    'Relatório de Evolução Clínica',
    'Evolução dos pacientes com resultados de tratamentos e alta',
    'clinical',
    'pdf',
    true,
    ARRAY['date_from', 'date_to'],
    ARRAY['therapist_id', 'patient_id'],
    '{"frequency": "monthly", "isSchedulable": true}',
    NULL
),
(
    'attendance-summary',
    'Resumo de Atendimentos',
    'Estatísticas de agendamentos, presenças e faltas por período',
    'administrative',
    'excel',
    true,
    ARRAY['date_from', 'date_to'],
    ARRAY['therapist_id'],
    '{"frequency": "weekly", "isSchedulable": true}',
    NULL
),
(
    'financial-revenue',
    'Relatório de Receitas',
    'Análise financeira detalhada com receitas por terapeuta e procedimento',
    'financial',
    'excel',
    true,
    ARRAY['date_from', 'date_to'],
    ARRAY['therapist_id'],
    '{"frequency": "monthly", "isSchedulable": true}',
    NULL
),
(
    'patient-satisfaction',
    'Pesquisa de Satisfação',
    'Resultados das avaliações de satisfação dos pacientes',
    'quality',
    'pdf',
    true,
    ARRAY['date_from', 'date_to'],
    ARRAY[],
    '{"frequency": "quarterly", "isSchedulable": true}',
    NULL
);

-- Add reference to scheduled_report_id in generated_reports
ALTER TABLE generated_reports 
ADD CONSTRAINT fk_generated_reports_scheduled_report 
FOREIGN KEY (scheduled_report_id) REFERENCES scheduled_reports(id) ON DELETE SET NULL;

