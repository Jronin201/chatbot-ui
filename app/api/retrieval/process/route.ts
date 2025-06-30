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

export async function POST(req: Request) {
  try {
    const { filepath, embeddingsProvider } = await req.json()

    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const file_id = "manual_" + Date.now()

    const fileBuffer = await fs.readFile(filepath)
    const blob = new Blob([fileBuffer])
    const fileExtension = filepath.split(".").pop()?.toLowerCase()

    let chunks: FileItemChunk[] = []

    switch (fileExtension) {
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
        return new NextResponse("Unsupported file type", { status: 400 })
    }

    let embeddings: any[] = []

    if (embeddingsProvider === "openai") {
      checkApiKey(process.env.OPENAI_API_KEY ?? null, "OpenAI")
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunks.map(chunk => chunk.content)
      })

      embeddings = response.data.map(item => item.embedding)
    } else if (embeddingsProvider === "local") {
      embeddings = await Promise.all(
        chunks.map(async chunk => {
          try {
            return await generateLocalEmbedding(chunk.content)
          } catch (err) {
            console.error("Embedding error:", err)
            return null
          }
        })
      )
    }

    const file_items = chunks.map((chunk, index) => ({
      file_id,
      user_id: "",
      content: chunk.content,
      tokens: chunk.tokens,
      openai_embedding:
        embeddingsProvider === "openai" ? embeddings[index] : null,
      local_embedding: embeddingsProvider === "local" ? embeddings[index] : null
    }))

    await supabaseAdmin.from("file_items").upsert(file_items)

    return new NextResponse("Embed successful", { status: 200 })
  } catch (error: any) {
    console.error("Embedding error:", error)
    return new NextResponse(
      JSON.stringify({ message: error.message || "Unknown error" }),
      { status: 500 }
    )
  }
}
