"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Expense } from "@/lib/types"
import { Calendar, DollarSign, Tag, ShoppingBag, FileText, Trash2, Edit } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ExpenseDetailsModalProps {
    expense: Expense | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: (expense: Expense) => void
    onDelete: (id: string) => void
}

export function ExpenseDetailsModal({
    expense,
    open,
    onOpenChange,
    onEdit,
    onDelete,
}: ExpenseDetailsModalProps) {
    if (!expense) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-500" />
                        Detalles del Gasto
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Información detallada del gasto registrado.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> FECHA
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {format(new Date(expense.date), "PPP", { locale: es })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1" title="Monto del gasto">
                                <DollarSign className="w-3 h-3" /> MONTO
                            </span>
                            <p className="text-lg text-red-500 font-bold">
                                ${expense.amount.toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Tag className="w-3 h-3" /> CATEGORÍA
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {expense.category}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" /> PROVEEDOR
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {expense.vendor || "No especificado"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-border pt-4">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Descripción</span>
                        <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg border border-border/50">
                            {expense.description}
                        </p>
                    </div>

                    {expense.notes && (
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase">Notas Adicionales</span>
                            <p className="text-sm text-muted-foreground italic bg-secondary/10 p-2 rounded border-l-2 border-primary/30">
                                "{expense.notes}"
                            </p>
                        </div>
                    )}

                    {expense.invoice_url && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <FileText className="w-5 h-5 text-primary" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">Factura Adjunta</p>
                                <p className="text-xs text-muted-foreground">Documento verificado</p>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <a href={expense.invoice_url} target="_blank" rel="noopener noreferrer">Ver</a>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                    <Button
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                            onDelete(expense.id)
                            onOpenChange(false)
                        }}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => {
                            onEdit(expense)
                            onOpenChange(false)
                        }}
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
