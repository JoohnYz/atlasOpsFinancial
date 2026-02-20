-- Insert sample categories
INSERT INTO categories (name, type, color) VALUES
  ('Aviación', 'expense', '#3B82F6'),
  ('Gasolina', 'expense', '#F97316'),
  ('Vehículos', 'expense', '#EAB308'),
  ('Oficina', 'expense', '#06B6D4'),
  ('Mantenimiento', 'expense', '#8B5CF6'),
  ('Servicios', 'income', '#10B981'),
  ('Rentas', 'income', '#6366F1'),
  ('Cursos', 'income', '#EC4899')
ON CONFLICT DO NOTHING;

-- Insert sample employees
INSERT INTO employees (name, email, role, department, salary, hire_date, status) VALUES
  ('Carlos Mendoza', 'carlos@atlasops.com', 'Piloto Senior', 'Operaciones', 45000, '2022-03-15', 'active'),
  ('María González', 'maria@atlasops.com', 'Administradora', 'Administración', 35000, '2021-06-01', 'active'),
  ('Juan Pérez', 'juan@atlasops.com', 'Mecánico', 'Mantenimiento', 28000, '2023-01-10', 'active'),
  ('Ana Rodríguez', 'ana@atlasops.com', 'Contadora', 'Finanzas', 32000, '2022-08-20', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample income
INSERT INTO income (description, amount, category, client, date) VALUES
  ('Servicio de vuelo charter', 150000, 'Servicios', 'Cliente Corporativo A', '2025-06-22'),
  ('Renta de aeronave', 85000, 'Rentas', 'Empresa XYZ', '2025-06-20'),
  ('Curso de pilotaje', 45000, 'Cursos', 'Academia de Aviación', '2025-06-18'),
  ('Servicio de mantenimiento', 35000, 'Servicios', 'Aerolínea Regional', '2025-06-15'),
  ('Vuelo ejecutivo', 120000, 'Servicios', 'Grupo Empresarial', '2025-06-10')
ON CONFLICT DO NOTHING;

-- Insert sample expenses
INSERT INTO expenses (description, amount, category, date) VALUES
  ('Combustible aeronave N-4521', 15000, 'Aviación', '2025-06-20'),
  ('Gasolina flotilla vehículos', 8500, 'Gasolina', '2025-06-19'),
  ('Mantenimiento camioneta Ford', 12000, 'Vehículos', '2025-06-18'),
  ('Renta de oficina mensual', 25000, 'Oficina', '2025-06-15'),
  ('Refacciones aeronave', 45000, 'Mantenimiento', '2025-06-12')
ON CONFLICT DO NOTHING;
