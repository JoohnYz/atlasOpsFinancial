"use client"

import { useState, useEffect } from "react"
import { Search, MoreHorizontal, Mail, Calendar, DollarSign, User, Trash2, Phone, Building } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CRMLayout } from "@/components/crm-layout"
import { AddStaffModal } from "@/components/add-staff-modal"
import { createClient } from "@/lib/supabase/client"
import { PermissionGuard } from "@/components/permission-guard"
import type { Staff, PayrollPayment } from "@/lib/types"

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<PayrollPayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchStaff = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("employees").select("*").order("name", { ascending: true })

      if (error) {
        console.error("Error fetching staff:", error.message)
        setStaff([])
      } else {
        setStaff(data || [])
      }
    } catch (error) {
      console.error("Error in fetchStaff:", error)
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("employees")
        .update({ status: "Inactivo" })
        .eq("id", id)

      if (error) {
        console.error("Error deactivating employee:", error.message)
        alert("Error al desactivar empleado: " + error.message)
      } else {
        fetchStaff()
      }
    } catch (error) {
      console.error("Error in handleDeactivate:", error)
      alert("Error al desactivar empleado")
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeCount = staff.filter((s) => s.status === "Activo" || s.status === "active").length
  const totalSalary = staff.filter((s) => s.status === "Activo" || s.status === "active").reduce((sum, s) => sum + Number(s.salary), 0)

  const handleViewProfile = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setShowProfileModal(true)
  }

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setShowEditModal(true)
  }

  const handlePaymentHistory = async (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setShowPaymentHistory(true)
    setLoadingPayments(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payroll")
        .select("*")
        .eq("employee_id", staffMember.id)
        .order("payment_date", { ascending: false })

      if (error) {
        console.error("Error fetching payment history:", error.message)
        setPaymentHistory([])
      } else {
        setPaymentHistory(data || [])
      }
    } catch (error) {
      console.error("Error in handlePaymentHistory:", error)
      setPaymentHistory([])
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleDeleteClick = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", selectedStaff.id)

      if (error) {
        console.error("Error deleting employee:", error.message)
        alert("Error al eliminar empleado: " + error.message)
      } else {
        setShowDeleteConfirm(false)
        setSelectedStaff(null)
        fetchStaff()
      }
    } catch (error) {
      console.error("Error in handleDeleteConfirm:", error)
      alert("Error al eliminar empleado")
    } finally {
      setDeleting(false)
    }
  }

  const handleStaffAdded = () => {
    fetchStaff()
    setShowEditModal(false)
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
    <PermissionGuard permission="access_staff">
      <CRMLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Personal</h1>
              <p className="text-muted-foreground mt-1">Gestiona el equipo de trabajo</p>
            </div>
            <AddStaffModal onStaffAdded={handleStaffAdded} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Empleados</p>
                    <p className="text-2xl font-bold text-foreground">{staff.length}</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {activeCount} activos
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Nomina Mensual</p>
                  <p className="text-2xl font-bold text-foreground">${totalSalary.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staffMember) => (
              <Card key={staffMember.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage
                          src={`/.jpg?height=48&width=48&query=${staffMember.name} professional`}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {staffMember.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{staffMember.name}</h3>
                        <p className="text-sm text-muted-foreground">{staffMember.role}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem
                          className="text-foreground cursor-pointer"
                          onClick={() => handleViewProfile(staffMember)}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-foreground cursor-pointer"
                          onClick={() => handleEdit(staffMember)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-foreground cursor-pointer"
                          onClick={() => handlePaymentHistory(staffMember)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Historial de pagos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive cursor-pointer"
                          onClick={() => handleDeleteClick(staffMember)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{staffMember.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground font-medium">
                        ${Number(staffMember.salary).toLocaleString()}/mes
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Desde {staffMember.hire_date}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <Badge
                      variant="secondary"
                      className={
                        staffMember.status === "Activo" || staffMember.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }
                    >
                      {staffMember.status === "Activo" || staffMember.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Perfil del Empleado</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {selectedStaff.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{selectedStaff.name}</h3>
                    <p className="text-muted-foreground">{selectedStaff.role}</p>
                    <Badge
                      variant="secondary"
                      className={
                        selectedStaff.status === "Activo" || selectedStaff.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500 mt-2"
                          : "bg-red-500/10 text-red-500 mt-2"
                      }
                    >
                      {selectedStaff.status === "Activo" || selectedStaff.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                    <p className="text-foreground">{selectedStaff.email}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <DollarSign className="w-4 h-4" />
                      Salario
                    </div>
                    <p className="text-foreground font-semibold">${Number(selectedStaff.salary).toLocaleString()}/mes</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      Fecha de ingreso
                    </div>
                    <p className="text-foreground">{selectedStaff.hire_date}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <AddStaffModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          editStaff={selectedStaff}
          mode="edit"
          onStaffAdded={handleStaffAdded}
        />

        {/* Payment History Modal */}
        <Dialog open={showPaymentHistory} onOpenChange={setShowPaymentHistory}>
          <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Historial de Pagos</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {selectedStaff?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {loadingPayments ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay pagos registrados para este empleado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{payment.period}</p>
                        <p className="text-sm text-muted-foreground">{payment.payment_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${Number(payment.net_salary || payment.amount || 0).toLocaleString()}</p>
                        <Badge
                          variant="secondary"
                          className={
                            payment.status === "Pagado" || payment.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : payment.status === "Pendiente" || payment.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-red-500/10 text-red-500"
                          }
                        >
                          {payment.status === "paid" ? "Pagado" : payment.status === "pending" ? "Pendiente" : payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Eliminar Empleado</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                ¿Estás seguro de que deseas eliminar a <strong>{selectedStaff?.name}</strong>? Esta acción no se puede deshacer y también eliminará su historial de pagos.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-transparent border-border"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CRMLayout>
    </PermissionGuard>
  )
}
