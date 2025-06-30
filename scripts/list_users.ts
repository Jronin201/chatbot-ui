import { createClient } from "@supabase/supabase-js"

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
    )
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    throw error
  }

  console.log(JSON.stringify(data.users, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌", err)
    process.exit(1)
  })
