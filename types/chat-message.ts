import { Tables } from "@/supabase/types"

export interface ChatMessage {
  message: Tables<"public", "messages">
  fileItems: string[]
}
