const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rsgpbkdyivimfpwnixtv.supabase.co'
const supabaseKey = 'sb_publishable_NZJkc2qfeqHFAof7uq9ILg_0JvwbmL4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
    console.log("Checking user_permissions table...")
    const { data, error } = await supabase.from('user_permissions').select('*').limit(1)
    if (error) {
        console.error("Error detected:", error)
        if (error.code === '42P01') {
            console.log("CRITICAL: Table 'user_permissions' does NOT exist.")
        }
    } else {
        console.log("Table 'user_permissions' exists and is accessible.")
        console.log("Sample data:", data)
    }
}

checkTable()
