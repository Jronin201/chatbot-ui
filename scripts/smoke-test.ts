import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // 1. Embed the query **once**
  const {
    data: [{ embedding: queryEmbedding }],
  } = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: "What is spice?",
  });

  // 2. Call the Postgres function
  const { data, error } = await supabase.rpc("match_file_items", {
    query_embedding: queryEmbedding,
    match_threshold: 0.2,
    match_count: 5,
  });

  if (error) throw error;

  console.log("Top K:", data.length);
  console.dir(data, { depth: null });
}

main().catch((e) => {
  console.error("Smoke-test failed:", e);
  process.exit(1);
});
