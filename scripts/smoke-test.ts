import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // 1. embed the query
  const { data: embResp } = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: "What is spice?"
  });
  const queryEmbedding = embResp[0].embedding;          // 1536-length array

  const { data, error } = await supabase.rpc('match_file_items', {
    query_embedding: await embed('What is spice?'),
    match_threshold: 0.2,   // start loose
    match_count: 5
  });
  
  console.log('Top K:', data?.length ?? 0);
  console.dir(data, { depth: 3 });

  if (error) throw error;

  console.log("Top K:", data.length);
  console.dir(data, { depth: null });
}

main().catch(e => {
  console.error("Smoke-test failed:", e);
  process.exit(1);
});
async function embed(input: string): Promise<number[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const { data: embResp } = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input
    });
    return embResp[0].embedding;
}

