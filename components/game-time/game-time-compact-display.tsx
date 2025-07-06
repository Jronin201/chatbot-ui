"use client"

import React, { useState, useContext } from "react"
import { useGameTime } from "@/context/game-time-context"
import { ChatbotUIContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconCalendar,
  IconClock,
  IconSword,
  IconInfoCircle
} from "@tabler/icons-react"
import { CampaignInformationDialog } from "./campaign-information-dialog"

interface GameTimeCompactDisplayProps {}

export const GameTimeCompactDisplay: React.FC<
  GameTimeCompactDisplayProps
> = () => {
  const { gameTimeData, formatDate, isLoading } = useGameTime()
  const { selectedWorkspace, profile } = useContext(ChatbotUIContext)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)

  const workspaceId = selectedWorkspace?.id || "default"
  const userId = profile?.id

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <IconClock className="size-4 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    )
  }

  if (!gameTimeData) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCampaignDialog(true)}
          className="h-8 px-2 text-xs"
        >
          <IconSword className="mr-1 size-3" />
          Campaign Info
        </Button>
        <CampaignInformationDialog
          isOpen={showCampaignDialog}
          onClose={() => setShowCampaignDialog(false)}
        />
      </>
    )
  }

  const formattedDate = formatDate(
    gameTimeData.currentDate,
    gameTimeData.calendarSystem
  )

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={() => setShowCampaignDialog(true)}
      >
        <IconSword className="mr-1 size-3" />
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium leading-none">
            Campaign Info
          </span>
          <span className="text-muted-foreground font-mono text-xs leading-tight">
            {gameTimeData.campaignMetadata?.campaignName || "Campaign"}
          </span>
        </div>
      </Button>
      <CampaignInformationDialog
        isOpen={showCampaignDialog}
        onClose={() => setShowCampaignDialog(false)}
      />
    </>
  )
}
