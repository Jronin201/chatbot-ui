"use client"

import React, { useState } from "react"
import { useGameTime } from "@/context/game-time-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  IconCalendar,
  IconClock,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSettings,
  IconHistory,
  IconDownload,
  IconUpload,
  IconDots
} from "@tabler/icons-react"
import { toast } from "sonner"
import { GameTimeInitDialog } from "./game-time-init-dialog"
import { GameTimeHistoryDialog } from "./game-time-history-dialog"
import { GameTimeSettingsDialog } from "./game-time-settings-dialog"

interface GameTimeWidgetProps {
  className?: string
}

export const GameTimeWidget: React.FC<GameTimeWidgetProps> = ({
  className
}) => {
  const {
    gameTimeData,
    isLoading,
    error,
    updateGameTime,
    setGameTime,
    deleteGameTime,
    formatDate
  } = useGameTime()

  const [showInitDialog, setShowInitDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showAddTimeDialog, setShowAddTimeDialog] = useState(false)
  const [showSetDateDialog, setShowSetDateDialog] = useState(false)

  // Adjust time form state
  const [daysToAdd, setDaysToAdd] = useState("")
  const [timeDescription, setTimeDescription] = useState("")

  // Set date form state
  const [newDate, setNewDate] = useState("")
  const [dateDescription, setDateDescription] = useState("")

  const [isUpdating, setIsUpdating] = useState(false)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="border-primary size-6 animate-spin rounded-full border-b-2"></div>
            <span className="ml-2">Loading game time...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error: {error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowInitDialog(true)}
            >
              Reinitialize
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!gameTimeData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <IconCalendar className="text-muted-foreground mx-auto mb-4 size-12" />
            <h3 className="mb-2 text-lg font-semibold">No Game Time Set</h3>
            <p className="text-muted-foreground mb-4">
              Initialize game time tracking to begin monitoring your
              campaign&apos;s temporal progress.
            </p>
            <Button onClick={() => setShowInitDialog(true)}>
              <IconPlus className="mr-2 size-4" />
              Initialize Game Time
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleAddTime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!daysToAdd || !timeDescription) {
      toast.error("Please fill in all fields")
      return
    }

    const days = parseFloat(daysToAdd)
    if (isNaN(days)) {
      toast.error("Please enter a valid number of days")
      return
    }

    setIsUpdating(true)
    try {
      await updateGameTime(days, timeDescription)
      const action = days >= 0 ? "Added" : "Subtracted"
      const absoluteDays = Math.abs(days)
      toast.success(
        `${action} ${absoluteDays} day(s) ${days >= 0 ? "to" : "from"} game time`
      )
      setShowAddTimeDialog(false)
      setDaysToAdd("")
      setTimeDescription("")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update time"
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSetDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDate || !dateDescription) {
      toast.error("Please fill in all fields")
      return
    }

    setIsUpdating(true)
    try {
      await setGameTime(newDate, dateDescription)
      toast.success("Game date updated successfully")
      setShowSetDateDialog(false)
      setNewDate("")
      setDateDescription("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set date")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteGameTime = async () => {
    if (
      confirm(
        "Are you sure you want to delete all game time data? This action cannot be undone."
      )
    ) {
      try {
        await deleteGameTime()
        toast.success("Game time data deleted")
      } catch (error) {
        toast.error("Failed to delete game time data")
      }
    }
  }

  const exportData = async () => {
    try {
      const { GameTimeService } = await import(
        "@/lib/game-time/game-time-service"
      )
      const service = GameTimeService.getInstance()
      const data = await service.exportData()

      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `game-time-${gameTimeData.campaignMetadata?.campaignName || "campaign"}-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Game time data exported")
    } catch (error) {
      toast.error("Failed to export data")
    }
  }

  const formattedCurrentDate = formatDate(
    gameTimeData.currentDate,
    gameTimeData.calendarSystem
  )

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCalendar className="size-5" />
              <CardTitle className="text-lg">Game Time</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <IconDots className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowAddTimeDialog(true)}>
                  <IconPlus className="mr-2 size-4" />
                  Adjust Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSetDateDialog(true)}>
                  <IconEdit className="mr-2 size-4" />
                  Set Date
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowHistoryDialog(true)}>
                  <IconHistory className="mr-2 size-4" />
                  View History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                  <IconSettings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportData}>
                  <IconDownload className="mr-2 size-4" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteGameTime}
                  className="text-red-600"
                >
                  <IconTrash className="mr-2 size-4" />
                  Delete All Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription>
            {gameTimeData.campaignMetadata?.campaignName || "Campaign"} -{" "}
            {gameTimeData.calendarSystem} calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Date:</span>
              <Badge variant="secondary" className="font-mono">
                {formattedCurrentDate}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Days Elapsed:</span>
              <Badge variant="outline">{gameTimeData.totalDaysElapsed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Started:</span>
              <span className="text-muted-foreground font-mono text-sm">
                {formatDate(
                  gameTimeData.startDate,
                  gameTimeData.calendarSystem
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddTimeDialog(true)}
              className="flex-1"
            >
              <IconPlus className="mr-1 size-3" />
              Adjust Time
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowHistoryDialog(true)}
              className="flex-1"
            >
              <IconHistory className="mr-1 size-3" />
              History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Initialize Dialog */}
      <GameTimeInitDialog
        isOpen={showInitDialog}
        onClose={() => setShowInitDialog(false)}
      />

      {/* History Dialog */}
      <GameTimeHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
      />

      {/* Settings Dialog */}
      <GameTimeSettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />

      {/* Adjust Time Dialog */}
      <Dialog open={showAddTimeDialog} onOpenChange={setShowAddTimeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Time</DialogTitle>
            <DialogDescription>
              Add or subtract time from the current campaign date
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTime} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="days">Days to Add/Subtract</Label>
              <Input
                id="days"
                type="number"
                step="0.1"
                value={daysToAdd}
                onChange={e => setDaysToAdd(e.target.value)}
                placeholder="e.g., 3.5 or -2 to subtract"
              />
              <p className="text-muted-foreground text-sm">
                💡 Use positive numbers to add time, negative numbers to
                subtract time
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={timeDescription}
                onChange={e => setTimeDescription(e.target.value)}
                placeholder="What happened during this time?"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddTimeDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Time"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Date Dialog */}
      <Dialog open={showSetDateDialog} onOpenChange={setShowSetDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Date</DialogTitle>
            <DialogDescription>
              Set the campaign to a specific date
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetDate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-date">New Date</Label>
              <Input
                id="new-date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                placeholder={
                  gameTimeData.calendarSystem === "dune"
                    ? "15 Ignis 10191 A.G."
                    : "YYYY-MM-DD"
                }
                className="font-mono"
              />
              <p className="text-muted-foreground text-sm">
                Format:{" "}
                {gameTimeData.calendarSystem === "dune"
                  ? "Day Month Year A.G."
                  : "YYYY-MM-DD"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-description">Description</Label>
              <Textarea
                id="date-description"
                value={dateDescription}
                onChange={e => setDateDescription(e.target.value)}
                placeholder="Reason for date change"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSetDateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Setting..." : "Set Date"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
