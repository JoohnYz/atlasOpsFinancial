export type ExpenseCategory =
  | "aviation"
  | "fuel"
  | "vehicles"
  | "maintenance"
  | "office"
  | "travel"
  | "utilities"
  | "payroll"
  | "other"
  | string

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  vendor?: string
  notes?: string
  status?: string
  created_at: string
  updated_at?: string
  color?: string
  invoice_url?: string
  invoice_name?: string
}

export interface Income {
  id: string
  description: string
  amount: number
  category: string
  date: string
  client?: string
  notes?: string
  status?: string
  created_at: string
  updated_at?: string
  color?: string
  source?: string
}

export interface Staff {
  id: string
  name: string
  email: string
  role: string
  department: string
  salary: number
  status: "active" | "inactive" | "Activo" | "Inactivo" | string
  avatar?: string
  hire_date: string
}

export interface PayrollPayment {
  id: string
  staff_id: string
  staff_name?: string
  employee_name?: string
  amount: number
  net_salary?: number
  period: string
  date: string
  payment_date?: string
  department?: string
  status: "pending" | "paid" | "cancelled" | "Pendiente" | "Pagado" | "Cancelado" | string
  invoice_url?: string
  invoice_name?: string
}

export interface Category {
  id: string
  name: string
  emoji?: string
  color?: string
  type?: string
  is_custom?: boolean
  created_at?: string
}

export interface Authorization {
  id: string
  description: string
  amount: number
  date: string
  payment_method: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at?: string
  bank_name?: string
  phone_number?: string
  document_type?: string
  document_number?: string
  currency?: 'USD' | 'BS'
  account_number?: string
  email?: string
  category?: string
  created_by?: string
  is_rectified?: boolean
}

export interface UserPermission {
  id: string
  email: string
  access_income: boolean
  access_expenses: boolean
  access_staff: boolean
  access_payroll: boolean
  access_reports: boolean
  access_authorizations: boolean
  access_categories: boolean
  manage_authorizations: boolean
  assign_access: boolean
  created_at?: string
  updated_at?: string
}

export const categoryLabels: Record<ExpenseCategory, string> = {
  aviation: "Aviación",
  fuel: "Gasolina",
  vehicles: "Vehículos",
  maintenance: "Mantenimiento",
  office: "Oficina",
  travel: "Viajes",
  utilities: "Servicios",
  payroll: "Nómina",
  other: "Otros",
}

export const categoryEmojis: Record<ExpenseCategory, string> = {
  aviation: "✈️",
  fuel: "⛽",
  vehicles: "🚗",
  maintenance: "🔧",
  office: "🏢",
  travel: "🌍",
  utilities: "⚡",
  payroll: "💰",
  other: "📌",
}

export const categoryColors: Record<ExpenseCategory, string> = {
  aviation: "bg-purple-500",
  fuel: "bg-orange-500",
  vehicles: "bg-yellow-500",
  maintenance: "bg-blue-500",
  office: "bg-cyan-500",
  travel: "bg-pink-500",
  utilities: "bg-indigo-500",
  payroll: "bg-emerald-500",
  other: "bg-gray-500",
}

export function getEmojiFromText(text: string): string {
  const lowerText = text.toLowerCase()

  if (
    lowerText.includes("avión") ||
    lowerText.includes("aeronave") ||
    lowerText.includes("vuelo") ||
    lowerText.includes("piloto")
  )
    return "✈️"
  if (lowerText.includes("gasolina") || lowerText.includes("combustible") || lowerText.includes("fuel")) return "⛽"
  if (
    lowerText.includes("vehículo") ||
    lowerText.includes("carro") ||
    lowerText.includes("auto") ||
    lowerText.includes("camioneta") ||
    lowerText.includes("flotilla")
  )
    return "🚗"
  if (lowerText.includes("mantenimiento") || lowerText.includes("reparación") || lowerText.includes("servicio técnico"))
    return "🔧"
  if (lowerText.includes("oficina") || lowerText.includes("renta") || lowerText.includes("arrendamiento")) return "🏢"
  if (lowerText.includes("viaje") || lowerText.includes("hotel") || lowerText.includes("vuelos")) return "🌍"
  if (
    lowerText.includes("electricidad") ||
    lowerText.includes("agua") ||
    lowerText.includes("servicios") ||
    lowerText.includes("internet")
  )
    return "⚡"
  if (
    lowerText.includes("salario") ||
    lowerText.includes("nómina") ||
    lowerText.includes("pago") ||
    lowerText.includes("paya")
  )
    return "💰"

  return "📌"
}
