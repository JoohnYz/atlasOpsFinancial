"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Search, Building2, Mail, Phone, MapPin, FileText, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createVendorAction, updateVendorAction, deleteVendorAction } from "@/lib/vendor-actions"
import type { Vendor } from "@/lib/types"
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

interface VendorFormProps {
    formData: Partial<Vendor>
    handleInputChange: (field: keyof Vendor, value: string) => void
    loading: boolean
    isEditing: boolean
    handleUpdateVendor: () => Promise<void>
    handleAddVendor: () => Promise<void>
    handleRifChange: (value: string) => void
}

const VendorForm = ({
    formData,
    handleInputChange,
    loading,
    isEditing,
    handleUpdateVendor,
    handleAddVendor,
    handleRifChange
}: VendorFormProps) => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="name" className="text-foreground">Nombre / Razón Social <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: Distribuidora TodoVenta C.A." />
                </div>
            </div>

            {/* RIF */}
            <div className="space-y-2">
                <Label htmlFor="rif" className="text-foreground">RIF <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="rif" value={formData.rif} onChange={(e) => handleRifChange(e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: J-123456789" />
                </div>
                <p className="text-[10px] text-muted-foreground">Formato: Letra-Número (Ej: J-123456789)</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="proveedor@ejemplo.com" />
                </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Teléfono <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: +58 424 1234567" />
                </div>
            </div>

            {/* Estado */}
            <div className="space-y-2">
                <Label htmlFor="state" className="text-foreground">Estado <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="state" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: Distrito Capital" />
                </div>
            </div>

            {/* Dirección */}
            <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="address" className="text-foreground">Dirección <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input id="address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} className="pl-9 py-2 min-h-[80px] bg-secondary border-border" placeholder="Dirección completa del proveedor..." />
                </div>
            </div>
        </div>

        <Button
            onClick={isEditing ? handleUpdateVendor : handleAddVendor}
            disabled={loading}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
            {loading ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Agregar Proveedor")}
        </Button>
    </div>
)

export function VendorManagementSection({ vendors, setVendors }: { vendors: Vendor[], setVendors: (vendors: Vendor[]) => void }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null)

    // Form states
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
    const [formData, setFormData] = useState<Partial<Vendor>>({
        name: "",
        email: "",
        phone: "",
        address: "",
        rif: "",
        state: ""
    })

    const resetForm = () => {
        setFormData({
            name: "", email: "", phone: "", address: "", rif: "", state: ""
        })
        setEditingVendor(null)
    }

    const handleInputChange = (field: keyof Vendor, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleRifChange = (value: string) => {
        // Auto-format RIF: Uppercase first letter, add dash after letter, then numbers
        let formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, "")
        if (formatted.length > 0) {
            const letter = formatted[0].match(/[VJGERP]/) ? formatted[0] : "J"
            const numbers = formatted.slice(1).replace(/[^0-9]/g, "").slice(0, 9)
            formatted = numbers.length > 0 ? `${letter}-${numbers}` : letter
        }
        setFormData(prev => ({ ...prev, rif: formatted }))
    }

    const validateForm = () => {
        if (!formData.name?.trim() || !formData.email?.trim() || !formData.phone?.trim() ||
            !formData.address?.trim() || !formData.rif?.trim() || !formData.state?.trim()) {
            toast.error("Todos los campos marcados con * son obligatorios")
            return false
        }
        const rifRegex = /^[VJGERP]-[0-9]{5,9}$/
        if (!rifRegex.test(formData.rif)) {
            toast.error("El formato del RIF es inválido (Ej: J-123456789)")
            return false
        }
        return true
    }

    const handleAddVendor = async () => {
        if (!validateForm()) return
        setLoading(true)

        const res = await createVendorAction(formData as Omit<Vendor, "id" | "created_at" | "updated_at">)

        if (res.success && res.data) {
            toast.success("Proveedor agregado exitosamente")
            setVendors([...vendors, res.data].sort((a, b) => a.name.localeCompare(b.name)))
            setShowAddDialog(false)
            resetForm()
        } else {
            toast.error(res.error || "Error al crear proveedor")
        }

        setLoading(false)
    }

    const handleUpdateVendor = async () => {
        if (!editingVendor || !validateForm()) return
        setLoading(true)

        const res = await updateVendorAction(editingVendor.id, formData)

        if (res.success && res.data) {
            toast.success("Proveedor actualizado exitosamente")
            setVendors(vendors.map(v => v.id === editingVendor.id ? res.data! : v))
            setShowEditDialog(false)
            resetForm()
        } else {
            toast.error(res.error || "Error al actualizar proveedor")
        }

        setLoading(false)
    }

    const handleDeleteVendor = async () => {
        if (!vendorToDelete) return
        setLoading(true)

        const res = await deleteVendorAction(vendorToDelete.id)

        if (res.success) {
            toast.success("Proveedor eliminado exitosamente")
            setVendors(vendors.filter(v => v.id !== vendorToDelete.id))
            setVendorToDelete(null)
        } else {
            toast.error(res.error || "Error al eliminar proveedor")
        }

        setLoading(false)
    }

    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.rif.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-foreground">Gestión de Proveedores</CardTitle>
                    <CardDescription className="text-muted-foreground">Administra el listado de proveedores y vendedores</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar proveedor..."
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
                                Nuevo Proveedor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border sm:max-w-[550px]">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Agregar Proveedor</DialogTitle>
                                <DialogDescription className="text-muted-foreground">Ingresa los datos del nuevo proveedor.</DialogDescription>
                            </DialogHeader>
                            <VendorForm
                                isEditing={false}
                                formData={formData}
                                handleInputChange={handleInputChange}
                                handleRifChange={handleRifChange}
                                loading={loading}
                                handleAddVendor={handleAddVendor}
                                handleUpdateVendor={handleUpdateVendor}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor) => (
                        <div key={vendor.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-4">
                            <div className="flex items-start gap-3 w-full sm:w-auto">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">{vendor.name}</h4>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> {vendor.rif}</span>
                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {vendor.email}</span>
                                        <span className="flex items-center gap-1 hidden sm:flex"><Phone className="w-3 h-3" /> {vendor.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                                <Dialog open={showEditDialog && editingVendor?.id === vendor.id} onOpenChange={(open) => {
                                    setShowEditDialog(open)
                                    if (!open) setEditingVendor(null)
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary" onClick={() => {
                                            setEditingVendor(vendor)
                                            setFormData(vendor)
                                        }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border sm:max-w-[550px]">
                                        <DialogHeader>
                                            <DialogTitle className="text-foreground">Editar Proveedor</DialogTitle>
                                            <DialogDescription className="text-muted-foreground">Modifica los datos del proveedor.</DialogDescription>
                                        </DialogHeader>
                                        <VendorForm
                                            isEditing={true}
                                            formData={formData}
                                            handleInputChange={handleInputChange}
                                            handleRifChange={handleRifChange}
                                            loading={loading}
                                            handleAddVendor={handleAddVendor}
                                            handleUpdateVendor={handleUpdateVendor}
                                        />
                                    </DialogContent>
                                </Dialog>

                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setVendorToDelete(vendor)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium text-foreground">No se encontraron proveedores</p>
                        <p className="text-sm mt-1">{searchQuery ? "Intenta con otra búsqueda" : "Agrega el primer proveedor usando el botón 'Nuevo Proveedor'"}</p>
                    </div>
                )}
            </CardContent>

            <AlertDialog open={!!vendorToDelete} onOpenChange={(open) => !open && setVendorToDelete(null)}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground text-xl font-bold">¿Eliminar proveedor?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground space-y-3">
                            ¿Estás seguro que deseas eliminar a <strong>{vendorToDelete?.name}</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="border-border bg-transparent">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVendor} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white border-0">
                            {loading ? "Eliminando..." : "Eliminar proveedor"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
