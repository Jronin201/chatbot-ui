import { Tables } from "@/supabase/types"

export type DataListType =
  | Tables<"public", "collections">[]
  | Tables<"public", "chats">[]
  | Tables<"public", "presets">[]
  | Tables<"public", "prompts">[]
  | Tables<"public", "files">[]
  | Tables<"public", "assistants">[]
  | Tables<"public", "tools">[]
  | Tables<"public", "models">[]

export type DataItemType =
  | Tables<"public", "collections">
  | Tables<"public", "chats">
  | Tables<"public", "presets">
  | Tables<"public", "prompts">
  | Tables<"public", "files">
  | Tables<"public", "assistants">
  | Tables<"public", "tools">
  | Tables<"public", "models">
