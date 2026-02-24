"use server"

import { calculateMonthlyBalance } from "./data.server"

export async function getSidebarBalance() {
    try {
        const balanceData = await calculateMonthlyBalance()
        return {
            balance: balanceData.balance,
            overallBalance: balanceData.overallBalance,
            percentageChange: balanceData.percentageChange,
            isIncrease: balanceData.isIncrease,
        }
    } catch (error: any) {
        console.error("[Actions] Error fetching sidebar balance:", error)
        return {
            balance: 0,
            overallBalance: 0,
            percentageChange: "0.0",
            isIncrease: false,
            error: error.message || "Error al obtener balance"
        }
    }
}
