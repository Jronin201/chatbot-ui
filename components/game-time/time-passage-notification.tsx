"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { IconCalendar, IconClock, IconArrowRight } from "@tabler/icons-react"

interface TimePassageNotificationProps {
  daysElapsed: number
  description: string
  previousDate: string
  newDate: string
  confidence?: number
  onDismiss?: () => void
}

export const TimePassageNotification: React.FC<
  TimePassageNotificationProps
> = ({
  daysElapsed,
  description,
  previousDate,
  newDate,
  confidence = 1,
  onDismiss
}) => {
  const formatDays = (days: number): string => {
    if (days === 0) return "No time passed"
    if (days < 1) return `${(days * 24).toFixed(1)} hours`
    if (days === 1) return "1 day"
    return `${days} days`
  }

  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.9) return "bg-green-100 text-green-800 border-green-200"
    if (conf >= 0.7) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-blue-100 text-blue-800 border-blue-200"
  }

  return (
    <Card
      className={`border-l-4 border-l-blue-500 ${getConfidenceColor(confidence)}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <IconClock className="mt-0.5 size-5" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Time Has Passed</h4>
              <Badge variant="secondary" className="text-xs">
                {formatDays(daysElapsed)}
              </Badge>
            </div>

            <p className="text-muted-foreground text-sm">{description}</p>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="rounded border bg-white px-2 py-1">
                {previousDate}
              </span>
              <IconArrowRight className="size-3" />
              <span className="rounded border bg-white px-2 py-1 font-semibold">
                {newDate}
              </span>
            </div>

            {confidence < 1 && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <span>Confidence: {Math.round(confidence * 100)}%</span>
              </div>
            )}
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              ×
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
