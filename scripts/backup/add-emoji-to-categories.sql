-- Add emoji column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '📁';

-- Update existing categories with default emojis based on name patterns
UPDATE categories SET emoji = '✈️' WHERE LOWER(name) LIKE '%aviación%' OR LOWER(name) LIKE '%avion%' OR LOWER(name) LIKE '%vuelo%';
UPDATE categories SET emoji = '⛽' WHERE LOWER(name) LIKE '%gasolina%' OR LOWER(name) LIKE '%combustible%' OR LOWER(name) LIKE '%fuel%';
UPDATE categories SET emoji = '🚗' WHERE LOWER(name) LIKE '%vehículo%' OR LOWER(name) LIKE '%vehiculo%' OR LOWER(name) LIKE '%auto%' OR LOWER(name) LIKE '%carro%';
UPDATE categories SET emoji = '🔧' WHERE LOWER(name) LIKE '%mantenimiento%' OR LOWER(name) LIKE '%reparación%';
UPDATE categories SET emoji = '🏢' WHERE LOWER(name) LIKE '%oficina%' OR LOWER(name) LIKE '%office%';
UPDATE categories SET emoji = '👤' WHERE LOWER(name) LIKE '%personal%';
UPDATE categories SET emoji = '🎓' WHERE LOWER(name) LIKE '%capacitación%' OR LOWER(name) LIKE '%training%';
UPDATE categories SET emoji = '🚕' WHERE LOWER(name) LIKE '%taxi%';
UPDATE categories SET emoji = '💼' WHERE LOWER(name) LIKE '%servicio%';
UPDATE categories SET emoji = '💵' WHERE LOWER(name) LIKE '%renta%' OR LOWER(name) LIKE '%alquiler%';
