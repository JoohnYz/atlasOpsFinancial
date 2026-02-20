-- AtlasOps Financial - Consolidated Seed Data
-- Initial Setup and Sample Data

-- 1. CATEGORIES (with Emojis and Colors)
INSERT INTO categories (name, type, color, emoji, is_custom) VALUES
  ('Aviación', 'expense', '#3B82F6', '✈️', false),
  ('Gasolina', 'expense', '#F97316', '⛽', false),
  ('Vehículos', 'expense', '#EAB308', '🚗', false),
  ('Oficina', 'expense', '#06B6D4', '🏢', false),
  ('Mantenimiento', 'expense', '#8B5CF6', '🔧', false),
  ('Personal', 'expense', '#A855F7', '👤', false),
  ('Servicios', 'income', '#10B981', '💼', false),
  ('Rentas', 'income', '#6366F1', '💵', false),
  ('Cursos', 'income', '#EC4899', '🎓', false)
ON CONFLICT (id) DO NOTHING;

-- Update emojis for existing categories if any were created without them
UPDATE categories SET emoji = '✈️' WHERE emoji = '📁' AND (LOWER(name) LIKE '%aviación%' OR LOWER(name) LIKE '%avion%');
UPDATE categories SET emoji = '⛽' WHERE emoji = '📁' AND (LOWER(name) LIKE '%gasolina%' OR LOWER(name) LIKE '%combustible%');
UPDATE categories SET emoji = '🚗' WHERE emoji = '📁' AND (LOWER(name) LIKE '%vehículo%' OR LOWER(name) LIKE '%carro%');
UPDATE categories SET emoji = '🔧' WHERE emoji = '📁' AND (LOWER(name) LIKE '%mantenimiento%');
UPDATE categories SET emoji = '🏢' WHERE emoji = '📁' AND (LOWER(name) LIKE '%oficina%');

-- 2. EMPLOYEES
INSERT INTO employees (name, email, role, department, salary, hire_date, status) VALUES
  ('Carlos Mendoza', 'carlos@atlasops.com', 'Piloto Senior', 'Operaciones', 45000, '2022-03-15', 'active'),
  ('María González', 'maria@atlasops.com', 'Administradora', 'Administración', 35000, '2021-06-01', 'active'),
  ('Juan Pérez', 'juan@atlasops.com', 'Mecánico', 'Mantenimiento', 28000, '2023-01-10', 'active')
ON CONFLICT (email) DO NOTHING;

-- 3. USER PERMISSIONS

-- Ensure admin has all permissions (Targeted by email, won't affect auth)
INSERT INTO user_permissions (
    email, access_income, access_expenses, access_staff, access_payroll, 
    access_reports, access_authorizations, access_categories, 
    manage_authorizations, assign_access
)
VALUES (
    'admin@atlasops.com', true, true, true, true, true, true, true, true, true
)
ON CONFLICT (email) DO UPDATE SET 
    access_income = true, access_expenses = true, access_staff = true, 
    access_payroll = true, access_reports = true, access_authorizations = true, 
    access_categories = true, manage_authorizations = true, assign_access = true;

-- Sample Users
INSERT INTO user_permissions (
    email, access_income, access_expenses, access_staff, access_payroll, 
    access_reports, access_authorizations, access_categories, 
    manage_authorizations, assign_access
)
VALUES 
  ('usuario1@gmail.com', true, true, true, true, true, true, true, true, true),
  ('usuario2@gmail.com', true, true, false, false, true, true, true, false, false)
ON CONFLICT (email) DO NOTHING;

-- 4. SAMPLE TRANSACTIONS (Optional / Contextual)
INSERT INTO income (description, amount, category, client, date) VALUES
  ('Servicio de vuelo charter', 150000, 'Servicios', 'Cliente Corporativo A', '2025-02-15'),
  ('Renta de aeronave', 85000, 'Rentas', 'Empresa XYZ', '2025-02-10')
ON CONFLICT DO NOTHING;

INSERT INTO expenses (description, amount, category, date) VALUES
  ('Combustible aeronave N-4521', 15000, 'Aviación', '2025-02-14'),
  ('Renta de oficina mensual', 25000, 'Oficina', '2025-02-12')
ON CONFLICT DO NOTHING;
