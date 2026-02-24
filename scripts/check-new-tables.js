const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rsgpbkdyivimfpwnixtv.supabase.co'
const supabaseKey = 'sb_publishable_NZJkc2qfeqHFAof7uq9ILg_0JvwbmL4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    console.log("Checking tables...")

    const checkTable = async (name) => {
        try {
            const { error } = await supabase.from(name).select('*').limit(1)
            if (error) {
                console.log(`❌ Table '${name}' check failed:`, error.message)
                return false
            }
            console.log(`✅ Table '${name}' is OK.`)
            return true
        } catch (e) {
            console.log(`❌ Table '${name}' check crashed:`, e.message)
            return false
        }
    }

    await checkTable('categories')
    await checkTable('clients')
    await checkTable('branches')
    await checkTable('vendors')
}

checkTables()
