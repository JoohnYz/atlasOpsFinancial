'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Authorization } from "./types"
import { getUserPermissions } from "./permission-actions"

export async function getPendingAuthorizations() {
    console.log("[Actions] getPendingAuthorizations")
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("payment_authorizations")
            .select("*")
            .eq("status", "pending")
            .order("date", { ascending: false })

        if (error) throw error

        return { data }
    } catch (error) {
        console.error("Error fetching pending authorizations:", error)
        return { error: "Error al obtener autorizaciones pendientes" }
    }
}

export async function getAuthorizationHistory() {
    console.log("[Actions] getAuthorizationHistory")
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("payment_authorizations")
            .select("*")
            .neq("status", "pending")
            .order("date", { ascending: false })
            .limit(20) // Limit to last 20 items

        if (error) throw error

        return { data }
    } catch (error) {
        console.error("Error fetching authorization history:", error)
        return { error: "Error al obtener el historial" }
    }
}

export async function createAuthorization(formData: FormData) {
    try {
        const supabase = await createClient()

        const description = formData.get("description") as string
        const amount = parseFloat(formData.get("amount") as string)
        const date = formData.get("date") as string
        const payment_method = formData.get("payment_method") as string
        const currency = formData.get("currency") as 'USD' | 'BS' || 'USD'
        const bank_name = formData.get("bank_name") as string | null
        const phone_number = formData.get("phone_number") as string | null
        const account_number = formData.get("account_number") as string | null
        const document_type = formData.get("document_type") as string | null
        const document_number = formData.get("document_number") as string | null
        const email = formData.get("email") as string | null
        const category = formData.get("category") as string | null

        if (!description || isNaN(amount) || !date || !payment_method) {
            return { error: "Faltan datos requeridos" }
        }

        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        const created_by = user?.email || 'unknown'

        const { error } = await supabase.from("payment_authorizations").insert({
            description,
            amount,
            date,
            payment_method,
            currency,
            bank_name,
            phone_number,
            account_number,
            document_type,
            document_number,
            email,
            category,
            status: "pending",
            created_by
        })

        if (error) {
            console.error("Supabase error creating authorization:", error)
            throw error
        }

        revalidatePath("/dashboard/authorizations")
        return { success: true }
    } catch (error: any) {
        console.error("Critical error in createAuthorization:", error)
        return { error: `Error al crear la autorización: ${error.message || "Error desconocido"}` }
    }
}

export async function updateAuthorizationStatus(id: string, status: "approved" | "rejected" | "pending") {
    console.log(`[Actions] START updateAuthorizationStatus: id=${id}, status=${status}`)
    try {
        const supabase = await createClient()

        // Server-side permission check
        console.log("[Actions] Checking session...")
        const { data: userData, error: userError } = await supabase.auth.getUser()
        const user = userData?.user

        if (userError) {
            console.error("[Actions] User session error:", userError)
            return { error: "Error de sesión: " + userError.message }
        }

        if (!user?.email) {
            console.warn("[Actions] No authenticated user found")
            return { error: "No autenticado" }
        }

        console.log(`[Actions] User identified: ${user.email}`)
        const permissions = await getUserPermissions(user.email)
        const canManage = user.email === 'admin@atlasops.com' || (permissions?.manage_authorizations ?? false)

        console.log(`[Actions] canManage check: ${canManage} (admin=${user.email === 'admin@atlasops.com'}, perm=${permissions?.manage_authorizations})`)

        if (!canManage) {
            console.warn(`[Actions] Forbidden: User ${user.email} lacks manage_authorizations`)
            return { error: "No tienes permiso para gestionar autorizaciones" }
        }

        console.log(`[Actions] Proceeding with DB update for id=${id}`)
        const { error: dbError } = await supabase
            .from("payment_authorizations")
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)

        if (dbError) {
            console.error(`[Actions] DB Update FAILED for ${id}:`, dbError)
            return { error: `Error en base de datos: ${dbError.message}` }
        }

        console.log(`[Actions] SUCCESS updated ${id} to ${status}`)
        revalidatePath("/dashboard/authorizations")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (err: any) {
        console.error("[Actions] UNEXPECTED ERROR in updateAuthorizationStatus:", err)
        return { error: `Error inesperado: ${err.message || "Error desconocido"}` }
    }
}

export async function updateAuthorization(id: string, formData: FormData) {
    try {
        const supabase = await createClient()

        const description = formData.get("description") as string
        const amount = parseFloat(formData.get("amount") as string)
        const date = formData.get("date") as string
        const payment_method = formData.get("payment_method") as string
        const currency = formData.get("currency") as 'USD' | 'BS' || 'USD'
        const bank_name = formData.get("bank_name") as string | null
        const phone_number = formData.get("phone_number") as string | null
        const account_number = formData.get("account_number") as string | null
        const document_type = formData.get("document_type") as string | null
        const document_number = formData.get("document_number") as string | null
        const email = formData.get("email") as string | null
        const category = formData.get("category") as string | null

        if (!description || isNaN(amount) || !date || !payment_method) {
            return { error: "Faltan datos requeridos" }
        }

        // Fetch current record to check status
        const { data: currentAuth, error: fetchError } = await supabase
            .from("payment_authorizations")
            .select("status")
            .eq("id", id)
            .single()

        if (fetchError) {
            console.error("Error fetching current authorization:", fetchError)
            return { error: "Error al verificar la autorización actual" }
        }

        const updateData: any = {
            description,
            amount,
            date,
            payment_method,
            currency,
            bank_name,
            phone_number,
            account_number,
            document_type,
            document_number,
            email,
            category,
            updated_at: new Date().toISOString()
        }

        // If it was rejected, set to pending and mark as rectified
        if (currentAuth.status === "rejected") {
            updateData.status = "pending"
            updateData.is_rectified = true
        }

        const { error } = await supabase
            .from("payment_authorizations")
            .update(updateData)
            .eq('id', id)

        if (error) {
            console.error("Supabase error updating authorization:", error)
            throw error
        }

        revalidatePath("/dashboard/authorizations")
        return { success: true }
    } catch (error: any) {
        console.error("Critical error in updateAuthorization:", error)
        return { error: `Error al actualizar la autorización: ${error.message || "Error desconocido"}` }
    }
}

export async function deleteAuthorization(id: string) {
    try {
        const supabase = await createClient()

        // SECURITY: Only super-admin can delete authorizations
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user?.email) return { error: "No autenticado" }

        if (user.email !== 'admin@atlasops.com') {
            return { error: "Solo el administrador principal puede eliminar autorizaciones" }
        }

        const { error } = await supabase
            .from("payment_authorizations")
            .delete()
            .eq("id", id)

        if (error) throw error

        revalidatePath("/dashboard/authorizations")
        return { success: true }
    } catch (error) {
        console.error("Error deleting authorization:", error)
        return { error: "Error al eliminar la autorización" }
    }
}
