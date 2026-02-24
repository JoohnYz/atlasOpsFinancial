"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Search, Building2, MapPin, Phone, Mail, User, Hash, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createBranchAction, updateBranchAction, deleteBranchAction } from "@/lib/branch-actions"
import type { Branch } from "@/lib/types"
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

interface BranchFormProps {
    formData: Partial<Branch>
    handleInputChange: (field: keyof Branch, value: string) => void
    loading: boolean
    isEditing: boolean
    handleUpdateBranch: () => Promise<void>
    handleAddBranch: () => Promise<void>
}

const BranchForm = ({
    formData,
    handleInputChange,
    loading,
    isEditing,
    handleUpdateBranch,
    handleAddBranch
}: BranchFormProps) => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground">Código <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="code" value={formData.code} onChange={(e) => handleInputChange("code", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: sucursal-001" />
                </div>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nombre <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: Sucursal Central" />
                </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Teléfono <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: +58 412 1234567" />
                </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="sucursal@empresa.com" />
                </div>
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
                <Label htmlFor="city" className="text-foreground">Ciudad <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: Caracas" />
                </div>
            </div>

            {/* Estado */}
            <div className="space-y-2">
                <Label htmlFor="state" className="text-foreground">Estado / Provincia <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="state" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: Miranda" />
                </div>
            </div>

            {/* País */}
            <div className="space-y-2">
                <Label htmlFor="country" className="text-foreground">País <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="country" value={formData.country} onChange={(e) => handleInputChange("country", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: Venezuela" />
                </div>
            </div>

            {/* Responsable */}
            <div className="space-y-2">
                <Label htmlFor="manager" className="text-foreground">Responsable <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="manager" value={formData.manager} onChange={(e) => handleInputChange("manager", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Nombre del gerente" />
                </div>
            </div>

            {/* Dirección */}
            <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="address" className="text-foreground">Dirección <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input id="address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} className="pl-9 py-2 min-h-[80px] bg-secondary border-border" placeholder="Dirección completa..." />
                </div>
            </div>
        </div>

        <Button
            onClick={isEditing ? handleUpdateBranch : handleAddBranch}
            disabled={loading}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
            {loading ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Agregar Sucursal")}
        </Button>
    </div>
)

export function BranchManagementSection({ branches, setBranches }: { branches: Branch[], setBranches: (branches: Branch[]) => void }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)

    // Form states
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
    const [formData, setFormData] = useState<Partial<Branch>>({
        code: "",
        name: "",
        address: "",
        city: "",
        state: "",
        country: "Venezuela",
        phone: "",
        email: "",
        manager: ""
    })

    const resetForm = () => {
        setFormData({
            code: "", name: "", address: "", city: "",
            state: "", country: "Venezuela", phone: "", email: "", manager: ""
        })
        setEditingBranch(null)
    }

    const handleInputChange = (field: keyof Branch, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const validateForm = () => {
        if (!formData.code?.trim() || !formData.name?.trim() || !formData.address?.trim() ||
            !formData.city?.trim() || !formData.state?.trim() || !formData.country?.trim() ||
            !formData.phone?.trim() || !formData.email?.trim() || !formData.manager?.trim()) {
            toast.error("Todos los campos marcados con * son obligatorios")
            return false
        }
        return true
    }

    const handleAddBranch = async () => {
        if (!validateForm()) return
        setLoading(true)

        const res = await createBranchAction(formData as Omit<Branch, "id" | "created_at" | "updated_at">)

        if (res.success && res.data) {
            toast.success("Sucursal agregada exitosamente")
            setBranches([...branches, res.data].sort((a, b) => a.name.localeCompare(b.name)))
            setShowAddDialog(false)
            resetForm()
        } else {
            toast.error(res.error || "Error al crear sucursal")
        }

        setLoading(false)
    }

    const handleUpdateBranch = async () => {
        if (!editingBranch || !validateForm()) return
        setLoading(true)

        const res = await updateBranchAction(editingBranch.id, formData)

        if (res.success && res.data) {
            toast.success("Sucursal actualizada exitosamente")
            setBranches(branches.map(b => b.id === editingBranch.id ? res.data! : b))
            setShowEditDialog(false)
            resetForm()
        } else {
            toast.error(res.error || "Error al actualizar sucursal")
        }

        setLoading(false)
    }

    const handleDeleteBranch = async () => {
        if (!branchToDelete) return
        setLoading(true)

        const res = await deleteBranchAction(branchToDelete.id)

        if (res.success) {
            toast.success("Sucursal eliminada exitosamente")
            setBranches(branches.filter(b => b.id !== branchToDelete.id))
            setBranchToDelete(null)
        } else {
            toast.error(res.error || "Error al eliminar sucursal")
        }

        setLoading(false)
    }

    const filteredBranches = branches.filter(branch =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.city.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-foreground">Gestión de Sucursales</CardTitle>
                    <CardDescription className="text-muted-foreground">Administra las ubicaciones físicas de la empresa</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar sucursal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-secondary border-border"
                        />
                    </div>
                    <Dialog open={showAddDialog} onOpenChange={(open) => {
                        setShowAddDialog(open)
                        if (open) resetForm()
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                                <Plus className="w-4 h-4" />
                                Nueva sucursal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Agregar Sucursal</DialogTitle>
                                <DialogDescription className="text-muted-foreground">Ingresa los datos del nuevo establecimiento.</DialogDescription>
                            </DialogHeader>
                            <BranchForm
                                isEditing={false}
                                formData={formData}
                                handleInputChange={handleInputChange}
                                loading={loading}
                                handleAddBranch={handleAddBranch}
                                handleUpdateBranch={handleUpdateBranch}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {filteredBranches.length > 0 ? (
                    filteredBranches.map((branch) => (
                        <div key={branch.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-4">
                            <div className="flex items-start gap-3 w-full sm:w-auto">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">{branch.name} <span className="text-xs text-muted-foreground font-normal ml-2">({branch.code})</span></h4>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {branch.city}, {branch.state}</span>
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {branch.manager}</span>
                                        <span className="flex items-center gap-1 hidden sm:flex"><Phone className="w-3 h-3" /> {branch.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                                <Dialog open={showEditDialog && editingBranch?.id === branch.id} onOpenChange={(open) => {
                                    setShowEditDialog(open)
                                    if (!open) setEditingBranch(null)
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary" onClick={() => {
                                            setEditingBranch(branch)
                                            setFormData(branch)
                                        }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border sm:max-w-[600px]">
                                        <DialogHeader>
                                            <DialogTitle className="text-foreground">Editar Sucursal</DialogTitle>
                                            <DialogDescription className="text-muted-foreground">Modifica los datos de la sucursal.</DialogDescription>
                                        </DialogHeader>
                                        <BranchForm
                                            isEditing={true}
                                            formData={formData}
                                            handleInputChange={handleInputChange}
                                            loading={loading}
                                            handleAddBranch={handleAddBranch}
                                            handleUpdateBranch={handleUpdateBranch}
                                        />
                                    </DialogContent>
                                </Dialog>

                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setBranchToDelete(branch)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium text-foreground">No se encontraron sucursales</p>
                        <p className="text-sm mt-1">{searchQuery ? "Intenta con otra búsqueda" : "Agrega la primera sucursal usando el botón 'Nueva sucursal'"}</p>
                    </div>
                )}
            </CardContent>

            <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground text-xl font-bold">¿Eliminar sucursal?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground space-y-3">
                            ¿Estás seguro que deseas eliminar a <strong>{branchToDelete?.name}</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="border-border bg-transparent">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBranch} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white border-0">
                            {loading ? "Eliminando..." : "Eliminar sucursal"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
