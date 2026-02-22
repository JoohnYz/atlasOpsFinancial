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
    } catch (error) {
        console.error("Error fetching sidebar balance:", error)
        return null
    }
}
