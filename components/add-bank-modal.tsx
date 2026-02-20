"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Bank } from "@/lib/types"
import { createBank, updateBank } from "@/lib/bank-actions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface AddBankModalProps {
    onBankAdded?: () => void
    bankToEdit?: Bank | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
    mode?: "add" | "edit"
}

export function AddBankModal({
    onBankAdded,
    bankToEdit,
    open: controlledOpen,
    onOpenChange,
    mode = "add"
}: AddBankModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [bankName, setBankName] = useState("")
    const [accountHolder, setAccountHolder] = useState("")
    const [documentType, setDocumentType] = useState("")
    const [documentNumber, setDocumentNumber] = useState("")
    const [email, setEmail] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const isEditMode = mode === "edit" || !!bankToEdit

    // Populate form when editing
    useEffect(() => {
        if (bankToEdit) {
            setBankName(bankToEdit.bank_name)
            setAccountHolder(bankToEdit.account_holder)
            setDocumentType(bankToEdit.document_type)
            setDocumentNumber(bankToEdit.document_number)
            setEmail(bankToEdit.email)
            setPhoneNumber(bankToEdit.phone_number)
        } else {
            resetForm()
        }
    }, [bankToEdit, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("bank_name", bankName)
            formData.append("account_holder", accountHolder)
            formData.append("document_type", documentType)
            formData.append("document_number", documentNumber)
            formData.append("email", email)
            formData.append("phone_number", phoneNumber)

            let result
            if (isEditMode && bankToEdit) {
                result = await updateBank(bankToEdit.id, formData)
            } else {
                result = await createBank(formData)
            }

            if (result.error) {
                setError(result.error)
                toast.error(result.error)
            } else {
                toast.success(isEditMode ? "Banco actualizado" : "Banco registrado")
                setOpen(false)
                resetForm()
                onBankAdded?.()
            }
        } catch (err: any) {
            const errorMessage = err.message || "Error al guardar banco"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setBankName("")
        setAccountHolder("")
        setDocumentType("")
        setDocumentNumber("")
        setEmail("")
        setPhoneNumber("")
        setError(null)
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen && !isControlled) {
            resetForm()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Cuenta
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {isEditMode ? "Editar Cuenta Bancaria" : "Registrar Nueva Cuenta"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isEditMode
                            ? "Modifica los datos de la cuenta bancaria."
                            : "Ingresa los datos para registrar una nueva cuenta bancaria."
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="bankName" className="text-foreground">
                            Nombre del banco
                        </Label>
                        <Input
                            id="bankName"
                            placeholder="Nombre del banco"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="bg-secondary border-border text-foreground"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountHolder" className="text-foreground">
                            Titular del banco
                        </Label>
                        <Input
                            id="accountHolder"
                            placeholder="Titular del banco"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                            className="bg-secondary border-border text-foreground"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="documentType" className="text-foreground">
                                Tipo de documento
                            </Label>
                            <Select
                                value={documentType}
                                onValueChange={setDocumentType}
                            >
                                <SelectTrigger id="documentType" className="bg-secondary border-border text-foreground">
                                    <SelectValue placeholder="Seleccione" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    <SelectItem value="V">V</SelectItem>
                                    <SelectItem value="E">E</SelectItem>
                                    <SelectItem value="J">J</SelectItem>
                                    <SelectItem value="G">G</SelectItem>
                                    <SelectItem value="R">R</SelectItem>
                                    <SelectItem value="P">P</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="documentNumber" className="text-foreground">
                                Número de documento
                            </Label>
                            <Input
                                id="documentNumber"
                                placeholder="Número de documento"
                                value={documentNumber}
                                onChange={(e) => setDocumentNumber(e.target.value)}
                                className="bg-secondary border-border text-foreground"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">
                            Correo electrónico
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-secondary border-border text-foreground"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-foreground">
                            Número de celular
                        </Label>
                        <Input
                            id="phoneNumber"
                            placeholder="Número de celular"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="bg-secondary border-border text-foreground"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border bg-transparent">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? "Guardando..." : isEditMode ? "Guardar Cambios" : "Agregar Cuenta"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
