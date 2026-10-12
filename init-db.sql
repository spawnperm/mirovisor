-- ==============================================================================
-- Mirovisor Multi-Tenant Database Initialization
-- Pattern: Schema-per-Tenant with FORCE ROW LEVEL SECURITY (OWASP ASVS 5.0 L2)
-- ==============================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Public Registry of Tenants
CREATE SCHEMA IF NOT EXISTS platform_registry;

CREATE TABLE IF NOT EXISTS platform_registry.tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    schema_name VARCHAR(64) UNIQUE NOT NULL,
    tier VARCHAR(32) NOT NULL DEFAULT 'project',
    storage_quota_mb INTEGER NOT NULL DEFAULT 5120,
    storage_used_mb INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_registry.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    payload JSONB,
    client_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactional Outbox for NATS JetStream Guaranteed Delivery
CREATE TABLE IF NOT EXISTS platform_registry.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON platform_registry.outbox_events(status) WHERE status = 'PENDING';

-- Seed Initial Tenants
INSERT INTO platform_registry.tenants (id, name, slug, schema_name, tier, storage_quota_mb)
VALUES 
    ('t_holding', 'Mirovisor Global Holding', 'holding', 'tenant_holding', 'holding', 20480),
    ('t_fintech', 'CyberBank Ecosystem', 'cyberbank', 'tenant_fintech', 'division', 10240),
    ('t_defense', 'AeroSpace Telemetry', 'aerospace', 'tenant_defense', 'project', 5120)
ON CONFLICT (id) DO NOTHING;

-- Schema Template Provisioning for Tenants
CREATE OR REPLACE FUNCTION platform_registry.provision_tenant_schema(target_schema text)
RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', target_schema);
    
    -- Tenant Entities Table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.entities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id VARCHAR(64) NOT NULL,
            entity_type VARCHAR(64) NOT NULL,
            title VARCHAR(255) NOT NULL,
            data JSONB NOT NULL DEFAULT ''{}'',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE %I.entities ENABLE ROW LEVEL SECURITY;
        ALTER TABLE %I.entities FORCE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS tenant_isolation_policy ON %I.entities;
        CREATE POLICY tenant_isolation_policy ON %I.entities
            FOR ALL
            USING (tenant_id = current_setting(''app.current_tenant_id'', true));
    ', target_schema, target_schema, target_schema, target_schema, target_schema);
END;
$$ LANGUAGE plpgsql;

-- Provision seeded schemas
SELECT platform_registry.provision_tenant_schema('tenant_holding');
SELECT platform_registry.provision_tenant_schema('tenant_fintech');
SELECT platform_registry.provision_tenant_schema('tenant_defense');
