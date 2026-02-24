"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AmountTicker } from "@/components/ui/amount-ticker"
import Link from "next/link"

import { TrendingUp, TrendingDown, Wallet, Users } from "lucide-react"

const IconMap = {
    "trending-up": TrendingUp,
    "trending-down": TrendingDown,
    "wallet": Wallet,
    "users": Users,
} as const

interface Metric {
    label: string
    value: string | number
    change: string
    trend: "up" | "down" | "neutral"
    icon: keyof typeof IconMap
    color: string
    bg: string
    borderColor: string
    href: string
    isCurrency?: boolean
}

export function DashboardMetrics({ metrics }: { metrics: Metric[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((metric, index) => (
                <Link key={index} href={metric.href}>
                    <Card
                        className={`${metric.bg} border-2 ${metric.borderColor} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-full`}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${metric.bg} border ${metric.borderColor}`}>
                                    {(() => {
                                        const IconComponent = IconMap[metric.icon]
                                        return <IconComponent className={`w-6 h-6 ${metric.color}`} />
                                    })()}
                                </div>
                                <span
                                    className={`text-xs font-bold px-3 py-1 rounded-full ${metric.trend === "up" ? "bg-emerald-100/50 text-emerald-700 dark:text-emerald-400" : metric.trend === "down" ? "bg-red-100/50 text-red-700 dark:text-red-400" : "bg-secondary text-muted-foreground"}`}
                                >
                                    {metric.change}
                                </span>
                            </div>
                            <div>
                                <div className={`text-3xl font-bold font-sans ${metric.color}`}>
                                    {metric.isCurrency ? (
                                        <AmountTicker value={Number(metric.value)} prefix="$" />
                                    ) : (
                                        metric.value
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground font-medium mt-1">{metric.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
