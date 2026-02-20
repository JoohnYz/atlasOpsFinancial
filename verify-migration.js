const { createClient } = require('@supabase/supabase-js')

// Hardcoded from .env.local and check-table.js
const supabaseUrl = 'https://rsgpbkdyivimfpwnixtv.supabase.co'
const supabaseKey = 'sb_publishable_NZJkc2qfeqHFAof7uq9ILg_0JvwbmL4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMigration() {
    console.log("--- Migration Verification ---")

    // Check for payment_orders table
    const { data: oData, error: oError } = await supabase.from('payment_orders').select('*').limit(1)
    if (oError) {
        if (oError.code === '42P01') {
            console.log("❌ Table 'payment_orders' does NOT exist yet.")
        } else {
            console.error("Error checking 'payment_orders':", oError.message)
        }
    } else {
        console.log("✅ Table 'payment_orders' exists and is accessible.")
    }

    // Check for payment_authorizations table (should be gone)
    const { data: aData, error: aError } = await supabase.from('payment_authorizations').select('*').limit(1)
    if (aError) {
        if (aError.code === '42P01') {
            console.log("✅ Table 'payment_authorizations' has been renamed/removed.")
        } else {
            console.error("Error checking 'payment_authorizations':", aError.message)
        }
    } else {
        console.log("⚠️ Table 'payment_authorizations' STILL exists. Migration likely not run.")
    }

    // Check user_permissions columns
    const { data: pData, error: pError } = await supabase.from('user_permissions').select('*').limit(1)
    if (pError) {
        console.error("Error checking 'user_permissions':", pError.message)
    } else if (pData && pData.length > 0) {
        const firstRow = pData[0]
        const columns = Object.keys(firstRow)

        if (columns.includes('access_payment_orders')) {
            console.log("✅ 'access_payment_orders' column exists in 'user_permissions'.")
        } else {
            console.log("❌ 'access_payment_orders' column is MISSING in 'user_permissions'.")
        }

        if (columns.includes('access_authorizations')) {
            console.log("⚠️ 'access_authorizations' column STILL exists in 'user_permissions'.")
        } else {
            console.log("✅ 'access_authorizations' column has been removed/renamed.")
        }
    }
}

verifyMigration()
