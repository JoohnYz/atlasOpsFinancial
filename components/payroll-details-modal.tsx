"use client"

import { CheckCircle, Clock, XCircle, User, Calendar, DollarSign, Briefcase, FileText, Hash, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { PayrollPayment } from "@/lib/types"

interface PayrollDetailsModalProps {
    payment: PayrollPayment | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onMarkPaid?: (id: string) => void
    onCancel?: (id: string) => void
    onEdit?: (payment: PayrollPayment) => void
}

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

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "-"
    try {
        const date = new Date(dateStr + "T00:00:00")
        return date.toLocaleDateString("es-VE", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    } catch {
        return dateStr
    }
}

function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return "$0.00"
    return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function PayrollDetailsModal({ payment, open, onOpenChange, onMarkPaid, onCancel, onEdit }: PayrollDetailsModalProps) {
    if (!payment) return null

    const status = statusConfig[payment.status] || defaultStatus
    const StatusIcon = status.icon
    const isPending = payment.status === "pending" || payment.status === "Pendiente"
    const isCancelled = payment.status === "cancelled" || payment.status === "Cancelado"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[550px] bg-card border-border overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Detalles del Pago
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estado</span>
                        <Badge variant="secondary" className={`${status.className} text-sm px-3 py-1`}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                            {status.label}
                        </Badge>
                    </div>

                    <Separator className="bg-border" />

                    {/* Employee Info */}
                    <div className="space-y-4">
                        <DetailRow
                            icon={<User className="w-4 h-4 text-primary" />}
                            label="Empleado"
                            value={payment.staff_name || payment.employee_name || "Desconocido"}
                        />
                        <DetailRow
                            icon={<Hash className="w-4 h-4 text-primary" />}
                            label="ID de Empleado"
                            value={payment.staff_id}
                        />
                        {payment.department && (
                            <DetailRow
                                icon={<Briefcase className="w-4 h-4 text-primary" />}
                                label="Departamento"
                                value={payment.department}
                            />
                        )}
                    </div>

                    <Separator className="bg-border" />

                    {/* Payment Info */}
                    <div className="space-y-4">
                        <DetailRow
                            icon={<Calendar className="w-4 h-4 text-primary" />}
                            label="Período"
                            value={payment.period}
                        />
                        <DetailRow
                            icon={<Calendar className="w-4 h-4 text-primary" />}
                            label="Fecha de Pago"
                            value={formatDate(payment.payment_date || payment.date)}
                        />
                        <DetailRow
                            icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                            label="Monto Bruto"
                            value={formatCurrency(payment.amount)}
                            highlight
                        />
                        {payment.net_salary !== undefined && payment.net_salary !== payment.amount && (
                            <DetailRow
                                icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                                label="Salario Neto"
                                value={formatCurrency(payment.net_salary)}
                                highlight
                            />
                        )}
                    </div>

                    {/* Invoice */}
                    {payment.invoice_url && (
                        <>
                            <Separator className="bg-border" />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="text-sm text-muted-foreground">Comprobante</span>
                                </div>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                    <FileText className="w-3 h-3 mr-1" />
                                    {payment.invoice_name || "Adjunto"}
                                </Badge>
                            </div>
                        </>
                    )}

                    <Separator className="bg-border" />

                    {/* Actions */}
                    <div className="flex flex-wrap justify-end gap-3 pt-1">
                        {isPending && onCancel && (
                            <Button
                                variant="outline"
                                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                    onCancel(payment.id)
                                    onOpenChange(false)
                                }}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar Pago
                            </Button>
                        )}
                        {isPending && onEdit && (
                            <Button
                                variant="outline"
                                className="border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => {
                                    onOpenChange(false)
                                    onEdit(payment)
                                }}
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        )}
                        {isPending && onMarkPaid && (
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => {
                                    onMarkPaid(payment.id)
                                    onOpenChange(false)
                                }}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marcar como Pagado
                            </Button>
                        )}
                        {!isPending && (
                            <Button
                                variant="outline"
                                className="border-border"
                                onClick={() => onOpenChange(false)}
                            >
                                Cerrar
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function DetailRow({
    icon,
    label,
    value,
    highlight = false,
}: {
    icon: React.ReactNode
    label: string
    value: string
    highlight?: boolean
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="flex items-center gap-2 shrink-0">
                {icon}
                <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
            </div>
            <span className={`text-sm break-all text-right ${highlight ? "font-semibold text-foreground" : "text-foreground"}`}>
                {value}
            </span>
        </div>
    )
}
