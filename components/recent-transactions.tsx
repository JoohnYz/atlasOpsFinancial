"use client"

import { ArrowUpRight, ArrowDownRight, ChevronRight, Receipt } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type: "income" | "expense"
  source?: string
  client?: string
  category?: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const hasTransactions = transactions.length > 0

  return (

    <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card h-full">
      <CardHeader className="pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold font-sans text-foreground">Ultimas Transacciones</CardTitle>
            <CardDescription className="text-muted-foreground text-base mt-2 font-medium">
              Movimientos recientes registrados
            </CardDescription>
          </div>
          {hasTransactions && (
            <Link href="/income">
              <Button
                variant="outline"
                className="w-full sm:w-auto gap-2 border-primary/30 hover:bg-primary/5 bg-transparent"
              >
                Ver todas
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasTransactions ? (
          <div className="space-y-3">
            {transactions.slice(0, 6).map((transaction, index) => (
              <div
                key={transaction.id || index}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 border border-border hover:border-muted-foreground/20"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${transaction.type === "income" ? "bg-emerald-100/50 dark:bg-emerald-900/20" : "bg-red-100/50 dark:bg-red-900/20"}`}>
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground font-sans">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.type === "income"
                        ? (transaction.source || transaction.client || "")
                        : (transaction.category || "")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold font-sans ${transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive dark:text-red-400"}`}
                  >
                    {transaction.type === "income" ? "+" : "-"}${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
            <Receipt className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Sin transacciones</p>
            <p className="text-sm mt-1">No hay movimientos registrados todavia</p>
            <div className="flex gap-3 mt-4">
              <Link href="/income">
                <Button variant="outline" size="sm" className="bg-transparent">
                  Agregar Ingreso
                </Button>
              </Link>
              <Link href="/expenses">
                <Button variant="outline" size="sm" className="bg-transparent">
                  Agregar Gasto
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
