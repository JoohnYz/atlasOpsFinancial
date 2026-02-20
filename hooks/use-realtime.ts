"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * A hook to subscribe to real-time changes on a Supabase table.
 * 
 * @param table The table name to listen to
 * @param callback The function to call when a change occurs
 */
export function useRealtime(table: string, callback: () => void) {
    useEffect(() => {
        const supabase = createClient()

        // Subscribe to all changes (INSERT, UPDATE, DELETE) on the public schema
        const channel = supabase
            .channel(`realtime-changes:${table}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: table,
                },
                (payload) => {
                    console.log(`[Realtime] Change detected in ${table}:`, payload)
                    callback()
                },
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] Subscribed to changes in ${table}`)
                }
            })

        return () => {
            console.log(`[Realtime] Unsubscribing from changes in ${table}`)
            supabase.removeChannel(channel)
        }
    }, [table, callback])
}
