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
import { CRMLayout } from "@/components/crm-layout"
import { createClient } from "@/lib/supabase/client"
import { detectEmoji, EMOJI_OPTIONS } from "@/lib/emoji-utils"
import type { Expense, UserPermission } from "@/lib/types"
import { getAllUserPermissions, updateUserPermissions, deleteUserPermissions, getUserPermissions } from "@/lib/permission-actions"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  color: string
  emoji?: string
  type: string
}

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("")
  const [detectedEmoji, setDetectedEmoji] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmoji, setEditEmoji] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
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
      setNewCategoryName(name)
      const detected = detectEmoji(name)
      setDetectedEmoji(detected)
      if (!newCategoryEmoji) {
        setNewCategoryEmoji(detected)
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

      if (categoriesData) {
        setCategories(categoriesData)
      }
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

  // Add new category
  const handleAddCategory = async () => {
    const finalEmoji = newCategoryEmoji || detectedEmoji || "📁"

    // Check for duplicate name
    if (categories.some((cat) => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error("Ya existe una categoría con este nombre")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name: newCategoryName,
            emoji: finalEmoji,
            color: "bg-muted",
            type: "expense",
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setCategories([...categories, data[0]])
        setNewCategoryName("")
        setNewCategoryEmoji("")
        setDetectedEmoji("")
        setShowAddDialog(false)
      }
    } catch (err) {
      console.error("Error adding category:", err)
    } finally {
      setLoading(false)
    }
  }

  // Update category
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editName.trim()) return

    // Check for duplicate name (excluding current category)
    if (
      categories.some(
        (cat) =>
          cat.id !== editingCategory.id && cat.name.toLowerCase() === editName.trim().toLowerCase(),
      )
    ) {
      toast.error("Ya existe otra categoría con este nombre")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("categories")
        .update({
          name: editName,
          emoji: editEmoji,
        })
        .eq("id", editingCategory.id)

      if (error) throw error

      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id
            ? { ...cat, name: editName, emoji: editEmoji }
            : cat,
        ),
      )
      setEditingCategory(null)
      setShowEditDialog(false)
    } catch (err) {
      console.error("Error updating category:", err)
    } finally {
      setLoading(false)
    }
  }

  // Delete category
  const handleDeleteCategory = async (id: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)

      if (error) throw error

      setCategories(categories.filter((cat) => cat.id !== id))
    } catch (err) {
      console.error("Error deleting category:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Administra las preferencias del sistema</p>
        </div>

        <Tabs defaultValue={canManageCategories ? "categorias" : "seguridad"} className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            {canManageCategories && <TabsTrigger value="categorias">Categorías</TabsTrigger>}
            <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
            {canManageUsers && <TabsTrigger value="usuarios">Usuarios</TabsTrigger>}
          </TabsList>

          {canManageCategories && (
            <TabsContent value="categorias" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Categorías de Gastos</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Administra las categorías para clasificar gastos
                    </CardDescription>
                  </div>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                        <Plus className="w-4 h-4" />
                        Nueva Categoría
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Agregar Nueva Categoría</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Crea una nueva categoría de gasto
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="categoryName" className="text-foreground">
                            Nombre
                          </Label>
                          <div className="relative">
                            <Input
                              id="categoryName"
                              placeholder="Ej: Alojamiento, Gasolina, Viajes..."
                              value={newCategoryName}
                              onChange={(e) => handleNameChange(e.target.value)}
                              className="bg-secondary border-border text-foreground pr-12"
                            />
                            {detectedEmoji && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">
                                {detectedEmoji}
                              </span>
                            )}
                          </div>
                          {detectedEmoji && (
                            <p className="text-xs text-muted-foreground">
                              Emoji detectado automaticamente
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="categoryEmoji" className="text-foreground">
                            Emoji (opcional - cambiar manualmente)
                          </Label>
                          <Select value={newCategoryEmoji || detectedEmoji} onValueChange={setNewCategoryEmoji}>
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
                        <Button
                          onClick={handleAddCategory}
                          disabled={loading || !newCategoryName.trim()}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {loading ? "Guardando..." : "Agregar Categoría"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.emoji || "📁"}</span>
                          <div className="flex-1">
                            <span className="font-medium text-foreground">{category.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {getTransactionCount(category.name)} transacciones
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog open={showEditDialog && editingCategory?.id === category.id} onOpenChange={setShowEditDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingCategory(category)
                                  setEditName(category.name)
                                  setEditEmoji(category.emoji || "📁")
                                }}
                                className="h-8 w-8 hover:bg-secondary"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-foreground">Editar Categoría</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                  Modifica los detalles de la categoría
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="editCategoryName" className="text-foreground">
                                    Nombre
                                  </Label>
                                  <Input
                                    id="editCategoryName"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="bg-secondary border-border text-foreground"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editCategoryEmoji" className="text-foreground">
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
                                <Button
                                  onClick={handleUpdateCategory}
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
                            onClick={() => handleDeleteCategory(category.id)}
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
                      <p>No hay categorías creadas</p>
                      <p className="text-sm mt-1">Agrega la primera categoría usando el botón "Nueva Categoría"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
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
                              { id: 'access_reports', label: 'Reportes' },
                              { id: 'access_payment_orders', label: 'Ordenes de pago' },
                              { id: 'access_categories', label: 'Categorías' },
                              { id: 'access_banks', label: 'Bancos' },
                              { id: 'manage_payment_orders', label: 'Gestionar Órdenes de pago' },
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
      </div>
    </CRMLayout>
  )
}
