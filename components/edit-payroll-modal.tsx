"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Pencil, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
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
import { truncateFilename, cn } from "@/lib/utils"

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
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
    const [currentInvoiceUrl, setCurrentInvoiceUrl] = useState<string | null>(null)
    const [currentInvoiceName, setCurrentInvoiceName] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [loading, setLoading] = useState(false)

    const activeStaff = staff.filter((s) => s.status === "active" || s.status === "Activo")

    // Populate form when payment changes
    useEffect(() => {
        if (payment) {
            setSelectedStaff(payment.staff_id || "")
            setAmount(payment.amount?.toString() || "")
            setPeriod(payment.period || "")
            setDate(payment.payment_date || payment.date || "")
            setCurrentInvoiceUrl(payment.invoice_url || null)
            setCurrentInvoiceName(payment.invoice_name || null)
            setInvoiceFile(null)
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
            let invoiceUrl = currentInvoiceUrl || ""
            let invoiceName = currentInvoiceName || ""

            if (invoiceFile) {
                const supabase = createClient()
                const fileExt = invoiceFile.name.split('.').pop()
                const fileName = `${selectedStaff}-${Date.now()}.${fileExt}`
                const filePath = `payroll/${fileName}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('vouchers')
                    .upload(filePath, invoiceFile)

                if (uploadError) {
                    console.error("Error uploading file:", uploadError)
                    toast.error("Error al subir el comprobante. Verifique el bucket 'vouchers'.")
                    setLoading(false)
                    return
                }

                if (uploadData) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('vouchers')
                        .getPublicUrl(filePath)

                    invoiceUrl = publicUrl
                    invoiceName = invoiceFile.name
                }
            }

            const result = await updatePayrollAction(payment.id, {
                staff_id: selectedStaff,
                employee_name: employee?.name || "",
                amount: salaryAmount,
                period,
                date,
                invoice_url: invoiceUrl,
                invoice_name: invoiceName,
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

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragover") {
            setIsDragging(true)
        } else if (e.type === "dragleave") {
            setIsDragging(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setInvoiceFile(e.dataTransfer.files[0])
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
            <DialogContent className="w-[95vw] max-w-[500px] bg-card border-border overflow-y-auto max-h-[90vh]">
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

                    <div className="space-y-2">
                        <Label className="text-foreground">Comprobante (opcional)</Label>
                        {currentInvoiceUrl && !invoiceFile && (
                            <div className="flex items-center justify-between bg-primary/10 p-2 rounded-lg mb-2">
                                <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-primary" />
                                    <span className="text-sm text-foreground truncate max-w-[200px]" title={currentInvoiceName || ""}>
                                        {truncateFilename(currentInvoiceName || "Archivo actual", 20)}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setCurrentInvoiceUrl(null)
                                        setCurrentInvoiceName(null)
                                    }}
                                    className="text-destructive h-7 hover:bg-destructive/10"
                                >
                                    Eliminar
                                </Button>
                            </div>
                        )}
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                                isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            )}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                        >
                            {invoiceFile ? (
                                <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                                    <span className="text-sm text-foreground truncate" title={invoiceFile.name}>
                                        {truncateFilename(invoiceFile.name, 20)}
                                    </span>
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
                                        {currentInvoiceUrl ? "Reemplazar comprobante" : "Subir comprobante"} o <span className="text-primary">selecciona</span>
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
