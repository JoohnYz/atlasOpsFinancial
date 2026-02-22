"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, TrendingDown, PieChartIcon, BarChart3, FileBarChart, Download } from "lucide-react"
import {
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ExportPDFButton } from "@/components/export-pdf-button"
import type { Expense, Income, PayrollPayment } from "@/lib/types"

interface Category {
  id: string
  name: string
  color: string
  emoji?: string
}

// Default colors for categories that don't have one
const defaultColors = [
  "#8b5cf6", "#f97316", "#eab308", "#06b6d4", "#ec4899",
  "#6366f1", "#3b82f6", "#10b981", "#ef4444", "#a855f7"
]

// Helper function to group data by month
function groupByMonth(
  incomes: Income[],
  expenses: Expense[],
  payroll: PayrollPayment[]
) {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const data: Record<string, { ingresos: number; gastos: number; nomina: number }> = {}

  // Initialize all months with 0 values
  months.forEach(month => {
    data[month] = { ingresos: 0, gastos: 0, nomina: 0 }
  })

  incomes.forEach(inc => {
    const date = new Date(inc.date)
    const monthKey = months[date.getMonth()]
    if (monthKey) data[monthKey].ingresos += Number(inc.amount)
  })

  expenses.forEach(exp => {
    const date = new Date(exp.date)
    const monthKey = months[date.getMonth()]
    if (monthKey) data[monthKey].gastos += Number(exp.amount)
  })

  payroll.forEach(p => {
    const date = new Date(p.payment_date || p.date)
    const monthKey = months[date.getMonth()]
    if (monthKey) data[monthKey].nomina += Number(p.amount)
  })

  return months.map(month => ({
    name: month,
    ...data[month],
  }))
}

// Helper function to group payroll data by department
function groupByDepartment(payroll: PayrollPayment[]) {
  const departments = ['Ventas', 'Marketing', 'Finanzas', 'Operaciones', 'Otros']
  const data: Record<string, { salarios: number }> = {}

  payroll.forEach(p => {
    const dept = p.department || "Otros"
    if (!data[dept]) data[dept] = { salarios: 0 }
    data[dept].salarios += Number(p.net_salary || p.amount || 0)
  })

  return Object.entries(data).map(([name, values]) => ({
    name,
    ...values,
  }))
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("month")
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [payroll, setPayroll] = useState<PayrollPayment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        const [incomesRes, expensesRes, payrollRes, categoriesRes] = await Promise.all([
          supabase.from("income").select("*").order("date", { ascending: false }),
          supabase.from("expenses").select("*").order("date", { ascending: false }),
          supabase.from("payroll").select("*").order("payment_date", { ascending: false }),
          supabase.from("categories").select("id, name, color, emoji"),
        ])

        if (!incomesRes.error && incomesRes.data) {
          setIncomes(incomesRes.data)
        }
        if (!expensesRes.error && expensesRes.data) {
          setExpenses(expensesRes.data)
        }
        if (!payrollRes.error && payrollRes.data) {
          setPayroll(payrollRes.data.map(p => ({
            ...p,
            amount: p.net_salary || p.amount,
          })))
        }
        if (!categoriesRes.error && categoriesRes.data) {
          setCategories(categoriesRes.data)
        }

        // Calculate monthly data
        const mData = groupByMonth(incomesRes.data || [], expensesRes.data || [], payrollRes.data || [])
        setMonthlyData(mData)

        // Calculate department data
        const dData = groupByDepartment(payrollRes.data || [])
        setDepartmentData(dData)
      } catch (error) {
        console.error("[v0] Error fetching report data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const totalPayroll = payroll.filter((p) => p.status === "paid" || p.status === "Pagado").reduce((sum, p) => sum + Number(p.amount), 0)

  // Generate category data from expenses with dynamic colors and emojis
  const categoryData = Object.entries(
    expenses.reduce(
      (acc, exp) => {
        const cat = exp.category || "Otros"
        acc[cat] = (acc[cat] || 0) + Number(exp.amount)
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value], index) => {
    const categoryInfo = categories.find(c => c.name === name)
    return {
      name,
      value,
      emoji: categoryInfo?.emoji || "📁",
      color: defaultColors[index % defaultColors.length],
    }
  })
  const hasCategoryData = categoryData.length > 0
  const hasMonthlyData = monthlyData.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground mt-1">Analítica y reportes financieros</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
            </SelectContent>
          </Select>
          <ExportPDFButton
            incomes={incomes}
            expenses={expenses}
            payroll={payroll}
            companyName="AtlasOps Financial"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold text-emerald-500">${totalIncome.toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-2xl font-bold text-red-500">${totalExpenses.toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nómina</p>
                <p className="text-2xl font-bold text-blue-500">${totalPayroll.toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balance Neto</p>
                <p className="text-2xl font-bold text-primary">
                  ${(totalIncome - totalExpenses - totalPayroll).toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10">
                <PieChartIcon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="payroll">Nómina</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Flujo de Efectivo Mensual</CardTitle>
              <CardDescription className="text-muted-foreground">
                Comparativa de ingresos, gastos y nomina
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasMonthlyData ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNomina" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                        }}
                        labelStyle={{ color: "#1f2937" }}
                        formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, ""]}
                      />
                      <Area
                        type="monotone"
                        dataKey="ingresos"
                        stroke="#10b981"
                        fill="url(#colorIngresos)"
                        strokeWidth={2}
                        name="Ingresos"
                      />
                      <Area
                        type="monotone"
                        dataKey="gastos"
                        stroke="#ef4444"
                        fill="url(#colorGastos)"
                        strokeWidth={2}
                        name="Gastos"
                      />
                      <Area
                        type="monotone"
                        dataKey="nomina"
                        stroke="#3b82f6"
                        fill="url(#colorNomina)"
                        strokeWidth={2}
                        name="Nomina"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                  <FileBarChart className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Sin datos disponibles</p>
                  <p className="text-sm mt-1">Agrega ingresos, gastos o pagos de nomina para ver el flujo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {hasCategoryData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Distribucion por Categoria</CardTitle>
                  <CardDescription className="text-muted-foreground">Gastos agrupados por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                          }}
                          formatter={(value: any, name: any) => {
                            const cat = categoryData.find(c => c.name === name)
                            return [`$${Number(value || 0).toLocaleString()}`, `${cat?.emoji || "📁"} ${name || "Otros"}`]
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Desglose de Categorias</CardTitle>
                  <CardDescription className="text-muted-foreground">Detalle por categoria de gasto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.map((cat) => {
                      const total = categoryData.reduce((sum, c) => sum + c.value, 0)
                      const percentage = total > 0 ? ((cat.value / total) * 100).toFixed(1) : "0"
                      return (
                        <div key={cat.name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cat.emoji}</span>
                              <span className="text-foreground">{cat.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-foreground font-medium">${cat.value.toLocaleString()}</span>
                              <span className="text-muted-foreground ml-2">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <PieChartIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Sin gastos registrados</p>
                  <p className="text-sm mt-1">Agrega gastos para ver la distribucion por categoria</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Resumen de Nomina</CardTitle>
              <CardDescription className="text-muted-foreground">Pagos de nomina registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {payroll.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={payroll.slice(0, 10).map(p => ({
                        name: p.staff_name || p.employee_name || 'Empleado',
                        monto: Number(p.amount),
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                      <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                        }}
                        labelStyle={{ color: "#1f2937" }}
                        formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, "Monto"]}
                      />
                      <Bar dataKey="monto" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Sin pagos de nomina</p>
                  <p className="text-sm mt-1">Registra pagos de nomina para ver el resumen</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
