'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { UserSignature } from "./types"

export async function getUserSignature(email: string): Promise<UserSignature | null> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from("user_signatures")
            .select("*")
            .eq("user_email", email)
            .maybeSingle()

        if (error) {
            console.error(`[SignatureAction] Error fetching signature for ${email}:`, error.message)
            return null
        }

        return data
    } catch (error) {
        console.error("[SignatureAction] Error details:", error)
        return null
    }
}

export async function upsertUserSignature(data: { user_email: string, signer_name: string, signature_data: string }) {
    try {
        const supabase = await createClient()

        // Auth check
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user?.email) return { error: "No autenticado" }

        // Make sure user is only updating their own signature
        if (user.email !== data.user_email && user.email !== 'admin@atlasops.com') {
            return { error: "No tienes permisos para modificar esta firma" }
        }

        const { error } = await supabase
            .from("user_signatures")
            .upsert({
                user_email: data.user_email,
                signer_name: data.signer_name,
                signature_data: data.signature_data,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_email'
            })

        if (error) throw error

        revalidatePath("/settings")
        return { success: true }
    } catch (error: any) {
        console.error("Error upserting user signature:", error)
        if (
            error.code === '42P01' // undefined_table
        ) {
            return {
                error: "La base de datos no ha sido actualizada. Por favor, ejecuta el script de migración SQL correspondiente (018) en Supabase."
            }
        }
        return { error: `Error al guardar firma: ${error.message}` }
    }
}
