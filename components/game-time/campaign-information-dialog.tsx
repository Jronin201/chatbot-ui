"use client"

import React, { useState, useContext, useEffect } from "react"
import {
  CalendarSystem,
  CampaignMetadata,
  TimePassageEvent,
  GameTimeSettings,
  GameTimeData
} from "@/types/game-time"
import { LLMID } from "@/types"
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
    setShowFilesDisplay,
    profile,
    chatSettings
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

  const handleGenerateCampaignName = () => {
    // Check if Campaign Plot or Campaign Goal have text
    const hasPlot = campaignPlot.trim().length > 0
    const hasGoal = campaignGoal.trim().length > 0

    if (hasPlot || hasGoal) {
      // Generate name based on plot and/or goal
      const contextText = [campaignPlot.trim(), campaignGoal.trim()]
        .filter(text => text.length > 0)
        .join(" ")

      const generatedName = generateCampaignNameFromContext(contextText)
      setCampaignName(generatedName)
      toast.success("Campaign name generated based on plot and goals")
    } else {
      // Generate random name based on game system
      const randomName = generateRandomCampaignName(gameSystem)
      setCampaignName(randomName)
      toast.success("Random campaign name generated")
    }
  }

  const generateCampaignNameFromContext = (context: string): string => {
    // Extract key themes and concepts from the context
    const words = context.toLowerCase().split(/\s+/)

    // Common fantasy/sci-fi themes and their associated name patterns
    const themes = {
      // Fantasy themes
      dragon: ["Dragon's", "Dragonheart", "Wyrm's", "Scale"],
      magic: ["Arcane", "Mystic", "Enchanted", "Spellbound"],
      kingdom: ["Crown", "Throne", "Royal", "Empire"],
      dark: ["Shadow", "Darkness", "Void", "Eclipse"],
      light: ["Dawn", "Radiance", "Beacon", "Celestial"],
      war: ["Conflict", "Battle", "Strife", "Warfare"],
      ancient: ["Elder", "Primordial", "Forgotten", "Lost"],
      power: ["Dominion", "Ascension", "Sovereignty", "Supremacy"],

      // Sci-fi themes (especially Dune)
      spice: ["Spice", "Melange", "Desert", "Arrakis"],
      empire: ["Imperial", "Galactic", "Imperium", "Dynasty"],
      house: ["House", "Clan", "Lineage", "Bloodline"],
      desert: ["Dune", "Sands", "Wasteland", "Arid"],
      water: ["Water", "Moisture", "Oasis", "Precious"],
      prophecy: ["Prophecy", "Vision", "Foretelling", "Destiny"],
      politics: ["Intrigue", "Conspiracy", "Alliance", "Betrayal"],
      awakening: ["Awakening", "Rising", "Emergence", "Ascension"]
    }

    // Find matching themes
    const foundThemes = []
    for (const [key, variations] of Object.entries(themes)) {
      if (words.some(word => word.includes(key))) {
        foundThemes.push(
          variations[Math.floor(Math.random() * variations.length)]
        )
      }
    }

    // Campaign name templates
    const templates = [
      "The %s Chronicles",
      "Tales of %s",
      "The %s Saga",
      "Legacy of %s",
      "Rise of %s",
      "The %s Prophecy",
      "Shadows of %s",
      "The %s Conspiracy",
      "Echoes of %s",
      "The %s Awakening"
    ]

    if (foundThemes.length > 0) {
      const theme = foundThemes[Math.floor(Math.random() * foundThemes.length)]
      const template = templates[Math.floor(Math.random() * templates.length)]
      return template.replace("%s", theme)
    }

    // Fallback: extract meaningful words and create a name
    const meaningfulWords = words.filter(
      word =>
        word.length > 4 &&
        ![
          "the",
          "and",
          "but",
          "for",
          "nor",
          "yet",
          "so",
          "with",
          "from",
          "they",
          "them",
          "their",
          "this",
          "that",
          "will",
          "have",
          "been",
          "were",
          "said",
          "each",
          "which",
          "what",
          "when",
          "where",
          "while",
          "would",
          "could",
          "should"
        ].includes(word)
    )

    if (meaningfulWords.length > 0) {
      const word =
        meaningfulWords[Math.floor(Math.random() * meaningfulWords.length)]
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1)
      const template = templates[Math.floor(Math.random() * templates.length)]
      return template.replace("%s", capitalized)
    }

    // Final fallback
    return "The Great Campaign"
  }

  const generateRandomCampaignName = (gameSystem: string): string => {
    const system = gameSystem.toLowerCase()

    // System-specific name generators
    if (system.includes("dune")) {
      const duneNames = [
        "The Spice Must Flow",
        "House Wars of Arrakis",
        "The Golden Path",
        "Desert Power Rising",
        "Shadows of the Imperium",
        "The Water Sellers",
        "Prophecy of the Desert",
        "The Spacing Guild Chronicles",
        "Fremen Resistance",
        "The Great Convention",
        "Melange Conspiracy",
        "The Sardaukar Campaign",
        "Arrakeen Intrigues",
        "The Kwisatz Haderach",
        "Desert Storm Rising"
      ]
      return duneNames[Math.floor(Math.random() * duneNames.length)]
    }

    if (system.includes("d&d") || system.includes("dungeons")) {
      const dndNames = [
        "The Dragon's Hoard",
        "Tales of the Sword Coast",
        "The Forgotten Realms",
        "Rise of the Underdark",
        "The Elemental Chaos",
        "Heroes of the Vale",
        "The Shadowfell Conspiracy",
        "The Feywild Adventures",
        "The Astral Sea",
        "Curse of the Ancient",
        "The Planar Convergence",
        "Legends of the North",
        "The Arcane Brotherhood",
        "Storm King's Thunder",
        "The Nine Hells"
      ]
      return dndNames[Math.floor(Math.random() * dndNames.length)]
    }

    if (system.includes("pathfinder")) {
      const pathfinderNames = [
        "The Pathfinder Chronicles",
        "Rise of the Runelords",
        "The Kingmaker Campaign",
        "Wrath of the Righteous",
        "The Serpent's Skull",
        "Council of Thieves",
        "The Jade Regent",
        "Skull & Shackles",
        "The Shattered Star",
        "Reign of Winter",
        "The Mummy's Mask",
        "Iron Gods Rising",
        "The Giantslayer",
        "Hell's Rebels",
        "Strange Aeons"
      ]
      return pathfinderNames[Math.floor(Math.random() * pathfinderNames.length)]
    }

    if (system.includes("cyberpunk") || system.includes("shadowrun")) {
      const cyberpunkNames = [
        "Neon Nights",
        "The Corporate Wars",
        "Data Runners",
        "Chrome and Steel",
        "The Matrix Conspiracy",
        "Cyber Rebellion",
        "The Net Prophets",
        "Digital Shadows",
        "The Hack Collective",
        "Neural Storm",
        "The Datastream",
        "Virtual Vendetta",
        "The Code Breakers",
        "Synthetic Dreams",
        "The Ghost Protocol"
      ]
      return cyberpunkNames[Math.floor(Math.random() * cyberpunkNames.length)]
    }

    // Generic fantasy/adventure names
    const genericNames = [
      "The Epic Quest",
      "Heroes of Legend",
      "The Grand Adventure",
      "Tales of Glory",
      "The Chosen Few",
      "Rise of Heroes",
      "The Great Journey",
      "Legends Reborn",
      "The Heroic Age",
      "The Adventure Begins",
      "The Lost Chronicles",
      "The Forgotten Tales",
      "The New Legends",
      "The Eternal Quest",
      "The Mythic Campaign"
    ]

    return genericNames[Math.floor(Math.random() * genericNames.length)]
  }

  const handleGenerateStartDate = () => {
    const randomDate = generateRandomStartDate(calendarSystem)
    setStartDate(randomDate)
    toast.success(`Random start date generated for ${calendarSystem} calendar`)
  }

  const generateRandomStartDate = (calendar: CalendarSystem): string => {
    switch (calendar) {
      case "dune":
        return generateDuneDate()
      case "standard":
        return generateStandardDate()
      case "custom":
        return generateCustomDate()
      default:
        return generateDuneDate() // Default fallback
    }
  }

  const generateDuneDate = (): string => {
    // Dune calendar months in order
    const duneMonths = [
      "Ignis",
      "Canus",
      "Chusuk",
      "Grumman",
      "Ix",
      "Kaitan",
      "Kaitain",
      "Richese",
      "Salusa",
      "Tleilax",
      "Tupile",
      "Wallach"
    ]

    // Random day (1-30 for simplicity)
    const day = Math.floor(Math.random() * 30) + 1

    // Random month
    const month = duneMonths[Math.floor(Math.random() * duneMonths.length)]

    // Random year in the typical Dune era (10180-10200 A.G.)
    const year = Math.floor(Math.random() * 21) + 10180

    return `${day} ${month} ${year} A.G.`
  }

  const generateStandardDate = (): string => {
    // Standard calendar - just use "Day X" format
    const day = Math.floor(Math.random() * 365) + 1
    return `Day ${day}`
  }

  const generateCustomDate = (): string => {
    // For custom calendar, create a fantasy-style date
    const fantasyMonths = [
      "Frostfall",
      "Sunsbane",
      "Morningstar",
      "Harvesttide",
      "Starweave",
      "Moonhaven",
      "Goldleaf",
      "Stormwind",
      "Shadowmere",
      "Brightblade",
      "Ironforge",
      "Dragonmoon"
    ]

    const day = Math.floor(Math.random() * 28) + 1
    const month =
      fantasyMonths[Math.floor(Math.random() * fantasyMonths.length)]
    const year = Math.floor(Math.random() * 500) + 1000 // Years 1000-1499

    return `${day}th of ${month}, ${year} AR` // AR = After Realm founding
  }

  const handleGenerateCharacterName = () => {
    const hasCharacterInfo = characterInfo.trim().length > 0

    if (hasCharacterInfo) {
      // Generate name based on character information
      const generatedName = generateCharacterNameFromInfo(
        characterInfo,
        gameSystem
      )
      setCharacterName(generatedName)
      toast.success("Character name generated based on character information")
    } else {
      // Generate random name based on game system
      const randomName = generateRandomCharacterName(gameSystem)
      setCharacterName(randomName)
      toast.success("Random character name generated")
    }
  }

  const generateCharacterNameFromInfo = (
    info: string,
    system: string
  ): string => {
    const words = info.toLowerCase().split(/\s+/)
    const systemLower = system.toLowerCase()

    // Extract character traits and roles from the info
    const traits = {
      warrior: [
        "fighter",
        "warrior",
        "soldier",
        "knight",
        "guard",
        "mercenary",
        "swordsman"
      ],
      mage: [
        "mage",
        "wizard",
        "sorcerer",
        "warlock",
        "spellcaster",
        "magic",
        "arcane"
      ],
      rogue: [
        "rogue",
        "thief",
        "assassin",
        "spy",
        "stealth",
        "sneak",
        "shadow"
      ],
      noble: ["noble", "lord", "lady", "duke", "baron", "royal", "aristocrat"],
      desert: ["desert", "sand", "dune", "fremen", "nomad", "tribal"],
      tech: ["tech", "cyber", "hacker", "data", "net", "digital", "chrome"]
    }

    let characterType = "common"
    for (const [type, keywords] of Object.entries(traits)) {
      if (
        keywords.some(keyword => words.some(word => word.includes(keyword)))
      ) {
        characterType = type
        break
      }
    }

    return generateLoreAccurateName(systemLower, characterType)
  }

  const generateRandomCharacterName = (system: string): string => {
    const systemLower = system.toLowerCase()
    const randomTypes = ["warrior", "mage", "rogue", "noble", "common"]
    const characterType =
      randomTypes[Math.floor(Math.random() * randomTypes.length)]

    return generateLoreAccurateName(systemLower, characterType)
  }

  const generateLoreAccurateName = (
    system: string,
    characterType: string
  ): string => {
    if (system.includes("dune")) {
      return generateDuneCharacterName(characterType)
    } else if (system.includes("d&d") || system.includes("dungeons")) {
      return generateDnDCharacterName(characterType)
    } else if (system.includes("pathfinder")) {
      return generatePathfinderCharacterName(characterType)
    } else if (system.includes("cyberpunk") || system.includes("shadowrun")) {
      return generateCyberpunkCharacterName(characterType)
    } else if (system.includes("warhammer")) {
      return generateWarhammerCharacterName(characterType)
    } else if (system.includes("star wars")) {
      return generateStarWarsCharacterName(characterType)
    } else {
      // Generic fantasy
      return generateFantasyCharacterName(characterType)
    }
  }

  const generateDuneCharacterName = (type: string): string => {
    const duneNames: { [key: string]: string[] } = {
      noble: [
        "Leto Harkonnen",
        "Duncan Corrino",
        "Shaddam Atreides",
        "Feyd Ordos",
        "Alia Vernius",
        "Irulan Ginaz",
        "Stilgar Harkonnen",
        "Gurney Moritani"
      ],
      warrior: [
        "Stilgar",
        "Duncan Idaho",
        "Gurney Halleck",
        "Naib Korba",
        "Jamis",
        "Turok",
        "Harah",
        "Chani Kynes"
      ],
      desert: [
        "Muad'Dib",
        "Usul",
        "Jamis",
        "Stilgar",
        "Chani",
        "Naib",
        "Korba",
        "Otheym",
        "Farok",
        "Turok"
      ],
      mage: [
        "Reverend Mother Gaius",
        "Piter De Vries",
        "Yueh Suk",
        "Mohiam",
        "Margot Fenring",
        "Irulan Corrino",
        "Alia Atreides",
        "Jessica Atreides"
      ],
      common: [
        "Yueh",
        "Hawat",
        "Kynes",
        "Rabban",
        "Fenring",
        "Tuek",
        "Vries",
        "Suk",
        "Harq",
        "Nefud"
      ]
    }

    const names = duneNames[type] || duneNames.common
    return names[Math.floor(Math.random() * names.length)]
  }

  const generateDnDCharacterName = (type: string): string => {
    const dndNames: { [key: string]: string[] } = {
      warrior: [
        "Gareth Ironforge",
        "Thora Battlehammer",
        "Marcus Steelbane",
        "Lyra Dragonsbane",
        "Korgan Axebreaker",
        "Seraphina Goldshield",
        "Dain Stormforge",
        "Aria Lightbringer"
      ],
      mage: [
        "Elminster Aumar",
        "Mordenkainen",
        "Tasha Blackheart",
        "Bigby Spellweaver",
        "Zelda Starweaver",
        "Gandris Moonwhisper",
        "Mystra Arcanum",
        "Khelben Shadowstaff"
      ],
      rogue: [
        "Artemis Entreri",
        "Drizzt Do'Urden",
        "Silk Shadowstep",
        "Raven Nightfall",
        "Garrett Lockpick",
        "Luna Whisperwind",
        "Shadow Nightblade",
        "Vex Darkcrow"
      ],
      noble: [
        "Lord Blackwood",
        "Lady Silvermane",
        "Duke Ravencrest",
        "Baroness Goldleaf",
        "Prince Stormwind",
        "Duchess Moonhaven",
        "Earl Dragonmoor",
        "Countess Starfall"
      ],
      common: [
        "Gareth",
        "Thora",
        "Marcus",
        "Lyra",
        "Korgan",
        "Seraphina",
        "Dain",
        "Aria",
        "Eldric",
        "Maya",
        "Thorin",
        "Elara"
      ]
    }

    const names = dndNames[type] || dndNames.common
    return names[Math.floor(Math.random() * names.length)]
  }

  const generatePathfinderCharacterName = (type: string): string => {
    const pathfinderNames: { [key: string]: string[] } = {
      warrior: [
        "Amiri Kellid",
        "Valeros Fighter",
        "Seoni Sorcerer",
        "Harsk Ranger",
        "Kyra Cleric",
        "Ezren Wizard",
        "Merisiel Rogue",
        "Lem Bard"
      ],
      mage: [
        "Seoni Varisian",
        "Ezren Wizard",
        "Feiya Witch",
        "Alahazra Oracle",
        "Damiel Alchemist",
        "Lini Druid",
        "Jirelle Swashbuckler",
        "Hakon Skald"
      ],
      rogue: [
        "Merisiel Elf",
        "Red Raven",
        "Sajan Monk",
        "Crowe Bloodrager",
        "Reiko Ninja",
        "Seltyiel Magus",
        "Oloch Warpriest",
        "Zadim Slayer"
      ],
      noble: [
        "Lord Gyr",
        "Lady Darchana",
        "Count Jeggare",
        "Baroness Vencarlo",
        "Duke Dou-Bral",
        "Duchess Galfrey",
        "Prince Stavian",
        "Queen Abrogail"
      ],
      common: [
        "Amiri",
        "Valeros",
        "Seoni",
        "Harsk",
        "Kyra",
        "Ezren",
        "Merisiel",
        "Lem",
        "Sajan",
        "Lini",
        "Feiya",
        "Damiel"
      ]
    }

    const names = pathfinderNames[type] || pathfinderNames.common
    return names[Math.floor(Math.random() * names.length)]
  }

  const generateCyberpunkCharacterName = (type: string): string => {
    const cyberpunkNames: { [key: string]: string[] } = {
      tech: [
        "Neo Matrix",
        "Cipher Ghost",
        "Raven Data",
        "Vex Chrome",
        "Zero Cool",
        "Trinity Net",
        "Echo Binary",
        "Nyx Digital",
        "Blade Runner",
        "Phoenix Code"
      ],
      warrior: [
        "Molly Millions",
        "Case Neuromancer",
        "Armitage Colonel",
        "Riviera Artist",
        "Dixie Flatline",
        "Wintermute AI",
        "Johnny Mnemonic",
        "Lori Machine"
      ],
      rogue: [
        "Slip Shadow",
        "Hack Phantom",
        "Glitch Runner",
        "Proxy Ghost",
        "Wire Frame",
        "Data Thief",
        "Net Crawler",
        "Code Breaker",
        "Cyber Ninja",
        "Ghost Walker"
      ],
      noble: [
        "Corp Executive",
        "Zaibatsu Head",
        "Mr. Johnson",
        "Lady Chrome",
        "Director Steel",
        "Chairman Zero",
        "Executive Alpha",
        "Boss Matrix"
      ],
      common: [
        "Jack",
        "Nova",
        "Raven",
        "Vex",
        "Zero",
        "Echo",
        "Nyx",
        "Blade",
        "Phoenix",
        "Cipher",
        "Ghost",
        "Chrome",
        "Wire",
        "Slip",
        "Hack"
      ]
    }

    const names = cyberpunkNames[type] || cyberpunkNames.common
    return names[Math.floor(Math.random() * names.length)]
  }

  const generateWarhammerCharacterName = (type: string): string => {
    const warhammerNames: { [key: string]: string[] } = {
      warrior: [
        "Sigmar Heldenhammer",
        "Karl Franz",
        "Gotrek Gurnisson",
        "Felix Jaeger",
        "Tyrion Prince",
        "Teclis Mage",
        "Grimgor Ironhide",
        "Archaon Everchosen"
      ],
      mage: [
        "Teclis",
        "Malekith",
        "Nagash",
        "Mannfred",
        "Balthasar Gelt",
        "Grey Seer",
        "Thanquol",
        "Ikit Claw",
        "Morathi",
        "Alarielle"
      ],
      noble: [
        "Emperor Karl",
        "Prince Tyrion",
        "High King Thorgrim",
        "Elector Count",
        "Baron von Carstein",
        "Duke Alberic",
        "Lord Kroak",
        "Phoenix King"
      ],
      common: [
        "Markus",
        "Heinrich",
        "Wilhelm",
        "Gunther",
        "Dieter",
        "Johann",
        "Klaus",
        "Otto",
        "Franz",
        "Ludwig",
        "Matthias",
        "Stefan"
      ]
    }

    const names = warhammerNames[type] || warhammerNames.common
    return names[Math.floor(Math.random() * names.length)]
  }

  const generateStarWarsCharacterName = (type: string): string => {
    const starWarsNames: { [key: string]: string[] } = {
      mage: [
        "Jedi Master Kira",
        "Sith Lord Vex",
        "Padawan Zara",
        "Master Theron",
        "Dark Jedi Malak",
        "Force Adept Nomi",
        "Jedi Knight Bastila",
        "Sith Apprentice Revan"
      ],
      warrior: [
        "Captain Rex",
        "Commander Cody",
        "Sergeant Havoc",
        "Trooper Fives",
        "Mandalorian Jango",
        "Bounty Hunter Boba",
        "Rebel Pilot Wedge",
        "Imperial Admiral"
      ],
      rogue: [
        "Smuggler Solo",
        "Scoundrel Lando",
        "Pilot Poe",
        "Spy Cassian",
        "Thief Jyn",
        "Rebel Sabine",
        "Outlaw Din",
        "Mercenary Fennec"
      ],
      noble: [
        "Princess Leia",
        "Senator Amidala",
        "Count Dooku",
        "Duke Pantoran",
        "Queen Breha",
        "Baron Administrator",
        "Viceroy Gunray",
        "Chancellor Palpatine"
      ],
      common: [
        "Kira",
        "Vex",
        "Zara",
        "Theron",
        "Nomi",
        "Bastila",
        "Rex",
        "Cody",
        "Havoc",
        "Fives",
        "Jango",
        "Wedge",
        "Solo",
        "Lando",
        "Poe",
        "Cassian"
      ]
    }

    const names = starWarsNames[type] || starWarsNames.common
    return names[Math.floor(Math.random() * names.length)]
  }

  const generateFantasyCharacterName = (type: string): string => {
    const fantasyNames: { [key: string]: string[] } = {
      warrior: [
        "Aragorn",
        "Boromir",
        "Gimli",
        "Thorin",
        "Conan",
        "Beowulf",
        "Arthur",
        "Lancelot",
        "Gawain",
        "Percival",
        "Gareth",
        "Galahad"
      ],
      mage: [
        "Gandalf",
        "Merlin",
        "Saruman",
        "Radagast",
        "Elrond",
        "Galadriel",
        "Morgoth",
        "Sauron",
        "Voldemort",
        "Dumbledore",
        "Flamel",
        "Prospero"
      ],
      rogue: [
        "Bilbo",
        "Frodo",
        "Sam",
        "Merry",
        "Pippin",
        "Legolas",
        "Robin Hood",
        "Artemis",
        "Hermes",
        "Loki",
        "Silk",
        "Shadow"
      ],
      noble: [
        "King Arthur",
        "Lord Elrond",
        "Lady Galadriel",
        "Prince Legolas",
        "Duke Boromir",
        "Earl Faramir",
        "Baron Gimli",
        "Count Aragorn"
      ],
      common: [
        "Aiden",
        "Cora",
        "Dara",
        "Ewan",
        "Fynn",
        "Gwen",
        "Hale",
        "Iris",
        "Jace",
        "Kira",
        "Lars",
        "Mira",
        "Noel",
        "Orin",
        "Piper",
        "Quinn"
      ]
    }

    const names = fantasyNames[type] || fantasyNames.common
    return names[Math.floor(Math.random() * names.length)]
  }

  const handleGenerateCharacterInfo = async () => {
    if (!profile || !selectedWorkspace) {
      toast.error("Unable to generate character - user profile not available")
      return
    }

    // Use existing chat settings or create default ones
    const currentChatSettings = chatSettings || {
      model: "gpt-4" as LLMID,
      prompt:
        "You are a helpful assistant for tabletop RPG character creation.",
      temperature: 0.8,
      contextLength: 4096,
      includeProfileContext: false,
      includeWorkspaceInstructions: false,
      embeddingsProvider: "openai" as const
    }

    try {
      // Build the character generation prompt
      const systemPrompt = `You are an expert tabletop RPG character generator. Create a complete, playable character for the specified game system. Include all necessary stats, abilities, skills, background, and personality traits.

Game System: ${gameSystem}
Character Name: ${characterName || "Generate a suitable name"}
Campaign Context: ${campaignName ? `Campaign: ${campaignName}` : ""}${campaignPlot ? ` Plot: ${campaignPlot}` : ""}${campaignGoal ? ` Goal: ${campaignGoal}` : ""}

Generate a complete character sheet with:
1. Character Name (if not provided)
2. Race/Species and Class/Profession
3. Core Stats/Attributes (appropriate for the game system)
4. Skills and Abilities
5. Background and Backstory
6. Personality Traits and Motivations
7. Equipment and Starting Gear
8. Any system-specific mechanics

Format the response as a well-structured character sheet that can be directly used in play. Be lore-accurate for the specified game system.`

      const userPrompt = `Create a complete character for ${gameSystem}${characterName ? ` named ${characterName}` : ""}.`

      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]

      // Check API key availability based on model
      const modelProvider = currentChatSettings.model.includes("gpt")
        ? "openai"
        : currentChatSettings.model.includes("claude")
          ? "anthropic"
          : currentChatSettings.model.includes("gemini")
            ? "google"
            : "openai"

      let apiKey = ""
      if (modelProvider === "openai") {
        apiKey = profile.openai_api_key || ""
      } else if (modelProvider === "anthropic") {
        apiKey = profile.anthropic_api_key || ""
      } else if (modelProvider === "google") {
        apiKey = profile.google_gemini_api_key || ""
      }

      if (!apiKey) {
        toast.error(
          `${modelProvider.charAt(0).toUpperCase() + modelProvider.slice(1)} API key not found. Please set it in your profile settings.`
        )
        return
      }

      toast.info("Generating character...")

      // Make API call to generate character
      const response = await fetch(`/api/chat/${modelProvider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatSettings: currentChatSettings,
          messages: messages
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate character")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      let generatedText = ""
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // For OpenAI streaming responses, we might get JSON chunks
          // Try to handle both direct text and JSON responses
          try {
            // Check if it looks like a streaming JSON response
            if (chunk.trim().startsWith("data: ")) {
              const lines = chunk.split("\n")
              for (const line of lines) {
                if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                  try {
                    const jsonStr = line.substring(6) // Remove 'data: '
                    const parsed = JSON.parse(jsonStr)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      generatedText += content
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for individual chunks
                  }
                }
              }
            } else {
              // Direct text response
              generatedText += chunk
            }
          } catch (e) {
            // If parsing fails, treat as direct text
            generatedText += chunk
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (!generatedText.trim()) {
        throw new Error("No character data generated")
      }

      // Update character information field
      setCharacterInfo(generatedText)

      // If no character name was provided, try to extract it from the generated text
      if (!characterName) {
        const nameMatch = generatedText.match(
          /(?:Name|Character Name):\s*([^\n\r]+)/i
        )
        if (nameMatch) {
          setCharacterName(nameMatch[1].trim())
        }
      }

      toast.success("Character generated successfully!")
    } catch (error) {
      console.error("Error generating character:", error)
      toast.error(
        `Failed to generate character: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  const handleGenerateKeyNPCs = async () => {
    if (!profile || !selectedWorkspace) {
      toast.error("Unable to generate NPCs - user profile not available")
      return
    }

    // Use existing chat settings or create default ones
    const currentChatSettings = chatSettings || {
      model: "gpt-4" as LLMID,
      prompt: "You are a helpful assistant for tabletop RPG NPC creation.",
      temperature: 0.8,
      contextLength: 4096,
      includeProfileContext: false,
      includeWorkspaceInstructions: false,
      embeddingsProvider: "openai" as const
    }

    try {
      // Build the NPC generation prompt
      const systemPrompt = `You are an expert tabletop RPG NPC generator. Create exactly 3 distinct Non-Player Characters (NPCs) for the specified game system. Each NPC should be complete but concise, focusing only on relevant stats and mechanics for their role.

Game System: ${gameSystem}
Campaign Context: ${campaignName ? `Campaign: ${campaignName}` : ""}${campaignPlot ? ` Plot: ${campaignPlot}` : ""}${campaignGoal ? ` Goal: ${campaignGoal}` : ""}${characterInfo ? ` Player Character Context: ${characterInfo.substring(0, 200)}` : ""}

For each of the 3 NPCs, generate:
1. Name (appropriate for the game system)
2. Role/Class/Profession
3. Only the RELEVANT stats/attributes (not full character sheets)
4. Key skills and abilities (only what matters for their role)
5. Notable traits or special mechanics
6. Background (exactly 2 sentences)
7. Personality (exactly 2 sentences)

Keep each NPC focused and concise. Only include mechanics that are actually relevant to their role in the campaign. Format as a clear, easy-to-read list with proper spacing between each NPC.`

      const userPrompt = `Create 3 distinct NPCs for ${gameSystem} that would be suitable for this campaign context.`

      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]

      // Check API key availability based on model
      const modelProvider = currentChatSettings.model.includes("gpt")
        ? "openai"
        : currentChatSettings.model.includes("claude")
          ? "anthropic"
          : currentChatSettings.model.includes("gemini")
            ? "google"
            : "openai"

      let apiKey = ""
      if (modelProvider === "openai") {
        apiKey = profile.openai_api_key || ""
      } else if (modelProvider === "anthropic") {
        apiKey = profile.anthropic_api_key || ""
      } else if (modelProvider === "google") {
        apiKey = profile.google_gemini_api_key || ""
      }

      if (!apiKey) {
        toast.error(
          `${modelProvider.charAt(0).toUpperCase() + modelProvider.slice(1)} API key not found. Please set it in your profile settings.`
        )
        return
      }

      toast.info("Generating 3 NPCs...")

      // Make API call to generate NPCs
      const response = await fetch(`/api/chat/${modelProvider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatSettings: currentChatSettings,
          messages: messages
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate NPCs")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      let generatedText = ""
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // For OpenAI streaming responses, we might get JSON chunks
          // Try to handle both direct text and JSON responses
          try {
            // Check if it looks like a streaming JSON response
            if (chunk.trim().startsWith("data: ")) {
              const lines = chunk.split("\n")
              for (const line of lines) {
                if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                  try {
                    const jsonStr = line.substring(6) // Remove 'data: '
                    const parsed = JSON.parse(jsonStr)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      generatedText += content
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for individual chunks
                  }
                }
              }
            } else {
              // Direct text response
              generatedText += chunk
            }
          } catch (e) {
            // If parsing fails, treat as direct text
            generatedText += chunk
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (!generatedText.trim()) {
        throw new Error("No NPC data generated")
      }

      // Update Key NPCs field
      setKeyNPCs(generatedText)

      toast.success("3 NPCs generated successfully!")
    } catch (error) {
      console.error("Error generating NPCs:", error)
      toast.error(
        `Failed to generate NPCs: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  const handleGenerateCampaignPlot = async () => {
    if (!profile || !selectedWorkspace) {
      toast.error(
        "Unable to generate campaign plot - user profile not available"
      )
      return
    }

    // Use existing chat settings or create default ones
    const currentChatSettings = chatSettings || {
      model: "gpt-4" as LLMID,
      prompt: "You are a helpful assistant for tabletop RPG campaign creation.",
      temperature: 0.8,
      contextLength: 4096,
      includeProfileContext: false,
      includeWorkspaceInstructions: false,
      embeddingsProvider: "openai" as const
    }

    try {
      // Check if Campaign Goal has content to guide the plot
      const hasGoal = campaignGoal && campaignGoal.trim().length > 0

      // Build the campaign plot generation prompt
      const systemPrompt = `You are an expert tabletop RPG campaign designer. Create a compelling campaign plot for the specified game system that would work well as a story or TV show plot. The plot must be lore-accurate and include specific, actionable elements - no vague or fluffy descriptions.

Game System: ${gameSystem}
${hasGoal ? `Campaign Goal: ${campaignGoal}` : ""}
Campaign Context: ${campaignName ? `Campaign: ${campaignName}` : ""}${characterInfo ? ` Player Character Context: ${characterInfo.substring(0, 200)}` : ""}${keyNPCs ? ` Key NPCs: ${keyNPCs.substring(0, 200)}` : ""}

Generate a campaign plot that includes:
1. Clear, specific central conflict or threat
2. Tangible objectives and goals for the players
3. Specific locations, factions, or organizations involved
4. Actionable plot hooks and story beats
5. Concrete stakes and consequences
6. Specific antagonists or opposing forces

${
  hasGoal
    ? `The plot MUST align with and support the specified Campaign Goal. Design the story to naturally lead the players toward achieving that goal.`
    : `Create an engaging plot that fits the themes and tone of ${gameSystem}. Draw inspiration from popular stories, movies, or TV shows that would fit this game system.`
}

Make the plot detailed enough to be immediately usable but concise enough to be clear. Focus on concrete, actionable elements rather than abstract concepts. The plot should feel like it could be adapted into a compelling story or TV series.`

      const userPrompt = hasGoal
        ? `Create a campaign plot for ${gameSystem} that leads the players to achieve this goal: ${campaignGoal}`
        : `Create an engaging campaign plot for ${gameSystem} with clear objectives and actionable story elements.`

      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]

      // Check API key availability based on model
      const modelProvider = currentChatSettings.model.includes("gpt")
        ? "openai"
        : currentChatSettings.model.includes("claude")
          ? "anthropic"
          : currentChatSettings.model.includes("gemini")
            ? "google"
            : "openai"

      let apiKey = ""
      if (modelProvider === "openai") {
        apiKey = profile.openai_api_key || ""
      } else if (modelProvider === "anthropic") {
        apiKey = profile.anthropic_api_key || ""
      } else if (modelProvider === "google") {
        apiKey = profile.google_gemini_api_key || ""
      }

      if (!apiKey) {
        toast.error(
          `${modelProvider.charAt(0).toUpperCase() + modelProvider.slice(1)} API key not found. Please set it in your profile settings.`
        )
        return
      }

      const loadingMessage = hasGoal
        ? "Generating campaign plot based on goal..."
        : "Generating campaign plot..."

      toast.info(loadingMessage)

      // Make API call to generate campaign plot
      const response = await fetch(`/api/chat/${modelProvider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatSettings: currentChatSettings,
          messages: messages
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate campaign plot")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      let generatedText = ""
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // For OpenAI streaming responses, we might get JSON chunks
          // Try to handle both direct text and JSON responses
          try {
            // Check if it looks like a streaming JSON response
            if (chunk.trim().startsWith("data: ")) {
              const lines = chunk.split("\n")
              for (const line of lines) {
                if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                  try {
                    const jsonStr = line.substring(6) // Remove 'data: '
                    const parsed = JSON.parse(jsonStr)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      generatedText += content
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for individual chunks
                  }
                }
              }
            } else {
              // Direct text response
              generatedText += chunk
            }
          } catch (e) {
            // If parsing fails, treat as direct text
            generatedText += chunk
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (!generatedText.trim()) {
        throw new Error("No campaign plot data generated")
      }

      // Update Campaign Plot field
      setCampaignPlot(generatedText)

      const successMessage = hasGoal
        ? "Campaign plot generated based on goal!"
        : "Campaign plot generated successfully!"

      toast.success(successMessage)
    } catch (error) {
      console.error("Error generating campaign plot:", error)
      toast.error(
        `Failed to generate campaign plot: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  const handleGenerateCampaignGoal = async () => {
    if (!profile || !selectedWorkspace) {
      toast.error(
        "Unable to generate campaign goal - user profile not available"
      )
      return
    }

    // Use existing chat settings or create default ones
    const currentChatSettings = chatSettings || {
      model: "gpt-4" as LLMID,
      prompt: "You are a helpful assistant for tabletop RPG campaign creation.",
      temperature: 0.8,
      contextLength: 4096,
      includeProfileContext: false,
      includeWorkspaceInstructions: false,
      embeddingsProvider: "openai" as const
    }

    try {
      // Check if Campaign Plot has content to guide the goal
      const hasPlot = campaignPlot && campaignPlot.trim().length > 0

      // Build the campaign goal generation prompt
      const systemPrompt = `You are an expert tabletop RPG campaign designer. Create a compelling campaign goal for the specified game system that would work well as a story or TV show objective. The goal must be lore-accurate and include specific, actionable elements - no vague or fluffy descriptions.

Game System: ${gameSystem}
${hasPlot ? `Campaign Plot: ${campaignPlot}` : ""}
Campaign Context: ${campaignName ? `Campaign: ${campaignName}` : ""}${characterInfo ? ` Player Character Context: ${characterInfo.substring(0, 200)}` : ""}${keyNPCs ? ` Key NPCs: ${keyNPCs.substring(0, 200)}` : ""}

Generate a campaign goal that includes:
1. Clear, specific primary objective for the players
2. Tangible outcomes and measurable success criteria
3. Concrete stakes and what happens if they fail
4. Specific targets, locations, or entities to interact with
5. Actionable steps or milestones toward the goal
6. Compelling motivation that drives the story forward

${
  hasPlot
    ? `The goal MUST align with and be supported by the specified Campaign Plot. Design the goal to naturally emerge from and be achieved through the plot events.`
    : `Create an engaging goal that fits the themes and tone of ${gameSystem}. Draw inspiration from popular stories, movies, or TV shows that would fit this game system.`
}

Make the goal detailed enough to provide clear direction but concise enough to be memorable. Focus on concrete, actionable objectives rather than abstract concepts. The goal should feel like it could be the central objective of a compelling story or TV series.`

      const userPrompt = hasPlot
        ? `Create a campaign goal for ${gameSystem} that emerges from and aligns with this plot: ${campaignPlot.substring(0, 500)}`
        : `Create an engaging campaign goal for ${gameSystem} with clear objectives and actionable elements.`

      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]

      // Check API key availability based on model
      const modelProvider = currentChatSettings.model.includes("gpt")
        ? "openai"
        : currentChatSettings.model.includes("claude")
          ? "anthropic"
          : currentChatSettings.model.includes("gemini")
            ? "google"
            : "openai"

      let apiKey = ""
      if (modelProvider === "openai") {
        apiKey = profile.openai_api_key || ""
      } else if (modelProvider === "anthropic") {
        apiKey = profile.anthropic_api_key || ""
      } else if (modelProvider === "google") {
        apiKey = profile.google_gemini_api_key || ""
      }

      if (!apiKey) {
        toast.error(
          `${modelProvider.charAt(0).toUpperCase() + modelProvider.slice(1)} API key not found. Please set it in your profile settings.`
        )
        return
      }

      const loadingMessage = hasPlot
        ? "Generating campaign goal based on plot..."
        : "Generating campaign goal..."

      toast.info(loadingMessage)

      // Make API call to generate campaign goal
      const response = await fetch(`/api/chat/${modelProvider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatSettings: currentChatSettings,
          messages: messages
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate campaign goal")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      let generatedText = ""
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // For OpenAI streaming responses, we might get JSON chunks
          // Try to handle both direct text and JSON responses
          try {
            // Check if it looks like a streaming JSON response
            if (chunk.trim().startsWith("data: ")) {
              const lines = chunk.split("\n")
              for (const line of lines) {
                if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                  try {
                    const jsonStr = line.substring(6) // Remove 'data: '
                    const parsed = JSON.parse(jsonStr)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      generatedText += content
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for individual chunks
                  }
                }
              }
            } else {
              // Direct text response
              generatedText += chunk
            }
          } catch (e) {
            // If parsing fails, treat as direct text
            generatedText += chunk
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (!generatedText.trim()) {
        throw new Error("No campaign goal data generated")
      }

      // Update Campaign Goal field
      setCampaignGoal(generatedText)

      const successMessage = hasPlot
        ? "Campaign goal generated based on plot!"
        : "Campaign goal generated successfully!"

      toast.success(successMessage)
    } catch (error) {
      console.error("Error generating campaign goal:", error)
      toast.error(
        `Failed to generate campaign goal: ${error instanceof Error ? error.message : "Unknown error"}`
      )
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
                    onClick={handleGenerateCampaignName}
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
                  onClick={handleGenerateStartDate}
                  disabled={isEditMode}
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
                  onClick={handleGenerateCharacterName}
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
                  onClick={handleGenerateCharacterInfo}
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
                  onClick={handleGenerateKeyNPCs}
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
                  onClick={handleGenerateCampaignPlot}
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
                  onClick={handleGenerateCampaignGoal}
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
