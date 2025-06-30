import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

const fixedUsername = "Jronin201"
const fixedDisplayName = "Demerzel"

export const getProfileByUserId = async (userId: string) => {
  // Try to find the fixed profile first
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", fixedUsername)
    .single()

  if (!profile) {
    // Fallback to searching by user_id
    const { data: profileById } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (profileById) {
      await supabase
        .from("profiles")
        .update({ username: fixedUsername })
        .eq("id", profileById.id)
      profile = { ...profileById, username: fixedUsername }
    } else {
      const insertPayload: TablesInsert<"profiles"> = {
        user_id: userId,
        username: fixedUsername,
        display_name: fixedDisplayName,
        bio: "",
        image_url: "",
        image_path: "",
        profile_context: "",
        use_azure_openai: false,
        has_onboarded: false
      }

      const { data: created, error } = await supabase
        .from("profiles")
        .insert(insertPayload)
        .select("*")
        .single()

      if (!created) {
        throw new Error(error?.message || "Unable to create profile")
      }

      profile = created
    }
  }

  return profile
}

export const getProfilesByUserId = async (userId: string) => {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)

  if (!profiles) {
    throw new Error(error.message)
  }

  return profiles
}

export const createProfile = async (profile: TablesInsert<"profiles">) => {
  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .insert([profile])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdProfile
}

export const updateProfile = async (
  profileId: string,
  profile: TablesUpdate<"profiles">
) => {
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", profileId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedProfile
}

export const deleteProfile = async (profileId: string) => {
  const { error } = await supabase.from("profiles").delete().eq("id", profileId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
