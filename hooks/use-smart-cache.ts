"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getCachedData, setCachedData } from "@/lib/smart-cache"
import { useRealtime } from "./use-realtime"

/**
 * A hook that provides cached data with real-time invalidation support.
 * 
 * @param key The cache key
 * @param fetcher The function to fetch fresh data
 * @param initialData Optional initial data
 * @param tableName Optional table name to listen for real-time changes to invalidate cache
 */
export function useSmartCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    initialData: T | null = null,
    tableName?: string
) {
    const [data, setData] = useState<T | null>(initialData)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    const refresh = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        try {
            const freshData = await fetcher()
            if (isMounted.current) {
                setCachedData(key, freshData)
                setData(freshData)
                setError(null)
            }
        } catch (err: any) {
            console.error(`[useSmartCache] Error fetching fresh data for ${key}:`, err)
            if (isMounted.current) setError(err)
        } finally {
            if (!isSilent && isMounted.current) setLoading(false)
        }
    }, [key, fetcher])

    // Initial load from cache or fetch
    useEffect(() => {
        const cached = getCachedData<T>(key)
        if (cached !== null) {
            setData(cached)
            refresh(true) // Silent refresh to ensure data is still accurate
        } else {
            refresh()
        }
    }, [key, refresh])

    // Optional real-time invalidation
    useRealtime(tableName || '', useCallback(() => {
        if (tableName) {
            console.log(`[useSmartCache] Cache invalidated for ${key} due to changes in ${tableName}`)
            refresh(true) // Silent refresh
        }
    }, [key, tableName, refresh]))

    return { data, loading, error, refresh }
}
