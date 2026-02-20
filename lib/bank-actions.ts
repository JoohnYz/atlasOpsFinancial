'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Bank } from "./types"

export async function createBank(formData: FormData) {
    try {
        const supabase = await createClient()

        const bank_name = formData.get("bank_name") as string
        const account_holder = formData.get("account_holder") as string
        const document_type = formData.get("document_type") as string
        const document_number = formData.get("document_number") as string
        const email = formData.get("email") as string
        const phone_number = formData.get("phone_number") as string

        if (!bank_name || !account_holder || !document_type || !document_number || !email || !phone_number) {
            return { error: "Faltan datos requeridos" }
        }

        // Check for duplicates
        const { data: existingBank, error: checkError } = await supabase
            .from("banks")
            .select("id")
            .eq("bank_name", bank_name)
            .eq("account_holder", account_holder)
            .eq("document_type", document_type)
            .eq("document_number", document_number)
            .eq("email", email)
            .eq("phone_number", phone_number)
            .maybeSingle()

        if (checkError) {
            console.error("Error checking for duplicate bank:", checkError)
        }

        if (existingBank) {
            return { error: "Ya existe una cuenta con exactamente estos mismos datos." }
        }


        const { error } = await supabase.from("banks").insert({
            bank_name,
            account_holder,
            document_type,
            document_number,
            email,
            phone_number
        })

        if (error) {
            console.error("Supabase error creating bank:", error)
            throw error
        }

        revalidatePath("/banks")
        return { success: true }
    } catch (error: any) {
        console.error("Critical error in createBank:", error)
        return { error: `Error al registrar el banco: ${error.message || "Error desconocido"}` }
    }
}

export async function updateBank(id: string, formData: FormData) {
    try {
        const supabase = await createClient()

        const bank_name = formData.get("bank_name") as string
        const account_holder = formData.get("account_holder") as string
        const document_type = formData.get("document_type") as string
        const document_number = formData.get("document_number") as string
        const email = formData.get("email") as string
        const phone_number = formData.get("phone_number") as string

        if (!bank_name || !account_holder || !document_type || !document_number || !email || !phone_number) {
            return { error: "Faltan datos requeridos" }
        }

        // Check for duplicates (excluding current ID)
        const { data: existingBank, error: checkError } = await supabase
            .from("banks")
            .select("id")
            .eq("bank_name", bank_name)
            .eq("account_holder", account_holder)
            .eq("document_type", document_type)
            .eq("document_number", document_number)
            .eq("email", email)
            .eq("phone_number", phone_number)
            .neq("id", id)
            .maybeSingle()

        if (checkError) {
            console.error("Error checking for duplicate bank on update:", checkError)
        }

        if (existingBank) {
            return { error: "Ya existe una cuenta con exactamente estos mismos datos." }
        }


        const { error } = await supabase
            .from("banks")
            .update({
                bank_name,
                account_holder,
                document_type,
                document_number,
                email,
                phone_number,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) {
            console.error("Supabase error updating bank:", error)
            throw error
        }

        revalidatePath("/banks")
        return { success: true }
    } catch (error: any) {
        console.error("Critical error in updateBank:", error)
        return { error: `Error al actualizar el banco: ${error.message || "Error desconocido"}` }
    }
}

export async function deleteBank(id: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from("banks")
            .delete()
            .eq("id", id)

        if (error) throw error

        revalidatePath("/banks")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting bank:", error)
        return { error: `Error al eliminar el banco: ${error.message || "Error desconocido"}` }
    }
}
