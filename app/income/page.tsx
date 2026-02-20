"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Download, FileText, ArrowUpRight, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CRMLayout } from "@/components/crm-layout"
import { AddIncomeModal } from "@/components/add-income-modal"
import { IncomeDetailsModal } from "@/components/income-details-modal"
import { EditIncomeModal } from "@/components/edit-income-modal"
import { addIncome, deleteIncome, updateIncome } from "@/lib/data.client"
import type { Income } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { PermissionGuard } from "@/components/permission-guard"
import { toast } from "sonner"

export default function IncomePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [incomes, setIncomes] = useState<Income[]>([])

  useEffect(() => {
    fetchIncomes()
  }, [])

  const fetchIncomes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("income").select("*").order("date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching incomes:", error)
    } else {
      setIncomes(data || [])
    }
  }

  const filteredIncomes = incomes.filter(
    (income) =>
      income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (income.client && income.client.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  const thisMonthIncome = incomes
    .filter((inc) => new Date(inc.date).getMonth() === new Date().getMonth())
    .reduce((sum, inc) => sum + inc.amount, 0)

  const handleViewDetails = (income: Income) => {
    setSelectedIncome(income)
    setShowDetailsModal(true)
  }

  const handleEdit = (income: Income) => {
    setSelectedIncome(income)
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este ingreso?")) return
    try {
      await deleteIncome(id)
      toast.success("Ingreso eliminado correctamente")
      fetchIncomes()
    } catch (error) {
      console.error("[v0] Error deleting income:", error)
      toast.error("Error al eliminar el ingreso")
    }
  }

  const handleUpdate = async (id: string, data: Partial<Income>) => {
    try {
      await updateIncome(id, data as any)
      toast.success("Ingreso actualizado correctamente")
      fetchIncomes()
    } catch (error) {
      console.error("[v0] Error updating income:", error)
      toast.error("Error al actualizar el ingreso")
    }
  }

  const handleAddIncome = async (data: {
    description: string
    amount: number
    date: string
    category: string
    client?: string
    notes?: string
  }) => {
    try {
      await addIncome(data)
      fetchIncomes()
    } catch (error) {
      console.error("[v0] Error adding income:", error)
    }
  }

  return (
    <PermissionGuard permission="access_income">
      <CRMLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ingresos</h1>
              <p className="text-muted-foreground mt-1">Gestiona todos tus ingresos y facturas</p>
            </div>
            <AddIncomeModal onAdd={handleAddIncome} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-foreground">${totalIncome.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10">
                    <ArrowUpRight className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Este Mes</p>
                    <p className="text-2xl font-bold text-foreground">${thisMonthIncome.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transacciones</p>
                    <p className="text-2xl font-bold text-foreground">{incomes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-foreground">Historial de Ingresos</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Todos los ingresos registrados en el sistema
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar ingresos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64 bg-secondary border-border"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="border-border bg-transparent">
                    <Filter className="w-4 h-4" />
                  </Button>
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
                      <TableHead className="text-muted-foreground">Cliente</TableHead>
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                      <TableHead className="text-muted-foreground">Monto</TableHead>
                      <TableHead className="text-muted-foreground">Notas</TableHead>
                      <TableHead className="text-muted-foreground w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncomes.map((income) => (
                      <TableRow
                        key={income.id}
                        className="border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                        onClick={() => handleViewDetails(income)}
                      >
                        <TableCell className="font-medium text-foreground">{income.description}</TableCell>
                        <TableCell className="text-muted-foreground">{income.client || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{income.date}</TableCell>
                        <TableCell className="text-emerald-500 font-semibold">
                          +${income.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                          {income.notes || "-"}
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDetails(income)
                                }}
                              >
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-foreground cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(income)
                                }}
                              >
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(income.id)
                                }}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <IncomeDetailsModal
          income={selectedIncome}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <EditIncomeModal
          income={selectedIncome}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onUpdate={handleUpdate}
        />
      </CRMLayout>
    </PermissionGuard>
  )
}
