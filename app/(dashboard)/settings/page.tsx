"use client"

import { useState, useEffect } from "react"
import { Save, Bell, Shield, Mail, Lock, Eye, EyeOff, Upload, Plus, Trash2, Edit2, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { detectEmoji, EMOJI_OPTIONS } from "@/lib/emoji-utils"
import type { Expense, UserPermission, Client, Branch, Vendor } from "@/lib/types"
import { getAllUserPermissions, updateUserPermissions, deleteUserPermissions, getUserPermissions } from "@/lib/permission-actions"
import { getClients } from "@/lib/client-actions"
import { getBranches } from "@/lib/branch-actions"
import { getVendors } from "@/lib/vendor-actions"
import { ClientManagementSection } from "@/components/client-management-section"
import { BranchManagementSection } from "@/components/branch-management-section"
import { VendorManagementSection } from "@/components/vendor-management-section"
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
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  color: string
  emoji?: string
  type: string // "expense", "branch", "client", "vendor"
}

interface EntityManagementSectionProps {
  title: string
  description: string
  entities: Category[]
  type: string
  activeEntityType: string
  setActiveEntityType: (type: string) => void
  showAddDialog: boolean
  setShowAddDialog: (open: boolean) => void
  newEntityName: string
  handleNameChange: (name: string, isEdit?: boolean) => void
  detectedEmoji: string
  newEntityEmoji: string
  setNewEntityEmoji: (emoji: string) => void
  loading: boolean
  handleAddEntity: () => Promise<void>
  showEditDialog: boolean
  setShowEditDialog: (open: boolean) => void
  editingEntity: Category | null
  setEditingEntity: (entity: Category | null) => void
  setEditName: (name: string) => void
  setEditEmoji: (emoji: string) => void
  editName: string
  editEmoji: string
  handleUpdateEntity: () => Promise<void>
  setEntityToDelete: (entity: Category | null) => void
  getTransactionCount: (name: string) => number
}

