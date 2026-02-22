"use client"

import type React from "react"

interface CRMLayoutProps {
  children: React.ReactNode
  balance?: number
  percentageChange?: string
  isIncrease?: boolean
}

/**
 * @deprecated Use DashboardLayout in app/(dashboard)/layout.tsx for better persistence.
 * This component now only acts as a pass-through to avoid breaking existing pages during transition.
 */
export function CRMLayout({ children }: CRMLayoutProps) {
  return <>{children}</>
}
