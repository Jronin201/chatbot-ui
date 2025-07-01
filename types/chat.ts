import { Tables } from "@/supabase/types"
import { ChatMessage, LLMID } from "."

export interface ChatSettings {
  model: LLMID
  prompt: string
  temperature: number
  contextLength: number
  includeProfileContext: boolean
  includeWorkspaceInstructions: boolean
  embeddingsProvider: "openai" | "local"
}

export interface ChatPayload {
  chatSettings: ChatSettings
  workspaceInstructions: string
  chatMessages: ChatMessage[]
  assistant: Tables<"assistants", never> | null
  messageFileItems: Tables<"file_items", never>[]
  chatFileItems: Tables<"file_items", never>[]
}

export interface ChatAPIPayload {
  chatSettings: ChatSettings
  messages: Tables<"messages", never>[]
}
