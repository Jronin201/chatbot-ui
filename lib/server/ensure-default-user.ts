import { Database } from "@/supabase/types"
import { createClient, User } from "@supabase/supabase-js"

export async function ensureDefaultUser() {
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const password = process.env.DEFAULT_USER_PASSWORD || "Seraphine"

  const { data, error: listError } =
    await supabaseAdmin.auth.admin.listUsers()

  if (listError) throw listError

  const existingUser = data.users.find(
    (u: User) => u.email === "jim@demerzel.local"
  )

  if (existingUser) {
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password
      })
    if (updateError) throw updateError
    console.log("✅ Default user password updated.")
  } else {
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: "jim@demerzel.local",
        password
      })
    if (createError) throw createError
    console.log("✅ Default user created.")
  }

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
