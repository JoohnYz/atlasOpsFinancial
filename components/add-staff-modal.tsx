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
import { createClient } from "@/lib/supabase/client"
import type { Staff } from "@/lib/types"

interface AddStaffModalProps {
  onStaffAdded?: () => void
  editStaff?: Staff | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  mode?: "add" | "edit"
}

export function AddStaffModal({ onStaffAdded, editStaff, open: controlledOpen, onOpenChange, mode = "add" }: AddStaffModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [salary, setSalary] = useState("")
  const [hireDate, setHireDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  // Populate form when editing
  useEffect(() => {
    if (editStaff && mode === "edit") {
      setName(editStaff.name)
      setEmail(editStaff.email)
      setRole(editStaff.role)
      setSalary(editStaff.salary.toString())
      setHireDate(editStaff.hire_date)
    }
  }, [editStaff, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const staffData = {
        name,
        email,
        role,
        department: "General",
        salary: Number.parseFloat(salary),
        hire_date: hireDate,
        status: "Activo",
      }

      if (mode === "edit" && editStaff) {
        const { error: updateError } = await supabase
          .from("employees")
          .update(staffData)
          .eq("id", editStaff.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from("employees")
          .insert([staffData])

        if (insertError) throw insertError
      }

      setOpen(false)
      resetForm()
      onStaffAdded?.()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar empleado"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setRole("")
    setSalary("")
    setHireDate("")
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const isEditMode = mode === "edit"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Empleado
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditMode ? "Editar Empleado" : "Agregar Nuevo Empleado"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditMode 
              ? "Modifica los datos del empleado."
              : "Ingresa los datos del nuevo miembro del equipo."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Nombre Completo
              </Label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-foreground">
              Puesto
            </Label>
            <Input
              id="role"
              placeholder="Ej: Piloto, Mecánico"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-secondary border-border text-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-foreground">
                Salario Mensual
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="salary"
                  type="number"
                  placeholder="0.00"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="pl-7 bg-secondary border-border text-foreground"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate" className="text-foreground">
                Fecha de Ingreso
              </Label>
              <Input
                id="hireDate"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border bg-transparent">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Guardando..." : isEditMode ? "Guardar Cambios" : "Agregar Empleado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
