"use client"

/**
 * Simple client-side cache utility using localStorage
 */

export const getCachedData = <T>(key: string): T | null => {
    if (typeof window === "undefined") return null

    try {
        const item = window.localStorage.getItem(`atlas_cache_${key}`)
        return item ? JSON.parse(item) : null
    } catch (error) {
        console.error(`[SmartCache] Error reading from localStorage:`, error)
        return null
    }
}

export const setCachedData = <T>(key: string, data: T): void => {
    if (typeof window === "undefined") return

    try {
        window.localStorage.setItem(`atlas_cache_${key}`, JSON.stringify(data))
    } catch (error) {
        console.error(`[SmartCache] Error writing to localStorage:`, error)
    }
}

export const clearCachedData = (key?: string): void => {
    if (typeof window === "undefined") return

    if (key) {
        window.localStorage.removeItem(`atlas_cache_${key}`)
    } else {
        // Clear all atlas related cache
        Object.keys(window.localStorage)
            .filter(k => k.startsWith('atlas_cache_'))
            .forEach(k => window.localStorage.removeItem(k))
    }
}
