import { Tables } from "@/supabase/types"

export type Assistant = Tables<"public", "assistants">

export interface AssistantWorkspaceResponse {
  id: string
  name: string
  assistants: Assistant[]
}
