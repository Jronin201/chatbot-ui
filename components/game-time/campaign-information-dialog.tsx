"use client"

import React, { useState, useContext, useEffect } from "react"
import {
  CalendarSystem,
  CampaignMetadata,
  TimePassageEvent,
  GameTimeSettings,
  GameTimeData
} from "@/types/game-time"
import { useGameTime } from "@/context/game-time-context"
import { CampaignDataProvider } from "@/context/campaign-data-context"
import { SessionStateProvider } from "@/context/session-state-context"
import { CampaignDataView } from "./campaign-data-view"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
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
  IconX,
  IconUsers,
  IconUser,
  IconFlag,
  IconMap,
  IconBook,
  IconNotes,
  IconDatabase
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface CampaignInformationDialogProps {
  isOpen: boolean
  onClose: () => void
  campaignId?: string | null
}

export const CampaignInformationDialog: React.FC<
  CampaignInformationDialogProps
> = ({ isOpen, onClose, campaignId }) => {
  const {
    gameTimeData,
    initializeGameTime,
    updateGameTime,
    setGameTime,
    deleteGameTime,
    timePassageHistory,
    settings,
    updateSettings,
    formatDate,
    loadGameTime
  } = useGameTime()
  const {
    selectedWorkspace,
    assistants,
    setSelectedAssistant,
    setChatFiles,
    setSelectedTools,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)
  const gameTimeService = GameTimeService.getInstance()

  const workspaceId = selectedWorkspace?.id || "default"

  // Campaign management state
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(
    null
  )
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditMode, setIsEditMode] = useState(false)

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
  const [gameMasterAssistantId, setGameMasterAssistantId] = useState("")

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
      travel: 3,
      rest: 1,
      training: 7,
      research: 3,
      shopping: 0.5
    },
    customKeywords: {}
  })

  const [isLoading, setIsLoading] = useState(false)

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCampaigns()

      // If campaignId is provided, load that specific campaign
      if (campaignId) {
        loadSpecificCampaign(campaignId)
      } else {
        setCurrentCampaignId(GameTimeStorage.getCurrentCampaignId())
        setIsEditMode(false) // Reset edit mode when dialog opens
        if (gameTimeData) {
          // Pre-populate form with existing data
          setCampaignName(gameTimeData.campaignMetadata?.campaignName || "")
          setGameSystem(gameTimeData.campaignMetadata?.gameSystem || "")
          setCharacterInfo(gameTimeData.campaignMetadata?.characterInfo || "")
          setKeyNPCs(gameTimeData.campaignMetadata?.keyNPCs || "")
          setNotes(gameTimeData.campaignMetadata?.notes?.join("\\n") || "")
          setGameMasterAssistantId(
            gameTimeData.campaignMetadata?.gameMasterAssistantId || ""
          )
          setCalendarSystem(gameTimeData.calendarSystem)
          setStartDate(gameTimeData.startDate)
          setNewDate(gameTimeData.currentDate)
          setActiveTab("overview")
        } else {
          // Reset form for new campaign
          setActiveTab("management")
        }
      }
      setTempSettings({ ...settings })
    }
  }, [isOpen, gameTimeData, settings, campaignId])

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
    } catch (error) {
      console.error("Error loading campaigns:", error)
      toast.error("Failed to load campaigns")
    }
  }

  const loadSpecificCampaign = async (specificCampaignId: string) => {
    try {
      const campaign = await GameTimeStorage.loadCampaign(specificCampaignId)
      if (campaign) {
        setCurrentCampaignId(specificCampaignId)
        setIsEditMode(true)

        // Pre-populate form with campaign data
        setCampaignName(campaign.campaignMetadata?.campaignName || "")
        setGameSystem(campaign.campaignMetadata?.gameSystem || "")
        setCharacterName(campaign.campaignMetadata?.characters?.[0] || "")
        setCharacterInfo(campaign.campaignMetadata?.characterInfo || "")
        setKeyNPCs(campaign.campaignMetadata?.keyNPCs || "")
        setNotes(campaign.campaignMetadata?.notes?.join("\\n") || "")
        setGameMasterAssistantId(
          campaign.campaignMetadata?.gameMasterAssistantId || ""
        )
        setCalendarSystem(campaign.calendarSystem)
        setStartDate(campaign.startDate)
        setNewDate(campaign.currentDate)
        setActiveTab("create") // Show the edit form
      } else {
        toast.error("Campaign not found")
      }
    } catch (error) {
      console.error("Error loading campaign:", error)
      toast.error("Failed to load campaign")
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignName.trim() || !startDate.trim()) {
      toast.error("Campaign name and start date are required")
      return
    }

    setIsLoading(true)

    try {
      // Check for duplicate campaign names
      const duplicateCampaign = campaigns.find(
        c => c.name.toLowerCase() === campaignName.trim().toLowerCase()
      )

      if (duplicateCampaign) {
        toast.error("A campaign with this name already exists")
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
        campaignName: campaignName.trim(),
        gameSystem: gameSystem.trim() || "Unknown",
        workspaceId,
        characters: characterName.trim() ? [characterName.trim()] : undefined,
        characterInfo: characterInfo.trim() || undefined,
        keyNPCs: keyNPCs.trim() || undefined,
        notes: notes.trim() ? [notes.trim()] : undefined,
        gameMasterAssistantId: gameMasterAssistantId || undefined
      }

      // Generate a campaign ID for this new campaign
      const campaignId = GameTimeStorage.generateCampaignId()

      // Set this as the current campaign
      GameTimeStorage.setCurrentCampaignId(campaignId)

      await initializeGameTime(startDate, calendarSystem, campaignMetadata)

      await loadCampaigns()
      setCurrentCampaignId(campaignId)

      toast.success("Campaign created successfully!")
      setActiveTab("overview")
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignName.trim() || !currentCampaignId) {
      toast.error("Campaign name is required")
      return
    }

    setIsLoading(true)

    try {
      // Check for duplicate campaign names (excluding current campaign)
      const duplicateCampaign = campaigns.find(
        c =>
          c.id !== currentCampaignId &&
          c.name.toLowerCase() === campaignName.trim().toLowerCase()
      )

      if (duplicateCampaign) {
        toast.error("A campaign with this name already exists")
        return
      }

      // Load current campaign data
      const currentCampaign =
        await GameTimeStorage.loadCampaign(currentCampaignId)
      if (!currentCampaign) {
        toast.error("Campaign not found")
        return
      }

      // Update the campaign metadata
      const updatedCampaignMetadata: CampaignMetadata = {
        ...currentCampaign.campaignMetadata,
        campaignName: campaignName.trim(),
        gameSystem: gameSystem.trim() || "Unknown",
        workspaceId,
        characters: characterName.trim() ? [characterName.trim()] : undefined,
        characterInfo: characterInfo.trim() || undefined,
        keyNPCs: keyNPCs.trim() || undefined,
        notes: notes.trim() ? [notes.trim()] : undefined,
        gameMasterAssistantId: gameMasterAssistantId || undefined
      }

      // Update the game time data
      const updatedGameTimeData: GameTimeData = {
        ...currentCampaign,
        campaignMetadata: updatedCampaignMetadata,
        lastUpdated: new Date().toISOString()
      }

      // Save the updated campaign
      await GameTimeStorage.saveGameTime(updatedGameTimeData)

      // Reload campaigns and game time data
      await loadCampaigns()
      await loadGameTime()

      toast.success("Campaign updated successfully!")
      setActiveTab("overview")
      setIsEditMode(false)
    } catch (error) {
      console.error("Error updating campaign:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update campaign"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchCampaign = async (campaignId: string) => {
    try {
      const success = await GameTimeStorage.switchToCampaign(campaignId)
      if (success) {
        setCurrentCampaignId(campaignId)
        await loadGameTime()
        toast.success("Switched to campaign")
        onClose() // Close the dialog after switching
      } else {
        toast.error("Failed to switch campaign")
      }
    } catch (error) {
      console.error("Error switching campaign:", error)
      toast.error("Failed to switch campaign")
    }
  }

  const handleEditCampaign = () => {
    if (gameTimeData && gameTimeData.campaignMetadata) {
      // Pre-populate form with current campaign data
      setCampaignName(gameTimeData.campaignMetadata.campaignName || "")
      setGameSystem(gameTimeData.campaignMetadata.gameSystem || "")
      setCharacterName(gameTimeData.campaignMetadata.characters?.[0] || "")
      setCharacterInfo(gameTimeData.campaignMetadata.characterInfo || "")
      setKeyNPCs(gameTimeData.campaignMetadata.keyNPCs || "")
      setNotes(gameTimeData.campaignMetadata.notes?.join("\n") || "")
      setCalendarSystem(gameTimeData.calendarSystem)
      setStartDate(gameTimeData.startDate)

      setIsEditMode(true)
      setActiveTab("create")
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setActiveTab("overview")
    // Reset form fields
    setCampaignName("")
    setGameSystem("Dune: Adventures in the Imperium")
    setCharacterName("")
    setCharacterInfo("")
    setKeyNPCs("")
    setNotes("")
    setCalendarSystem("dune")
    setStartDate("")
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await GameTimeStorage.deleteCampaign(campaignId)
      await loadCampaigns()

      if (currentCampaignId === campaignId) {
        setCurrentCampaignId(null)
        GameTimeStorage.setCurrentCampaignId(null)
        await loadGameTime()
      }

      toast.success("Campaign deleted")
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast.error("Failed to delete campaign")
    }
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

    try {
      await updateGameTime(days, timeDescription)
      setDaysToAdd("")
      setTimeDescription("")
      toast.success("Time updated successfully")
    } catch (error) {
      toast.error("Failed to update time")
    }
  }

  const handleSetDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDate || !dateDescription) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      await setGameTime(newDate, dateDescription)
      setDateDescription("")
      toast.success("Date set successfully")
    } catch (error) {
      toast.error("Failed to set date")
    }
  }

  const handleSaveSettings = async () => {
    try {
      await updateSettings(tempSettings)
      toast.success("Settings saved successfully")
    } catch (error) {
      toast.error("Failed to save settings")
    }
  }

  const handleExportData = async () => {
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
      a.download = `game-time-${gameTimeData?.campaignMetadata?.campaignName || "campaign"}-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Game time data exported")
    } catch (error) {
      toast.error("Failed to export data")
    }
  }

  const handleDeleteAllData = async () => {
    try {
      await deleteGameTime()
      toast.success("All game time data deleted")
      onClose()
    } catch (error) {
      toast.error("Failed to delete game time data")
    }
  }

  const handleContinueCampaign = async () => {
    if (!gameMasterAssistantId) {
      toast.error("Please select a Game Master Assistant")
      return
    }

    try {
      // Find the selected assistant
      const selectedGMAssistant = assistants.find(
        assistant => assistant.id === gameMasterAssistantId
      )

      if (!selectedGMAssistant) {
        toast.error("Selected Game Master Assistant not found")
        return
      }

      // Load assistant files and tools just like in quick-settings
      let allFiles = []
      const assistantFiles = (
        await getAssistantFilesByAssistantId(selectedGMAssistant.id)
      ).files
      allFiles = [...assistantFiles]
      const assistantCollections = (
        await getAssistantCollectionsByAssistantId(selectedGMAssistant.id)
      ).collections
      for (const collection of assistantCollections) {
        const collectionFiles = (
          await getCollectionFilesByCollectionId(collection.id)
        ).files
        allFiles = [...allFiles, ...collectionFiles]
      }
      const assistantTools = (
        await getAssistantToolsByAssistantId(selectedGMAssistant.id)
      ).tools
      setSelectedTools(assistantTools)
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )
      if (allFiles.length > 0) setShowFilesDisplay(true)

      // Set the selected assistant in the main context
      setSelectedAssistant(selectedGMAssistant)

      // Close the dialog
      onClose()

      toast.success(
        `Campaign continued with ${selectedGMAssistant.name} as Game Master`
      )
    } catch (error) {
      console.error("Error continuing campaign:", error)
      toast.error("Failed to continue campaign")
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
            Manage your TTRPG campaigns, game time tracking, and settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaign-data">Campaign Data</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Campaign</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions <IconChevronDown className="ml-2 size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleExportData}>
                        <IconDownload className="mr-2 size-4" />
                        Export Data
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDeleteAllData}
                        className="text-red-600"
                      >
                        <IconTrash className="mr-2 size-4" />
                        Delete All Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gameTimeData ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditCampaign}
                      >
                        <IconEdit className="mr-2 size-4" />
                        Edit Campaign
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Campaign Name
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          {gameTimeData.campaignMetadata?.campaignName ||
                            "Unnamed Campaign"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Game System
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          {gameTimeData.campaignMetadata?.gameSystem ||
                            "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Current Date
                        </Label>
                        <p className="bg-muted rounded p-2 font-mono text-sm">
                          {formatDate(
                            gameTimeData.currentDate,
                            gameTimeData.calendarSystem
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Days Elapsed
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          {gameTimeData.totalDaysElapsed} days since start
                        </p>
                      </div>
                    </div>

                    {gameTimeData.campaignMetadata?.characterInfo && (
                      <div>
                        <Label className="text-sm font-medium">
                          Character Information
                        </Label>
                        <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                          {gameTimeData.campaignMetadata.characterInfo}
                        </p>
                      </div>
                    )}

                    {gameTimeData.campaignMetadata?.keyNPCs && (
                      <div>
                        <Label className="text-sm font-medium">Key NPCs</Label>
                        <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                          {gameTimeData.campaignMetadata.keyNPCs}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <IconCalendar className="text-muted-foreground mx-auto size-12" />
                    <h3 className="mt-2 text-sm font-medium">
                      No Campaign Active
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Create a new campaign or select an existing one to get
                      started.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setIsEditMode(false)
                        setActiveTab("management")
                      }}
                    >
                      <IconPlus className="mr-2 size-4" />
                      Create New Campaign
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Available Campaigns</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditMode(false)
                      setActiveTab("management")
                    }}
                  >
                    <IconPlus className="mr-2 size-4" />
                    New Campaign
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length > 0 ? (
                  <div className="space-y-2">
                    {campaigns.map(campaign => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{campaign.name}</span>
                            {campaign.id === currentCampaignId && (
                              <Badge variant="secondary">Current</Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {campaign.gameSystem} • {campaign.currentDate} •{" "}
                            {campaign.totalDaysElapsed} days
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {campaign.id !== currentCampaignId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSwitchCampaign(campaign.id)}
                            >
                              Switch
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <IconTrash className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Campaign
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {campaign.name}&quot;? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteCampaign(campaign.id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <IconSword className="text-muted-foreground mx-auto size-12" />
                    <h3 className="mt-2 text-sm font-medium">
                      No Campaigns Yet
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Create your first campaign to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Data Tab - Enhanced with Search and Filtering */}
          <TabsContent value="campaign-data" className="space-y-4">
            <CampaignDataProvider>
              <SessionStateProvider>
                <CampaignDataView gameTimeData={gameTimeData} />
              </SessionStateProvider>
            </CampaignDataProvider>
          </TabsContent>

          {/* Management Tab - Combines Create/Edit, Adjust Time, and History */}
          <TabsContent value="management" className="space-y-4">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="create">Create/Edit</TabsTrigger>
                <TabsTrigger value="adjust">Adjust Time</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Create/Edit Sub-tab */}
              <TabsContent value="create" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {isEditMode ? "Edit Campaign" : "Create New Campaign"}
                  </h3>
                  {isEditMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <IconX className="mr-2 size-4" />
                      Cancel Edit
                    </Button>
                  )}
                </div>

                <form
                  onSubmit={
                    isEditMode ? handleUpdateCampaign : handleCreateCampaign
                  }
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name *</Label>
                      <Input
                        id="campaign-name"
                        value={campaignName}
                        onChange={e => setCampaignName(e.target.value)}
                        placeholder="Enter campaign name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="game-system">Game System</Label>
                      <Input
                        id="game-system"
                        value={gameSystem}
                        onChange={e => setGameSystem(e.target.value)}
                        placeholder="e.g., D&D 5e, Pathfinder, Dune"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="calendar-system">Calendar System</Label>
                    <Select
                      value={calendarSystem}
                      onValueChange={(value: CalendarSystem) =>
                        setCalendarSystem(value)
                      }
                      disabled={isEditMode}
                    >
                      <SelectTrigger className={isEditMode ? "bg-muted" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dune">Dune Calendar</SelectItem>
                        <SelectItem value="standard">
                          Standard Calendar
                        </SelectItem>
                        <SelectItem value="custom">Custom Calendar</SelectItem>
                      </SelectContent>
                    </Select>
                    {isEditMode && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Calendar system cannot be changed after campaign
                        creation
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      placeholder={
                        calendarSystem === "dune"
                          ? "e.g., 1 Ignis 10191 A.G."
                          : "e.g., Day 1"
                      }
                      required={!isEditMode}
                      disabled={isEditMode}
                      className={isEditMode ? "bg-muted" : ""}
                    />
                    {isEditMode && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Start date cannot be changed after campaign creation
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="game-master">Game Master Assistant</Label>
                    <Select
                      value={gameMasterAssistantId}
                      onValueChange={setGameMasterAssistantId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Game Master Assistant" />
                      </SelectTrigger>
                      <SelectContent>
                        {assistants
                          .filter(
                            assistant =>
                              assistant.id && assistant.id.trim() !== ""
                          )
                          .map(assistant => (
                            <SelectItem key={assistant.id} value={assistant.id}>
                              {assistant.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="character-name">Character Name</Label>
                    <Input
                      id="character-name"
                      value={characterName}
                      onChange={e => setCharacterName(e.target.value)}
                      placeholder="Your character's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="character-info">
                      Character Information
                    </Label>
                    <Textarea
                      id="character-info"
                      value={characterInfo}
                      onChange={e => setCharacterInfo(e.target.value)}
                      placeholder="Character stats, abilities, background, etc."
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="key-npcs">Key NPCs</Label>
                    <Textarea
                      id="key-npcs"
                      value={keyNPCs}
                      onChange={e => setKeyNPCs(e.target.value)}
                      placeholder="Important NPCs, their relationships, goals, etc."
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Campaign Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Important notes or reminders for this campaign"
                      rows={6}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={isEditMode ? handleCancelEdit : onClose}
                    >
                      Cancel
                    </Button>
                    {isEditMode ? (
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Updating..." : "Update Campaign"}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleContinueCampaign}
                          disabled={isLoading}
                        >
                          Continue Campaign
                        </Button>
                      </div>
                    ) : (
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Initialize Game Time"}
                      </Button>
                    )}
                  </div>
                </form>
              </TabsContent>

              {/* Adjust Time Sub-tab */}
              <TabsContent value="adjust" className="space-y-4">
                {gameTimeData ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Add Time</CardTitle>
                        <CardDescription>
                          Advance the game time by a number of days
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddTime} className="space-y-4">
                          <div>
                            <Label htmlFor="days-to-add">Days to Add</Label>
                            <Input
                              id="days-to-add"
                              type="number"
                              step="0.1"
                              value={daysToAdd}
                              onChange={e => setDaysToAdd(e.target.value)}
                              placeholder="Enter number of days"
                            />
                          </div>
                          <div>
                            <Label htmlFor="time-description">
                              Description
                            </Label>
                            <Input
                              id="time-description"
                              value={timeDescription}
                              onChange={e => setTimeDescription(e.target.value)}
                              placeholder="What happened during this time?"
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={!daysToAdd || !timeDescription}
                          >
                            <IconPlus className="mr-2 size-4" />
                            Add Time
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Set Specific Date</CardTitle>
                        <CardDescription>
                          Jump to a specific date in the game
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSetDate} className="space-y-4">
                          <div>
                            <Label htmlFor="new-date">New Date</Label>
                            <Input
                              id="new-date"
                              value={newDate}
                              onChange={e => setNewDate(e.target.value)}
                              placeholder={
                                gameTimeData.calendarSystem === "dune"
                                  ? "e.g., 15 Ignis 10191 A.G."
                                  : "e.g., Day 15"
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="date-description">
                              Description
                            </Label>
                            <Input
                              id="date-description"
                              value={dateDescription}
                              onChange={e => setDateDescription(e.target.value)}
                              placeholder="Reason for date change"
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={!newDate || !dateDescription}
                          >
                            <IconEdit className="mr-2 size-4" />
                            Set Date
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground">
                      No campaign active. Please create or select a campaign
                      first.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* History Sub-tab */}
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Time Passage History</CardTitle>
                    <CardDescription>
                      A record of all time changes in this campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {timePassageHistory.length > 0 ? (
                      <div className="max-h-96 space-y-2 overflow-y-auto">
                        {timePassageHistory.map((event, index) => (
                          <div
                            key={index}
                            className="border-l-2 border-blue-200 py-2 pl-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {event.description}
                              </span>
                              <Badge variant="outline">
                                {event.daysElapsed} days
                              </Badge>
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
                      <div className="py-6 text-center">
                        <IconHistory className="text-muted-foreground mx-auto size-12" />
                        <p className="text-muted-foreground mt-2 text-sm">
                          No time passage events recorded yet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Game Time Settings</CardTitle>
                <CardDescription>
                  Configure how game time tracking behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-detect time passage</Label>
                    <p className="text-muted-foreground text-sm">
                      Automatically detect time passage in chat messages
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.autoDetectTimePassage}
                    onCheckedChange={checked =>
                      setTempSettings({
                        ...tempSettings,
                        autoDetectTimePassage: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show notifications</Label>
                    <p className="text-muted-foreground text-sm">
                      Show notifications when time passes
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.showTimePassageNotifications}
                    onCheckedChange={checked =>
                      setTempSettings({
                        ...tempSettings,
                        showTimePassageNotifications: checked
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Time Intervals (days)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Travel</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={tempSettings.defaultTimeIntervals.travel}
                        onChange={e =>
                          setTempSettings({
                            ...tempSettings,
                            defaultTimeIntervals: {
                              ...tempSettings.defaultTimeIntervals,
                              travel: parseFloat(e.target.value) || 0
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Rest</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={tempSettings.defaultTimeIntervals.rest}
                        onChange={e =>
                          setTempSettings({
                            ...tempSettings,
                            defaultTimeIntervals: {
                              ...tempSettings.defaultTimeIntervals,
                              rest: parseFloat(e.target.value) || 0
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Training</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={tempSettings.defaultTimeIntervals.training}
                        onChange={e =>
                          setTempSettings({
                            ...tempSettings,
                            defaultTimeIntervals: {
                              ...tempSettings.defaultTimeIntervals,
                              training: parseFloat(e.target.value) || 0
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Research</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={tempSettings.defaultTimeIntervals.research}
                        onChange={e =>
                          setTempSettings({
                            ...tempSettings,
                            defaultTimeIntervals: {
                              ...tempSettings.defaultTimeIntervals,
                              research: parseFloat(e.target.value) || 0
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings}>
                  <IconSettings className="mr-2 size-4" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Keep the old export name for backwards compatibility, but point to the new component
export const GameTimeInitDialog = CampaignInformationDialog
