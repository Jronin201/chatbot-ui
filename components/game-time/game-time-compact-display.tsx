"use client"

import React, { useState, useContext } from "react"
import { useGameTime } from "@/context/game-time-context"
import { ChatbotUIContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  IconCalendar,
  IconClock,
  IconPlus,
  IconSettings
} from "@tabler/icons-react"
import { GameTimeWidget } from "./game-time-widget"
import { GameTimeInitDialog } from "./game-time-init-dialog"

interface GameTimeCompactDisplayProps {}

export const GameTimeCompactDisplay: React.FC<
  GameTimeCompactDisplayProps
> = () => {
  const { gameTimeData, formatDate, isLoading } = useGameTime()
  const { selectedWorkspace, profile } = useContext(ChatbotUIContext)
  const [showInitDialog, setShowInitDialog] = useState(false)

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
          onClick={() => setShowInitDialog(true)}
          className="h-8 px-2 text-xs"
        >
          <IconCalendar className="mr-1 size-3" />
          Game Time
        </Button>
        <GameTimeInitDialog
          isOpen={showInitDialog}
          onClose={() => setShowInitDialog(false)}
        />
      </>
    )
  }

  const formattedDate = formatDate(
    gameTimeData.currentDate,
    gameTimeData.calendarSystem
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <IconCalendar className="mr-1 size-3" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium leading-none">Game Time</span>
            <span className="text-muted-foreground font-mono text-xs leading-tight">
              {formattedDate.length > 20
                ? `${formattedDate.slice(0, 17)}...`
                : formattedDate}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="left" align="start" className="w-80 p-0">
        <GameTimeWidget workspaceId={workspaceId} userId={userId} />
      </PopoverContent>
    </Popover>
  )
}
