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

        // Check for duplicate payroll: same employee + same period
        const { data: existing, error: checkError } = await supabase
            .from("payroll")
            .select("id, employee_name, status")
            .eq("staff_id", data.staff_id)
            .eq("period", data.period)
            .limit(1)

        if (checkError) {
            console.error("[v0] Error checking duplicate payroll:", checkError)
            throw checkError
        }

        if (existing && existing.length > 0) {
            const statusText = existing[0].status ? ` (Estado: ${existing[0].status})` : ""
            throw new Error(
                `Ya existe un pago de nómina registrado para ${data.employee_name || "este empleado"} en el período "${data.period}"${statusText}. No se permiten pagos duplicados.`
            )
        }

        const { error } = await supabase.from("payroll").insert([
            {
                staff_id: data.staff_id,
                employee_name: data.employee_name || "",
                amount: data.amount,
                net_salary: data.amount,
                period: data.period,
                date: data.date,
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

        let friendlyMessage = "Error desconocido al procesar la nómina"

        const msg = error.message || ""

        if (msg.includes("null value") && msg.includes("\"date\"")) {
            friendlyMessage = "La fecha de pago es obligatoria. Por favor, seleccione una fecha."
        } else if (msg.includes("null value") && msg.includes("\"payment_date\"")) {
            friendlyMessage = "La fecha de pago es obligatoria. Por favor, seleccione una fecha."
        } else if (msg.includes("null value") && msg.includes("\"amount\"")) {
            friendlyMessage = "El monto es obligatorio. Por favor, ingrese un monto válido."
        } else if (msg.includes("null value") && msg.includes("\"staff_id\"")) {
            friendlyMessage = "Debe seleccionar un empleado."
        } else if (msg.includes("null value") && msg.includes("\"period\"")) {
            friendlyMessage = "El período es obligatorio. Por favor, seleccione un período."
        } else if (msg.includes("not-null constraint")) {
            friendlyMessage = "Faltan campos obligatorios. Por favor, complete todos los campos requeridos."
        } else if (msg.includes("No autorizado")) {
            friendlyMessage = "No tiene permisos para realizar esta acción. Inicie sesión nuevamente."
        } else if (msg !== "") {
            friendlyMessage = msg
        }

        return {
            success: false,
            error: friendlyMessage
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

export async function deletePayrollAction(id: string) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            throw new Error("No autorizado")
        }

        // Fetch current payment status
        const { data: payment, error: fetchError } = await supabase
            .from("payroll")
            .select("status")
            .eq("id", id)
            .single()

        if (fetchError || !payment) {
            throw new Error("Pago no encontrado")
        }

        const isAdmin = user.email === "admin@atlasops.com"
        const isPending = payment.status === "pending" || payment.status === "Pendiente"

        if (!isAdmin && !isPending) {
            throw new Error("Solo los pagos pendientes pueden ser eliminados")
        }

        const { error } = await supabase.from("payroll").delete().eq("id", id)

        if (error) {
            console.error("[v0] Error deleting payroll:", error)
            throw error
        }

        revalidatePath("/payroll")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error: any) {
        console.error("[v0] Server Action Exception (delete):", error)
        return {
            success: false,
            error: error.message || "Error al eliminar el pago de nómina"
        }
    }
}

export async function updatePayrollAction(id: string, data: {
    staff_id: string
    amount: number
    period: string
    date: string
    employee_name?: string
}) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            throw new Error("No autorizado")
        }

        // Check for duplicate payroll (same employee + period), excluding the current record
        const { data: existing, error: checkError } = await supabase
            .from("payroll")
            .select("id")
            .eq("staff_id", data.staff_id)
            .eq("period", data.period)
            .neq("id", id)
            .limit(1)

        if (checkError) {
            console.error("[v0] Error checking duplicate payroll:", checkError)
            throw checkError
        }

        if (existing && existing.length > 0) {
            throw new Error(
                `Ya existe otro pago de nómina para ${data.employee_name || "este empleado"} en el período "${data.period}". No se permiten pagos duplicados.`
            )
        }

        const { error } = await supabase.from("payroll").update({
            staff_id: data.staff_id,
            employee_name: data.employee_name || "",
            amount: data.amount,
            net_salary: data.amount,
            period: data.period,
            date: data.date,
            payment_date: data.date,
        }).eq("id", id)

        if (error) {
            console.error("[v0] Error updating payroll:", error)
            throw error
        }

        revalidatePath("/payroll")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error: any) {
        console.error("[v0] Server Action Exception (update):", error)
        return {
            success: false,
            error: error.message || "Error al actualizar el pago de nómina"
        }
    }
}
