"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, TrendingDown, TrendingUp, Users, Wallet, BarChart3, Settings, Menu, X, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationsBell } from "@/components/notifications-bell"
import { ModeToggle } from "@/components/mode-toggle"
import { getUserPermissions } from "@/lib/permission-actions"
import { UserPermission } from "@/lib/types"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { name: "Ingresos", href: "/income", icon: TrendingUp, permission: "access_income" },
  { name: "Gastos", href: "/expenses", icon: TrendingDown, permission: "access_expenses" },
  { name: "Personal", href: "/staff", icon: Users, permission: "access_staff" },
  { name: "Nómina", href: "/payroll", icon: Wallet, permission: "access_payroll" },
  { name: "Reportes", href: "/reports", icon: BarChart3, permission: "access_reports" },
  { name: "Autorizaciones", href: "/dashboard/authorizations", icon: ShieldCheck, permission: "access_authorizations" },
  { name: "Configuración", href: "/settings", icon: Settings, permission: null },
]

interface CRMLayoutProps {
  children: React.ReactNode
  balance?: number
  percentageChange?: string
  isIncrease?: boolean
}

export function CRMLayout({ children, balance, percentageChange, isIncrease }: CRMLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [permissions, setPermissions] = useState<UserPermission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        console.log("[CRMLayout] Fetching permissions...")
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.email) {
          console.log(`[CRMLayout] Fetching permissions for: ${user.email}`)
          const userPerms = await getUserPermissions(user.email)
          setPermissions(userPerms)
          console.log("[CRMLayout] Permissions set:", !!userPerms)
        } else {
          console.log("[CRMLayout] No user session found")
        }
      } catch (err) {
        console.error("[CRMLayout] Error initializing layout:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const filteredNavigation = navigation.filter(item => {
    // Admin always has access
    if (permissions?.email === 'admin@atlasops.com') return true

    // Items with no specific permission requirement are visible to all
    if (!item.permission) return true

    // Check specific permission
    return permissions ? (permissions as any)[item.permission] : false
  })

  const NavContent = () => (
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
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="h-20 border-b border-border bg-background shadow-sm px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
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
              {(permissions?.email === 'admin@atlasops.com' || permissions?.access_reports === true) && (
                <div className="px-4 pb-6">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg border-0">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wide">Balance del mes</p>
                    <p className="text-3xl font-bold mt-2 font-sans">
                      ${balance !== undefined ? balance.toLocaleString() : "0"}
                    </p>
                    <p className="text-blue-100 text-xs mt-2 font-medium flex items-center gap-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${isIncrease ? "bg-emerald-400" : "bg-red-400"}`}
                      ></span>
                      {isIncrease ? "+" : "-"}
                      {percentageChange || "0"}% vs mes anterior
                    </p>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Logo in header */}
          {/* Logo in header */}
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
            canAccess={permissions?.email === 'admin@atlasops.com' || permissions?.access_authorizations === true}
            canManage={permissions?.email === 'admin@atlasops.com' || permissions?.manage_authorizations === true}
            currentUserEmail={permissions?.email}
          />

          {/* Logout button */}
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
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 border-r border-sidebar-border bg-sidebar h-[calc(100vh-5rem)] overflow-y-auto sticky top-20">
          <div className="py-8">
            <NavContent />
          </div>

          {(permissions?.email === 'admin@atlasops.com' || permissions?.access_reports === true) && (
            <div className="px-4 pb-6">
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg border-0">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wide">Balance del mes</p>
                <p className="text-3xl font-bold mt-2 font-sans">
                  ${balance !== undefined ? balance.toLocaleString() : "0"}
                </p>
                <p className="text-blue-100 text-xs mt-2 font-medium flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${isIncrease ? "bg-emerald-400" : "bg-red-400"}`}
                  ></span>
                  {isIncrease ? "+" : "-"}
                  {percentageChange || "0"}% vs mes anterior
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 min-h-[calc(100vh-4rem)] overflow-x-hidden bg-background">
          {children}
        </main>
      </div>
    </div >
  )
}
