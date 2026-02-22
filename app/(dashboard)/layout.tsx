"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard, TrendingDown, TrendingUp, Users, Wallet,
    BarChart3, Settings, LogOut, ShieldCheck, Building
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationsBell } from "@/components/notifications-bell"
import { getUserPermissions } from "@/lib/permission-actions"
import { UserPermission } from "@/lib/types"
import { useSmartCache } from "@/hooks/use-smart-cache"
import { clearCachedData } from "@/lib/smart-cache"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { MonthlyBalanceCard } from "@/components/monthly-balance-card"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
    { name: "Ingresos", href: "/income", icon: TrendingUp, permission: "access_income" },
    { name: "Gastos", href: "/expenses", icon: TrendingDown, permission: "access_expenses" },
    { name: "Personal", href: "/staff", icon: Users, permission: "access_staff" },
    { name: "Nómina", href: "/payroll", icon: Wallet, permission: "access_payroll" },
    { name: "Reportes", href: "/reports", icon: BarChart3, permission: "access_reports" },
    { name: "Ordenes de pago", href: "/dashboard/payment-orders", icon: ShieldCheck, permission: "access_payment_orders" },
    { name: "Bancos", href: "/dashboard/banks", icon: Building, permission: "access_banks" },
    { name: "Configuración", href: "/settings", icon: Settings, permission: null },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        const initUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) {
                setUserEmail(user.email)
            }
        }
        initUser()
    }, [])

    const fetchPermissions = React.useCallback(async () => {
        if (!userEmail) return null
        console.log(`[DashboardLayout] Fetching permissions for: ${userEmail}`)
        return await getUserPermissions(userEmail)
    }, [userEmail])

    // Reactive permissions using Smart Cache and Real-time
    const { data: permissions } = useSmartCache<UserPermission | null>(
        'user_permissions',
        fetchPermissions,
        null,
        'user_permissions' // Invalidate on user_permissions table changes
    )

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        clearCachedData() // Clear all cache
        router.push('/auth/login')
        router.refresh()
    }

    const filteredNavigation = navigation.filter(item => {
        if (permissions?.email === 'admin@atlasops.com') return true
        if (!item.permission) return true
        return permissions ? (permissions as any)[item.permission] : false
    })

    const NavContent = () => (
        <>
            <nav className="space-y-1 px-3">
                {filteredNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            <div className="mt-6 border-t border-sidebar-border/50 pt-4">
                <MonthlyBalanceCard />
            </div>
        </>
    )

    return (
        <div className="min-h-screen bg-background">
            <header className="h-20 border-b border-border bg-background shadow-sm px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent/50">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
                            <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
                                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="py-6">
                                <NavContent />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="relative">
                        <Image
                            src="/images/qocudl4nzvcitky1762190700.png"
                            alt="AtlasOps Financial"
                            width={140}
                            height={140}
                            className="object-cover -my-6 dark:hidden"
                            priority
                        />
                        <Image
                            src="/images/atlas-logo-blanco.png"
                            alt="AtlasOps Financial"
                            width={140}
                            height={140}
                            className="object-cover -my-6 hidden dark:block"
                            priority
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <NotificationsBell
                        canAccess={permissions?.email === 'admin@atlasops.com' || permissions?.access_payment_orders === true}
                        canManage={permissions?.email === 'admin@atlasops.com' || permissions?.manage_payment_orders === true}
                        currentUserEmail={permissions?.email}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Cerrar sesión</span>
                    </Button>
                </div>
            </header>

            <div className="flex">
                <aside className="hidden md:block w-72 border-r border-sidebar-border bg-sidebar h-[calc(100vh-5rem)] overflow-y-auto sticky top-20">
                    <div className="py-8">
                        <NavContent />
                    </div>
                </aside>

                <main className="flex-1 p-4 md:p-8 lg:p-10 min-h-[calc(100vh-4rem)] overflow-x-hidden bg-background">
                    {children}
                </main>
            </div>
        </div>
    )
}
