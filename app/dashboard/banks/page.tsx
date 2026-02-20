"use client"

import { useState, useEffect } from "react"
import { Search, Landmark } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CRMLayout } from "@/components/crm-layout"
import { AddBankModal } from "@/components/add-bank-modal"
import { BankCard } from "@/components/bank-card"
import { PermissionGuard } from "@/components/permission-guard"
import { createClient } from "@/lib/supabase/client"
import { deleteBank } from "@/lib/bank-actions"
import type { Bank } from "@/lib/types"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function BanksPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [banks, setBanks] = useState<Bank[]>([])
    const [loading, setLoading] = useState(true)
    const [bankToEdit, setBankToEdit] = useState<Bank | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [bankToDelete, setBankToDelete] = useState<Bank | null>(null)

    const fetchBanks = async () => {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("banks")
                .select("*")
                .order("bank_name", { ascending: true })

            if (error) {
                console.error("Error fetching banks:", error.message)
                toast.error("Error al cargar bancos")
                setBanks([])
            } else {
                setBanks(data || [])
            }
        } catch (error) {
            console.error("Error in fetchBanks:", error)
            setBanks([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBanks()
    }, [])

    const handleEdit = (bank: Bank) => {
        setBankToEdit(bank)
        setModalOpen(true)
    }

    const handleDeleteClick = (bank: Bank) => {
        setBankToDelete(bank)
    }

    const confirmDelete = async () => {
        if (!bankToDelete) return

        try {
            const result = await deleteBank(bankToDelete.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Banco eliminado correctamente")
                fetchBanks()
            }
        } catch (error) {
            toast.error("Error inesperado al eliminar")
        } finally {
            setBankToDelete(null)
        }
    }

    const filteredBanks = banks.filter(
        (b) =>
            b.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.account_holder.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <CRMLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </CRMLayout>
        )
    }

    return (
        <PermissionGuard permission="access_banks">
            <CRMLayout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Bancos</h1>
                            <p className="text-muted-foreground mt-1">Registra y administra las cuentas bancarias</p>
                        </div>
                        <AddBankModal
                            onBankAdded={fetchBanks}
                            open={modalOpen}
                            onOpenChange={setModalOpen}
                            bankToEdit={bankToEdit}
                            mode={bankToEdit ? "edit" : "add"}
                        />
                    </div>

                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar banco o titular..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-secondary border-border"
                        />
                    </div>

                    {filteredBanks.length === 0 ? (
                        <div className="text-center py-20 bg-card border border-dashed rounded-xl border-border">
                            <Landmark className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                            <h3 className="text-lg font-medium text-foreground">No se encontraron cuentas</h3>
                            <p className="text-muted-foreground">Comienza agregando una nueva cuenta bancaria.</p>
                            <Button
                                variant="outline"
                                className="mt-4 border-border"
                                onClick={() => {
                                    setBankToEdit(null)
                                    setModalOpen(true)
                                }}
                            >
                                Registrar primer banco
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredBanks.map((bank) => (
                                <BankCard
                                    key={bank.id}
                                    bank={bank}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <AlertDialog open={!!bankToDelete} onOpenChange={(open) => !open && setBankToDelete(null)}>
                    <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground text-xl font-bold">¿Eliminar esta cuenta?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                                Esta acción eliminará permanentemente la información bancaria de <strong>{bankToDelete?.bank_name}</strong> ({bankToDelete?.account_holder}).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel className="border-border bg-transparent">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white border-0"
                            >
                                Eliminar Cuenta
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CRMLayout>
        </PermissionGuard>
    )
}
