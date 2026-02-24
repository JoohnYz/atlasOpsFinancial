"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, DollarSign, Tag, User, ShoppingBag, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AmountTicker } from "@/components/ui/amount-ticker"

interface TransactionDetailsModalProps {
    transaction: {
        id: string
        description: string
        amount: number
        date: string
        type: "income" | "expense"
        source?: string
        client?: string
        category?: string
        vendor?: string
        notes?: string
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TransactionDetailsModal({
    transaction,
    open,
    onOpenChange,
}: TransactionDetailsModalProps) {
    if (!transaction) return null

    const isIncome = transaction.type === "income"
    const accentColor = isIncome ? "text-emerald-500" : "text-red-500"
    const bgColor = isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
    const Icon = isIncome ? ArrowUpRight : ArrowDownRight

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[500px] bg-card border-border rounded-xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${bgColor}`}>
                            <Icon className={`w-5 h-5 ${accentColor}`} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground font-sans">
                                Detalles de {isIncome ? "Ingreso" : "Gasto"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Información completa de la transacción.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                                <Calendar className="w-3 h-3" /> Fecha
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {format(new Date(transaction.date), "PPP", { locale: es })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                                <DollarSign className="w-3 h-3" /> Monto
                            </span>
                            <div className={`text-xl font-bold ${accentColor} font-sans`}>
                                <AmountTicker value={Number(transaction.amount)} prefix={isIncome ? "+$" : "-$"} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                                <Tag className="w-3 h-3" /> Categoría
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {transaction.category || "General"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                                {isIncome ? <User className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                                {isIncome ? "Cliente" : "Proveedor"}
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {transaction.client || transaction.source || transaction.vendor || "No especificado"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-border pt-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descripción</span>
                        <div className="mt-2 p-3 rounded-xl bg-secondary/30 border border-border/50">
                            <p className="text-sm text-foreground leading-relaxed">
                                {transaction.description}
                            </p>
                        </div>
                    </div>

                    {transaction.notes && (
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notas Adicionales</span>
                            <p className="text-sm text-muted-foreground italic mt-1 leading-relaxed">
                                "{transaction.notes}"
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                    >
                        Cerrar
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
