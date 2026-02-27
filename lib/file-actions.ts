"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface UploadedFile {
    id: string
    file_name: string
    file_url: string
    bucket: string
    module: string
    transaction_id?: string
    uploaded_by: string
    upload_date: string
    deleted_at?: string
    transaction_data?: any
}

export async function recordFileUpload(params: {
    file_name: string
    file_url: string
    bucket: string
    module: string
    transaction_id?: string
    uploaded_by: string
}) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("uploaded_files")
        .insert([{
            file_name: params.file_name,
            file_url: params.file_url,
            bucket: params.bucket,
            module: params.module,
            transaction_id: params.transaction_id,
            uploaded_by: params.uploaded_by,
        }])
        .select()

    if (error) {
        console.error("Error inserting file record:", error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getFileHistory(params?: {
    searchTerm?: string
    module?: string
}) {
    const supabase = await createClient()

    let query = supabase
        .from("uploaded_files")
        .select("*")
        .is("deleted_at", null)
        .order("upload_date", { ascending: false })

    if (params?.module && params.module !== 'all') {
        query = query.eq('module', params.module)
    }

    if (params?.searchTerm) {
        // Simple search by filename or email
        query = query.or(`file_name.ilike.%${params.searchTerm}%,uploaded_by.ilike.%${params.searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching file history:", error)
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as UploadedFile[] }
}

export async function getDeletedFiles() {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user?.email !== 'admin@atlasops.com') {
        return { success: false, error: "Unauthorized access to trash bin", data: [] }
    }

    const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })

    if (error) {
        console.error("Error fetching deleted files:", error)
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as UploadedFile[] }
}

export async function moveToTrash(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("uploaded_files")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)

    if (error) {
        console.error("Error moving file to trash:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/settings")
    return { success: true }
}

export async function restoreFromTrash(id: string) {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user?.email !== 'admin@atlasops.com') {
        return { success: false, error: "Unauthorized access to restore action" }
    }

    const { error } = await supabase
        .from("uploaded_files")
        .update({ deleted_at: null })
        .eq("id", id)

    if (error) {
        console.error("Error restoring file:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/settings")
    return { success: true }
}

export async function permanentlyDeleteFile(id: string, file_url: string, bucket: string) {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user?.email !== 'admin@atlasops.com') {
        return { success: false, error: "Unauthorized access to delete action" }
    }

    try {
        // 1. Delete from Supabase Storage
        // Extract the file path from the URL
        // e.g. https://.../storage/v1/object/public/vouchers/payroll/file.pdf -> payroll/file.pdf
        const urlParts = file_url.split(`/public/${bucket}/`)
        if (urlParts.length > 1) {
            const filePath = urlParts[1]
            const { error: storageError } = await supabase.storage
                .from(bucket)
                .remove([filePath])

            if (storageError) {
                console.error("Error deleting from storage:", storageError)
                // We continue anyway to ensure the DB record is removed
            }
        }

        // 2. Delete from Database
        const { error: dbError } = await supabase
            .from("uploaded_files")
            .delete()
            .eq("id", id)

        if (dbError) throw dbError

        revalidatePath("/settings")
        return { success: true }
    } catch (err: any) {
        console.error("Error permanently deleting file:", err)
        return { success: false, error: err.message }
    }
}

export async function getTransactionDetails(module: string, transactionId?: string) {
    if (!transactionId) return { success: true, data: null }

    const supabase = await createClient()

    try {
        let tableName = ""
        switch (module) {
            case "payroll": tableName = "payroll"; break;
            case "expense": tableName = "expenses"; break;
            case "income": tableName = "income"; break;
            case "orders": tableName = "payment_orders"; break;
            default: return { success: true, data: null }
        }

        const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", transactionId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found, maybe it was deleted
                return { success: true, data: { info: "Transacción original no encontrada o eliminada." } }
            }
            throw error
        }

        return { success: true, data }
    } catch (err: any) {
        console.error("Error fetching transaction details:", err)
        return { success: false, error: err.message, data: null }
    }
}
