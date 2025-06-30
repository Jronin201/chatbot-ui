# still at repo root
mkdir -p scripts            # just in case
cat > scripts/list_users.ts <<'TS'
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

(async () => {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("❌", error);
    process.exit(1);
  }
  console.log("✅ Users:", data.users);
})();
TS
