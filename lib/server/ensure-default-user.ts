import { Database } from "@/supabase/types"
import { createClient } from "@supabase/supabase-js"

export async function ensureDefaultUser() {
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const password = process.env.DEFAULT_USER_PASSWORD || "Seraphine"

  const { data: existingUser } =
    await supabaseAdmin.auth.admin.getUserByEmail("jim@demerzel.local")

  if (existingUser?.user) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.user.id,
      { password }
    )
    console.log("ensureDefaultUser update", error)
    return
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: "jim@demerzel.local",
    password
  })
  console.log("ensureDefaultUser create", error)
}