function EntityManagementSection({
  title,
  description,
  entities,
  type,
  activeEntityType,
  setActiveEntityType,
  showAddDialog,
  setShowAddDialog,
  newEntityName,
  handleNameChange,
  detectedEmoji,
  newEntityEmoji,
  setNewEntityEmoji,
  loading,
  handleAddEntity,
  showEditDialog,
  setShowEditDialog,
  editingEntity,
  setEditingEntity,
  setEditName,
  setEditEmoji,
  editName,
  editEmoji,
  handleUpdateEntity,
  setEntityToDelete,
  getTransactionCount,
}: EntityManagementSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        <Dialog open={showAddDialog && activeEntityType === type} onOpenChange={(open) => {
          setShowAddDialog(open)
          if (open) setActiveEntityType(type)
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Agregar {title}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Crea un nuevo registro en {title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="entityName" className="text-foreground">
                  Nombre
                </Label>
                <div className="relative">
                  <Input
                    id="entityName"
                    placeholder={`Ej: ${type === 'expense' ? 'Alojamiento' : type === 'branch' ? 'Sucursal Este' : 'Nombre...'}`}
                    value={newEntityName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`bg-secondary border-border text-foreground ${type === 'expense' ? 'pr-12' : ''}`}
                  />
                  {type === 'expense' && detectedEmoji && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">
                      {detectedEmoji}
                    </span>
                  )}
                </div>
                {type === 'expense' && detectedEmoji && (
                  <p className="text-xs text-muted-foreground">
                    Emoji detectado automáticamente
                  </p>
                )}
              </div>
              {type === 'expense' && (
                <div className="space-y-2">
                  <Label htmlFor="entityEmoji" className="text-foreground">
                    Emoji (opcional)
                  </Label>
                  <Select value={newEntityEmoji || detectedEmoji} onValueChange={setNewEntityEmoji}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Selecciona un emoji" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-60">
                      {EMOJI_OPTIONS.map((option) => (
                        <SelectItem key={option.emoji} value={option.emoji}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{option.emoji}</span>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={handleAddEntity}
                disabled={loading || !newEntityName.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? "Guardando..." : "Agregar Registro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {entities.length > 0 ? (
          entities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              onClick={() => {
                setActiveEntityType(type)
              }}
            >
              <div className="flex items-center gap-3">
                {type === 'expense' && (
                  <span className="text-2xl">{entity.emoji || "📁"}</span>
                )}
                <div className="flex-1">
                  <span className="font-medium text-foreground">{entity.name}</span>
                  {type === 'expense' && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {getTransactionCount(entity.name)} transacciones
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={showEditDialog && editingEntity?.id === entity.id} onOpenChange={setShowEditDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingEntity(entity)
                        setEditName(entity.name)
                        setEditEmoji(entity.emoji || "📁")
                        setActiveEntityType(type)
                      }}
                      className="h-8 w-8 hover:bg-secondary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Editar {title}</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Modifica los detalles
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="editEntityName" className="text-foreground">
                          Nombre
                        </Label>
                        <Input
                          id="editEntityName"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-secondary border-border text-foreground"
                        />
                      </div>
                      {type === 'expense' && (
                        <div className="space-y-2">
                          <Label htmlFor="editEntityEmoji" className="text-foreground">
                            Emoji
                          </Label>
                          <Select value={editEmoji} onValueChange={setEditEmoji}>
                            <SelectTrigger className="bg-secondary border-border text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border max-h-60">
                              {EMOJI_OPTIONS.map((option) => (
                                <SelectItem key={option.emoji} value={option.emoji}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{option.emoji}</span>
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button
                        onClick={handleUpdateEntity}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {loading ? "Guardando..." : "Guardar Cambios"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveEntityType(type)
                    setEntityToDelete(entity)
                  }}
                  disabled={loading}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>No hay registros creados</p>
            <p className="text-sm mt-1">Agrega el primer registro usando el botón "Nuevo Registro"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [newEntityName, setNewEntityName] = useState("")
  const [newEntityEmoji, setNewEntityEmoji] = useState("")
  const [detectedEmoji, setDetectedEmoji] = useState("")
  const [editingEntity, setEditingEntity] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmoji, setEditEmoji] = useState("")
  const [activeEntityType, setActiveEntityType] = useState<string>("expense")

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [entityToDelete, setEntityToDelete] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    incomeAlerts: true,
    expenseAlerts: true,
    payrollReminders: true,
    weeklyReport: true,
  })
  const [newCategoryColor, setNewCategoryColor] = useState("bg-blue-500")
  const [editColor, setEditColor] = useState("")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<UserPermission | null>(null)
  const [allPermissions, setAllPermissions] = useState<UserPermission[]>([])
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<Partial<UserPermission> | null>(null)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPassError, setCurrentPassError] = useState("")
  const [passwordMismatch, setPasswordMismatch] = useState(false)

  const isAdmin = userEmail === 'admin@atlasops.com'
  const canManageCategories = isAdmin || (userPermissions?.access_categories)
  const canManageUsers = isAdmin || (userPermissions?.assign_access === true)

  const loadPermissions = async () => {
    if (canManageUsers) {
      const data = await getAllUserPermissions()
      setAllPermissions(data)
    }
  }

  const handleSavePermissions = async () => {
    if (!editingUser?.email) return
    setLoading(true)
    const res = await updateUserPermissions(editingUser as UserPermission)
    if (res.success) {
      toast.success("Permisos actualizados correctamente")
      loadPermissions()
      setShowUserDialog(false)
      setEditingUser(null)
    } else {
      toast.error(res.error || "Error al actualizar permisos")
    }
    setLoading(false)
  }

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`¿Estás seguro de eliminar los permisos para ${email}?`)) return
    setLoading(true)
    const res = await deleteUserPermissions(email)
    if (res.success) {
      toast.success("Usuario eliminado correctamente")
      loadPermissions()
    } else {
      toast.error(res.error || "Error al eliminar usuario")
    }
    setLoading(false)
  }

  const handleUpdatePassword = async () => {
    setCurrentPassError("")
    setPasswordMismatch(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Por favor completa todos los campos")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true)
      toast.error("Las nuevas contraseñas no coinciden")
      return
    }

    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // 1. Verify current password by signing in again
      if (userEmail) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword,
        })

        if (signInError) {
          setCurrentPassError("La contraseña actual es incorrecta")
          toast.error("La contraseña actual es incorrecta")
          setLoading(false)
          return
        }
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

      if (updateError) throw updateError

      toast.success("Contraseña actualizada correctamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      console.error("Error updating password:", err)
      toast.error(err.message || "Error al actualizar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  // Handle name change and auto-detect emoji
  const handleNameChange = (name: string, isEdit = false) => {
    if (isEdit) {
      setEditName(name)
    } else {
      setNewEntityName(name)
      if (activeEntityType === "expense") {
        const detected = detectEmoji(name)
        setDetectedEmoji(detected)
        if (!newEntityEmoji) {
          setNewEntityEmoji(detected)
        }
      }
    }
  }

  // Load categories and expenses from Supabase
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (user?.email) {
        setUserEmail(user.email)
        const perms = await getUserPermissions(user.email)
        setUserPermissions(perms)

        if (user.email === 'admin@atlasops.com' || perms?.assign_access === true) {
          const allPerms = await getAllUserPermissions()
          setAllPermissions(allPerms)
        }
      }

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })

      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")

      const branchesData = await getBranches()
      const vendorsData = await getVendors()
      const clientsData = await getClients()

      if (categoriesData) {
        setCategories(categoriesData.filter(c => c.type === "expense" || !c.type))
      }

      if (branchesData) setBranches(branchesData)
      if (vendorsData) setVendors(vendorsData)
      if (clientsData) setClients(clientsData)

      if (expensesData) {
        setExpenses(expensesData)
      }
    }

    loadData()
  }, [])

  // Count transactions by category
  const getTransactionCount = (categoryName: string) => {
    return expenses.filter((exp) => exp.category === categoryName).length
  }

  // Add new entity (category, branch, client, vendor)
  const handleAddEntity = async () => {
    const finalEmoji = activeEntityType === "expense" ? (newEntityEmoji || detectedEmoji || "📁") : undefined

    const entityList = categories

    // Check for duplicate name
    if (entityList.some((item) => item.name.toLowerCase() === newEntityName.trim().toLowerCase())) {
      toast.error(`Ya existe un registro con este nombre`)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name: newEntityName,
            emoji: finalEmoji,
            color: "bg-muted",
            type: activeEntityType,
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        const newEntity = data[0]
        setCategories([...categories, newEntity])

        setNewEntityName("")
        setNewEntityEmoji("")
        setDetectedEmoji("")
        setShowAddDialog(false)
        toast.success("Registro agregado correctamente")
      }
    } catch (err) {
      console.error("Error adding entity:", err)
      toast.error("Error al agregar registro")
    } finally {
      setLoading(false)
    }
  }

  // Update entity
  const handleUpdateEntity = async () => {
    if (!editingEntity || !editName.trim()) return

    const entityList = categories

    // Check for duplicate name (excluding current)
    if (
      entityList.some(
        (item) =>
          item.id !== editingEntity.id && item.name.toLowerCase() === editName.trim().toLowerCase(),
      )
    ) {
      toast.error("Ya existe otro registro con este nombre")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("categories")
        .update({
          name: editName,
          emoji: activeEntityType === "expense" ? editEmoji : undefined,
        })
        .eq("id", editingEntity.id)

      if (error) throw error

      const updated = { ...editingEntity, name: editName, emoji: activeEntityType === "expense" ? editEmoji : undefined }

      setCategories(categories.map(c => c.id === editingEntity.id ? updated : c))

      setEditingEntity(null)
      setShowEditDialog(false)
      toast.success("Registro actualizado correctamente")
    } catch (err) {
      console.error("Error updating entity:", err)
      toast.error("Error al actualizar registro")
    } finally {
      setLoading(false)
    }
  }

  // Delete entity
  const handleDeleteEntity = async (id: string, name: string) => {
    setLoading(true)
    try {
      const supabase = createClient()

      // 1. Delete associated expenses if it's an expense category
      if (activeEntityType === "expense") {
        const { error: expError } = await supabase
          .from("expenses")
          .delete()
          .eq("category", name)

        if (expError) throw expError
        setExpenses(expenses.filter((exp) => exp.category !== name))
      }

      // 2. Delete the entity itself
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      // 3. Update local state
      if (activeEntityType === "expense") setCategories(categories.filter((cat) => cat.id !== id))

      toast.success(`Registro "${name}" eliminado`)
    } catch (err: any) {
      console.error("Error deleting entity:", err)
      toast.error(`Error al eliminar: ${err.message}`)
    } finally {
      setLoading(false)
      setEntityToDelete(null)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Administra las preferencias del sistema</p>
      </div>

      <Tabs defaultValue={canManageCategories ? "categorias" : "seguridad"} className="space-y-6">
        <TabsList className="bg-secondary border border-border flex flex-wrap h-auto p-1">
          {canManageCategories && (
            <>
              <TabsTrigger value="categorias" onClick={() => setActiveEntityType("expense")}>Categorías</TabsTrigger>
              <TabsTrigger value="sucursales" onClick={() => setActiveEntityType("branch")}>Sucursales</TabsTrigger>
              <TabsTrigger value="clientes" onClick={() => setActiveEntityType("client")}>Clientes</TabsTrigger>
              <TabsTrigger value="proveedores" onClick={() => setActiveEntityType("vendor")}>Proveedores</TabsTrigger>
            </>
          )}
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          {canManageUsers && <TabsTrigger value="usuarios">Usuarios</TabsTrigger>}
        </TabsList>

        {canManageCategories && (
          <>
            <TabsContent value="categorias" className="space-y-6">
              <EntityManagementSection
                title="Categorías de Gastos"
                description="Administra las categorías para clasificar gastos"
                entities={categories}
                type="expense"
                activeEntityType={activeEntityType}
                setActiveEntityType={setActiveEntityType}
                showAddDialog={showAddDialog}
                setShowAddDialog={setShowAddDialog}
                newEntityName={newEntityName}
                handleNameChange={handleNameChange}
                detectedEmoji={detectedEmoji}
                newEntityEmoji={newEntityEmoji}
                setNewEntityEmoji={setNewEntityEmoji}
                loading={loading}
                handleAddEntity={handleAddEntity}
                showEditDialog={showEditDialog}
                setShowEditDialog={setShowEditDialog}
                editingEntity={editingEntity}
                setEditingEntity={setEditingEntity}
                setEditName={setEditName}
                setEditEmoji={setEditEmoji}
                editName={editName}
                editEmoji={editEmoji}
                handleUpdateEntity={handleUpdateEntity}
                setEntityToDelete={setEntityToDelete}
                getTransactionCount={getTransactionCount}
              />
            </TabsContent>

            <TabsContent value="sucursales" className="space-y-6">
              <BranchManagementSection
                branches={branches}
                setBranches={setBranches}
              />
            </TabsContent>

            <TabsContent value="clientes" className="space-y-6">
              <ClientManagementSection
                clients={clients}
                setClients={setClients}
              />
            </TabsContent>

            <TabsContent value="proveedores" className="space-y-6">
              <VendorManagementSection
                vendors={vendors}
                setVendors={setVendors}
              />
            </TabsContent>
          </>
        )}

        <TabsContent value="seguridad" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Actualiza tu contraseña para mantener tu cuenta segura. Se requiere tu contraseña actual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className={currentPassError ? "text-destructive" : ""}>
                    Contraseña Actual
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      placeholder="••••••••"
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        if (currentPassError) setCurrentPassError("")
                      }}
                      className={`bg-secondary border-border ${currentPassError ? "border-destructive ring-1 ring-destructive placeholder:text-destructive/50" : ""}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {currentPassError && (
                    <p className="text-xs text-destructive font-medium mt-1">
                      {currentPassError}
                    </p>
                  )}
                </div>

                <div className="border-t border-border my-6 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className={passwordMismatch ? "text-destructive" : ""}>
                        Nueva Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          placeholder="••••••••"
                          onChange={(e) => {
                            setNewPassword(e.target.value)
                            if (passwordMismatch) setPasswordMismatch(false)
                          }}
                          className={`bg-secondary border-border ${passwordMismatch ? "border-destructive ring-1 ring-destructive placeholder:text-destructive/50" : ""}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className={passwordMismatch ? "text-destructive" : ""}>
                        Confirmar Nueva Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          placeholder="••••••••"
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            if (passwordMismatch) setPasswordMismatch(false)
                          }}
                          className={`bg-secondary border-border ${passwordMismatch ? "border-destructive ring-1 ring-destructive placeholder:text-destructive/50" : ""}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUpdatePassword}
                  disabled={loading}
                  className="w-full md:w-auto px-8"
                >
                  {loading ? "Actualizando..." : "Actualizar Contraseña"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canManageUsers && (
          <TabsContent value="usuarios" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Gestión de Usuarios</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Controla los permisos de acceso para cada usuario
                  </CardDescription>
                </div>
                <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setEditingUser({
                        email: '',
                        access_income: false,
                        access_expenses: false,
                        access_staff: false,
                        access_payroll: false,
                        access_reports: false,
                        access_payment_orders: false,
                        access_categories: false,
                        access_banks: false,
                        manage_payment_orders: false,
                        manage_banks: false,
                        access_notifications: false,
                        assign_access: false
                      })}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Configurar Permisos</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Asigna permisos de acceso vinculados al correo electrónico del usuario
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="userEmail" className="text-foreground">
                          Correo Electrónico
                        </Label>
                        <Input
                          id="userEmail"
                          placeholder="usuario@ejemplo.com"
                          value={editingUser?.email || ''}
                          onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-secondary border-border text-foreground"
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-foreground">Permisos de Acceso</h4>

                        <div className="space-y-3">
                          {[
                            { id: 'access_income', label: 'Ingresos' },
                            { id: 'access_expenses', label: 'Gastos' },
                            { id: 'access_staff', label: 'Personal' },
                            { id: 'access_payroll', label: 'Nómina' },
                            { id: 'access_reports', label: 'Reportes y Balance General' },
                            { id: 'access_payment_orders', label: 'Ordenes de pago' },
                            { id: 'access_categories', label: 'Categorías' },
                            { id: 'access_banks', label: 'Bancos' },
                            { id: 'manage_payment_orders', label: 'Gestionar Órdenes de pago' },
                            { id: 'manage_banks', label: 'Gestión de Cuentas Bancarias' },
                            { id: 'access_notifications', label: 'Notificaciones' },
                            { id: 'assign_access', label: 'Asignar Accesos' },
                          ].map((perm) => (
                            <div key={perm.id} className="flex items-center justify-between">
                              <Label htmlFor={perm.id} className="flex-1 cursor-pointer text-foreground">
                                {perm.label}
                              </Label>
                              <Switch
                                id={perm.id}
                                checked={(editingUser as any)?.[perm.id] || false}
                                disabled={perm.id === 'assign_access' && !isAdmin}
                                onCheckedChange={(checked) => setEditingUser(prev => ({ ...prev, [perm.id]: checked }))}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleSavePermissions}
                        disabled={loading || !editingUser?.email}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                      >
                        {loading ? "Guardando..." : "Guardar Permisos"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3">
                {allPermissions.length > 0 ? (
                  allPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{permission.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {permission.access_income && <Badge variant="secondary" className="text-[10px] py-0">Ingresos</Badge>}
                            {permission.access_expenses && <Badge variant="secondary" className="text-[10px] py-0">Gastos</Badge>}
                            {permission.access_staff && <Badge variant="secondary" className="text-[10px] py-0">Personal</Badge>}
                            {permission.access_payroll && <Badge variant="secondary" className="text-[10px] py-0">Nómina</Badge>}
                            {permission.access_reports && <Badge variant="secondary" className="text-[10px] py-0">Reportes</Badge>}
                            {permission.access_payment_orders && <Badge variant="secondary" className="text-[10px] py-0">Ordenes</Badge>}
                            {permission.access_categories && <Badge variant="secondary" className="text-[10px] py-0">Categorías</Badge>}
                            {permission.manage_payment_orders && <Badge variant="secondary" className="text-[10px] py-0">Gestionar Órdenes</Badge>}
                            {permission.manage_banks && <Badge variant="secondary" className="text-[10px] py-0">Gestión Bancos</Badge>}
                            {permission.access_notifications && <Badge variant="secondary" className="text-[10px] py-0">Notificaciones</Badge>}
                            {permission.assign_access && <Badge variant="default" className="text-[10px] py-0 bg-blue-600">Asignar Accesos</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingUser(permission)
                            setShowUserDialog(true)
                          }}
                          className="h-8 w-8 hover:bg-secondary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(permission.email)}
                          disabled={loading}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No hay usuarios configurados</p>
                    <p className="text-sm mt-1">Configura permisos para el primer usuario usando el botón "Nuevo Usuario"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Global AlertDialog for Deletion */}
      <AlertDialog open={!!entityToDelete} onOpenChange={(open) => !open && setEntityToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-bold">
              ¿Está seguro que quiere eliminar "{entityToDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="text-muted-foreground space-y-3">
              <div>
                <p>Esta acción no se puede deshacer de forma sencilla.</p>
                {activeEntityType === "expense" && entityToDelete && getTransactionCount(entityToDelete.name) > 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive font-medium">
                    <p className="text-sm">
                      ⚠️ <strong>Aviso importante:</strong> Esta categoría tiene {getTransactionCount(entityToDelete.name)} transacciones asociadas.
                      Si elimina la categoría, <strong>se eliminarán también todas las transacciones</strong> que tenga de forma automática.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="border-border bg-transparent">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => entityToDelete && handleDeleteEntity(entityToDelete.id, entityToDelete.name)}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {activeEntityType === "expense" && entityToDelete && getTransactionCount(entityToDelete.name) > 0
                ? "Eliminar todo"
                : "Eliminar registro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


