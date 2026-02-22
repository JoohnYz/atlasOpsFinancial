import { getPaymentOrders, calculateMonthlyBalance } from "@/lib/data.server"
import { PaymentOrdersClient } from "@/components/payment-orders-client"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserPermissions } from "@/lib/permission-actions"

export default async function PaymentOrdersPage() {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user?.email) {
        redirect("/auth/login")
    }

    const permissions = await getUserPermissions(user.email)

    // Admin has full access, otherwise check specific permission
    if (user.email !== 'admin@atlasops.com' && (!permissions || !permissions.access_payment_orders)) {
        redirect("/dashboard")
    }

    const paymentOrders = await getPaymentOrders()
    const { balance, percentageChange, isIncrease } = await calculateMonthlyBalance()

    return (
        <PaymentOrdersClient
            initialPaymentOrders={paymentOrders}
            canManage={permissions?.manage_payment_orders || user.email === 'admin@atlasops.com'}
            isAdmin={user.email === 'admin@atlasops.com'}
        />
    )
}
