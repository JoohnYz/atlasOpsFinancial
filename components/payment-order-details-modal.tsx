"use client"

import { format } from "date-fns"
import { Check, X, Calendar, CreditCard, DollarSign, FileText, ShieldCheck, Download, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PaymentOrder } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface PaymentOrderDetailsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: PaymentOrder | null
    onApprove: (id: string) => void
    onReject: (id: string) => void
    onRectify?: (order: PaymentOrder) => void
    canManage: boolean
}

export function PaymentOrderDetailsModal({
    open,
    onOpenChange,
    order,
    onApprove,
    onReject,
    onRectify,
    canManage
}: PaymentOrderDetailsModalProps) {
    if (!order) return null

    const handleApprove = () => {
        onApprove(order.id)
        onOpenChange(false)
    }

    const handleReject = () => {
        onReject(order.id)
        onOpenChange(false)
    }

    const handleDownloadPDF = async () => {
        const { generatePaymentOrderPDF } = await import("@/lib/generate-payment-order-pdf")
        generatePaymentOrderPDF(order)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-full ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : order.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <DialogTitle>Detalles de la Orden de Pago</DialogTitle>
                    </div>
                    <DialogDescription>
                        Revisa la información completa de la orden antes de procesarla.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Fecha
                            </span>
                            <p className="text-sm font-semibold text-foreground">
                                {order.date.includes('T') ? format(new Date(order.date), "PPP") : order.date.split('-').reverse().join('/')}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                Estado Actual
                            </span>
                            <div>
                                {order.status === "approved" ? (
                                    <Badge className="bg-green-500">Aprobado</Badge>
                                ) : order.status === "rejected" ? (
                                    <Badge className="bg-red-500">Rechazado</Badge>
                                ) : (
                                    <Badge className="bg-orange-500">Pendiente</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> Descripción
                                </span>
                                {order.category && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                        {order.category}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                                {order.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/50 p-3 rounded-lg border border-border">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                    <CreditCard className="w-3 h-3" /> Método de Pago
                                </span>
                                <p className="text-sm font-semibold text-foreground">
                                    {order.payment_method}
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1">
                                    <DollarSign className="w-3 h-3" /> Monto
                                </span>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                    {order.currency === 'BS' ? 'Bs.' : '$'} {order.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {order.payment_method === 'Pago móvil' && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30 mt-2">
                                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-2">
                                    <FileText className="w-3 h-3" /> Detalles de Pago Móvil
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {order.bank_name && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground text-xs">Banco:</span>
                                            <p className="font-medium text-foreground">{order.bank_name}</p>
                                        </div>
                                    )}
                                    {order.phone_number && (
                                        <div>
                                            <span className="text-muted-foreground text-xs">Teléfono:</span>
                                            <p className="font-medium text-foreground">{order.phone_number}</p>
                                        </div>
                                    )}
                                    {order.document_number && (
                                        <div>
                                            <span className="text-muted-foreground text-xs">Documento:</span>
                                            <p className="font-medium text-foreground">
                                                {order.document_type}-{order.document_number}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {order.payment_method === 'Transferencia Bancaria' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 mt-2">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-2">
                                    <FileText className="w-3 h-3" /> Detalles de Transferencia
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {order.bank_name && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground text-xs">Banco:</span>
                                            <p className="font-medium text-foreground">{order.bank_name}</p>
                                        </div>
                                    )}
                                    {order.phone_number && (
                                        <div>
                                            <span className="text-muted-foreground text-xs">Teléfono:</span>
                                            <p className="font-medium text-foreground">{order.phone_number}</p>
                                        </div>
                                    )}
                                    {order.account_number && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground text-xs">Número de Cuenta:</span>
                                            <p className="font-medium text-foreground tracking-wider">{order.account_number}</p>
                                        </div>
                                    )}
                                    {order.document_number && (
                                        <div>
                                            <span className="text-muted-foreground text-xs">Documento:</span>
                                            <p className="font-medium text-foreground">
                                                {order.document_type}-{order.document_number}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    {order.status === 'pending' ? (
                        <>
                            <Button
                                variant="outline"
                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={handleReject}
                                disabled={!canManage}
                            >
                                <X className="mr-2 h-4 w-4" /> Rechazar Pago
                            </Button>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleApprove}
                                disabled={!canManage}
                            >
                                <Check className="mr-2 h-4 w-4" /> Autorizar Pago
                            </Button>
                        </>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                                Cerrar
                            </Button>
                            {order.status === 'rejected' && onRectify && (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => {
                                        onRectify(order)
                                        onOpenChange(false)
                                    }}
                                >
                                    <Pencil className="mr-2 h-4 w-4" /> Rectificar Pago
                                </Button>
                            )}
                            {order.status === 'approved' && (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={handleDownloadPDF}
                                >
                                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
                                </Button>
                            )}
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
