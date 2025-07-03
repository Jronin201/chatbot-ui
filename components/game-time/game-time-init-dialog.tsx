"use client"

import React, { useState, useContext } from "react"
import { CalendarSystem, CampaignMetadata } from "@/types/game-time"
import { useGameTime } from "@/context/game-time-context"
import { ChatbotUIContext } from "@/context/context"
import { GameTimeService } from "@/lib/game-time/game-time-service"
import { GameTimeStorage } from "@/lib/game-time/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { IconCalendar, IconClock, IconWorld } from "@tabler/icons-react"
import { toast } from "sonner"

interface GameTimeInitDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const GameTimeInitDialog: React.FC<GameTimeInitDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { initializeGameTime } = useGameTime()
  const { selectedWorkspace } = useContext(ChatbotUIContext)
  const gameTimeService = GameTimeService.getInstance()

  const workspaceId = selectedWorkspace?.id || "default"

  const [calendarSystem, setCalendarSystem] = useState<CalendarSystem>("dune")
  const [startDate, setStartDate] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [gameSystem, setGameSystem] = useState(
    "Dune: Adventures in the Imperium"
  )
  // Removed gameMaster and characters for single-player setup
  const [characterName, setCharacterName] = useState("")
  const [characterInfo, setCharacterInfo] = useState("")
  const [keyNPCs, setKeyNPCs] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Set default date when calendar system changes
  React.useEffect(() => {
    if (calendarSystem) {
      const defaultDate = gameTimeService.getDefaultStartDate(calendarSystem)
      setStartDate(defaultDate)
    }
  }, [calendarSystem, gameTimeService])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!startDate.trim()) {
        toast.error("Please enter a start date")
        return
      }

      if (!gameTimeService.isValidDate(startDate, calendarSystem)) {
        const errorMsg =
          calendarSystem === "dune"
            ? "Invalid date format for Dune Calendar. Please use format like '1 Ignis 10191 A.G.' with valid Dune month names."
            : `Invalid date format for ${calendarSystem} calendar`
        toast.error(errorMsg)
        return
      }

      const campaignMetadata: CampaignMetadata = {
        campaignName: campaignName.trim() || "New Campaign",
        gameSystem: gameSystem.trim() || "Unknown",
        workspaceId,
        // Only one character for single-player setup
        characters: characterName.trim() ? [characterName.trim()] : undefined,
        characterInfo: characterInfo.trim() || undefined,
        keyNPCs: keyNPCs.trim() || undefined,
        notes: notes.trim() ? [notes.trim()] : undefined
      }

      // Generate a campaign ID for this new campaign
      const campaignId = GameTimeStorage.generateCampaignId()

      // Set this as the current campaign
      GameTimeStorage.setCurrentCampaignId(campaignId)

      await initializeGameTime(startDate, calendarSystem, campaignMetadata)

      toast.success("Game time tracking initialized successfully!")
      onClose()
    } catch (error) {
      console.error("Error initializing game time:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to initialize game time"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getCalendarSystemDescription = (system: CalendarSystem): string => {
    switch (system) {
      case "dune":
        return "Imperial Dune calendar with 12 months of 30 days each (360 days per year). Dates are in the format 'Day Month Year A.G.'"
      case "standard":
        return "Standard Gregorian calendar system used in modern Earth dating"
      case "custom":
        return "Custom calendar system (configuration options will be available after selection)"
      default:
        return ""
    }
  }

  const getDateExample = (system: CalendarSystem): string => {
    switch (system) {
      case "dune":
        return "Example: '15 Ignis 10191 A.G.'"
      case "standard":
        return "Example: '2024-01-15' or '01/15/2024'"
      case "custom":
        return "Format depends on your custom configuration"
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCalendar className="size-5" />
            Initialize Game Time Tracking
          </DialogTitle>
          <DialogDescription>
            Set up time tracking for your TTRPG campaign. This will track the
            passage of in-game time based on narrative events.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Calendar System Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconWorld className="size-4" />
                Calendar System
              </CardTitle>
              <CardDescription>
                Choose the calendar system that matches your campaign setting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-system">Calendar System</Label>
                <Select
                  value={calendarSystem}
                  onValueChange={value =>
                    setCalendarSystem(value as CalendarSystem)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select calendar system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dune">Dune Imperial Calendar</SelectItem>
                    <SelectItem value="standard">
                      Standard (Gregorian)
                    </SelectItem>
                    <SelectItem value="custom">
                      Custom Calendar (Coming Soon)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted rounded-md p-3 text-sm">
                {getCalendarSystemDescription(calendarSystem)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Campaign Start Date</Label>
                <Input
                  id="start-date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  placeholder={
                    calendarSystem === "dune"
                      ? "1 Ignis 10191 A.G."
                      : "Enter the starting date"
                  }
                  className={`font-mono ${
                    startDate &&
                    !gameTimeService.isValidDate(startDate, calendarSystem)
                      ? "border-destructive"
                      : ""
                  }`}
                />
                <p className="text-muted-foreground text-sm">
                  {getDateExample(calendarSystem)}
                </p>
                {startDate &&
                  !gameTimeService.isValidDate(startDate, calendarSystem) && (
                    <p className="text-destructive text-sm">
                      ⚠️ Invalid date format.{" "}
                      {calendarSystem === "dune"
                        ? "Use format like '1 Ignis 10191 A.G.'"
                        : "Please check the date format."}
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconClock className="size-4" />
                Campaign Information
              </CardTitle>
              <CardDescription>
                Optional information about your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    placeholder="e.g., The Arrakis Chronicles"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game-system">Game System</Label>
                  <Input
                    id="game-system"
                    value={gameSystem}
                    onChange={e => setGameSystem(e.target.value)}
                    placeholder="e.g., Dune: Adventures in the Imperium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="character-name">Character Name</Label>
                <Input
                  id="character-name"
                  value={characterName}
                  onChange={e => setCharacterName(e.target.value)}
                  placeholder="Enter your character's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="character-info">Character Information</Label>
                <Textarea
                  id="character-info"
                  value={characterInfo}
                  onChange={e => setCharacterInfo(e.target.value)}
                  placeholder="Enter character sheet information, stats, abilities, background, etc."
                  rows={4}
                />
                <p className="text-muted-foreground text-sm">
                  Store your character&apos;s stats, abilities, background, and
                  other sheet information
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-npcs">Key NPCs</Label>
                <Textarea
                  id="key-npcs"
                  value={keyNPCs}
                  onChange={e => setKeyNPCs(e.target.value)}
                  placeholder="Track important Non-Player Characters, their stats, personality, goals, and relationships"
                  rows={4}
                />
                <p className="text-muted-foreground text-sm">
                  Record key NPCs, their stats, personality traits, attitude
                  toward your character, goals, and current situations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Campaign Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any important notes or reminders for this campaign"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Initializing..." : "Initialize Game Time"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
