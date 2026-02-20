// Client-side data functions - these use the browser Supabase client
// For server-side functions, use lib/data.server.ts

import { createClient } from "@/lib/supabase/client"

export async function addIncome(data: {
  description: string
  amount: number
  date: string
  category: string
  client?: string
  notes?: string
}) {
  const supabase = createClient()

  const { error } = await supabase.from("income").insert([
    {
      description: data.description,
      amount: data.amount,
      date: data.date,
      category: data.category,
      client: data.client,
      notes: data.notes,
    },
  ])

  if (error) {
    console.error("[v0] Error adding income:", error)
    throw error
  }
}

export async function addExpense(data: {
  description: string
  amount: number
  category: string
  date: string
  vendor?: string
  notes?: string
}) {
  const supabase = createClient()

  const { error } = await supabase.from("expenses").insert([
    {
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date,
      vendor: data.vendor,
      notes: data.notes,
    },
  ])

  if (error) {
    console.error("[v0] Error adding expense:", error)
    throw error
  }
}

export async function addStaff(data: {
  name: string
  email: string
  role: string
  department: string
  salary: number
  hire_date: string
  status?: "active" | "inactive"
}) {
  const supabase = createClient()

  const { error } = await supabase.from("employees").insert([
    {
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      salary: data.salary,
      hire_date: data.hire_date,
      status: data.status || "active",
    },
  ])

  if (error) {
    console.error("[v0] Error adding staff:", error)
    throw error
  }
}

export async function addPayrollPayment(data: {
  staff_id: string
  amount: number
  period: string
  date: string
  employee_name?: string
  status?: "Pendiente" | "Pagado" | "Cancelado"
  invoice_url?: string
  invoice_name?: string
}) {
  const supabase = createClient()

  const { error } = await supabase.from("payroll").insert([
    {
      staff_id: data.staff_id,
      employee_name: data.employee_name || "",
      amount: data.amount,
      net_salary: data.amount,
      period: data.period,
      payment_date: data.date,
      status: data.status || "Pendiente",
      invoice_url: data.invoice_url,
      invoice_name: data.invoice_name,
    },
  ])

  if (error) {
    console.error("[v0] Error adding payroll payment:", error)
    throw error
  }
}

export async function deleteIncome(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("income").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting income:", error)
    throw error
  }
}

export async function deleteExpense(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting expense:", error)
    throw error
  }
}

export async function deleteStaff(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("employees").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting staff:", error)
    throw error
  }
}

export async function updatePayrollStatus(id: string, status: "Pendiente" | "Pagado" | "Cancelado") {
  const supabase = createClient()

  const { error } = await supabase.from("payroll").update({ status }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating payroll status:", error)
    throw error
  }
}
export async function updateIncome(id: string, data: {
  description: string
  amount: number
  date: string
  category: string
  client?: string
  notes?: string
}) {
  const supabase = createClient()

  const { error } = await supabase.from("income").update({
    description: data.description,
    amount: data.amount,
    date: data.date,
    category: data.category,
    client: data.client,
    notes: data.notes,
  }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating income:", error)
    throw error
  }
}

export async function updateExpense(id: string, data: {
  description: string
  amount: number
  category: string
  date: string
  vendor?: string
  notes?: string
}) {
  const supabase = createClient()

  const { error } = await supabase.from("expenses").update({
    description: data.description,
    amount: data.amount,
    category: data.category,
    date: data.date,
    vendor: data.vendor,
    notes: data.notes,
  }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating expense:", error)
    throw error
  }
}
