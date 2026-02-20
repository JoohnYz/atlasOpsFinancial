"use client"

import type React from "react"
import { useState } from "react"
import { Plus } from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"

interface AddIncomeModalProps {
  onAdd?: (income: {
    description: string
    amount: number
    date: string
    category: string
    client?: string
    notes?: string
  }) => void
}

export function AddIncomeModal({ onAdd }: AddIncomeModalProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [client, setClient] = useState("")
  const [notes, setNotes] = useState("")
  const [category, setCategory] = useState("") // Declare category and setCategory variables

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd?.({
      description,
      amount: Number.parseFloat(amount),
      date,
      client,
      notes,
      category, // Include category in the submitted data
    })
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setDate("")
    setClient("")
    setNotes("")
    setCategory("") // Reset category in the form
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ingreso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Registrar Nuevo Ingreso</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ingresa los detalles del ingreso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Descripción
            </Label>
            <Textarea
              id="description"
              placeholder="Describe el ingreso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border text-foreground"
              required
            />
          </div>

          <CategorySelect value={category} onChange={setCategory} label="Categoría de Ingreso" />

          <div className="space-y-2">
            <Label htmlFor="client" className="text-foreground">
              Cliente
            </Label>
            <Input
              id="client"
              placeholder="Nombre del cliente"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="bg-secondary border-border text-foreground"
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

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">
              Notas
            </Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Registrar Ingreso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
