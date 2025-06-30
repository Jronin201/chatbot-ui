import { Tables } from "@/supabase/types"

export type Assistant = Tables<"assistants">

export interface AssistantWorkspaceResponse {
  id: string
  name: string
  assistants: Assistant[]
}
