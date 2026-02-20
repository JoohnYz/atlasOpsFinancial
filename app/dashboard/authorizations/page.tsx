import { getAuthorizations } from "@/lib/data.server"
import { AuthorizationsClient } from "@/components/authorizations-client"
import { CRMLayout } from "@/components/crm-layout"
import { calculateMonthlyBalance } from "@/lib/data.server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserPermissions } from "@/lib/permission-actions"

export default async function AuthorizationsPage() {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user?.email) {
        redirect("/auth/login")
    }

    const permissions = await getUserPermissions(user.email)

    // Admin has full access, otherwise check specific permission
    if (user.email !== 'admin@atlasops.com' && (!permissions || !permissions.access_authorizations)) {
        redirect("/dashboard")
    }

    const authorizations = await getAuthorizations()
    const { balance, percentageChange, isIncrease } = await calculateMonthlyBalance()

    return (
        <CRMLayout
            balance={balance}
            percentageChange={percentageChange}
            isIncrease={isIncrease}
        >
            <AuthorizationsClient
                initialAuthorizations={authorizations}
                canManage={permissions?.manage_authorizations || user.email === 'admin@atlasops.com'}
                isAdmin={user.email === 'admin@atlasops.com'}
            />
        </CRMLayout>
    )
}
