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
import { Income } from "@/lib/types"

interface EditIncomeModalProps {
    income: Income | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdate: (id: string, data: {
        description: string
        amount: number
        date: string
        category: string
        client?: string
        notes?: string
    }) => void
}

export function EditIncomeModal({ income, open, onOpenChange, onUpdate }: EditIncomeModalProps) {
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState("")
    const [client, setClient] = useState("")
    const [notes, setNotes] = useState("")
    const [category, setCategory] = useState("")

    useEffect(() => {
        if (income) {
            setDescription(income.description)
            setAmount(income.amount.toString())
            setDate(income.date)
            setClient(income.client || "")
            setNotes(income.notes || "")
            setCategory(income.category)
        }
    }, [income, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!income) return

        onUpdate(income.id, {
            description,
            amount: Number.parseFloat(amount),
            date,
            client,
            notes,
            category,
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Editar Ingreso</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modifica los detalles del ingreso seleccionado.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-description" className="text-foreground">
                            Descripción
                        </Label>
                        <Textarea
                            id="edit-description"
                            placeholder="Describe el ingreso..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-secondary border-border text-foreground"
                            required
                        />
                    </div>

                    <CategorySelect value={category} onChange={setCategory} label="Categoría de Ingreso" />

                    <div className="space-y-2">
                        <Label htmlFor="edit-client" className="text-foreground">
                            Cliente
                        </Label>
                        <Input
                            id="edit-client"
                            placeholder="Nombre del cliente"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
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

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border">
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
