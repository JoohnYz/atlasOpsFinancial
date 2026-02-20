import { createClient } from "./lib/supabase/server"

async function checkSchema() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('user_permissions')
            .select('*')
            .limit(1)

        if (error) {
            console.error("Error fetching user_permissions:", error)
            return
        }

        if (data && data.length > 0) {
            console.log("Columns found:", Object.keys(data[0]))
        } else {
            console.log("No rows found in user_permissions to check columns.")
        }
    } catch (err) {
        console.error("Critical error checking schema:", err)
    }
}

checkSchema()
