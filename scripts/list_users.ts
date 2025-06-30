// scripts/list_users.ts
import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  // Nicely formatted JSON output
  console.log(JSON.stringify(data.users, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
