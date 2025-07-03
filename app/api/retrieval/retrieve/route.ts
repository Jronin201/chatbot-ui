import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { Database } from "@/supabase/types"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

function enhanceQueryForContent(userInput: string): string {
  const lowerInput = userInput.toLowerCase()

  // TTRPG-specific enhancements
  if (
    lowerInput.includes("combat") ||
    lowerInput.includes("fight") ||
    lowerInput.includes("battle")
  ) {
    return `${userInput} attack damage weapon armor initiative action round conflict duel swordplay violence`
  }

  if (
    lowerInput.includes("character") ||
    lowerInput.includes("stats") ||
    lowerInput.includes("abilities")
  ) {
    return `${userInput} skills attributes traits talents background class house noble archetype creation`
  }

  if (lowerInput.includes("spice") || lowerInput.includes("melange")) {
    return `${userInput} arrakis dune sandworm fremen guild navigator prescience addiction withdrawal`
  }

  if (
    lowerInput.includes("house") ||
    lowerInput.includes("noble") ||
    lowerInput.includes("politics")
  ) {
    return `${userInput} atreides harkonnen corrino landsraad imperium emperor politics intrigue feud alliance`
  }

  if (
    lowerInput.includes("bene gesserit") ||
    lowerInput.includes("sisterhood")
  ) {
    return `${userInput} prana bindu voice truthsense weirding way training abilities sisterhood adept`
  }

  if (lowerInput.includes("fremen") || lowerInput.includes("desert")) {
    return `${userInput} sietch stillsuit sandworm crysknife water discipline thumper arrakis`
  }

  if (lowerInput.includes("mentat") || lowerInput.includes("calculation")) {
    return `${userInput} sapho juice computation analysis logic human computer mental discipline`
  }

  if (lowerInput.includes("swordmaster") || lowerInput.includes("ginaz")) {
    return `${userInput} blade work martial arts training discipline combat expertise duel`
  }

  if (
    lowerInput.includes("rules") ||
    lowerInput.includes("mechanics") ||
    lowerInput.includes("how")
  ) {
    return `${userInput} system dice roll test difficulty modifier rules mechanics 2d20 momentum threat`
  }

  if (
    lowerInput.includes("skills") ||
    lowerInput.includes("test") ||
    lowerInput.includes("roll")
  ) {
    return `${userInput} difficulty complication momentum attribute focus talent specialty`
  }

  if (
    lowerInput.includes("equipment") ||
    lowerInput.includes("gear") ||
    lowerInput.includes("weapon")
  ) {
    return `${userInput} shield generator lasgun maula pistol crysknife ornithopter technology artifact`
  }

  if (
    lowerInput.includes("campaign") ||
    lowerInput.includes("adventure") ||
    lowerInput.includes("scenario")
  ) {
    return `${userInput} gamemaster gm narrator plot story intrigue politics house operations`
  }

  // Legal document enhancements (keep existing)
  if (lowerInput.includes("impact") || lowerInput.includes("effect")) {
    return `${userInput} economic consequences financial implications policy changes`
  }

  // Default: return original query
  return userInput
}

export async function POST(request: Request) {
  const json = await request.json()
  const { userInput, fileIds, embeddingsProvider, sourceCount } = json as {
    userInput: string
    fileIds: string[]
    embeddingsProvider: "openai" | "local"
    sourceCount: number
  }

  const uniqueFileIds = [...new Set(fileIds)]

  try {
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const profile = await getServerProfile()

    if (embeddingsProvider === "openai") {
      if (profile.use_azure_openai) {
        checkApiKey(profile.azure_openai_api_key, "Azure OpenAI")
      } else {
        checkApiKey(profile.openai_api_key, "OpenAI")
      }
    }

    let chunks: any[] = []

    let openai
    if (profile.use_azure_openai) {
      openai = new OpenAI({
        apiKey: profile.azure_openai_api_key || "",
        baseURL: `${profile.azure_openai_endpoint}/openai/deployments/${profile.azure_openai_embeddings_id}`,
        defaultQuery: { "api-version": "2023-12-01-preview" },
        defaultHeaders: { "api-key": profile.azure_openai_api_key }
      })
    } else {
      openai = new OpenAI({
        apiKey: profile.openai_api_key || "",
        organization: profile.openai_organization_id
      })
    }

    if (embeddingsProvider === "openai") {
      // Enhance query based on content type
      const enhancedQuery = enhanceQueryForContent(userInput)

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: enhancedQuery
      })

      const openaiEmbedding = response.data.map(item => item.embedding)[0]

      const { data: openaiFileItems, error: openaiError } =
        await supabaseAdmin.rpc("match_file_items_openai", {
          query_embedding: openaiEmbedding as any,
          match_count: sourceCount,
          file_ids: uniqueFileIds
        })

      if (openaiError) {
        throw openaiError
      }

      chunks = openaiFileItems
    } else if (embeddingsProvider === "local") {
      const localEmbedding = await generateLocalEmbedding(userInput)

      const { data: localFileItems, error: localFileItemsError } =
        await supabaseAdmin.rpc("match_file_items_local", {
          query_embedding: localEmbedding as any,
          match_count: sourceCount,
          file_ids: uniqueFileIds
        })

      if (localFileItemsError) {
        throw localFileItemsError
      }

      chunks = localFileItems
    }

    const mostSimilarChunks = chunks?.sort(
      (a, b) => b.similarity - a.similarity
    )

    // Filter out chunks with low similarity scores to improve relevance
    const SIMILARITY_THRESHOLD = 0.7
    const filteredChunks = mostSimilarChunks?.filter(
      chunk => chunk.similarity >= SIMILARITY_THRESHOLD
    )

    // If no high-quality chunks found, return the best ones but with a warning
    const finalChunks =
      filteredChunks?.length > 0
        ? filteredChunks
        : mostSimilarChunks?.slice(0, 3)

    return new Response(
      JSON.stringify({
        results: finalChunks,
        warning:
          filteredChunks?.length === 0
            ? "No high-confidence matches found"
            : null
      }),
      {
        status: 200
      }
    )
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
