import { createClient as createServerClient } from "@/lib/supabase/server"
import type { Expense, Income, Staff, PayrollPayment, Category, PaymentOrder, Bank } from "./types"

export async function getPaymentOrders(): Promise<PaymentOrder[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("payment_orders").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Error fetching payment orders:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPaymentOrders:", error)
    return []
  }
}

export async function getIncomes(): Promise<Income[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("income").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Error fetching incomes:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getIncomes:", error)
    return []
  }
}

export async function getExpenses(): Promise<Expense[]> {
  try {
    const supabase = await createServerClient()

    // Fetch expenses and categories separately
    const [expensesResult, categoriesResult] = await Promise.all([
      supabase.from("expenses").select("*").order("date", { ascending: false }),
      supabase.from("categories").select("*"),
    ])

    if (expensesResult.error) {
      console.error("Error fetching expenses:", expensesResult.error.message)
      return []
    }

    const expenses = expensesResult.data || []
    const categories = categoriesResult.data || []

    // Create a map of category names to colors
    const categoryColorMap = new Map(categories.map((cat) => [cat.name, cat.color]))

    // Add colors to expenses
    return expenses.map((exp) => ({
      ...exp,
      color: categoryColorMap.get(exp.category) || '#6B7280',
    }))
  } catch (error) {
    console.error("Error in getExpenses:", error)
    return []
  }
}

export async function getStaff(): Promise<Staff[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("employees").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching staff:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getStaff:", error)
    return []
  }
}

export async function getPayrollPayments(): Promise<PayrollPayment[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("payroll")
      .select(`
        *,
        employees (name)
      `)
      .order("payment_date", { ascending: false })

    if (error) {
      console.error("Error fetching payroll:", error.message)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((payment) => ({
      ...payment,
      staff_name: payment.employees?.name || payment.employee_name,
      amount: payment.amount,
      date: payment.payment_date,
    }))
  } catch (error) {
    console.error("Error in getPayrollPayments:", error)
    return []
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching categories:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error in getCategories:", error)
    return []
  }
}


export async function getBanks(): Promise<Bank[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("banks").select("*").order("bank_name", { ascending: true })

    if (error) {
      console.error("Error fetching banks:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getBanks:", error)
    return []
  }
}

export async function calculateMonthlyBalance() {
  console.log("[v0] calculateMonthlyBalance started")
  const incomes = await getIncomes()
  const expenses = await getExpenses()
  const payroll = await getPayrollPayments()

  const sumIncomes = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0)
  const sumExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  console.log(`[v0] Data fetched: incomes=${incomes.length} ($${sumIncomes}), expenses=${expenses.length} ($${sumExpenses}), payroll=${payroll.length}`)

  // Get current month dates
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Filter by current month
  const currentMonthIncomes = incomes.filter(inc => {
    const date = new Date(inc.date)
    return date >= currentMonthStart
  })
  const currentMonthExpenses = expenses.filter(exp => {
    const date = new Date(exp.date)
    return date >= currentMonthStart
  })
  const currentMonthPayroll = payroll.filter(p => {
    const date = new Date(p.payment_date || p.date)
    return date >= currentMonthStart && (p.status === "paid" || p.status === "Pagado")
  })

  // Filter by previous month
  const previousMonthIncomes = incomes.filter(inc => {
    const date = new Date(inc.date)
    return date >= previousMonthStart && date <= previousMonthEnd
  })
  const previousMonthExpenses = expenses.filter(exp => {
    const date = new Date(exp.date)
    return date >= previousMonthStart && date <= previousMonthEnd
  })
  const previousMonthPayroll = payroll.filter(p => {
    const date = new Date(p.payment_date || p.date)
    return date >= previousMonthStart && date <= previousMonthEnd && (p.status === "paid" || p.status === "Pagado")
  })

  // Calculate totals (all time for overview)
  const totalIncome = sumIncomes
  const totalExpenses = sumExpenses
  const totalPayroll = payroll.filter((p) => p.status === "paid" || p.status === "Pagado").reduce((sum, p) => sum + Number(p.amount), 0)
  const pendingPayrollCount = payroll.filter((p) => p.status === "pending" || p.status === "Pendiente").length

  // Calculate current month balance
  const currentMonthIncomeValue = currentMonthIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0)
  const currentMonthExpenseValue = currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const currentMonthPayrollValue = currentMonthPayroll.reduce((sum, p) => sum + Number(p.amount), 0)
  const currentBalance = currentMonthIncomeValue - currentMonthExpenseValue - currentMonthPayrollValue

  // Calculate previous month balance
  const previousMonthIncomeValue = previousMonthIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0)
  const previousMonthExpenseValue = previousMonthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  const previousMonthPayrollValue = previousMonthPayroll.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const previousBalance = previousMonthIncomeValue - previousMonthExpenseValue - previousMonthPayrollValue

  // Calculate percentage change
  let change = 0
  if (previousBalance !== 0) {
    change = ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100
  } else if (currentBalance > 0) {
    change = 100
  } else if (currentBalance < 0) {
    change = -100
  }

  const isIncrease = change >= 0

  return {
    balance: currentBalance || 0,
    overallBalance: (totalIncome || 0) - (totalExpenses || 0) - (totalPayroll || 0),
    percentageChange: isNaN(change) ? "0.0" : Math.abs(change).toFixed(1),
    isIncrease: isIncrease || false,
    totalIncome: totalIncome || 0,
    totalExpenses: totalExpenses || 0,
    totalPayroll: totalPayroll || 0,
    pendingPayrollCount: pendingPayrollCount || 0,
  }
}
