"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Income } from "@/lib/types"
import { Calendar, DollarSign, Tag, User, FileText, Trash2, Edit } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface IncomeDetailsModalProps {
    income: Income | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: (income: Income) => void
    onDelete: (id: string) => void
}

export function IncomeDetailsModal({
    income,
    open,
    onOpenChange,
    onEdit,
    onDelete,
}: IncomeDetailsModalProps) {
    if (!income) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        Detalles del Ingreso
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Información detallada de la transacción registrada.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> FECHA
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {format(new Date(income.date), "PPP", { locale: es })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> MONTO
                            </span>
                            <p className="text-lg text-emerald-500 font-bold">
                                ${income.amount.toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Tag className="w-3 h-3" /> CATEGORÍA
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {income.category}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> CLIENTE
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {income.client || "No especificado"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-border pt-4">
                        <span className="text-xs font-medium text-muted-foreground">DESCRIPCIÓN</span>
                        <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg border border-border/50">
                            {income.description}
                        </p>
                    </div>

                    {income.notes && (
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">NOTAS ADICIONALES</span>
                            <p className="text-sm text-muted-foreground italic">
                                "{income.notes}"
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                    <Button
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                            onDelete(income.id)
                            onOpenChange(false)
                        }}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => {
                            onEdit(income)
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
