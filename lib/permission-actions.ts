'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { UserPermission } from "./types"

const ADMIN_EMAIL = 'admin@atlasops.com'

export async function getUserPermissions(email: string): Promise<UserPermission | null> {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const sessionUser = userData?.user
    console.log(`[PermissionAction] Request for: ${email}, Session: ${sessionUser?.email || 'none'}`)

    if (email === ADMIN_EMAIL) {
        return {
            id: '76ec0609-8472-463d-82c8-70138ae3f47c',
            email: ADMIN_EMAIL,
            access_income: true,
            access_expenses: true,
            access_staff: true,
            access_payroll: true,
            access_reports: true,
            access_payment_orders: true,
            access_categories: true,
            access_banks: true,
            manage_payment_orders: true,
            assign_access: true,
        }
    }

    try {
        const { data, error } = await supabase
            .from("user_permissions")
            .select("*")
            .eq("email", email)
            .maybeSingle()

        if (error) {
            console.error(`[PermissionAction] Error for ${email}:`, error.message)
            return null
        }

        return data
    } catch (error) {
        console.error("[PermissionAction] Error fetching user permissions:", error)
        return null
    }
}

export async function getAllUserPermissions(): Promise<UserPermission[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("user_permissions")
            .select("*")
            .order("email", { ascending: true })

        if (error) {
            console.error(`[PermissionAction] DB Error in getAll:`, error.message)
            throw error
        }
        console.log(`[PermissionAction] Successfully fetched ${data?.length || 0} permissions`)
        return data || []
    } catch (error) {
        console.error("[PermissionAction] Error fetching all user permissions:", error)
        return []
    }
}

export async function updateUserPermissions(permission: Partial<UserPermission> & { email: string }) {
    try {
        const supabase = await createClient()

        // Check permissions: Only super-admin or users with assign_access
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user?.email) return { error: "No autenticado" }

        const currentUserPerms = await getUserPermissions(user.email)
        const isSuperAdmin = user.email === ADMIN_EMAIL
        const canAssign = isSuperAdmin || (currentUserPerms?.assign_access === true)

        if (!canAssign) {
            return { error: "No tienes permisos para realizar esta acción" }
        }

        // SECURITY: Only super-admin can modify 'assign_access' property
        if (!isSuperAdmin && permission.hasOwnProperty('assign_access')) {
            const existingPerms = await getUserPermissions(permission.email)
            if (permission.assign_access !== (existingPerms?.assign_access ?? false)) {
                return { error: "Solo el administrador principal puede otorgar o quitar el permiso de 'Asignar Accesos'" }
            }
        }

        const { error } = await supabase
            .from("user_permissions")
            .upsert({
                ...permission,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'email'
            })

        if (error) throw error

        revalidatePath("/settings")
        return { success: true }
    } catch (error: any) {
        console.error("Error updating user permissions:", error)
        if (error.code === 'PGRST204' || error.message?.includes('manage_payment_orders')) {
            return {
                error: "La base de datos no ha sido actualizada. Por favor, ejecuta el script de migración SQL (011-rename-authorizations-to-payment-orders.sql)."
            }
        }
        return { error: `Error al actualizar permisos: ${error.message}` }
    }
}

export async function deleteUserPermissions(email: string) {
    try {
        const supabase = await createClient()

        // Check permissions
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user?.email) return { error: "No autenticado" }

        const currentUserPerms = await getUserPermissions(user.email)
        const isSuperAdmin = user.email === ADMIN_EMAIL
        const canAssign = isSuperAdmin || (currentUserPerms?.assign_access === true)

        if (!canAssign) {
            return { error: "No tienes permisos para realizar esta acción" }
        }

        // SECURITY: Only super-admin can delete a user who has 'assign_access'
        if (!isSuperAdmin) {
            const targetUserPerms = await getUserPermissions(email)
            if (targetUserPerms?.assign_access) {
                return { error: "Solo el administrador principal puede eliminar a un usuario con permiso de 'Asignar Accesos'" }
            }
        }

        const { error } = await supabase
            .from("user_permissions")
            .delete()
            .eq("email", email)

        if (error) throw error

        revalidatePath("/settings")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting user permissions:", error)
        return { error: `Error al eliminar permisos: ${error.message}` }
    }
}
