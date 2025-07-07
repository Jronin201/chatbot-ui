"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  IconChevronDown,
  IconPlus,
  IconTrash,
  IconEdit,
  IconSword,
  IconWand,
  IconCalendar,
  IconClock
} from "@tabler/icons-react"
import { toast } from "sonner"
import { GameTimeStorage, CampaignSummary } from "@/lib/game-time/storage"
import { GameTimeData, CampaignMetadata } from "@/types/game-time"
import { useGameTime } from "@/context/game-time-context"

interface CampaignSelectorProps {
  workspaceId: string
  userId?: string
  onCampaignChange?: (campaignId: string | null) => void
  className?: string
}

export const CampaignSelector: React.FC<CampaignSelectorProps> = ({
  workspaceId,
  userId,
  onCampaignChange,
  className
}) => {
  const { gameTimeData, setGameTime, loadGameTime } = useGameTime()
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAICreateDialog, setShowAICreateDialog] = useState(false)

  // Create campaign form state
  const [newCampaignName, setNewCampaignName] = useState("")
  const [newGameSystem, setNewGameSystem] = useState("")
  const [newGameMaster, setNewGameMaster] = useState("")
  const [newStartDate, setNewStartDate] = useState("")
  const [newCurrentDate, setNewCurrentDate] = useState("")
  const [newCharacterInfo, setNewCharacterInfo] = useState("")
  const [newNotes, setNewNotes] = useState("")

  // AI campaign creation state
  const [aiCampaignPrompt, setAiCampaignPrompt] = useState("")
  const [isCreatingAICampaign, setIsCreatingAICampaign] = useState(false)

  const loadCampaigns = useCallback(async () => {
    try {
      const campaignList = await GameTimeStorage.getCampaigns(workspaceId)
      setCampaigns(campaignList)
    } catch (error) {
      console.error("Error loading campaigns:", error)
      toast.error("Failed to load campaigns")
    }
  }, [workspaceId])

  // Load campaigns on mount and when workspace changes
  useEffect(() => {
    loadCampaigns()
    setCurrentCampaignId(GameTimeStorage.getCurrentCampaignId())
  }, [workspaceId, loadCampaigns])

  const handleCampaignSwitch = async (campaignId: string) => {
    try {
      setIsLoading(true)
      const success = await GameTimeStorage.switchToCampaign(campaignId)

      if (success) {
        setCurrentCampaignId(campaignId)
        await loadGameTime()
        onCampaignChange?.(campaignId)
        toast.success("Switched to campaign")
      } else {
        toast.error("Failed to switch campaign")
      }
    } catch (error) {
      console.error("Error switching campaign:", error)
      toast.error("Failed to switch campaign")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim() || !newGameSystem.trim()) {
      toast.error("Campaign name and game system are required")
      return
    }

    try {
      setIsLoading(true)

      // Check for duplicate campaign names
      const duplicateCampaign = campaigns.find(
        c => c.name.toLowerCase() === newCampaignName.trim().toLowerCase()
      )

      if (duplicateCampaign) {
        toast.error("A campaign with this name already exists")
        return
      }

      const campaignId = GameTimeStorage.generateCampaignId()

      const campaignMetadata: CampaignMetadata = {
        campaignName: newCampaignName.trim(),
        gameSystem: newGameSystem.trim(),
        gameMaster: newGameMaster.trim() || undefined,
        workspaceId,
        characterInfo: newCharacterInfo.trim() || undefined,
        keyNPCs: undefined,
        notes: newNotes.trim() ? [newNotes.trim()] : []
      }

      const gameTimeData: GameTimeData = {
        currentDate: newCurrentDate.trim() || newStartDate.trim() || "Day 1",
        calendarSystem: "standard",
        startDate: newStartDate.trim() || "Day 1",
        totalDaysElapsed: 0,
        lastUpdated: new Date().toISOString(),
        campaignMetadata,
        campaignId
      }

      // Switch to new campaign and save data
      GameTimeStorage.setCurrentCampaignId(campaignId)
      await GameTimeStorage.saveGameTime(gameTimeData)

      // Update state
      setCurrentCampaignId(campaignId)
      await loadCampaigns()
      await loadGameTime()

      // Reset form
      setNewCampaignName("")
      setNewGameSystem("")
      setNewGameMaster("")
      setNewStartDate("")
      setNewCurrentDate("")
      setNewCharacterInfo("")
      setNewNotes("")
      setShowCreateDialog(false)

      onCampaignChange?.(campaignId)
      toast.success("Campaign created successfully")
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Failed to create campaign")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAICampaignCreation = async () => {
    if (!aiCampaignPrompt.trim()) {
      toast.error("Please describe the campaign you want to create")
      return
    }

    try {
      setIsCreatingAICampaign(true)

      // This would ideally call an AI service to generate campaign details
      // For now, we'll create a basic campaign structure
      const campaignId = GameTimeStorage.generateCampaignId()

      // Generate a unique name for AI-generated campaigns
      let baseName = "AI Generated Campaign"
      let campaignName = baseName
      let counter = 1

      while (
        campaigns.find(c => c.name.toLowerCase() === campaignName.toLowerCase())
      ) {
        campaignName = `${baseName} ${counter}`
        counter++
      }

      const campaignMetadata: CampaignMetadata = {
        campaignName,
        gameSystem: "D&D 5e", // Default, could be determined by AI
        gameMaster: "AI Assistant",
        workspaceId,
        characterInfo: aiCampaignPrompt.trim(),
        keyNPCs: undefined,
        notes: [`Campaign created from prompt: "${aiCampaignPrompt.trim()}"`]
      }

      const gameTimeData: GameTimeData = {
        currentDate: "Day 1",
        calendarSystem: "standard",
        startDate: "Day 1",
        totalDaysElapsed: 0,
        lastUpdated: new Date().toISOString(),
        campaignMetadata,
        campaignId
      }

      // Switch to new campaign and save data
      GameTimeStorage.setCurrentCampaignId(campaignId)
      await GameTimeStorage.saveGameTime(gameTimeData)

      // Update state
      setCurrentCampaignId(campaignId)
      await loadCampaigns()
      await loadGameTime()

      // Reset form
      setAiCampaignPrompt("")
      setShowAICreateDialog(false)

      onCampaignChange?.(campaignId)
      toast.success("AI campaign created successfully")
    } catch (error) {
      console.error("Error creating AI campaign:", error)
      toast.error("Failed to create AI campaign")
    } finally {
      setIsCreatingAICampaign(false)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await GameTimeStorage.deleteCampaign(campaignId)
      await loadCampaigns()

      // If we deleted the current campaign, clear it
      if (currentCampaignId === campaignId) {
        setCurrentCampaignId(null)
        GameTimeStorage.setCurrentCampaignId(null)
        await loadGameTime()
        onCampaignChange?.(null)
      }

      toast.success("Campaign deleted")
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast.error("Failed to delete campaign")
    }
  }

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId)

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <IconSword className="size-4" />
              <span>
                {currentCampaign ? currentCampaign.name : "Select Campaign"}
              </span>
              <IconChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            {campaigns.length === 0 ? (
              <div className="text-muted-foreground p-2 text-center">
                No campaigns found
              </div>
            ) : (
              campaigns.map(campaign => (
                <DropdownMenuItem
                  key={campaign.id}
                  onClick={() => handleCampaignSwitch(campaign.id)}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{campaign.name}</span>
                      {campaign.id === currentCampaignId && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4 text-xs">
                      <span>{campaign.gameSystem}</span>
                      <span className="flex items-center gap-1">
                        <IconCalendar className="size-3" />
                        {campaign.currentDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconClock className="size-3" />
                        {campaign.totalDaysElapsed} days
                      </span>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => e.stopPropagation()}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent windowId="CS-A01">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{campaign.name}
                          &quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
              <IconPlus className="mr-2 size-4" />
              Create New Campaign
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAICreateDialog(true)}>
              <IconWand className="mr-2 size-4" />
              Create with AI
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" windowId="CS-001">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new TTRPG campaign with game time tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name *</Label>
                <Input
                  id="campaign-name"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="game-system">Game System *</Label>
                <Input
                  id="game-system"
                  value={newGameSystem}
                  onChange={e => setNewGameSystem(e.target.value)}
                  placeholder="e.g., D&D 5e, Pathfinder, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="game-master">Game Master</Label>
              <Input
                id="game-master"
                value={newGameMaster}
                onChange={e => setNewGameMaster(e.target.value)}
                placeholder="Enter GM name (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  value={newStartDate}
                  onChange={e => setNewStartDate(e.target.value)}
                  placeholder="e.g., Day 1, 1st of Tarsakh"
                />
              </div>
              <div>
                <Label htmlFor="current-date">Current Date</Label>
                <Input
                  id="current-date"
                  value={newCurrentDate}
                  onChange={e => setNewCurrentDate(e.target.value)}
                  placeholder="Leave blank to use start date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="character-info">Character Information</Label>
              <Textarea
                id="character-info"
                value={newCharacterInfo}
                onChange={e => setNewCharacterInfo(e.target.value)}
                placeholder="Enter player character details"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Campaign Notes</Label>
              <Textarea
                id="notes"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Any initial notes about the campaign"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Create Campaign Dialog */}
      <Dialog open={showAICreateDialog} onOpenChange={setShowAICreateDialog}>
        <DialogContent windowId="CS-002">
          <DialogHeader>
            <DialogTitle>Create Campaign with AI</DialogTitle>
            <DialogDescription>
              Describe the campaign you want to create and let AI help set it up
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">Campaign Description</Label>
              <Textarea
                id="ai-prompt"
                value={aiCampaignPrompt}
                onChange={e => setAiCampaignPrompt(e.target.value)}
                placeholder="Describe your campaign idea... e.g., 'A high fantasy adventure in the Forgotten Realms where the party starts as level 1 adventurers in the town of Phandalin'"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAICreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAICampaignCreation}
              disabled={isCreatingAICampaign}
            >
              {isCreatingAICampaign ? "Creating..." : "Create with AI"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
