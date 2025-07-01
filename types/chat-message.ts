import { Tables } from "@/supabase/types"

export interface ChatMessage {
  message: Tables<"messages", never>
  fileItems: string[]
}
