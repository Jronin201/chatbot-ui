// app/api/retrieval/process/route.ts
import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import {
  processCSV,
  processJSON,
  processMarkdown,
  processPdf,
  processTxt
} from "@/lib/retrieval/processing"
import { checkApiKey } from "@/lib/server/server-chat-helpers"
import { Database } from "@/supabase/types"
import { FileItemChunk } from "@/types"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import OpenAI from "openai"
import fs from "fs/promises"
import crypto from "crypto" // ← NEW

export async function POST(req: Request) {
  try {
    // ------------ 1. Parse body ------------------------------------------------
    const { filepath, embeddingsProvider = "openai" } = await req.json()

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ------------ 2. Generate IDs & basic data --------------------------------
    const file_id = crypto.randomUUID() // RFC-4122 uuid v4
    const filename = filepath.split("/").pop() ?? "unknown"

    // ------------ 3. Read & chunk file ----------------------------------------
    const fileBuffer = await fs.readFile(filepath)
    const blob = new Blob([fileBuffer])
    const ext = filename.split(".").pop()?.toLowerCase()

    let chunks: FileItemChunk[]
    switch (ext) {
      case "csv":
        chunks = await processCSV(blob)
        break
      case "json":
        chunks = await processJSON(blob)
        break
      case "md":
        chunks = await processMarkdown(blob)
        break
      case "pdf":
        chunks = await processPdf(blob)
        break
      case "txt":
        chunks = await processTxt(blob)
        break
      default:
        return NextResponse.json(
          { message: "Unsupported file type" },
          { status: 400 }
        )
    }

    // ------------ 4. Generate embeddings -------------------------------------
    let embeddings: number[][] = []

    if (embeddingsProvider === "openai") {
      checkApiKey(process.env.OPENAI_API_KEY ?? null, "OpenAI")
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

      const { data } = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunks.map(c => c.content)
      })
      embeddings = data.map(d => d.embedding)
    } else {
      embeddings = await Promise.all(
        chunks.map(c => generateLocalEmbedding(c.content))
      )
    }

    // ------------ 5. Insert into `files` --------------------------------------
    const { error: insertError } = await supabase.from("files").insert({
      id: file_id,
      name: filename,
      user_id: "bfc55e3f-ecfc-42fc-aefc-9ed9c89a62f5", // Use empty string or a valid user id
      file_path: filepath,
      tokens: chunks.reduce((t, c) => t + c.tokens, 0),
      description: "dune_files", // Provide a default or actual description
      size: fileBuffer.length, // Use the file buffer length as size in bytes
      type: ext ?? "unknown" // Use the file extension as type
    })

    if (insertError) {
      console.error("Error inserting into files:", insertError)
      throw insertError
    }

    // ------------ 6. Upsert into `file_items` ---------------------------------
    const file_items = chunks.map((chunk, i) => ({
      file_id,
      user_id: "bfc55e3f-ecfc-42fc-aefc-9ed9c89a62f5", // Use an empty string or a valid user id if available
      content: chunk.content,
      tokens: chunk.tokens,
      openai_embedding:
        embeddingsProvider === "openai" ? JSON.stringify(embeddings[i]) : null,
      local_embedding:
        embeddingsProvider === "local" ? JSON.stringify(embeddings[i]) : null
    }))

    const { error: upsertError } = await supabase
      .from("file_items")
      .upsert(file_items)

    if (upsertError) {
      console.error("Error upserting file_items:", upsertError)
      throw upsertError
    }

    // ------------ 7. Done ------------------------------------------------------
    return NextResponse.json({ message: "Embed successful" }, { status: 200 })
  } catch (err: any) {
    console.error("Embedding error:", err)
    return NextResponse.json(
      { message: err?.message || "Unknown error" },
      { status: 500 }
    )
  }
}
