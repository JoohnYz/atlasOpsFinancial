"use client"

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
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, PieChartIcon } from "lucide-react"

interface CategoryData {
  id: string
  category: string
  amount: number
  color: string
  emoji?: string
}

interface DashboardChartsProps {
  monthlyData: { name: string; ingresos: number; gastos: number }[]
  expensesByCategory: CategoryData[]
}

export function DashboardCharts({ monthlyData, expensesByCategory }: DashboardChartsProps) {
  const hasMonthlyData = monthlyData.length > 0
  const hasExpenseData = expensesByCategory.length > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-border shadow-sm hover:shadow-md transition-shadow bg-card">
        <CardHeader className="pb-6">
          <div>
            <CardTitle className="text-2xl font-bold font-sans text-foreground">Flujo de Efectivo</CardTitle>
            <CardDescription className="text-muted-foreground text-base mt-2 font-medium">
              Comparativa de ingresos vs gastos mensuales
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {hasMonthlyData ? (
            <div className="h-80 -mx-6 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={13} fontWeight={500} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={13} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    formatter={(value: any) => [`$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ""]}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10b981"
                    fill="url(#colorIngresos)"
                    strokeWidth={3}
                    name="Ingresos"
                  />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stroke="#ef4444"
                    fill="url(#colorGastos)"
                    strokeWidth={3}
                    name="Gastos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
              <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Sin datos disponibles</p>
              <p className="text-sm mt-1">Agrega ingresos y gastos para ver el flujo de efectivo</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
        <CardHeader className="pb-6">
          <div>
            <CardTitle className="text-2xl font-bold font-sans text-foreground">Gastos por Categoría</CardTitle>
            <CardDescription className="text-muted-foreground text-base mt-2 font-medium">Distribución del mes</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {hasExpenseData ? (
            <>
              <div className="h-64 -mx-6 flex justify-center min-h-[256px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        color: "hsl(var(--popover-foreground))",
                      }}
                      formatter={(value: any, name: any) => {
                        const cat = expensesByCategory.find(c => c.category === name)
                        return [`$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, `${cat?.emoji || ""} ${name || ""}`]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 space-y-3 px-2">
                {expensesByCategory.slice(0, 4).map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.emoji || "📁"}</span>
                      <span className="text-sm font-medium text-foreground">{cat.category}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <PieChartIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Sin gastos registrados</p>
              <p className="text-sm mt-1">Agrega gastos para ver la distribución</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
