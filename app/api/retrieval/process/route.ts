/* ------------------------------------------------------------------
   CHAT COMPLETION ENDPOINT ― WITH RAG VIA SUPABASE + PGVECTOR
   ------------------------------------------------------------------

   – Takes an incoming chat request from the UI
   – Embeds the user prompt           (OpenAI “text-embedding-3-small”)
   – Hits the `match_file_items` RPC  (returns top-k file chunks)
   – Pushes those chunks into the system context
   – Streams the final GPT-4-Turbo answer back to the UI
------------------------------------------------------------------- */

import "server-only"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

import type { Database } from "@/supabase/types"

// Ensure this route is not statically optimized
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ────────────────────────────────────────────────────────────
//  CONSTANTS  (adjust if you want different defaults)
// ────────────────────────────────────────────────────────────
const EMBEDDING_MODEL = "text-embedding-3-small"
const COMPLETION_MODEL = "gpt-4o-mini" // change if you need
const K_MATCHES = 6 // top-k chunks
const MATCH_THRESHOLD = 0.25 // cosine distance
const MAX_CONTEXT_CHARS = 2_400 // trim long chunk blobs
const SYSTEM_HEADER = `You are an assistant that can reference an internal knowledge base extracted from the Dune: Adventures in the Imperium rulebook. Cite facts accurately and do not fabricate details. When you use a retrieved chunk, cite it with (source).`

// ────────────────────────────────────────────────────────────
//  HELPER FUNCTIONS FOR CLIENT INITIALIZATION
// ────────────────────────────────────────────────────────────
function createSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required Supabase environment variables")
  }
  return createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing required OpenAI API key")
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

// ────────────────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────────────────
async function embed(text: string): Promise<number[]> {
  const openai = createOpenAIClient()
  const {
    data: [{ embedding }]
  } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text
  })
  return embedding
}

/** Fetch top-k matching chunks from Supabase (RPC). */
async function fetchMatches(
  queryEmbedding: number[],
  fileIdFilter: string | null = null
) {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.rpc("match_file_items", {
    query_embedding: queryEmbedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: K_MATCHES,
    file_id_filter: fileIdFilter // optional 4-th arg in SQL fn (can be null)
  })

  if (error) throw error
  // Map the data to ensure each item has the expected shape with 'source'
  return Array.isArray(data)
    ? data.map(item => ({
        id: item.id,
        content: item.content,
        similarity: item.similarity,
        source: (item as any).source ?? (item as any).file_id ?? "unknown"
      }))
    : []
}

/** Build the system + user messages array for OpenAI. */
function buildMessages(
  userPrompt: string,
  matches: Awaited<ReturnType<typeof fetchMatches>>
) {
  // stitch together context
  const contextBlocks = matches
    .map(
      (m, i) =>
        `SOURCE_${i + 1}: """${m.content.slice(0, MAX_CONTEXT_CHARS)}"""`
    )
    .join("\n\n")

  const systemPrompt = `${SYSTEM_HEADER}\n\n${contextBlocks}`

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ] as const
}

// ────────────────────────────────────────────────────────────
//  ROUTE HANDLER  (POST /api/retrieval/process)
// ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Validate environment variables at runtime
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { message: "Missing required Supabase environment variables" },
        { status: 500 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "Missing required OpenAI API key" },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { prompt, fileId = null } = body as {
      prompt: string
      fileId?: string | null // optional: limit matches to a specific doc
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { message: "prompt (string) is required" },
        { status: 400 }
      )
    }

    // 1⃣  Embed the query ------------------------------------------------------------------
    const queryEmbedding = await embed(prompt)

    // 2⃣  Similarity-search in Supabase ----------------------------------------------------
    const matches = await fetchMatches(queryEmbedding, fileId)

    // 3⃣  Build augmented prompt ----------------------------------------------------------
    const messages = buildMessages(prompt, matches)

    // 4⃣  Call ChatCompletion --------------------------------------------------------------
    const openai = createOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: COMPLETION_MODEL,
      messages: [...messages],
      temperature: 0.3,
      stream: false
    })

    // 5⃣  Return to client -----------------------------------------------------------------
    return NextResponse.json({
      answer: completion.choices[0].message.content,
      matches // send back the chunks for debugging / highlighting
    })
  } catch (err: any) {
    console.error("[retrieval/process] error:", err)
    return NextResponse.json(
      { message: err?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}
