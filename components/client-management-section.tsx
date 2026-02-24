"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Search, Building2, Mail, Phone, MapPin, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClientAction, updateClientAction, deleteClientAction } from "@/lib/client-actions"
import type { Client } from "@/lib/types"
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

export const DOC_TYPES = [
    { value: "V", label: "Venezolano (V)" },
    { value: "E", label: "Extranjero (E)" },
    { value: "J", label: "Jurídico (J)" },
    { value: "G", label: "Gubernamental (G)" },
    { value: "R", label: "Firma Personal (R)" },
    { value: "P", label: "Pasaporte (P)" },
]

export const BRANCHES = [
    "Sucursal Central",
    "Sucursal Este",
    "Sucursal Norte",
    "Sucursal Sur"
]

interface ClientFormProps {
    formData: Partial<Client>
    handleInputChange: (field: keyof Client, value: string) => void
    loading: boolean
    isEditing: boolean
    handleUpdateClient: () => Promise<void>
    handleAddClient: () => Promise<void>
}

const ClientForm = ({
    formData,
    handleInputChange,
    loading,
    isEditing,
    handleUpdateClient,
    handleAddClient
}: ClientFormProps) => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="name" className="text-foreground">Nombre / Razón Social <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: Empresa C.A." />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="document_type" className="text-foreground">Tipo Doc. <span className="text-destructive">*</span></Label>
                <Select value={formData.document_type} onValueChange={(val) => handleInputChange("document_type", val)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                        {DOC_TYPES.map(dt => <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="document_number" className="text-foreground">Número de Documento <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="document_number" value={formData.document_number} onChange={(e) => handleInputChange("document_number", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: 12345678" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Correo Electrónico <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="correo@ejemplo.com" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Teléfono <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="pl-9 bg-secondary border-border" placeholder="Ej: +58 412 1234567" />
                </div>
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="branch" className="text-foreground">Sucursal Asignada <span className="text-destructive">*</span></Label>
                <Select value={formData.branch} onValueChange={(val) => handleInputChange("branch", val)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                        {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="address" className="text-foreground">Dirección <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input id="address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} className="pl-9 py-2 min-h-[80px] bg-secondary border-border" placeholder="Dirección completa..." />
                </div>
            </div>
        </div>

        <Button
            onClick={isEditing ? handleUpdateClient : handleAddClient}
            disabled={loading}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
            {loading ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Agregar Cliente")}
        </Button>
    </div>
)

export function ClientManagementSection({ clients, setClients }: { clients: Client[], setClients: (clients: Client[]) => void }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

    // Form states
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [formData, setFormData] = useState<Partial<Client>>({
        name: "",
        email: "",
        phone: "",
        address: "",
        document_type: "V",
        document_number: "",
        branch: "Sucursal Central"
    })

    const resetForm = () => {
        setFormData({
            name: "", email: "", phone: "", address: "",
            document_type: "V", document_number: "", branch: "Sucursal Central"
        })
        setEditingClient(null)
    }

    const handleInputChange = (field: keyof Client, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const validateForm = () => {
        if (!formData.name?.trim() || !formData.email?.trim() || !formData.phone?.trim() ||
            !formData.address?.trim() || !formData.document_number?.trim()) {
            toast.error("Todos los campos son obligatorios")
            return false
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            toast.error("El formato del correo es inválido")
            return false
        }
        return true
    }

    const handleAddClient = async () => {
        if (!validateForm()) return
        setLoading(true)

        const res = await createClientAction({
            name: formData.name!,
            email: formData.email!,
            phone: formData.phone!,
            address: formData.address!,
            document_type: formData.document_type!,
            document_number: formData.document_number!,
            branch: formData.branch!
        })

        if (res.success && res.data) {
            toast.success("Cliente agregado exitosamente")
            setClients([...clients, res.data].sort((a, b) => a.name.localeCompare(b.name)))
            setShowAddDialog(false)
            resetForm()
        } else {
            toast.error(res.error || "Error al crear cliente")
        }

        setLoading(false)
    }

    const handleUpdateClient = async () => {
        if (!editingClient || !validateForm()) return
        setLoading(true)

        const res = await updateClientAction(editingClient.id, {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            document_type: formData.document_type,
            document_number: formData.document_number,
            branch: formData.branch
        })

        if (res.success && res.data) {
            toast.success("Cliente actualizado exitosamente")
            setClients(clients.map(c => c.id === editingClient.id ? res.data! : c))
            setShowEditDialog(false)
            resetForm()
        } else {
            toast.error(res.error || "Error al actualizar cliente")
        }

        setLoading(false)
    }

    const handleDeleteClient = async () => {
        if (!clientToDelete) return
        setLoading(true)

        const res = await deleteClientAction(clientToDelete.id)

        if (res.success) {
            toast.success("Cliente eliminado exitosamente")
            setClients(clients.filter(c => c.id !== clientToDelete.id))
            setClientToDelete(null)
        } else {
            toast.error(res.error || "Error al eliminar cliente")
        }

        setLoading(false)
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.document_number.includes(searchQuery)
    )

    return (
        <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-foreground">Gestión de Clientes</CardTitle>
                    <CardDescription className="text-muted-foreground">Administra la base de datos de tus clientes</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cliente..."
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
                                Nuevo Cliente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border sm:max-w-[550px]">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Agregar Cliente</DialogTitle>
                                <DialogDescription className="text-muted-foreground">Ingresa los datos del nuevo cliente.</DialogDescription>
                            </DialogHeader>
                            <ClientForm
                                isEditing={false}
                                formData={formData}
                                handleInputChange={handleInputChange}
                                loading={loading}
                                handleAddClient={handleAddClient}
                                handleUpdateClient={handleUpdateClient}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <div key={client.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-4">
                            <div className="flex items-start gap-3 w-full sm:w-auto">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">{client.name}</h4>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {client.document_type}-{client.document_number}</span>
                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>
                                        <span className="flex items-center gap-1 hidden sm:flex"><Phone className="w-3 h-3" /> {client.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                                <Dialog open={showEditDialog && editingClient?.id === client.id} onOpenChange={(open) => {
                                    setShowEditDialog(open)
                                    if (!open) setEditingClient(null)
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary" onClick={() => {
                                            setEditingClient(client)
                                            setFormData({
                                                name: client.name, email: client.email, phone: client.phone, address: client.address,
                                                document_type: client.document_type, document_number: client.document_number, branch: client.branch
                                            })
                                        }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border sm:max-w-[550px]">
                                        <DialogHeader>
                                            <DialogTitle className="text-foreground">Editar Cliente</DialogTitle>
                                            <DialogDescription className="text-muted-foreground">Modifica los datos del cliente.</DialogDescription>
                                        </DialogHeader>
                                        <ClientForm
                                            isEditing={true}
                                            formData={formData}
                                            handleInputChange={handleInputChange}
                                            loading={loading}
                                            handleAddClient={handleAddClient}
                                            handleUpdateClient={handleUpdateClient}
                                        />
                                    </DialogContent>
                                </Dialog>

                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setClientToDelete(client)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium text-foreground">No se encontraron clientes</p>
                        <p className="text-sm mt-1">{searchQuery ? "Intenta con otra búsqueda" : "Agrega el primer cliente usando el botón 'Nuevo Cliente'"}</p>
                    </div>
                )}
            </CardContent>

            <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground text-xl font-bold">¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground space-y-3">
                            ¿Estás seguro que deseas eliminar a <strong>{clientToDelete?.name}</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="border-border bg-transparent">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClient} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white border-0">
                            {loading ? "Eliminando..." : "Eliminar cliente"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
