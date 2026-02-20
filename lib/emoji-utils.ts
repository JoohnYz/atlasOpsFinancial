// Emoji detection based on category name keywords
const emojiKeywords: Record<string, string> = {
  // Transportation
  'aviación': '✈️',
  'avion': '✈️',
  'vuelo': '✈️',
  'aereo': '✈️',
  'gasolina': '⛽',
  'combustible': '⛽',
  'fuel': '⛽',
  'vehículo': '🚗',
  'vehiculo': '🚗',
  'carro': '🚗',
  'auto': '🚗',
  'coche': '🚗',
  'taxi': '🚕',
  'transporte': '🚌',
  'viaje': '🧳',
  'viajes': '🧳',
  
  // Office & Work
  'oficina': '🏢',
  'office': '🏢',
  'trabajo': '💼',
  'empresa': '🏛️',
  
  // Services
  'servicio': '⚡',
  'servicios': '⚡',
  'utilities': '⚡',
  'luz': '💡',
  'electricidad': '💡',
  'agua': '💧',
  'internet': '🌐',
  'telefono': '📱',
  'teléfono': '📱',
  
  // People & Payroll
  'nómina': '👥',
  'nomina': '👥',
  'payroll': '👥',
  'empleado': '👤',
  'personal': '👤',
  'salario': '💰',
  
  // Maintenance
  'mantenimiento': '🔧',
  'reparación': '🔧',
  'reparacion': '🔧',
  'maintenance': '🔧',
  
  // Food & Drinks
  'comida': '🍽️',
  'restaurante': '🍽️',
  'almuerzo': '🍽️',
  'cena': '🍽️',
  'café': '☕',
  'cafe': '☕',
  'pizza': '🍕',
  'bebida': '🥤',
  
  // Finance
  'banco': '🏦',
  'finanzas': '💵',
  'inversión': '📈',
  'inversion': '📈',
  'ahorro': '🏦',
  'impuesto': '📋',
  'impuestos': '📋',
  
  // Technology
  'tecnología': '💻',
  'tecnologia': '💻',
  'software': '💻',
  'hardware': '🖥️',
  'computadora': '🖥️',
  'equipo': '🖥️',
  
  // Health
  'salud': '🏥',
  'médico': '🏥',
  'medico': '🏥',
  'hospital': '🏥',
  'seguro': '🛡️',
  
  // Education
  'educación': '📚',
  'educacion': '📚',
  'capacitación': '📚',
  'capacitacion': '📚',
  'curso': '📚',
  'entrenamiento': '📚',
  
  // Marketing
  'marketing': '📣',
  'publicidad': '📣',
  'ventas': '💹',
  
  // Legal
  'legal': '⚖️',
  'abogado': '⚖️',
  'contrato': '📝',
  
  // Rent
  'renta': '🏠',
  'alquiler': '🏠',
  'arrendamiento': '🏠',
  
  // Other
  'otro': '📦',
  'otros': '📦',
  'misc': '📦',
  'general': '📦',
}

// Common emojis for category picker
export const categoryEmojis = [
  '✈️', '⛽', '🚗', '🚕', '🚌', '🧳', '🏢', '💼', '🏛️',
  '⚡', '💡', '💧', '🌐', '📱', '👥', '👤', '💰', '🔧',
  '🍽️', '☕', '🍕', '🥤', '🏦', '💵', '📈', '📋', '💻',
  '🖥️', '🏥', '🛡️', '📚', '📣', '💹', '⚖️', '📝', '🏠',
  '📦', '🎯', '🎨', '🎬', '🎵', '🎮', '📷', '🔒', '⭐',
]

// Emoji options for Select dropdown
export const EMOJI_OPTIONS = [
  { emoji: '✈️', label: 'Aviacion' },
  { emoji: '⛽', label: 'Gasolina' },
  { emoji: '🚗', label: 'Vehiculos' },
  { emoji: '🚕', label: 'Taxi' },
  { emoji: '🧳', label: 'Viajes' },
  { emoji: '🏢', label: 'Oficina' },
  { emoji: '💼', label: 'Trabajo' },
  { emoji: '⚡', label: 'Servicios' },
  { emoji: '💡', label: 'Electricidad' },
  { emoji: '💧', label: 'Agua' },
  { emoji: '🌐', label: 'Internet' },
  { emoji: '📱', label: 'Telefono' },
  { emoji: '👥', label: 'Nomina' },
  { emoji: '💰', label: 'Dinero' },
  { emoji: '🔧', label: 'Mantenimiento' },
  { emoji: '🍽️', label: 'Comida' },
  { emoji: '☕', label: 'Cafe' },
  { emoji: '🏦', label: 'Banco' },
  { emoji: '💵', label: 'Finanzas' },
  { emoji: '📈', label: 'Inversiones' },
  { emoji: '💻', label: 'Tecnologia' },
  { emoji: '🏥', label: 'Salud' },
  { emoji: '📚', label: 'Educacion' },
  { emoji: '📣', label: 'Marketing' },
  { emoji: '⚖️', label: 'Legal' },
  { emoji: '🏠', label: 'Renta' },
  { emoji: '📦', label: 'Otros' },
  { emoji: '🎯', label: 'Objetivo' },
  { emoji: '🛒', label: 'Compras' },
  { emoji: '🎨', label: 'Diseño' },
]

export function getEmojiFromText(text: string): string {
  const lowerText = text.toLowerCase().trim()
  
  // Check for exact matches first
  if (emojiKeywords[lowerText]) {
    return emojiKeywords[lowerText]
  }
  
  // Check for partial matches
  for (const [keyword, emoji] of Object.entries(emojiKeywords)) {
    if (lowerText.includes(keyword) || keyword.includes(lowerText)) {
      return emoji
    }
  }
  
  // Default emoji
  return '📦'
}

export function isEmoji(str: string): boolean {
  const emojiRegex = /\p{Emoji}/u
  return emojiRegex.test(str)
}

// Alias for detectEmoji
export const detectEmoji = getEmojiFromText
