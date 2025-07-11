import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { ChatbotUIContext } from "@/context/context"
import { deleteAssistant } from "@/db/assistants"
import { deleteChat } from "@/db/chats"
import { deleteCollection } from "@/db/collections"
import { deleteFile } from "@/db/files"
import { deleteModel } from "@/db/models"
import { deletePreset } from "@/db/presets"
import { deletePrompt } from "@/db/prompts"
import { deleteFileFromStorage } from "@/db/storage/files"
import { deleteTool } from "@/db/tools"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import { ContentType, DataItemType } from "@/types"
import { FC, useContext, useRef, useState } from "react"

interface SidebarDeleteItemProps {
  item: DataItemType
  contentType: ContentType
}

export const SidebarDeleteItem: FC<SidebarDeleteItemProps> = ({
  item,
  contentType
}) => {
  const {
    setChats,
    setPresets,
    setPrompts,
    setFiles,
    setCollections,
    setAssistants,
    setTools,
    setModels
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [showDialog, setShowDialog] = useState(false)

  const deleteFunctions = {
    chats: async (chat: Tables<"chats", never>) => {
      await deleteChat(chat.id)
    },
    presets: async (preset: Tables<"presets", never>) => {
      await deletePreset(preset.id)
    },
    prompts: async (prompt: Tables<"prompts", never>) => {
      await deletePrompt(prompt.id)
    },
    files: async (file: Tables<"files", never>) => {
      try {
        // Try to delete from storage first (may fail in local development)
        await deleteFileFromStorage(file.file_path)
      } catch (storageError) {
        console.warn(
          "Storage deletion failed, continuing with database deletion:",
          storageError
        )
      }

      // Always attempt database deletion
      await deleteFile(file.id)

      // Also clean up related records
      try {
        const { error: workspaceError } = await supabase
          .from("file_workspaces")
          .delete()
          .eq("file_id", file.id)

        if (workspaceError) {
          console.warn(
            "Failed to delete file workspace relations:",
            workspaceError.message
          )
        }

        const { error: itemsError } = await supabase
          .from("file_items")
          .delete()
          .eq("file_id", file.id)

        if (itemsError) {
          console.warn("Failed to delete file items:", itemsError.message)
        }
      } catch (cleanupError) {
        console.warn("Cleanup error (non-critical):", cleanupError)
      }
    },
    collections: async (collection: Tables<"collections", never>) => {
      await deleteCollection(collection.id)
    },
    assistants: async (assistant: Tables<"assistants", never>) => {
      await deleteAssistant(assistant.id)
      setChats(prevState =>
        prevState.filter(chat => chat.assistant_id !== assistant.id)
      )
    },
    tools: async (tool: Tables<"tools", never>) => {
      await deleteTool(tool.id)
    },
    models: async (model: Tables<"models", never>) => {
      await deleteModel(model.id)
    }
  }

  const stateUpdateFunctions = {
    chats: setChats,
    presets: setPresets,
    prompts: setPrompts,
    files: setFiles,
    collections: setCollections,
    assistants: setAssistants,
    tools: setTools,
    models: setModels
  }

  const handleDelete = async () => {
    const deleteFunction = deleteFunctions[contentType]
    const setStateFunction = stateUpdateFunctions[contentType]

    if (!deleteFunction || !setStateFunction) return

    await deleteFunction(item as any)

    setStateFunction((prevItems: any) =>
      prevItems.filter((prevItem: any) => prevItem.id !== item.id)
    )

    setShowDialog(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.stopPropagation()
      buttonRef.current?.click()
    }
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="text-red-500" variant="ghost">
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent onKeyDown={handleKeyDown} windowId="SDI-001">
        <DialogHeader>
          <DialogTitle>Delete {contentType.slice(0, -1)}</DialogTitle>

          <DialogDescription>
            Are you sure you want to delete {item.name}?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>

          <Button ref={buttonRef} variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
