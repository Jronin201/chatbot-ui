// scripts/smoke-test.ts
/* -----------------------------------------------------------
   Smoke-test: embed a question with OpenAI and pull the
   5 most-similar chunks from Supabase via match_file_items().
   ----------------------------------------------------------- */

// scripts/smoke-test.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });       // <-- add this line
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
   
   // ---------- helper: generate an embedding for a query ----------
   async function getEmbedding(text: string): Promise<number[]> {
     const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
   
     const resp = await openai.embeddings.create({
       model: "text-embedding-3-small",
       input: text,
     });
   
     // text-embedding endpoints always return exactly one vector
     return resp.data[0].embedding;
   }
   
   // ---------- main ----------
   async function main() {
     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     );
   
     const question = "What is spice?";                 // <-- change the prompt
     const queryEmbedding = await getEmbedding(question);
   
     // call the Postgres function we created earlier
     const { data, error } = await supabase.rpc("match_file_items", {
       query_embedding: queryEmbedding,  // vector
       match_threshold: 0.80,            // optional – default in SQL fn is 0.80
       match_count: 5,                   // optional – default is 5
     });
   
     if (error) throw error;
   
     console.log("\nTop matches for:", question);
     console.log(JSON.stringify(data, null, 2));
   }
   
   main().catch((err) => {
     console.error("Smoke-test failed:", err);
     process.exit(1);
   });
   