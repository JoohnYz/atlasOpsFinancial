"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Staff, PayrollPayment } from "@/lib/types"
import { updatePayrollAction } from "@/lib/payroll-actions"
import { toast } from "sonner"

interface EditPayrollModalProps {
    payment: PayrollPayment | null
    staff: Staff[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onPayrollUpdated?: () => void
}

export function EditPayrollModal({ payment, staff, open, onOpenChange, onPayrollUpdated }: EditPayrollModalProps) {
    const [selectedStaff, setSelectedStaff] = useState("")
    const [amount, setAmount] = useState("")
    const [period, setPeriod] = useState("")
    const [date, setDate] = useState("")
    const [loading, setLoading] = useState(false)

    const activeStaff = staff.filter((s) => s.status === "active" || s.status === "Activo")

    // Populate form when payment changes
    useEffect(() => {
        if (payment) {
            setSelectedStaff(payment.staff_id || "")
            setAmount(payment.amount?.toString() || "")
            setPeriod(payment.period || "")
            setDate(payment.payment_date || payment.date || "")
        }
    }, [payment])

    const handleStaffChange = (staffId: string) => {
        setSelectedStaff(staffId)
        const employee = staff.find((s) => s.id === staffId)
        if (employee) {
            setAmount(employee.salary.toString())
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!payment) return

        if (!selectedStaff) {
            toast.error("Debe seleccionar un empleado.")
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

            const result = await updatePayrollAction(payment.id, {
                staff_id: selectedStaff,
                employee_name: employee?.name || "",
                amount: salaryAmount,
                period,
                date,
            })

            if (!result.success) {
                toast.error(result.error || "No se pudo actualizar el pago")
                return
            }

            toast.success("Pago de nómina actualizado correctamente")
            onOpenChange(false)
            onPayrollUpdated?.()
        } catch (error: any) {
            console.error("[v0] Error updating payroll:", error)
            toast.error(error.message || "Ocurrió un error inesperado")
        } finally {
            setLoading(false)
        }
    }

    const currentYear = new Date().getFullYear()
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ]
    const periods = months.map((m) => `${m} ${currentYear}`)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-primary" />
                        Editar Pago de Nómina
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modifica los datos del pago de nómina.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-staff" className="text-foreground">
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
                            <Label htmlFor="edit-period" className="text-foreground">
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
                            <Label htmlFor="edit-date" className="text-foreground">
                                Fecha de Pago
                            </Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-secondary border-border text-foreground"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-amount" className="text-foreground">
                            Monto
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                id="edit-amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7 bg-secondary border-border text-foreground"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border">
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
