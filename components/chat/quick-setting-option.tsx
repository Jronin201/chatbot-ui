import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { Tables } from "@/supabase/types"
import {
  IconCircleCheckFilled,
  IconRobotFace,
  IconPlus,
  IconSword
} from "@tabler/icons-react"
import Image from "next/image"
import { FC } from "react"
import { ModelIcon } from "../models/model-icon"
import { DropdownMenuItem } from "../ui/dropdown-menu"

interface QuickSettingOptionProps {
  contentType: "presets" | "assistants" | "campaigns"
  isSelected: boolean
  item:
    | Tables<"presets", never>
    | Tables<"assistants", never>
    | { id: string; name: string; description?: string }
  onSelect: () => void
  image: string
}

export const QuickSettingOption: FC<QuickSettingOptionProps> = ({
  contentType,
  isSelected,
  item,
  onSelect,
  image
}) => {
  const modelDetails =
    contentType !== "campaigns"
      ? LLM_LIST.find(model => model.modelId === (item as any).model)
      : null

  return (
    <DropdownMenuItem
      tabIndex={0}
      className="cursor-pointer items-center"
      onSelect={onSelect}
    >
      <div className="w-[32px]">
        {contentType === "presets" ? (
          <ModelIcon
            provider={modelDetails?.provider || "custom"}
            width={32}
            height={32}
          />
        ) : contentType === "assistants" ? (
          image ? (
            <Image
              style={{ width: "32px", height: "32px" }}
              className="rounded"
              src={image}
              alt="Assistant"
              width={32}
              height={32}
            />
          ) : (
            <IconRobotFace
              className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
              size={32}
            />
          )
        ) : contentType === "campaigns" ? (
          item.id === "new-campaign" ? (
            <IconPlus
              className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
              size={32}
            />
          ) : (
            <IconSword
              className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
              size={32}
            />
          )
        ) : null}
      </div>

      <div className="ml-4 flex grow flex-col space-y-1">
        <div className="text-md font-bold">{item.name}</div>

        {item.description && (
          <div className="text-sm font-light">{item.description}</div>
        )}
      </div>

      <div className="min-w-[40px]">
        {isSelected ? (
          <IconCircleCheckFilled className="ml-4" size={20} />
        ) : null}
      </div>
    </DropdownMenuItem>
  )
}
