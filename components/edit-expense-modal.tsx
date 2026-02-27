"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelect } from "@/components/category-select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Expense } from "@/lib/types"
import { Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn, truncateFilename } from "@/lib/utils"
import { toast } from "sonner"
import { recordFileUpload } from "@/lib/file-actions"

interface EditExpenseModalProps {
    expense: Expense | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdate: (id: string, data: {
        description: string
        amount: number
        date: string
        category: string
        vendor?: string
        notes?: string
        invoice_url?: string
        invoice_name?: string
    }) => void
}

export function EditExpenseModal({ expense, open, onOpenChange, onUpdate }: EditExpenseModalProps) {
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState("")
    const [vendor, setVendor] = useState("")
    const [notes, setNotes] = useState("")
    const [category, setCategory] = useState("")

    const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
    const [currentInvoiceUrl, setCurrentInvoiceUrl] = useState<string | null>(null)
    const [currentInvoiceName, setCurrentInvoiceName] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (expense) {
            setDescription(expense.description)
            setAmount(expense.amount.toString())
            setDate(expense.date)
            setVendor(expense.vendor || "")
            setNotes(expense.notes || "")
            setCategory(expense.category)
            setCurrentInvoiceUrl(expense.invoice_url || null)
            setCurrentInvoiceName(expense.invoice_name || null)
            setInvoiceFile(null)
        }
    }, [expense, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!expense) return

        setIsSubmitting(true)
        try {
            let invoiceUrl = currentInvoiceUrl || ""
            let invoiceName = currentInvoiceName || ""

            if (invoiceFile) {
                const supabase = createClient()
                const fileExt = invoiceFile.name.split('.').pop()
                const fileName = `expense-${Date.now()}.${fileExt}`
                const filePath = `expenses/${fileName}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('vouchers')
                    .upload(filePath, invoiceFile)

                if (uploadError) {
                    console.error("Error uploading file:", uploadError)
                    toast.error("Error al subir el comprobante. Verifique el bucket 'vouchers'.")
                    setIsSubmitting(false)
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

            const submittedVendor = vendor.trim() === "" ? "No especificado" : vendor.trim()

            const result = await onUpdate(expense.id, {
                description,
                amount: Number.parseFloat(amount),
                date,
                vendor: submittedVendor,
                notes,
                category,
                invoice_url: invoiceUrl,
                invoice_name: invoiceName,
            }) as unknown as { success: boolean, error?: string }

            if (result?.success) {
                if (invoiceFile && invoiceUrl) {
                    const userEmail = (await createClient().auth.getUser()).data.user?.email || "unknown@atlasops.com"
                    await recordFileUpload({
                        file_name: invoiceName,
                        file_url: invoiceUrl,
                        bucket: "vouchers",
                        module: "expense",
                        transaction_id: expense.id,
                        uploaded_by: userEmail
                    })
                }
                onOpenChange(false)
            }
        } finally {
            setIsSubmitting(false)
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Editar Gasto</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modifica los detalles del gasto seleccionado.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-description" className="text-foreground">
                            Descripción
                        </Label>
                        <Textarea
                            id="edit-description"
                            placeholder="Describe el gasto..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-secondary border-border text-foreground"
                            required
                        />
                    </div>

                    <CategorySelect value={category} onChange={setCategory} label="Categoría de Gasto" />

                    <div className="space-y-2">
                        <Label htmlFor="edit-vendor" className="text-foreground">
                            Proveedor / Vendedor
                        </Label>
                        <Input
                            id="edit-vendor"
                            placeholder="Nombre del proveedor"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            className="bg-secondary border-border text-foreground"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            <Label htmlFor="edit-date" className="text-foreground">
                                Fecha
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
                        <Label htmlFor="edit-notes" className="text-foreground">
                            Notas
                        </Label>
                        <Textarea
                            id="edit-notes"
                            placeholder="Notas adicionales..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-secondary border-border text-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">Factura (opcional)</Label>
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
                                        disabled={isSubmitting}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label className="cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {currentInvoiceUrl ? "Reemplazar factura" : "Subir factura"} o <span className="text-primary">selecciona</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG hasta 10MB</p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                                        disabled={isSubmitting}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border" disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
