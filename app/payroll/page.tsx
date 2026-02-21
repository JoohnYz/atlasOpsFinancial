"use client"

import { useState, useEffect } from "react"
import { Search, FileText, CheckCircle, Clock, XCircle, Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CRMLayout } from "@/components/crm-layout"
import { PayrollModal } from "@/components/payroll-modal"
import { PayrollDetailsModal } from "@/components/payroll-details-modal"
import { EditPayrollModal } from "@/components/edit-payroll-modal"
import { createClient } from "@/lib/supabase/client"
import { deletePayrollAction } from "@/lib/payroll-actions"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/permission-guard"
import type { PayrollPayment, Staff } from "@/lib/types"
import type { User as UserType } from "@supabase/supabase-js"

export default function PayrollPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [payments, setPayments] = useState<PayrollPayment[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<PayrollPayment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PayrollPayment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        // Fetch staff
        const { data: staffData, error: staffError } = await supabase
          .from("employees")
          .select("*")
          .order("name", { ascending: true })

        if (!staffError && staffData) {
          setStaff(staffData)
        }

        // Fetch current user
        try {
          const { data: authData } = await supabase.auth.getUser()
          if (authData?.user) {
            setCurrentUser(authData.user as unknown as UserType)
          }
        } catch (authCatch) {
          console.error("[Payroll] Error fetching user:", authCatch)
        }

        // Fetch payroll with employee names
        const { data: payrollData, error: payrollError } = await supabase
          .from("payroll")
          .select(`
            *,
            employees (name)
          `)
          .order("payment_date", { ascending: false })

        if (!payrollError && payrollData) {
          setPayments(
            payrollData.map((p) => ({
              ...p,
              staff_name: p.employees?.name || p.employee_name || "Desconocido",
              amount: p.amount,
              date: p.payment_date,
            })),
          )
        }
      } catch (error) {
        console.error("[v0] Error fetching payroll data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredPayments = payments.filter((payment) =>
    (payment.staff_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPaid = payments.filter((p) => p.status === "paid" || p.status === "Pagado").reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPending = payments.filter((p) => p.status === "pending" || p.status === "Pendiente").reduce((sum, p) => sum + Number(p.amount), 0)

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
    paid: {
      label: "Pagado",
      icon: CheckCircle,
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    Pagado: {
      label: "Pagado",
      icon: CheckCircle,
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    pending: {
      label: "Pendiente",
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    Pendiente: {
      label: "Pendiente",
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    cancelled: {
      label: "Cancelado",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    Cancelado: {
      label: "Cancelado",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  }

  const defaultStatus = {
    label: "Desconocido",
    icon: Clock,
    className: "bg-muted/10 text-muted-foreground border-muted/20",
  }

  const handleViewDetails = (payment: PayrollPayment) => {
    setSelectedPayment(payment)
    setShowDetailsModal(true)
  }

  const handleDownloadPDF = (payment: PayrollPayment) => {
    console.log("Descargar PDF:", payment.id)
  }

  const handleMarkPaid = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("payroll").update({ status: "Pagado" }).eq("id", id)

      if (!error) {
        setPayments(payments.map((p) => (p.id === id ? { ...p, status: "Pagado" } : p)))
        if (selectedPayment?.id === id) {
          setSelectedPayment({ ...selectedPayment, status: "Pagado" })
        }
      }
    } catch (error) {
      console.error("[v0] Error marking as paid:", error)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("payroll").update({ status: "Cancelado" }).eq("id", id)

      if (!error) {
        setPayments(payments.map((p) => (p.id === id ? { ...p, status: "Cancelado" } : p)))
        if (selectedPayment?.id === id) {
          setSelectedPayment({ ...selectedPayment, status: "Cancelado" })
        }
      }
    } catch (error) {
      console.error("[v0] Error cancelling payment:", error)
    }
  }

  const handleDelete = async (payment: PayrollPayment) => {
    const confirmed = window.confirm(
      `¿Está seguro de que desea eliminar el pago de nómina de ${payment.staff_name || payment.employee_name || "este empleado"} del período "${payment.period}"? Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    try {
      const result = await deletePayrollAction(payment.id)
      if (!result.success) {
        toast.error(result.error || "No se pudo eliminar el pago")
        return
      }
      setPayments(payments.filter((p) => p.id !== payment.id))
      toast.success("Pago de nómina eliminado correctamente")
    } catch (error: any) {
      console.error("[v0] Error deleting payroll:", error)
      toast.error("Ocurrió un error al eliminar el pago")
    }
  }

  const handleEdit = (payment: PayrollPayment) => {
    setEditingPayment(payment)
    setShowEditModal(true)
  }

  const handlePayrollAdded = () => {
    const supabase = createClient()
    supabase
      .from("payroll")
      .select(`*, employees (name)`)
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setPayments(
            data.map((p) => ({
              ...p,
              staff_name: p.employees?.name || "Desconocido",
            })),
          )
        }
      })
  }

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CRMLayout>
    )
  }

  return (
    <PermissionGuard permission="access_payroll">
      <CRMLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nómina</h1>
              <p className="text-muted-foreground mt-1">Gestiona los pagos de nómina del personal</p>
            </div>
            <PayrollModal staff={staff} onPayrollAdded={handlePayrollAdded} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pagado</p>
                    <p className="text-2xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-yellow-500/10">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendiente</p>
                    <p className="text-2xl font-bold text-foreground">${totalPending.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pagos Este Mes</p>
                    <p className="text-2xl font-bold text-foreground">{payments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-foreground">Historial de Pagos</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Registro de todos los pagos de nómina
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar empleado..."
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
                      <TableHead className="text-muted-foreground">Empleado</TableHead>
                      <TableHead className="text-muted-foreground">Período</TableHead>
                      <TableHead className="text-muted-foreground">Fecha de Pago</TableHead>
                      <TableHead className="text-muted-foreground">Monto</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-muted-foreground">Comprobante</TableHead>
                      <TableHead className="text-muted-foreground w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const status = statusConfig[payment.status] || defaultStatus
                      const StatusIcon = status.icon
                      return (
                        <TableRow key={payment.id} className="border-border hover:bg-secondary/30">
                          <TableCell className="font-medium text-foreground">{payment.staff_name}</TableCell>
                          <TableCell className="text-muted-foreground">{payment.period}</TableCell>
                          <TableCell className="text-muted-foreground">{payment.date}</TableCell>
                          <TableCell className="text-foreground font-semibold">
                            ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={status.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.invoice_url ? (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <FileText className="w-3 h-3 mr-1" />
                                Adjunto
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuItem
                                  className="text-foreground cursor-pointer"
                                  onClick={() => handleViewDetails(payment)}
                                >
                                  Ver detalles
                                </DropdownMenuItem>
                                {(payment.status === "pending" || payment.status === "Pendiente") && (
                                  <DropdownMenuItem
                                    className="text-foreground cursor-pointer"
                                    onClick={() => handleEdit(payment)}
                                  >
                                    <Pencil className="w-3.5 h-3.5 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {(payment.status === "pending" || payment.status === "Pendiente") && (
                                  <DropdownMenuItem
                                    className="text-emerald-500 cursor-pointer"
                                    onClick={() => handleMarkPaid(payment.id)}
                                  >
                                    Marcar como Pagado
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-foreground cursor-pointer"
                                  onClick={() => handleDownloadPDF(payment)}
                                >
                                  Descargar recibo
                                </DropdownMenuItem>
                                {(payment.status !== "cancelled" && payment.status !== "Cancelado") && (
                                  <DropdownMenuItem
                                    className="text-destructive cursor-pointer"
                                    onClick={() => handleCancel(payment.id)}
                                  >
                                    Cancelar Pago
                                  </DropdownMenuItem>
                                )}
                                {(payment.status === "pending" || payment.status === "Pendiente" || currentUser?.email === "admin@atlasops.com") && (
                                  <DropdownMenuItem
                                    className="text-destructive cursor-pointer"
                                    onClick={() => handleDelete(payment)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    Eliminar pago
                                  </DropdownMenuItem>
                                )}
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

        {/* Payroll Details Modal */}
        <PayrollDetailsModal
          payment={selectedPayment}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          onMarkPaid={handleMarkPaid}
          onCancel={handleCancel}
          onEdit={handleEdit}
        />

        {/* Edit Payroll Modal */}
        <EditPayrollModal
          payment={editingPayment}
          staff={staff}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onPayrollUpdated={handlePayrollAdded}
        />
      </CRMLayout>
    </PermissionGuard>
  )
}
