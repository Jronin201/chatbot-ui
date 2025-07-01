import { supabase } from "@/lib/supabase/browser-client"
import { toast } from "sonner"

export const uploadFile = async (
  file: File,
  payload: {
    name: string
    user_id: string
    file_id: string
  }
) => {
  const SIZE_LIMIT = parseInt(
    process.env.NEXT_PUBLIC_USER_FILE_SIZE_LIMIT || "10000000"
  )

  if (file.size > SIZE_LIMIT) {
    throw new Error(
      `File must be less than ${Math.floor(SIZE_LIMIT / 1000000)}MB`
    )
  }

  const filePath = `${payload.user_id}/${Buffer.from(payload.file_id).toString("base64")}`

  const { error } = await supabase.storage
    .from("files")
    .upload(filePath, file, {
      upsert: true
    })

  if (error) {
    throw new Error("Error uploading file")
  }

  return filePath
}

export const deleteFileFromStorage = async (filePath: string) => {
  try {
    const { error } = await supabase.storage.from("files").remove([filePath])

    if (error) {
      // In local development, storage deletion may fail due to DNS issues
      // Log the error but don't fail the entire deletion process
      console.warn("Storage deletion failed:", error.message)

      // Only show toast error in production environments
      if (process.env.NODE_ENV === "production") {
        toast.error("Failed to remove file from storage!")
      } else {
        console.log(
          "Local development: Continuing with database deletion despite storage error"
        )
      }
      return
    }

    console.log("File successfully deleted from storage:", filePath)
  } catch (err) {
    // Handle network/connection errors gracefully in local development
    console.warn("Storage deletion error (continuing anyway):", err)

    if (process.env.NODE_ENV === "production") {
      toast.error("Failed to remove file from storage!")
    }
  }
}

export const getFileFromStorage = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from("files")
    .createSignedUrl(filePath, 60 * 60 * 24) // 24hrs

  if (error) {
    console.error(`Error uploading file with path: ${filePath}`, error)
    throw new Error("Error downloading file")
  }

  return data.signedUrl
}
