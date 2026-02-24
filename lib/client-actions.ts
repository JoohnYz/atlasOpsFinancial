"use server"

import { createClient } from "@/lib/supabase/server"
import type { Client } from "./types"

export async function getClients(): Promise<Client[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("clients")
            .select("*")
            .order("name", { ascending: true })

        if (error) {
            console.error("Error fetching clients:", error.message)
            return []
        }

        return data || []
    } catch (error) {
        console.error("Error in getClients:", error)
        return []
    }
}

export async function createClientAction(clientData: Omit<Client, "id" | "created_at" | "updated_at">): Promise<{ success: boolean; data?: Client; error?: string }> {
    try {
        const supabase = await createClient()

        // Server-side validation for duplicates
        const { data: existingClientEmail, error: emailError } = await supabase
            .from("clients")
            .select("id")
            .eq("email", clientData.email)
            .single()

        if (existingClientEmail) {
            return { success: false, error: "Ya existe un cliente con este correo electrónico." }
        }

        const { data: existingClientDoc, error: docError } = await supabase
            .from("clients")
            .select("id")
            .eq("document_number", clientData.document_number)
            .single()

        if (existingClientDoc) {
            return { success: false, error: "Ya existe un cliente con este número de documento." }
        }

        const { data, error } = await supabase
            .from("clients")
            .insert([clientData])
            .select()
            .single()

        if (error) {
            console.error("Error creating client:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error("Error in createClientAction:", error)
        return { success: false, error: error.message || "Error al crear cliente" }
    }
}

export async function updateClientAction(id: string, clientData: Partial<Omit<Client, "id" | "created_at" | "updated_at">>): Promise<{ success: boolean; data?: Client; error?: string }> {
    try {
        const supabase = await createClient()

        // Validate duplicates only if they changed
        if (clientData.email) {
            const { data: existingEmail } = await supabase
                .from("clients")
                .select("id")
                .eq("email", clientData.email)
                .neq("id", id)
                .maybeSingle()

            if (existingEmail) return { success: false, error: "Ya existe otro cliente con este correo." }
        }

        if (clientData.document_number) {
            const { data: existingDoc } = await supabase
                .from("clients")
                .select("id")
                .eq("document_number", clientData.document_number)
                .neq("id", id)
                .maybeSingle()

            if (existingDoc) return { success: false, error: "Ya existe otro cliente con este documento." }
        }

        const { data, error } = await supabase
            .from("clients")
            .update(clientData)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("Error updating client:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error("Error in updateClientAction:", error)
        return { success: false, error: error.message || "Error al actualizar cliente" }
    }
}

export async function deleteClientAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("clients")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting client:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        console.error("Error in deleteClientAction:", error)
        return { success: false, error: error.message || "Error al eliminar cliente" }
    }
}
