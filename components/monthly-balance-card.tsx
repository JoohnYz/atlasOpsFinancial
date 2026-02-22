"use client"

import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
import { getSidebarBalance } from "@/lib/balance-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSmartCache } from "@/hooks/use-smart-cache"
import { useRealtime } from "@/hooks/use-realtime"

export function MonthlyBalanceCard() {
    // Use Smart Cache for persistence across page changes
    const { data, loading, refresh } = useSmartCache(
        'sidebar_general_balance',
        getSidebarBalance,
        null
    )

    // Listen to all relevant tables for real-time balance updates
    useRealtime('income', refresh)
    useRealtime('expenses', refresh)
    useRealtime('payroll', refresh)

    if (loading && !data) {
        return (
            <div className="px-4 py-2">
                <Skeleton className="h-24 w-full rounded-xl bg-secondary animate-pulse" />
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="px-4 py-2">
            <Card className="border-0 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white shadow-lg overflow-hidden relative group transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                <CardContent className="p-4 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold tracking-wider text-blue-100 uppercase opacity-90">Balance General</p>
                        <div className="p-1 rounded-lg bg-white/10">
                            <Wallet className="w-3.5 h-3.5 text-blue-100" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold font-sans tracking-tight">${data.overallBalance.toLocaleString()}</p>
                    <div className="mt-3 flex items-center gap-1.5">
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${data.isIncrease ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'}`}>
                            {data.isIncrease ? (
                                <ArrowUpRight className="w-2.5 h-2.5" />
                            ) : (
                                <ArrowDownRight className="w-2.5 h-2.5" />
                            )}
                            {data.isIncrease ? "+" : ""}{data.percentageChange}%
                        </div>
                        <p className="text-[9px] font-medium text-blue-200/80 italic">vs mes anterior</p>
                    </div>
                </CardContent>
                {/* Abstract background shapes */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-16 h-16 bg-blue-400/10 rounded-full blur-xl" />
            </Card>
        </div>
    )
}
