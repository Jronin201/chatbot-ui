"use client"

import React from "react"
import { useGameTime } from "@/context/game-time-context"
import { TimePassageEvent } from "@/types/game-time"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconCalendar, IconClock, IconArrowRight } from "@tabler/icons-react"

interface GameTimeHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const GameTimeHistoryDialog: React.FC<GameTimeHistoryDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { timePassageHistory, formatDate, gameTimeData } = useGameTime()

  const formatDateTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDays = (days: number): string => {
    if (days === 0) return "No time passed"
    if (days < 1) return `${(days * 24).toFixed(1)} hours`
    if (days === 1) return "1 day"
    return `${days} days`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconClock className="size-5" />
            Time Passage History
          </DialogTitle>
          <DialogDescription>
            All recorded time changes for this campaign
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {timePassageHistory.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <IconCalendar className="mx-auto mb-4 size-12 opacity-50" />
              <p>No time passage events recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timePassageHistory
                .slice()
                .reverse() // Show most recent first
                .map((event, index) => (
                  <TimePassageEventCard
                    key={`${event.timestamp}-${index}`}
                    event={event}
                    formatDate={formatDate}
                    formatDateTime={formatDateTime}
                    formatDays={formatDays}
                    calendarSystem={gameTimeData?.calendarSystem}
                  />
                ))}
            </div>
          )}
        </ScrollArea>

        {timePassageHistory.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>Total Events:</span>
              <span>{timePassageHistory.length}</span>
            </div>
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>Campaign Duration:</span>
              <span>{gameTimeData?.totalDaysElapsed || 0} days</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface TimePassageEventCardProps {
  event: TimePassageEvent
  formatDate: (date: string, calendarSystem?: any) => string
  formatDateTime: (timestamp: string) => string
  formatDays: (days: number) => string
  calendarSystem?: string
}

const TimePassageEventCard: React.FC<TimePassageEventCardProps> = ({
  event,
  formatDate,
  formatDateTime,
  formatDays,
  calendarSystem
}) => {
  const isInitialEvent =
    event.daysElapsed === 0 && event.description === "Campaign started"

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{event.description}</p>
          <p className="text-muted-foreground text-xs">
            {formatDateTime(event.timestamp)}
          </p>
        </div>
        <Badge
          variant={isInitialEvent ? "secondary" : "default"}
          className="shrink-0"
        >
          {formatDays(event.daysElapsed)}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1 font-mono">
          <span className="text-muted-foreground">From:</span>
          <span>{formatDate(event.previousDate, calendarSystem)}</span>
        </div>
        <IconArrowRight className="text-muted-foreground size-3" />
        <div className="flex items-center gap-1 font-mono">
          <span className="text-muted-foreground">To:</span>
          <span>{formatDate(event.newDate, calendarSystem)}</span>
        </div>
      </div>
    </div>
  )
}
