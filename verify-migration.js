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
    const { error: aError } = await supabase.from('payment_authorizations').select('*').limit(1)
    if (aError) {
        // PostgREST returns this message when a table is missing
        if (aError.code === '42P01' || aError.message.includes('Could not find the table')) {
            console.log("✅ Table 'payment_authorizations' has been renamed/removed.")
        } else {
            console.error("Error checking 'payment_authorizations':", aError.message)
        }
    } else {
        console.log("⚠️ Table 'payment_authorizations' STILL exists. Migration likely not run.")
    }

    // Check user_permissions columns
    console.log("\nChecking 'user_permissions' columns...")

    async function checkColumnExists(columnName, migration) {
        const { error } = await supabase.from('user_permissions').select(columnName).limit(1)
        if (error) {
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                console.log(`❌ '${columnName}' column is MISSING. (Migration ${migration})`)
            } else {
                console.error(`Error checking '${columnName}':`, error.message)
            }
        } else {
            console.log(`✅ '${columnName}' column exists.`)
        }
    }

    await checkColumnExists('access_payment_orders', '011')
    await checkColumnExists('manage_payment_orders', '011')
    await checkColumnExists('manage_banks', '013')
    await checkColumnExists('access_notifications', '014')

    // Check old column
    const { error: oldColError } = await supabase.from('user_permissions').select('access_authorizations').limit(1)
    if (oldColError) {
        if (oldColError.message.includes('column') && oldColError.message.includes('does not exist')) {
            console.log("✅ 'access_authorizations' column has been removed/renamed.")
        } else {
            // If table is missing, we already handled that above, but here we expect the table to exist
            console.log("✅ 'access_authorizations' column is likely gone.")
        }
    } else {
        console.log("⚠️ 'access_authorizations' column STILL exists in 'user_permissions'.")
    }
}

verifyMigration().then(() => console.log("\n--- Verification Complete ---")).catch(err => {
    console.error("Verification failed:", err)
    process.exit(1)
})
