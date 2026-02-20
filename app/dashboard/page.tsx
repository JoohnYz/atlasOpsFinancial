import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { CRMLayout } from "@/components/crm-layout"
import { getExpenses, getIncomes, getStaff, calculateMonthlyBalance, getCategories, getAuthorizations } from "@/lib/data.server"
import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentTransactions } from "@/components/recent-transactions"
import { AuthorizationsWidget } from "@/components/authorizations-widget"
import { createClient } from "@/lib/supabase/server"
import { getUserPermissions } from "@/lib/permission-actions"

export const dynamic = "force-dynamic"

// Helper function to group data by month
function groupByMonth(items: { date: string; amount: number }[], type: 'income' | 'expense') {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const grouped: Record<string, number> = {}

  items.forEach(item => {
    const date = new Date(item.date)
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
    const monthName = months[date.getMonth()]
    grouped[monthName] = (grouped[monthName] || 0) + Number(item.amount)
  })

  return grouped
}

// Default colors for pie chart
const defaultColors = [
  "#8b5cf6", "#f97316", "#eab308", "#06b6d4", "#ec4899",
  "#6366f1", "#3b82f6", "#10b981", "#ef4444", "#a855f7"
]

// Helper function to group expenses by category
function groupExpensesByCategory(
  expenses: { category: string; amount: number }[],
  categories: { name: string; emoji?: string }[]
) {
  const grouped: Record<string, { amount: number }> = {}

  expenses.forEach(exp => {
    const category = exp.category || 'Otros'
    if (!grouped[category]) {
      grouped[category] = { amount: 0 }
    }
    grouped[category].amount += Number(exp.amount)
  })

  // Sort by amount in descending order
  return Object.entries(grouped)
    .map(([category, data], index) => {
      const catInfo = categories.find(c => c.name === category)
      return {
        id: category,
        category,
        amount: data.amount,
        color: defaultColors[index % defaultColors.length],
        emoji: catInfo?.emoji || "📁",
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

export default async function Dashboard() {
  const balanceData = await calculateMonthlyBalance()
  const { balance, percentageChange, isIncrease, totalIncome, totalExpenses, totalPayroll, pendingPayrollCount } = balanceData

  const expenses = await getExpenses()
  const incomes = await getIncomes()
  const staff = await getStaff()
  const categories = await getCategories()
  const authorizations = await getAuthorizations()

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  const permissions = user?.email ? await getUserPermissions(user.email) : null
  const canManageAuthorizations = user?.email === 'admin@atlasops.com' || (permissions?.manage_authorizations ?? false)

  const activeStaff = staff.filter((s) => s.status === "Activo" || s.status === "active").length
  const pendingPayroll = pendingPayrollCount;

  // Generate monthly data for chart from real data
  const incomeByMonth = groupByMonth(incomes, 'income')
  const expenseByMonth = groupByMonth(expenses, 'expense')

  const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])]
  const monthlyData = allMonths.length > 0
    ? allMonths.map(month => ({
      name: month,
      ingresos: incomeByMonth[month] || 0,
      gastos: expenseByMonth[month] || 0,
    }))
    : []

  // Group expenses by category for pie chart
  const expensesByCategory = groupExpensesByCategory(expenses, categories)

  const metrics = [
    {
      label: "Ingresos Totales",
      value: `$${totalIncome.toLocaleString()}`,
      change: incomes.length > 0 ? `${incomes.length} registros` : "Sin registros",
      trend: incomes.length > 0 ? "up" : "neutral",
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800/50",
      href: "/income",
      show: user?.email === 'admin@atlasops.com' || (permissions?.access_income ?? false),
    },
    {
      label: "Gastos Totales",
      value: `$${totalExpenses.toLocaleString()}`,
      change: expenses.length > 0 ? `${expenses.length} registros` : "Sin registros",
      trend: expenses.length > 0 ? "up" : "neutral",
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800/50",
      href: "/expenses",
      show: user?.email === 'admin@atlasops.com' || (permissions?.access_expenses ?? false),
    },
    {
      label: "Nomina Pagada",
      value: `$${totalPayroll.toLocaleString()}`,
      change: pendingPayrollCount > 0 ? `${pendingPayrollCount} pendientes` : "Al dia",
      trend: pendingPayrollCount > 0 ? "down" : "neutral",
      icon: Wallet,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800/50",
      href: "/payroll",
      show: user?.email === 'admin@atlasops.com' || (permissions?.access_payroll ?? false),
    },
    {
      label: "Personal Activo",
      value: activeStaff.toString(),
      change: staff.length > 0 ? `${staff.length} total` : "Sin personal",
      trend: staff.length > 0 ? "up" : "neutral",
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800/50",
      href: "/staff",
      show: user?.email === 'admin@atlasops.com' || (permissions?.access_staff ?? false),
    },
  ].filter(m => m.show)

  const canAccessIncomes = user?.email === 'admin@atlasops.com' || (permissions?.access_income ?? false)
  const canAccessExpenses = user?.email === 'admin@atlasops.com' || (permissions?.access_expenses ?? false)
  const canAccessAuthorizations = user?.email === 'admin@atlasops.com' || (permissions?.access_authorizations ?? false)
  const canAccessReports = user?.email === 'admin@atlasops.com' || (permissions?.access_reports ?? false)

  const recentTransactions = [
    ...(canAccessIncomes ? incomes : []).slice(0, 3).map((inc) => ({
      ...inc,
      type: "income" as const,
    })),
    ...(canAccessExpenses ? expenses : []).slice(0, 3).map((exp) => ({
      ...exp,
      type: "expense" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <CRMLayout balance={balance} percentageChange={percentageChange} isIncrease={isIncrease}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-foreground font-sans">Dashboard</h1>
          <p className="text-lg text-muted-foreground font-medium">Resumen financiero completo de tu empresa</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric, index) => (
            <Link key={index} href={metric.href}>
              <Card
                className={`${metric.bg} border-2 ${metric.borderColor} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-full`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${metric.bg} border ${metric.borderColor}`}>
                      <metric.icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${metric.trend === "up" ? "bg-emerald-100/50 text-emerald-700 dark:text-emerald-400" : metric.trend === "down" ? "bg-red-100/50 text-red-700 dark:text-red-400" : "bg-secondary text-muted-foreground"}`}
                    >
                      {metric.change}
                    </span>
                  </div>
                  <div>
                    <p className={`text-3xl font-bold font-sans ${metric.color}`}>{metric.value}</p>
                    <p className="text-sm text-muted-foreground font-medium mt-1">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {canAccessReports && (
          <Card className="border-0 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-blue-100 font-medium text-sm tracking-wide">BALANCE GENERAL</p>
                  <p className="text-5xl font-bold mt-3 font-sans">${balance.toLocaleString()}</p>
                  <p className="text-blue-100 mt-3 flex items-center gap-2 font-medium">
                    {isIncrease ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {isIncrease ? "+" : "-"}
                    {percentageChange}% comparado con el mes anterior
                  </p>
                </div>
                <div className="flex gap-8 md:gap-12">
                  <div className="text-center">
                    <p className="text-blue-100 text-sm font-medium">Ingresos</p>
                    <p className="text-3xl font-bold mt-2 font-sans">${(totalIncome / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="w-px bg-blue-400/30"></div>
                  <div className="text-center">
                    <p className="text-blue-100 text-sm font-medium">Egresos</p>
                    <p className="text-3xl font-bold mt-2 font-sans">
                      ${((totalExpenses + totalPayroll) / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(canAccessIncomes || canAccessExpenses) && (
          <DashboardCharts monthlyData={monthlyData} expensesByCategory={expensesByCategory} />
        )}

        <div className={`grid grid-cols-1 ${canAccessAuthorizations ? 'lg:grid-cols-3' : ''} gap-6`}>
          {(canAccessIncomes || canAccessExpenses) && (
            <div className={canAccessAuthorizations ? "lg:col-span-1" : "col-span-1"}>
              <RecentTransactions transactions={recentTransactions} />
            </div>
          )}
          {canAccessAuthorizations && (
            <div className="lg:col-span-2">
              <AuthorizationsWidget authorizations={authorizations} canManage={canManageAuthorizations} />
            </div>
          )}
        </div>

        {canAccessExpenses && expensesByCategory.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {expensesByCategory.slice(0, 4).map((cat) => (
              <Card
                key={cat.id}
                className="border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group bg-card border"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{cat.emoji}</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat.category}</p>
                  <p className="text-xl font-bold text-foreground font-sans mt-1">${cat.amount.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CRMLayout>
  )
}
