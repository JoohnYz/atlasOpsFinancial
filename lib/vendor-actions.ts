"use server"

import { createClient } from "@/lib/supabase/server"
import type { Vendor } from "./types"

export async function getVendors(): Promise<Vendor[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("vendors")
            .select("*")
            .order("name", { ascending: true })

        if (error) {
            console.error("Error fetching vendors:", error.message)
            return []
        }

        return data || []
    } catch (error) {
        console.error("Error in getVendors:", error)
        return []
    }
}

export async function createVendorAction(vendorData: Omit<Vendor, "id" | "created_at" | "updated_at">): Promise<{ success: boolean; data?: Vendor; error?: string }> {
    try {
        const supabase = await createClient()

        // Validation for duplicates by name
        const { data: existingName } = await supabase
            .from("vendors")
            .select("id")
            .eq("name", vendorData.name)
            .maybeSingle()

        if (existingName) {
            return { success: false, error: "Ya existe un proveedor con este nombre." }
        }

        // Validation for duplicates by RIF
        const { data: existingRif } = await supabase
            .from("vendors")
            .select("id")
            .eq("rif", vendorData.rif)
            .maybeSingle()

        if (existingRif) {
            return { success: false, error: "Ya existe un proveedor con este RIF." }
        }

        const { data, error } = await supabase
            .from("vendors")
            .insert([vendorData])
            .select()
            .single()

        if (error) {
            console.error("Error creating vendor:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error("Error in createVendorAction:", error)
        return { success: false, error: error.message || "Error al crear proveedor" }
    }
}

export async function updateVendorAction(id: string, vendorData: Partial<Omit<Vendor, "id" | "created_at" | "updated_at">>): Promise<{ success: boolean; data?: Vendor; error?: string }> {
    try {
        const supabase = await createClient()

        if (vendorData.name) {
            const { data: existingName } = await supabase
                .from("vendors")
                .select("id")
                .eq("name", vendorData.name)
                .neq("id", id)
                .maybeSingle()

            if (existingName) return { success: false, error: "Ya existe otro proveedor con este nombre." }
        }

        if (vendorData.rif) {
            const { data: existingRif } = await supabase
                .from("vendors")
                .select("id")
                .eq("rif", vendorData.rif)
                .neq("id", id)
                .maybeSingle()

            if (existingRif) return { success: false, error: "Ya existe otro proveedor con este RIF." }
        }

        const { data, error } = await supabase
            .from("vendors")
            .update(vendorData)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("Error updating vendor:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error("Error in updateVendorAction:", error)
        return { success: false, error: error.message || "Error al actualizar proveedor" }
    }
}

export async function deleteVendorAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("vendors")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting vendor:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        console.error("Error in deleteVendorAction:", error)
        return { success: false, error: error.message || "Error al eliminar proveedor" }
    }
}
