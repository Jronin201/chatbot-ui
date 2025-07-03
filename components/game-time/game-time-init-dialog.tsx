"use client"

import React, { useState, useContext, useEffect } from "react"
import {
  CalendarSystem,
  CampaignMetadata,
  TimePassageEvent,
  GameTimeSettings
} from "@/types/game-time"
import { useGameTime } from "@/context/game-time-context"
import { ChatbotUIContext } from "@/context/context"
import { GameTimeService } from "@/lib/game-time/game-time-service"
import { GameTimeStorage, CampaignSummary } from "@/lib/game-time/storage"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  IconCalendar,
  IconClock,
  IconWorld,
  IconPlus,
  IconEdit,
  IconHistory,
  IconSettings,
  IconDownload,
  IconTrash,
  IconSword,
  IconChevronDown,
  IconRefresh,
  IconArrowLeft,
  IconArrowRight
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface GameTimeInitDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const GameTimeInitDialog: React.FC<GameTimeInitDialogProps> = ({
  isOpen,
  onClose
}) => {
  const {
    gameTimeData,
    initializeGameTime,
    updateGameTime,
    setGameTime,
    deleteGameTime,
    timePassageHistory,
    settings,
    updateSettings,
    formatDate
  } = useGameTime()
  const { selectedWorkspace, profile } = useContext(ChatbotUIContext)
  const gameTimeService = GameTimeService.getInstance()

  const workspaceId = selectedWorkspace?.id || "default"
  const userId = profile?.id || "default"

  // Campaign management state
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(
    null
  )
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditingCampaign, setIsEditingCampaign] = useState(false)

  // Form state for new/editing campaigns
  const [calendarSystem, setCalendarSystem] = useState<CalendarSystem>("dune")
  const [startDate, setStartDate] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [gameSystem, setGameSystem] = useState(
    "Dune: Adventures in the Imperium"
  )
  const [characterName, setCharacterName] = useState("")
  const [characterInfo, setCharacterInfo] = useState("")
  const [keyNPCs, setKeyNPCs] = useState("")
  const [notes, setNotes] = useState("")

  // Time adjustment state
  const [daysToAdd, setDaysToAdd] = useState("")
  const [timeDescription, setTimeDescription] = useState("")
  const [newDate, setNewDate] = useState("")
  const [dateDescription, setDateDescription] = useState("")

  // Settings state
  const [tempSettings, setTempSettings] = useState<GameTimeSettings>({
    autoDetectTimePassage: true,
    showTimePassageNotifications: true,
    defaultTimeIntervals: {
      travel: 1,
      rest: 1,
      training: 7,
      research: 3,
      shopping: 1
    },
    customKeywords: {}
  })

  const [isLoading, setIsLoading] = useState(false)

  // Load campaigns and current campaign on mount
  useEffect(() => {
    loadCampaigns()
    if (settings) {
      setTempSettings(settings)
    }
  }, [settings])

  // Load current campaign data when current campaign changes
  useEffect(() => {
    if (currentCampaignId) {
      loadCurrentCampaignData()
    }
  }, [currentCampaignId])

  // Set default date when calendar system changes
  useEffect(() => {
    if (calendarSystem) {
      const defaultDate = gameTimeService.getDefaultStartDate(calendarSystem)
      setStartDate(defaultDate)
    }
  }, [calendarSystem, gameTimeService])

  const loadCampaigns = async () => {
    try {
      const campaignList = await GameTimeStorage.getCampaigns(workspaceId)
      setCampaigns(campaignList)
      const currentId = GameTimeStorage.getCurrentCampaignId()
      setCurrentCampaignId(currentId)

      // If no campaigns exist, switch to create tab
      if (campaignList.length === 0) {
        setActiveTab("create")
      }
    } catch (error) {
      console.error("Error loading campaigns:", error)
      toast.error("Failed to load campaigns")
    }
  }

  const loadCurrentCampaignData = async () => {
    if (!currentCampaignId) return

    try {
      const campaign = await GameTimeStorage.loadCampaign(currentCampaignId)
      if (campaign) {
        setCampaignName(campaign.campaignMetadata?.campaignName || "")
        setGameSystem(campaign.campaignMetadata?.gameSystem || "")
        setCharacterName(campaign.campaignMetadata?.characters?.[0] || "")
        setCharacterInfo(campaign.campaignMetadata?.characterInfo || "")
        setKeyNPCs(campaign.campaignMetadata?.keyNPCs || "")
        setNotes(campaign.campaignMetadata?.notes?.[0] || "")
        setCalendarSystem(campaign.calendarSystem || "dune")
        setStartDate(campaign.startDate)
      }
    } catch (error) {
      console.error("Error loading campaign data:", error)
      toast.error("Failed to load campaign data")
    }
  }

  const resetFormFields = () => {
    setCampaignName("")
    setGameSystem("Dune: Adventures in the Imperium")
    setCharacterName("")
    setCharacterInfo("")
    setKeyNPCs("")
    setNotes("")
    setCalendarSystem("dune")
    setStartDate("")
    setIsEditingCampaign(false)
  }

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
      setActiveTab("overview")
      await loadCampaigns()
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

  const handleEditCampaign = () => {
    setIsEditingCampaign(true)
    setActiveTab("create")
  }

  const handleSwitchCampaign = async (campaignId: string) => {
    try {
      const success = await GameTimeStorage.switchToCampaign(campaignId)
      if (success) {
        setCurrentCampaignId(campaignId)
        toast.success("Switched to campaign successfully!")
        await loadCurrentCampaignData()
        setActiveTab("overview")
      } else {
        toast.error("Failed to switch campaign")
      }
    } catch (error) {
      console.error("Error switching campaign:", error)
      toast.error("Failed to switch campaign")
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await GameTimeStorage.deleteCampaign(campaignId)
      toast.success("Campaign deleted successfully")
      await loadCampaigns()

      // If we deleted the current campaign, reset state
      if (campaignId === currentCampaignId) {
        setCurrentCampaignId(null)
        resetFormFields()
      }
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast.error("Failed to delete campaign")
    }
  }

  const handleAddTime = async () => {
    if (!daysToAdd || !gameTimeData) return

    try {
      const days = parseInt(daysToAdd)
      if (isNaN(days) || days <= 0) {
        toast.error("Please enter a valid number of days")
        return
      }

      await updateGameTime(days, timeDescription.trim() || "Time passage")
      toast.success(`Added ${days} days to the campaign`)
      setDaysToAdd("")
      setTimeDescription("")
    } catch (error) {
      console.error("Error adding time:", error)
      toast.error("Failed to add time")
    }
  }

  const handleSetDate = async () => {
    if (!newDate || !gameTimeData) return

    try {
      if (!gameTimeService.isValidDate(newDate, gameTimeData.calendarSystem)) {
        toast.error("Invalid date format")
        return
      }

      await setGameTime(newDate, dateDescription.trim() || "Date changed")
      toast.success("Date set successfully")
      setNewDate("")
      setDateDescription("")
    } catch (error) {
      console.error("Error setting date:", error)
      toast.error("Failed to set date")
    }
  }

  const handleExportData = async () => {
    try {
      const data = await GameTimeStorage.exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `game-time-data-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Data exported successfully")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export data")
    }
  }

  const handleSaveSettings = async () => {
    try {
      await updateSettings(tempSettings)
      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
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

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSword className="size-5" />
            Campaign Information
          </DialogTitle>
          <DialogDescription>
            Manage your TTRPG campaign, time tracking, and settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <IconCalendar className="size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <IconPlus className="size-4" />
              {isEditingCampaign ? "Edit" : "Create"}
            </TabsTrigger>
            <TabsTrigger
              value="adjust"
              className="flex items-center gap-2"
              disabled={!gameTimeData}
            >
              <IconClock className="size-4" />
              Adjust Time
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2"
              disabled={!gameTimeData}
            >
              <IconHistory className="size-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <IconSettings className="size-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {campaigns.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Campaigns</h3>
                  <Button
                    onClick={() => {
                      resetFormFields()
                      setActiveTab("create")
                    }}
                    size="sm"
                  >
                    <IconPlus className="mr-2 size-4" />
                    New Campaign
                  </Button>
                </div>

                <div className="grid gap-4">
                  {campaigns.map(campaign => (
                    <Card
                      key={campaign.id}
                      className={
                        campaign.id === currentCampaignId
                          ? "border-primary"
                          : ""
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {campaign.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {campaign.id === currentCampaignId && (
                              <Badge variant="default">Current</Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <IconChevronDown className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {campaign.id !== currentCampaignId && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSwitchCampaign(campaign.id)
                                    }
                                  >
                                    <IconRefresh className="mr-2 size-4" />
                                    Switch to Campaign
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={handleEditCampaign}
                                  disabled={campaign.id !== currentCampaignId}
                                >
                                  <IconEdit className="mr-2 size-4" />
                                  Edit Campaign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteCampaign(campaign.id)
                                  }
                                  className="text-destructive"
                                >
                                  <IconTrash className="mr-2 size-4" />
                                  Delete Campaign
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <CardDescription>{campaign.gameSystem}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Current Date:</strong>{" "}
                            {campaign.currentDate}
                          </div>
                          <div>
                            <strong>Days Elapsed:</strong>{" "}
                            {campaign.totalDaysElapsed}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="py-8 text-center">
                    <IconCalendar className="text-muted-foreground mx-auto mb-4 size-12" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No Campaigns Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first campaign to start tracking game time
                    </p>
                    <Button
                      onClick={() => {
                        resetFormFields()
                        setActiveTab("create")
                      }}
                    >
                      <IconPlus className="mr-2 size-4" />
                      Create Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Create/Edit Campaign Tab */}
          <TabsContent value="create" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isEditingCampaign ? "Edit Campaign" : "Create New Campaign"}
              </h3>
              {isEditingCampaign && (
                <Button
                  variant="outline"
                  onClick={() => {
                    resetFormFields()
                    setActiveTab("overview")
                  }}
                >
                  <IconArrowLeft className="mr-2 size-4" />
                  Back to Overview
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Calendar System Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IconWorld className="size-4" />
                    Calendar System
                  </CardTitle>
                  <CardDescription>
                    Choose the calendar system that matches your campaign
                    setting
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
                        <SelectItem value="dune">
                          Dune Imperial Calendar
                        </SelectItem>
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
                      !gameTimeService.isValidDate(
                        startDate,
                        calendarSystem
                      ) && (
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
                    Information about your campaign
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
                        required
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
                    <Label htmlFor="character-info">
                      Character Information
                    </Label>
                    <Textarea
                      id="character-info"
                      value={characterInfo}
                      onChange={e => setCharacterInfo(e.target.value)}
                      placeholder="Enter character sheet information, stats, abilities, background, etc."
                      rows={4}
                    />
                    <p className="text-muted-foreground text-sm">
                      Store your character&apos;s stats, abilities, background,
                      and other sheet information
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isEditingCampaign) {
                      setIsEditingCampaign(false)
                      setActiveTab("overview")
                    } else {
                      onClose()
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Saving..."
                    : isEditingCampaign
                      ? "Save Changes"
                      : "Create Campaign"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Adjust Time Tab */}
          <TabsContent value="adjust" className="space-y-4">
            <h3 className="text-lg font-semibold">Time Adjustment</h3>

            {gameTimeData && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 font-mono text-2xl">
                      {gameTimeData.currentDate}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {gameTimeData.totalDaysElapsed} days elapsed since start
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Add Time</CardTitle>
                      <CardDescription>
                        Advance the campaign by a number of days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="days-to-add">Days to Add</Label>
                        <Input
                          id="days-to-add"
                          type="number"
                          min="1"
                          value={daysToAdd}
                          onChange={e => setDaysToAdd(e.target.value)}
                          placeholder="Enter number of days"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time-description">
                          Description (Optional)
                        </Label>
                        <Input
                          id="time-description"
                          value={timeDescription}
                          onChange={e => setTimeDescription(e.target.value)}
                          placeholder="e.g., Travel to Arrakeen"
                        />
                      </div>
                      <Button
                        onClick={handleAddTime}
                        disabled={!daysToAdd || isLoading}
                        className="w-full"
                      >
                        <IconArrowRight className="mr-2 size-4" />
                        Add Time
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Set Specific Date
                      </CardTitle>
                      <CardDescription>
                        Jump to a specific date in the campaign
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-date">New Date</Label>
                        <Input
                          id="new-date"
                          value={newDate}
                          onChange={e => setNewDate(e.target.value)}
                          placeholder={getDateExample(
                            gameTimeData.calendarSystem
                          )}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date-description">
                          Description (Optional)
                        </Label>
                        <Input
                          id="date-description"
                          value={dateDescription}
                          onChange={e => setDateDescription(e.target.value)}
                          placeholder="e.g., Time skip to festival"
                        />
                      </div>
                      <Button
                        onClick={handleSetDate}
                        disabled={!newDate || isLoading}
                        className="w-full"
                      >
                        <IconCalendar className="mr-2 size-4" />
                        Set Date
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h3 className="text-lg font-semibold">Time Passage History</h3>

            <Card>
              <CardContent className="pt-6">
                {timePassageHistory.length > 0 ? (
                  <div className="space-y-4">
                    {timePassageHistory.map((event, index) => (
                      <div
                        key={index}
                        className="border-muted border-l-2 pb-4 pl-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {event.description || "Time passage"}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {event.daysElapsed} days
                          </div>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {event.previousDate} → {event.newDate}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <IconHistory className="text-muted-foreground mx-auto mb-4 size-12" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No History Yet
                    </h3>
                    <p className="text-muted-foreground">
                      Time passage events will appear here as you advance the
                      campaign
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-semibold">Game Time Settings</h3>

            <Card>
              <CardHeader>
                <CardTitle>Time Detection</CardTitle>
                <CardDescription>
                  Configure how the system detects and handles time passage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-detect">
                      Auto-detect Time Passage
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Automatically detect time passage from chat messages
                    </p>
                  </div>
                  <Switch
                    id="auto-detect"
                    checked={tempSettings.autoDetectTimePassage}
                    onCheckedChange={checked =>
                      setTempSettings(prev => ({
                        ...prev,
                        autoDetectTimePassage: checked
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="show-notifications">
                      Show Time Notifications
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Show notifications when time passes
                    </p>
                  </div>
                  <Switch
                    id="show-notifications"
                    checked={tempSettings.showTimePassageNotifications}
                    onCheckedChange={checked =>
                      setTempSettings(prev => ({
                        ...prev,
                        showTimePassageNotifications: checked
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default Time Intervals</CardTitle>
                <CardDescription>
                  Set default durations for common activities (in days)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="travel-time">Travel</Label>
                    <Input
                      id="travel-time"
                      type="number"
                      min="1"
                      value={tempSettings.defaultTimeIntervals.travel}
                      onChange={e =>
                        setTempSettings(prev => ({
                          ...prev,
                          defaultTimeIntervals: {
                            ...prev.defaultTimeIntervals,
                            travel: parseInt(e.target.value) || 1
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rest-time">Rest</Label>
                    <Input
                      id="rest-time"
                      type="number"
                      min="1"
                      value={tempSettings.defaultTimeIntervals.rest}
                      onChange={e =>
                        setTempSettings(prev => ({
                          ...prev,
                          defaultTimeIntervals: {
                            ...prev.defaultTimeIntervals,
                            rest: parseInt(e.target.value) || 1
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="training-time">Training</Label>
                    <Input
                      id="training-time"
                      type="number"
                      min="1"
                      value={tempSettings.defaultTimeIntervals.training}
                      onChange={e =>
                        setTempSettings(prev => ({
                          ...prev,
                          defaultTimeIntervals: {
                            ...prev.defaultTimeIntervals,
                            training: parseInt(e.target.value) || 1
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="research-time">Research</Label>
                    <Input
                      id="research-time"
                      type="number"
                      min="1"
                      value={tempSettings.defaultTimeIntervals.research}
                      onChange={e =>
                        setTempSettings(prev => ({
                          ...prev,
                          defaultTimeIntervals: {
                            ...prev.defaultTimeIntervals,
                            research: parseInt(e.target.value) || 1
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopping-time">Shopping</Label>
                    <Input
                      id="shopping-time"
                      type="number"
                      min="1"
                      value={tempSettings.defaultTimeIntervals.shopping}
                      onChange={e =>
                        setTempSettings(prev => ({
                          ...prev,
                          defaultTimeIntervals: {
                            ...prev.defaultTimeIntervals,
                            shopping: parseInt(e.target.value) || 1
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleExportData}>
                <IconDownload className="mr-2 size-4" />
                Export Data
              </Button>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
