"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Staff } from "@/lib/types"
import { addPayrollAction } from "@/lib/payroll-actions"
import { toast } from "sonner"

interface PayrollModalProps {
  staff: Staff[]
  onPayrollAdded?: () => void
  onPay?: (payroll: { staffId: string; amount: number; period: string; date: string; invoiceName?: string }) => void
}

export function PayrollModal({ staff, onPayrollAdded, onPay }: PayrollModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState("")
  const [amount, setAmount] = useState("")
  const [period, setPeriod] = useState("")
  const [date, setDate] = useState("")
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

  const activeStaff = staff.filter((s) => s.status === "active" || s.status === "Activo")

  const handleStaffChange = (staffId: string) => {
    setSelectedStaff(staffId)
    const employee = staff.find((s) => s.id === staffId)
    if (employee) {
      setAmount(employee.salary.toString())
    }
  }

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStaff) {
      toast.error("Debe seleccionar un empleado antes de procesar el pago.")
      return
    }
    if (!period) {
      toast.error("Debe seleccionar el período de pago.")
      return
    }
    if (!date) {
      toast.error("Debe ingresar la fecha de pago.")
      return
    }
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error("Debe ingresar un monto válido mayor a 0.")
      return
    }

    setLoading(true)

    try {
      const employee = staff.find((s) => s.id === selectedStaff)
      const salaryAmount = Number.parseFloat(amount)

      const result = await addPayrollAction({
        staff_id: selectedStaff,
        employee_name: employee?.name || "",
        amount: salaryAmount,
        period,
        date,
        status: "Pendiente",
      })

      if (!result.success) {
        toast.error(result.error || "No se pudo registrar el pago")
        return
      }

      toast.success("Pago de nómina registrado correctamente")
      setOpen(false)
      resetForm()
      onPayrollAdded?.()
    } catch (error: any) {
      console.error("[v0] Error adding payroll:", error)
      toast.error(error.message || "Ocurrió un error inesperado al procesar el pago")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedStaff("")
    setAmount("")
    setPeriod("")
    setDate("")
    setInvoiceFile(null)
  }

  const currentYear = new Date().getFullYear()
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  const periods = months.map((m) => `${m} ${currentYear}`)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Wallet className="w-4 h-4 mr-2" />
          Realizar Pago
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Pago de Nómina</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Registra el pago de nómina para un empleado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="staff" className="text-foreground">
              Empleado
            </Label>
            <Select value={selectedStaff} onValueChange={handleStaffChange}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue placeholder="Seleccionar empleado" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {activeStaff.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id} className="text-foreground hover:bg-secondary">
                    {employee.name} - {employee.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period" className="text-foreground">
                Período
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {periods.map((p) => (
                    <SelectItem key={p} value={p} className="text-foreground hover:bg-secondary">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground">
                Fecha de Pago
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Monto
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 bg-secondary border-border text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Comprobante (opcional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              {invoiceFile ? (
                <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                  <span className="text-sm text-foreground truncate">{invoiceFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setInvoiceFile(null)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra un archivo o <span className="text-primary">selecciona</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG hasta 10MB</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
              {loading ? "Procesando..." : "Procesar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
