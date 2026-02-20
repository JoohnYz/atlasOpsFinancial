import { createClient } from "./lib/supabase/server"

async function debug() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.from('user_permissions').select('*').limit(1)
        if (error) {
            console.error("Supabase Error:", error)
        } else {
            console.log("Success! Data:", data)
        }
    } catch (e) {
        console.error("Catch Error:", e)
    }
}

debug()
