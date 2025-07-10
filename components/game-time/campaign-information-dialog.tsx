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
import { IconEdit, IconSword, IconX, IconTerminal } from "@tabler/icons-react"
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
    // updateGameTime, // Removed - was used by Adjust Time tab
    // setGameTime, // Removed - was used by Adjust Time tab
    deleteGameTime,
    // timePassageHistory, // Removed - was used by History tab
    settings,
    // updateSettings, // Removed - was used by Settings tab
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
  // Remove activeTab since we no longer have tabs
  // const [activeTab, setActiveTab] = useState("management")
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
  const [campaignPlot, setCampaignPlot] = useState("")
  const [campaignGoal, setCampaignGoal] = useState("")
  const [subplot1, setSubplot1] = useState("")
  const [subplot2, setSubplot2] = useState("")
  const [subplot3, setSubplot3] = useState("")
  const [startingLocation, setStartingLocation] = useState("")
  const [startingSituation, setStartingSituation] = useState("")
  const [gameMasterAssistantId, setGameMasterAssistantId] = useState("")

  // AI generation options
  const [useAIGeneration, setUseAIGeneration] = useState(false)
  const [aiGenerationOptions, setAiGenerationOptions] = useState({
    campaignName: false,
    startDate: false,
    characters: false,
    npcs: false
  })

  // Time adjustment state - Remove since Adjust Time tab is removed
  // const [daysToAdd, setDaysToAdd] = useState("")
  // const [timeDescription, setTimeDescription] = useState("")
  // const [newDate, setNewDate] = useState("")
  // const [dateDescription, setDateDescription] = useState("")

  // Settings state - Remove this section since Settings tab is removed
  // const [tempSettings, setTempSettings] = useState<GameTimeSettings>({
  //   autoDetectTimePassage: true,
  //   showTimePassageNotifications: true,
  //   defaultTimeIntervals: {
  //     travel: 3,
  //     rest: 1,
  //     training: 7,
  //     research: 3,
  //     shopping: 0.5
  //   },
  //   customKeywords: {}
  // })

  const [isLoading, setIsLoading] = useState(false)

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCampaigns()

      // If campaignId is provided, load that specific campaign
      if (campaignId) {
        loadSpecificCampaign(campaignId)
      } else {
        // No campaignId provided - this is for creating a new campaign
        setCurrentCampaignId(GameTimeStorage.getCurrentCampaignId())
        setIsEditMode(false) // Reset edit mode when dialog opens
        // Remove setActiveTab since we no longer have tabs

        // Reset form fields for new campaign
        setCampaignName("")
        setGameSystem("Dune: Adventures in the Imperium")
        setCharacterName("")
        setCharacterInfo("")
        setKeyNPCs("")
        setNotes("")
        setCampaignPlot("")
        setCampaignGoal("")
        setSubplot1("")
        setSubplot2("")
        setSubplot3("")
        setStartingLocation("")
        setStartingSituation("")
        setCalendarSystem("dune")
        setStartDate("")
        setGameMasterAssistantId("")

        // Reset AI generation options
        setUseAIGeneration(false)
        setAiGenerationOptions({
          campaignName: false,
          startDate: false,
          characters: false,
          npcs: false
        })
      }
      // Remove tempSettings reference since Settings tab is removed
      // setTempSettings({ ...settings })
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
        setCampaignPlot(campaign.campaignMetadata?.campaignPlot || "")
        setCampaignGoal(campaign.campaignMetadata?.campaignGoal || "")
        setSubplot1(campaign.campaignMetadata?.subplot1 || "")
        setSubplot2(campaign.campaignMetadata?.subplot2 || "")
        setSubplot3(campaign.campaignMetadata?.subplot3 || "")
        setStartingLocation(campaign.campaignMetadata?.startingLocation || "")
        setStartingSituation(campaign.campaignMetadata?.startingSituation || "")
        setGameMasterAssistantId(
          campaign.campaignMetadata?.gameMasterAssistantId || ""
        )
        setCalendarSystem(campaign.calendarSystem)
        setStartDate(campaign.startDate)
        // Remove setNewDate and setActiveTab since those tabs are removed
        // setNewDate(campaign.currentDate)
        // setActiveTab("create") // Show the edit form
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
        campaignPlot: campaignPlot.trim() || undefined,
        campaignGoal: campaignGoal.trim() || undefined,
        subplot1: subplot1.trim() || undefined,
        subplot2: subplot2.trim() || undefined,
        subplot3: subplot3.trim() || undefined,
        startingLocation: startingLocation.trim() || undefined,
        startingSituation: startingSituation.trim() || undefined,
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
      // Remove setActiveTab since we no longer have tabs
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
        campaignPlot: campaignPlot.trim() || undefined,
        campaignGoal: campaignGoal.trim() || undefined,
        subplot1: subplot1.trim() || undefined,
        subplot2: subplot2.trim() || undefined,
        subplot3: subplot3.trim() || undefined,
        startingLocation: startingLocation.trim() || undefined,
        startingSituation: startingSituation.trim() || undefined,
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
      // Remove setActiveTab since we no longer have tabs
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
      setCampaignPlot(gameTimeData.campaignMetadata.campaignPlot || "")
      setCampaignGoal(gameTimeData.campaignMetadata.campaignGoal || "")
      setSubplot1(gameTimeData.campaignMetadata.subplot1 || "")
      setSubplot2(gameTimeData.campaignMetadata.subplot2 || "")
      setSubplot3(gameTimeData.campaignMetadata.subplot3 || "")
      setStartingLocation(gameTimeData.campaignMetadata.startingLocation || "")
      setStartingSituation(
        gameTimeData.campaignMetadata.startingSituation || ""
      )
      setGameMasterAssistantId(
        gameTimeData.campaignMetadata.gameMasterAssistantId || ""
      )
      setCalendarSystem(gameTimeData.calendarSystem)
      setStartDate(gameTimeData.startDate)

      setIsEditMode(true)
      // Remove setActiveTab since we no longer have tabs
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    // Remove setActiveTab since we no longer have tabs
    // Reset form fields
    setCampaignName("")
    setGameSystem("Dune: Adventures in the Imperium")
    setCharacterName("")
    setCharacterInfo("")
    setKeyNPCs("")
    setNotes("")
    setCampaignPlot("")
    setCampaignGoal("")
    setSubplot1("")
    setSubplot2("")
    setSubplot3("")
    setStartingLocation("")
    setStartingSituation("")
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

  // Remove unused functions from removed tabs
  // const handleAddTime = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (!daysToAdd || !timeDescription) {
  //     toast.error("Please fill in all fields")
  //     return
  //   }

  //   const days = parseFloat(daysToAdd)
  //   if (isNaN(days)) {
  //     toast.error("Please enter a valid number of days")
  //     return
  //   }

  //   try {
  //     await updateGameTime(days, timeDescription)
  //     setDaysToAdd("")
  //     setTimeDescription("")
  //     toast.success("Time updated successfully")
  //   } catch (error) {
  //     toast.error("Failed to update time")
  //   }
  // }

  // const handleSetDate = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (!newDate || !dateDescription) {
  //     toast.error("Please fill in all fields")
  //     return
  //   }

  //   try {
  //     await setGameTime(newDate, dateDescription)
  //     setDateDescription("")
  //     toast.success("Date set successfully")
  //   } catch (error) {
  //     toast.error("Failed to set date")
  //   }
  // }

  // Remove unused functions from removed tabs
  // const handleSaveSettings = async () => {
  //   try {
  //     await updateSettings(tempSettings)
  //     toast.success("Settings saved successfully")
  //   } catch (error) {
  //     toast.error("Failed to save settings")
  //   }
  // }

  // const handleExportData = async () => {
  //   try {
  //     const { GameTimeService } = await import(
  //       "@/lib/game-time/game-time-service"
  //     )
  //     const service = GameTimeService.getInstance()
  //     const data = await service.exportData()

  //     const blob = new Blob([data], { type: "application/json" })
  //     const url = URL.createObjectURL(blob)
  //     const a = document.createElement("a")
  //     a.href = url
  //     a.download = `game-time-${gameTimeData?.campaignMetadata?.campaignName || "campaign"}-${new Date().toISOString().split("T")[0]}.json`
  //     document.body.appendChild(a)
  //     a.click()
  //     document.body.removeChild(a)
  //     URL.revokeObjectURL(url)

  //     toast.success("Game time data exported")
  //   } catch (error) {
  //     toast.error("Failed to export data")
  //   }
  // }

  // const handleDeleteAllData = async () => {
  //   try {
  //     await deleteGameTime()
  //     toast.success("All game time data deleted")
  //     onClose()
  //   } catch (error) {
  //     toast.error("Failed to delete game time data")
  //   }
  // }

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
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
        windowId="CI-001"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSword className="size-5" />
            Campaign Information
          </DialogTitle>
          <DialogDescription>
            Manage your TTRPG campaigns, game time tracking, and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isEditMode ? "Edit Campaign" : "Create New Campaign"}
            </h3>
            {isEditMode && (
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <IconX className="mr-2 size-4" />
                Cancel Edit
              </Button>
            )}
          </div>

          <form
            onSubmit={isEditMode ? handleUpdateCampaign : handleCreateCampaign}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-6 p-0"
                    onClick={() => {
                      // Command button functionality will be added later
                    }}
                  >
                    <IconTerminal className="size-4" />
                  </Button>
                </div>
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
                  <SelectItem value="standard">Standard Calendar</SelectItem>
                  <SelectItem value="custom">Custom Calendar</SelectItem>
                </SelectContent>
              </Select>
              {isEditMode && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Calendar system cannot be changed after campaign creation
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
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
                      assistant => assistant.id && assistant.id.trim() !== ""
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
              <div className="flex items-center gap-2">
                <Label htmlFor="character-name">Character Name</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Input
                id="character-name"
                value={characterName}
                onChange={e => setCharacterName(e.target.value)}
                placeholder="Your character's name"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="character-info">Character Information</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="character-info"
                value={characterInfo}
                onChange={e => setCharacterInfo(e.target.value)}
                placeholder="Character stats, abilities, background, etc."
                rows={6}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="key-npcs">Key NPCs</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="key-npcs"
                value={keyNPCs}
                onChange={e => setKeyNPCs(e.target.value)}
                placeholder="Important NPCs, their relationships, goals, etc."
                rows={6}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="campaign-plot">Campaign Plot</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="campaign-plot"
                value={campaignPlot}
                onChange={e => setCampaignPlot(e.target.value)}
                placeholder="Main storyline and plot overview"
                rows={6}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="campaign-goal">Campaign Goal</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="campaign-goal"
                value={campaignGoal}
                onChange={e => setCampaignGoal(e.target.value)}
                placeholder="Primary objectives and end goals for the campaign"
                rows={4}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="subplot-1">Subplot 1</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="subplot-1"
                value={subplot1}
                onChange={e => setSubplot1(e.target.value)}
                placeholder="First subplot or side quest"
                rows={4}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="subplot-2">Subplot 2</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="subplot-2"
                value={subplot2}
                onChange={e => setSubplot2(e.target.value)}
                placeholder="Second subplot or side quest"
                rows={4}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="subplot-3">Subplot 3</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="subplot-3"
                value={subplot3}
                onChange={e => setSubplot3(e.target.value)}
                placeholder="Third subplot or side quest"
                rows={4}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="starting-location">Starting Location</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="starting-location"
                value={startingLocation}
                onChange={e => setStartingLocation(e.target.value)}
                placeholder="Where the campaign begins"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="starting-situation">Starting Situation</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => {
                    // Command button functionality will be added later
                  }}
                >
                  <IconTerminal className="size-4" />
                </Button>
              </div>
              <Textarea
                id="starting-situation"
                value={startingSituation}
                onChange={e => setStartingSituation(e.target.value)}
                placeholder="Initial circumstances and scenario"
                rows={4}
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
        </div>

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
