"use client"

import type React from "react"
import type { ExpenseCategory } from "@/lib/types" // Import ExpenseCategory type

import { useState, useEffect } from "react"
import {
  Search,
  Download,
  FileText,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CRMLayout } from "@/components/crm-layout"
import { AddExpenseModal } from "@/components/add-expense-modal"
import { EditExpenseModal } from "@/components/edit-expense-modal"
import { ExpenseDetailsModal } from "@/components/expense-details-modal"
import { addExpense, deleteExpense, updateExpense } from "@/lib/data.client"
import type { Expense } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { PermissionGuard } from "@/components/permission-guard"
import { toast } from "sonner"

const renderCategoryBadge = (categoryName: string, categoryEmoji?: string) => {
  return (
    <Badge variant="secondary" className="bg-secondary">
      <span className="mr-1.5">{categoryEmoji || "📁"}</span>
      {categoryName}
    </Badge>
  )
}

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string; emoji?: string }>>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    // Fetch expenses and categories in parallel
    const [expensesResult, categoriesResult] = await Promise.all([
      supabase.from("expenses").select("*").order("date", { ascending: false }),
      supabase.from("categories").select("id, name, color, emoji").order("name", { ascending: true }),
    ])

    if (expensesResult.error) {
      console.error("[v0] Error fetching expenses:", expensesResult.error)
    } else {
      setExpenses(expensesResult.data || [])
    }

    if (categoriesResult.error) {
      console.error("[v0] Error fetching categories:", categoriesResult.error)
    } else {
      setCategories(categoriesResult.data || [])
    }

    setLoading(false)
  }

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Calculate expenses by category and sort by amount
  const expensesByCategory = expenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    },
    {} as Record<string, number>,
  )

  // Sort categories by total expenses (descending)
  const sortedCategories = categories
    .map(cat => ({
      ...cat,
      amount: expensesByCategory[cat.name] || 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const handleAddExpense = async (data: any) => {
    try {
      await addExpense(data)
      toast.success("Gasto agregado correctamente")
      fetchData()
    } catch (error) {
      console.error("[v0] Error adding expense:", error)
      toast.error("Error al agregar el gasto")
    }
  }

  const handleUpdateExpense = async (id: string, data: any) => {
    try {
      await updateExpense(id, data)
      toast.success("Gasto actualizado correctamente")
      fetchData()
    } catch (error) {
      console.error("[v0] Error updating expense:", error)
      toast.error("Error al actualizar el gasto")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id)
      toast.success("Gasto eliminado correctamente")
      fetchData()
    } catch (error) {
      console.error("[v0] Error deleting expense:", error)
      toast.error("Error al eliminar el gasto")
    }
  }

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setEditModalOpen(true)
  }

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense)
    setDetailsModalOpen(true)
  }

  return (
    <PermissionGuard permission="access_expenses">
      <CRMLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gastos</h1>
              <p className="text-muted-foreground mt-1">Administra y categoriza todos tus gastos</p>
            </div>
            <AddExpenseModal onAdd={handleAddExpense} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <Card
              className={`bg-card border-border cursor-pointer transition-all ${selectedCategory === "all" ? "border-primary ring-1 ring-primary" : "hover:border-primary/30"}`}
              onClick={() => setSelectedCategory("all")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ArrowDownRight className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-foreground">${totalExpenses.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {sortedCategories.slice(0, 4).map((cat) => (
              <Card
                key={cat.id}
                className={`bg-card border-border cursor-pointer transition-all ${selectedCategory === cat.name ? "border-primary ring-1 ring-primary" : "hover:border-primary/30"}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cat.emoji || "📁"}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">{cat.name}</p>
                      <p className="text-lg font-bold text-foreground">${cat.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedCategories.length > 4 && (
            <div className="flex flex-wrap gap-2">
              {sortedCategories.slice(4).map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className={`cursor-pointer py-2 px-3 ${selectedCategory === cat.name ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <span className="mr-1.5">{cat.emoji || "📁"}</span>
                  {cat.name}: ${cat.amount.toLocaleString()}
                </Badge>
              ))}
            </div>
          )}

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-foreground">
                    {selectedCategory === "all"
                      ? "Todos los Gastos"
                      : `Gastos de ${selectedCategory}`}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {filteredExpenses.length} transacciones encontradas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar gastos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64 bg-secondary border-border"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="border-border bg-transparent">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-muted-foreground">Descripción</TableHead>
                      <TableHead className="text-muted-foreground">Categoría</TableHead>
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                      <TableHead className="text-muted-foreground">Monto</TableHead>
                      <TableHead className="text-muted-foreground">Factura</TableHead>
                      <TableHead className="text-muted-foreground w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => {
                      const categoryData = categories.find(c => c.name === expense.category)
                      return (
                        <TableRow
                          key={expense.id}
                          className="border-border hover:bg-secondary/30 cursor-pointer"
                          onClick={() => handleViewDetails(expense)}
                        >
                          <TableCell className="font-medium text-foreground">{expense.description}</TableCell>
                          <TableCell>{renderCategoryBadge(expense.category, categoryData?.emoji)}</TableCell>
                          <TableCell className="text-muted-foreground">{expense.date}</TableCell>
                          <TableCell className="text-red-500 font-semibold">
                            -${expense.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {expense.invoice_url ? (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <FileText className="w-3 h-3 mr-1" />
                                Adjunta
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuItem
                                  className="text-foreground cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-foreground cursor-pointer"
                                  onClick={() => handleEdit(expense)}
                                >
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive cursor-pointer"
                                  onClick={() => handleDelete(expense.id)}
                                >
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <EditExpenseModal
          expense={selectedExpense}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUpdate={handleUpdateExpense}
        />

        <ExpenseDetailsModal
          expense={selectedExpense}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </CRMLayout>
    </PermissionGuard>
  )
}
