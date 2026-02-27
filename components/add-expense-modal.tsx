"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CategorySelect } from "@/components/category-select"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { recordFileUpload } from "@/lib/file-actions"

interface AddExpenseModalProps {
  onAdd?: (expense: {
    description: string
    amount: number
    category: string
    date: string
    vendor?: string
    invoice_url?: string
    invoice_name?: string
  }) => void
}

export function AddExpenseModal({ onAdd }: AddExpenseModalProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<string>("other")
  const [date, setDate] = useState("")
  const [vendor, setVendor] = useState("")
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let invoiceUrl = ""
      let invoiceName = ""

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
          toast.error("Error al subir la factura.")
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

      const result = await onAdd?.({
        description,
        amount: Number.parseFloat(amount),
        category,
        date,
        vendor: submittedVendor,
        invoice_url: invoiceUrl,
        invoice_name: invoiceName,
      }) as unknown as { success: boolean, error?: string, data?: { id: string } }

      if (result?.success) {
        if (invoiceUrl && result.data?.id) {
          const userEmail = (await createClient().auth.getUser()).data.user?.email || "unknown@atlasops.com"
          await recordFileUpload({
            file_name: invoiceName,
            file_url: invoiceUrl,
            bucket: "vouchers",
            module: "expense",
            transaction_id: result.data.id,
            uploaded_by: userEmail
          })
        }
        setOpen(false)
        resetForm()
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

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setCategory("other")
    setDate("")
    setVendor("")
    setInvoiceFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Registrar Nuevo Gasto</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ingresa los detalles del gasto y adjunta la factura si es necesario.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Descripción
            </Label>
            <Textarea
              id="description"
              placeholder="Describe el gasto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border text-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="date" className="text-foreground">
                Fecha
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <CategorySelect value={category} onChange={setCategory} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor" className="text-foreground">
                Proveedor (opcional)
              </Label>
              <Input
                id="vendor"
                placeholder="No especificado"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Factura (opcional)</Label>
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
                    {invoiceFile.name}
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
                    Arrastra un archivo o <span className="text-primary">selecciona</span>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Gasto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
