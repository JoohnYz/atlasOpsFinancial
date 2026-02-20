"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addPayrollAction(data: {
    staff_id: string
    amount: number
    period: string
    date: string
    employee_name?: string
    status?: string
}) {
    try {
        const supabase = await createClient()

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            throw new Error("No autorizado")
        }

        const { error } = await supabase.from("payroll").insert([
            {
                staff_id: data.staff_id,
                employee_name: data.employee_name || "",
                amount: data.amount,
                net_salary: data.amount,
                period: data.period,
                payment_date: data.date,
                status: data.status || "Pendiente",
            },
        ])

        if (error) {
            console.error("[v0] Action error adding payroll:", error)
            throw error
        }

        revalidatePath("/payroll")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error: any) {
        console.error("[v0] Server Action Exception:", error)
        return {
            success: false,
            error: error.message || "Error desconocido al procesar la nómina"
        }
    }
}

export async function updatePayrollStatusAction(id: string, status: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.from("payroll").update({ status }).eq("id", id)

        if (error) throw error

        revalidatePath("/payroll")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
