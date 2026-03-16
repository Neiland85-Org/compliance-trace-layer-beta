-- Compliance Trace Layer Database Schema
-- PostgreSQL 16 compatible

-- ===========================================
-- TABLES
-- ===========================================

-- Traces table (migrated from mockDB)
CREATE TABLE IF NOT EXISTS traces (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'verified',
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cookie consent table (GDPR compliant)
CREATE TABLE IF NOT EXISTS cookie_consents (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    consent_version VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    consent_given BOOLEAN NOT NULL,
    preferences JSONB NOT NULL,
    third_party_vendors JSONB,
    expires_at TIMESTAMP NOT NULL,
    withdrawn_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cookie categories catalog
CREATE TABLE IF NOT EXISTS cookie_categories (
    id SERIAL PRIMARY KEY,
    category_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_necessary BOOLEAN NOT NULL DEFAULT false,
    default_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cookie vendors catalog
CREATE TABLE IF NOT EXISTS cookie_vendors (
    id SERIAL PRIMARY KEY,
    vendor_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    privacy_policy_url TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES cookie_categories(id) ON DELETE CASCADE,
    cookies_set JSONB,
    retention_period VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

-- Traces indexes
CREATE INDEX IF NOT EXISTS idx_traces_transaction_id ON traces(transaction_id);
CREATE INDEX IF NOT EXISTS idx_traces_hash ON traces(hash);
CREATE INDEX IF NOT EXISTS idx_traces_timestamp ON traces(timestamp);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);

-- Cookie consents indexes
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_timestamp ON cookie_consents(timestamp);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_consent_given ON cookie_consents(consent_given);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_expires_at ON cookie_consents(expires_at);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_consent_version ON cookie_consents(user_id, consent_version);

-- Cookie categories indexes
CREATE INDEX IF NOT EXISTS idx_cookie_categories_category_key ON cookie_categories(category_key);
CREATE INDEX IF NOT EXISTS idx_cookie_categories_is_necessary ON cookie_categories(is_necessary);

-- Cookie vendors indexes
CREATE INDEX IF NOT EXISTS idx_cookie_vendors_vendor_key ON cookie_vendors(vendor_key);
CREATE INDEX IF NOT EXISTS idx_cookie_vendors_category_id ON cookie_vendors(category_id);

-- ===========================================
-- CONSTRAINTS
-- ===========================================

-- Check constraints for traces
ALTER TABLE traces ADD CONSTRAINT chk_traces_status
    CHECK (status IN ('verified', 'pending', 'failed'));

-- Check constraints for cookie_consents
ALTER TABLE cookie_consents ADD CONSTRAINT chk_cookie_consents_consent_version
    CHECK (consent_version ~ '^\d+\.\d+\.\d+$');

-- Unique constraint for user consent versioning
ALTER TABLE cookie_consents ADD CONSTRAINT uq_cookie_consents_user_version UNIQUE (user_id, consent_version);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Triggers for updated_at
CREATE TRIGGER update_traces_updated_at BEFORE UPDATE ON traces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cookie_consents_updated_at BEFORE UPDATE ON cookie_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cookie_categories_updated_at BEFORE UPDATE ON cookie_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cookie_vendors_updated_at BEFORE UPDATE ON cookie_vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- INITIAL DATA (SEED)
-- ===========================================

-- Cookie categories
INSERT INTO cookie_categories (category_key, name, description, is_necessary, default_enabled) VALUES
    ('necessary', 'Cookies Necesarias', 'Cookies esenciales para el funcionamiento básico del sitio web. No se pueden desactivar.', true, true),
    ('analytics', 'Cookies Analíticas', 'Nos ayudan a entender cómo los visitantes interactúan con el sitio web recopilando información de forma anónima.', false, false),
    ('advertising', 'Cookies Publicitarias', 'Se utilizan para mostrar anuncios relevantes basados en sus intereses y comportamiento de navegación.', false, false),
    ('personalization', 'Cookies de Personalización', 'Permiten recordar sus preferencias y personalizar su experiencia en el sitio web.', false, false)
ON CONFLICT (category_key) DO NOTHING;

-- Cookie vendors
INSERT INTO cookie_vendors (vendor_key, name, description, privacy_policy_url, category_id, cookies_set, retention_period) VALUES
    ('google-analytics', 'Google Analytics', 'Servicio de análisis web que rastrea y reporta el tráfico del sitio web.', 'https://policies.google.com/privacy', (SELECT id FROM cookie_categories WHERE category_key = 'analytics'), '["_ga", "_gid", "_gat", "_ga_*"]'::jsonb, '2 years'),
    ('facebook-pixel', 'Facebook Pixel', 'Herramienta de seguimiento de conversiones que permite medir la efectividad de los anuncios en Facebook.', 'https://www.facebook.com/privacy/policy', (SELECT id FROM cookie_categories WHERE category_key = 'advertising'), '["_fbp", "_fbc"]'::jsonb, '3 months'),
    ('google-ads', 'Google Ads', 'Plataforma de publicidad que utiliza cookies para mostrar anuncios relevantes y medir el rendimiento de las campañas.', 'https://policies.google.com/privacy', (SELECT id FROM cookie_categories WHERE category_key = 'advertising'), '["_gcl_au", "_gcl_aw", "_gac_*"]'::jsonb, '3 months')
ON CONFLICT (vendor_key) DO NOTHING;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE traces IS 'Tabla principal para almacenar transacciones de trazabilidad de carbono con hashes SHA-256';
COMMENT ON TABLE cookie_consents IS 'Tabla GDPR-compliant para almacenar consentimientos de cookies con auditoría completa';
COMMENT ON TABLE cookie_categories IS 'Catálogo de categorías de cookies según clasificación GDPR';
COMMENT ON TABLE cookie_vendors IS 'Catálogo de proveedores terceros de cookies con información de retención';

COMMENT ON COLUMN traces.transaction_id IS 'ID único de la transacción de carbono';
COMMENT ON COLUMN traces.hash IS 'Hash SHA-256 de la transacción para integridad';
COMMENT ON COLUMN traces.metadata IS 'Datos adicionales en formato JSON para extensibilidad futura';

COMMENT ON COLUMN cookie_consents.user_id IS 'UUID del usuario generado en frontend';
COMMENT ON COLUMN cookie_consents.preferences IS 'Objeto JSON con preferencias por categoría: {necessary: true, analytics: bool, advertising: bool, personalization: bool}';
COMMENT ON COLUMN cookie_consents.third_party_vendors IS 'Array de vendor_keys aceptados: ["google-analytics", "facebook-pixel"]';
COMMENT ON COLUMN cookie_consents.expires_at IS 'Fecha de expiración del consentimiento (GDPR recomienda máximo 12 meses)';
COMMENT ON COLUMN cookie_consents.withdrawn_at IS 'Timestamp cuando el usuario retiró el consentimiento (NULL si no retirado)';

COMMENT ON COLUMN cookie_categories.category_key IS 'Clave única para identificar la categoría (necessary, analytics, etc.)';
COMMENT ON COLUMN cookie_categories.is_necessary IS 'Si la categoría es necesaria (no puede ser rechazada)';

COMMENT ON COLUMN cookie_vendors.cookies_set IS 'Array JSON con nombres de cookies que establece este vendor';
COMMENT ON COLUMN cookie_vendors.retention_period IS 'Período de retención de las cookies (ej: "2 years", "3 months")';