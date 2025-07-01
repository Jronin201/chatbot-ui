import { Tables } from "@/supabase/types"

export type DataListType =
  | Tables<"collections", never>[]
  | Tables<"chats", never>[]
  | Tables<"presets", never>[]
  | Tables<"prompts", never>[]
  | Tables<"files", never>[]
  | Tables<"assistants", never>[]
  | Tables<"tools", never>[]
  | Tables<"models", never>[]

export type DataItemType =
  | Tables<"collections", never>
  | Tables<"chats", never>
  | Tables<"presets", never>
  | Tables<"prompts", never>
  | Tables<"files", never>
  | Tables<"assistants", never>
  | Tables<"tools", never>
  | Tables<"models", never>
