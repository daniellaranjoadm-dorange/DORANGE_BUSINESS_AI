-- ============================================================================
-- D'OR@NGE BUSINESS AI — ESQUEMA RELACIONAL POSTGRESQL (VERSÃO R5.1)
-- Banco de dados SaaS White-Label Multi-Tenant
-- ============================================================================

-- Extensões para UUID e criptografia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABELAS DE NÚCLEO E MULTI-TENANCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    business_segment VARCHAR(32) NOT NULL DEFAULT 'nails' CHECK (business_segment IN ('nails','barber','beauty','brows_lashes','esthetics','massage','home_services','pet_grooming','automotive','photography','tutoring','tailoring')),
    business_hours JSONB,
    slug VARCHAR(100) UNIQUE NOT NULL,
    document VARCHAR(32) NOT NULL,
    document_type VARCHAR(10) NOT NULL CHECK (document_type IN ('CPF', 'CNPJ')),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    whatsapp VARCHAR(32) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(10) NOT NULL,
    service_type VARCHAR(32) NOT NULL DEFAULT 'both' CHECK (service_type IN ('establishment', 'domicile', 'both')),
    address TEXT,
    logo_url TEXT,
    cover_url TEXT,
    primary_color VARCHAR(16) NOT NULL DEFAULT '#17191F',
    secondary_color VARCHAR(16),
    description TEXT,
    instagram VARCHAR(100),
    plan_id VARCHAR(32) NOT NULL DEFAULT 'pro' CHECK (plan_id IN ('free', 'start', 'pro', 'studio')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended')),
    buffer_minutes INT NOT NULL DEFAULT 10,
    whatsapp_mode VARCHAR(32) NOT NULL DEFAULT 'personal' CHECK (whatsapp_mode IN ('personal', 'business_platform')),
    whatsapp_config JSONB,
    loyalty_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    loyalty_points_per_real NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    loyalty_reward_threshold INT NOT NULL DEFAULT 100,
    loyalty_reward_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Usuários do Sistema
CREATE TABLE IF NOT EXISTS users (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(32) NOT NULL CHECK (role IN ('superadmin', 'owner', 'manager', 'professional', 'customer')),
    password_hash TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Associação de Membros e Permissões por Salão (Multi-Salão)
CREATE TABLE IF NOT EXISTS tenant_memberships (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('owner', 'manager', 'professional', 'assistant')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, user_id)
);

-- ============================================================================
-- 2. PROFISSIONAIS E SERVIÇOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS professionals (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(32),
    avatar_url TEXT,
    bio TEXT,
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    schedule JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profs_tenant ON professionals(tenant_id);

CREATE TABLE IF NOT EXISTS services (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 45,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_brl NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estimated_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 80.00,
    image_url TEXT,
    materials_needed TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(tenant_id, category);

-- ============================================================================
-- 3. CLIENTES E CRM
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    birthdate VARCHAR(10),
    notes TEXT,
    favorite_colors TEXT[],
    loyalty_points INT NOT NULL DEFAULT 0,
    marketing_consent BOOLEAN NOT NULL DEFAULT TRUE,
    total_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    appointments_count INT NOT NULL DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_name ON customers(tenant_id, name);

-- ============================================================================
-- 4. AGENDA E DISPONIBILIDADE
-- ============================================================================

CREATE TABLE IF NOT EXISTS availability_rules (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    professional_id VARCHAR(64) NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS blocked_times (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    professional_id VARCHAR(64) NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id VARCHAR(64) NOT NULL REFERENCES services(id),
    service_name VARCHAR(255) NOT NULL,
    professional_id VARCHAR(64) NOT NULL REFERENCES professionals(id),
    professional_name VARCHAR(255) NOT NULL,
    customer_id VARCHAR(64) REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    duration_minutes INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'deposit_paid')),
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_domicile BOOLEAN NOT NULL DEFAULT FALSE,
    address TEXT,
    inspiration_photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice composto para verificação ultrarrápida de concorrência e conflitos de horários
CREATE INDEX IF NOT EXISTS idx_appointments_slot ON appointments(tenant_id, professional_id, date, status);

-- ============================================================================
-- 5. FINANCEIRO, PAGAMENTOS E DESPESAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_id VARCHAR(64) REFERENCES appointments(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method VARCHAR(32) NOT NULL CHECK (method IN ('pix', 'credit_card', 'debit_card', 'cash')),
    status VARCHAR(32) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'refunded')),
    pix_end_to_end_id VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL CHECK (type IN ('expense', 'commission', 'tax', 'rent')),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE,
    paid_date DATE,
    professional_id VARCHAR(64) REFERENCES professionals(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON expenses(tenant_id, due_date);

-- ============================================================================
-- 6. ESTOQUE E MOVIMENTAÇÃO DE MATERIAIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_items (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(32) NOT NULL DEFAULT 'un',
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(255),
    last_restocked_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    inventory_item_id VARCHAR(64) NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL CHECK (type IN ('in', 'out', 'consumption', 'loss')),
    quantity NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    appointment_id VARCHAR(64) REFERENCES appointments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. PACOTES E PROGRAMA DE FIDELIDADE
-- ============================================================================

CREATE TABLE IF NOT EXISTS packages (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    service_id VARCHAR(64) NOT NULL REFERENCES services(id),
    service_name VARCHAR(255) NOT NULL,
    total_sessions INT NOT NULL DEFAULT 4,
    price_total NUMERIC(10, 2) NOT NULL,
    validity_days INT NOT NULL DEFAULT 60,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS customer_packages (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    package_id VARCHAR(64) NOT NULL REFERENCES packages(id),
    package_name VARCHAR(255) NOT NULL,
    total_sessions INT NOT NULL,
    used_sessions INT NOT NULL DEFAULT 0,
    price_paid NUMERIC(10, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired'))
);

CREATE TABLE IF NOT EXISTS loyalty_accounts (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    current_points INT NOT NULL DEFAULT 0,
    total_earned INT NOT NULL DEFAULT 0,
    total_redeemed INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, customer_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points INT NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('credit', 'debit', 'reward_redemption')),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. PORTFÓLIO, REDES SOCIAIS E MARKETING
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_items (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    service_id VARCHAR(64) REFERENCES services(id) ON DELETE SET NULL,
    description TEXT,
    likes INT NOT NULL DEFAULT 0,
    published_to_portal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_connections (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(64) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'google_business', 'whatsapp_cloud')),
    account_name VARCHAR(255),
    account_id VARCHAR(255),
    access_token TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'needs_auth', 'action_required')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (tenant_id, platform)
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,
    caption TEXT NOT NULL,
    hashtags TEXT[],
    image_url TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    goal VARCHAR(100) NOT NULL,
    target_slots DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. ASSINATURAS SAAS, CONSUMO DE IA E AUDITORIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id VARCHAR(32) NOT NULL CHECK (plan_id IN ('free', 'start', 'pro', 'studio')),
    price_monthly NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled')),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_usage (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    model VARCHAR(64) NOT NULL DEFAULT 'gemini-3.8-flash',
    operation VARCHAR(64) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    response_tokens INT DEFAULT 0,
    cost_estimated_usd NUMERIC(10, 6) DEFAULT 0.000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    user_role VARCHAR(32),
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_time ON audit_logs(tenant_id, timestamp DESC);

-- ============================================================================
-- SCRIPT DE ROLLBACK INTEGRAL
-- ============================================================================
/*
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ai_usage CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS marketing_campaigns CASCADE;
DROP TABLE IF EXISTS scheduled_posts CASCADE;
DROP TABLE IF EXISTS social_connections CASCADE;
DROP TABLE IF EXISTS portfolio_items CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS loyalty_accounts CASCADE;
DROP TABLE IF EXISTS customer_packages CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS blocked_times CASCADE;
DROP TABLE IF EXISTS availability_rules CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS professionals CASCADE;
DROP TABLE IF EXISTS tenant_memberships CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
*/

-- R5.1 additions. This file is a schema for review/staging, not a production deployment.
CREATE TABLE IF NOT EXISTS physical_resources (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    capacity INT NOT NULL DEFAULT 1 CHECK (capacity > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS financial_transactions (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    type VARCHAR(32) NOT NULL CHECK (type IN ('income','expense','commission')),
    category VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    date DATE NOT NULL,
    due_date DATE,
    appointment_id VARCHAR(64) REFERENCES appointments(id),
    professional_id VARCHAR(64) REFERENCES professionals(id),
    payment_method VARCHAR(32),
    status VARCHAR(32) NOT NULL
);
CREATE TABLE IF NOT EXISTS waiting_list (
    raw_payload JSONB,
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    desired_date DATE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    notes TEXT,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS r51_snapshots (
    id VARCHAR(64) PRIMARY KEY,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS professionals_tenant_id_unique ON professionals(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS services_tenant_id_unique ON services(tenant_id,id);
CREATE TABLE IF NOT EXISTS professional_services (
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    professional_id VARCHAR(64) NOT NULL,
    service_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (tenant_id,professional_id,service_id),
    FOREIGN KEY (tenant_id,professional_id) REFERENCES professionals(tenant_id,id),
    FOREIGN KEY (tenant_id,service_id) REFERENCES services(tenant_id,id)
);

-- Additive changes for an existing R4 schema. No customer records are deleted.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_segment VARCHAR(32) NOT NULL DEFAULT 'nails';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_plan_id_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_id_check CHECK(plan_id IN ('free','start','pro','studio'));
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_check CHECK(plan_id IN ('free','start','pro','studio'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE tenant_memberships ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE availability_rules ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE blocked_times ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE customer_packages ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE loyalty_accounts ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE loyalty_transactions ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE physical_resources ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS raw_payload JSONB;
