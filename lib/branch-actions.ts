"use server"

import { createClient } from "@/lib/supabase/server"
import type { Branch } from "./types"

export async function getBranches(): Promise<Branch[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("branches")
            .select("*")
            .order("name", { ascending: true })

        if (error) {
            console.error("Error fetching branches:", error.message)
            return []
        }

        return data || []
    } catch (error) {
        console.error("Error in getBranches:", error)
        return []
    }
}

export async function createBranchAction(branchData: Omit<Branch, "id" | "created_at" | "updated_at">): Promise<{ success: boolean; data?: Branch; error?: string }> {
    try {
        const supabase = await createClient()

        // Validation for duplicates by name
        const { data: existingName } = await supabase
            .from("branches")
            .select("id")
            .eq("name", branchData.name)
            .maybeSingle()

        if (existingName) {
            return { success: false, error: "Ya existe una sucursal con este nombre." }
        }

        // Validation for duplicates by code
        const { data: existingCode } = await supabase
            .from("branches")
            .select("id")
            .eq("code", branchData.code)
            .maybeSingle()

        if (existingCode) {
            return { success: false, error: "Ya existe una sucursal con este código." }
        }

        const { data, error } = await supabase
            .from("branches")
            .insert([branchData])
            .select()
            .single()

        if (error) {
            console.error("Error creating branch:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error("Error in createBranchAction:", error)
        return { success: false, error: error.message || "Error al crear sucursal" }
    }
}

export async function updateBranchAction(id: string, branchData: Partial<Omit<Branch, "id" | "created_at" | "updated_at">>): Promise<{ success: boolean; data?: Branch; error?: string }> {
    try {
        const supabase = await createClient()

        if (branchData.name) {
            const { data: existingName } = await supabase
                .from("branches")
                .select("id")
                .eq("name", branchData.name)
                .neq("id", id)
                .maybeSingle()

            if (existingName) return { success: false, error: "Ya existe otra sucursal con este nombre." }
        }

        if (branchData.code) {
            const { data: existingCode } = await supabase
                .from("branches")
                .select("id")
                .eq("code", branchData.code)
                .neq("id", id)
                .maybeSingle()

            if (existingCode) return { success: false, error: "Ya existe otra sucursal con este código." }
        }

        const { data, error } = await supabase
            .from("branches")
            .update(branchData)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("Error updating branch:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error("Error in updateBranchAction:", error)
        return { success: false, error: error.message || "Error al actualizar sucursal" }
    }
}

export async function deleteBranchAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("branches")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting branch:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        console.error("Error in deleteBranchAction:", error)
        return { success: false, error: error.message || "Error al eliminar sucursal" }
    }
}
