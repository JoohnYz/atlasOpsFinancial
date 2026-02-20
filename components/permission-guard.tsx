"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getUserPermissions } from "@/lib/permission-actions"
import { UserPermission } from "@/lib/types"

interface PermissionGuardProps {
    children: React.ReactNode
    permission: keyof Omit<UserPermission, 'id' | 'email' | 'created_at' | 'updated_at'>
}

export function PermissionGuard({ children, permission }: PermissionGuardProps) {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        const checkPermission = async () => {
            try {
                console.log(`[PermissionGuard] Checking permission: ${permission}`)
                const supabase = createClient()
                const { data: { user }, error: userError } = await supabase.auth.getUser()

                if (userError) {
                    console.error("[PermissionGuard] Auth error:", userError)
                    return
                }

                if (!user?.email) {
                    console.log("[PermissionGuard] No user found, redirecting to login")
                    router.push("/auth/login")
                    return
                }

                console.log(`[PermissionGuard] User: ${user.email}`)
                const perms = await getUserPermissions(user.email)

                if (user.email === 'admin@atlasops.com') {
                    console.log("[PermissionGuard] Admin detected, granting access")
                    setIsAuthorized(true)
                    return
                }

                if (perms && (perms as any)[permission]) {
                    console.log(`[PermissionGuard] Permission ${permission} granted`)
                    setIsAuthorized(true)
                } else {
                    console.warn(`[PermissionGuard] Permission ${permission} denied for ${user.email}`)
                    setIsAuthorized(false)
                    router.push("/dashboard")
                }
            } catch (err) {
                console.error("[PermissionGuard] Fatal error:", err)
                setIsAuthorized(false)
            }
        }

        checkPermission()
    }, [permission, router])

    if (isAuthorized === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (isAuthorized === false) {
        return null // Redirection happens in useEffect
    }

    return <>{children}</>
}
