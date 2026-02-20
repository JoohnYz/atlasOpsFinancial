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

interface AddExpenseModalProps {
  onAdd?: (expense: {
    description: string
    amount: number
    category: string
    date: string
  }) => void
}

export function AddExpenseModal({ onAdd }: AddExpenseModalProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<string>("other")
  const [date, setDate] = useState("")
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd?.({
      description,
      amount: Number.parseFloat(amount),
      category,
      date,
    })
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setCategory("other")
    setDate("")
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
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
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

          <CategorySelect value={category} onChange={setCategory} />

          <div className="space-y-2">
            <Label className="text-foreground">Factura (opcional)</Label>
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
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Guardar Gasto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
