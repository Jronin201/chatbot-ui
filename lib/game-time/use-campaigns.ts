"use client"

import { useState, useEffect, useCallback } from "react"
import { GameTimeStorage, CampaignSummary } from "@/lib/game-time/storage"
import { toast } from "sonner"

export interface UseCampaignsReturn {
  campaigns: CampaignSummary[]
  currentCampaignId: string | null
  isLoading: boolean
  error: string | null
  loadCampaigns: () => Promise<void>
  switchToCampaign: (campaignId: string) => Promise<boolean>
  deleteCampaign: (campaignId: string) => Promise<void>
  createCampaign: (campaignData: any) => Promise<string | null>
}

export const useCampaigns = (workspaceId: string): UseCampaignsReturn => {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const campaignList = await GameTimeStorage.getCampaigns(workspaceId)
      setCampaigns(campaignList)
      setCurrentCampaignId(GameTimeStorage.getCurrentCampaignId())
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load campaigns"
      setError(errorMessage)
      console.error("Error loading campaigns:", err)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  const switchToCampaign = async (campaignId: string): Promise<boolean> => {
    try {
      setError(null)
      const success = await GameTimeStorage.switchToCampaign(campaignId)
      if (success) {
        setCurrentCampaignId(campaignId)
        return true
      }
      return false
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to switch campaign"
      setError(errorMessage)
      console.error("Error switching campaign:", err)
      return false
    }
  }

  const deleteCampaign = async (campaignId: string): Promise<void> => {
    try {
      setError(null)
      await GameTimeStorage.deleteCampaign(campaignId)

      // If we deleted the current campaign, clear it
      if (currentCampaignId === campaignId) {
        setCurrentCampaignId(null)
      }

      // Reload campaigns list
      await loadCampaigns()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete campaign"
      setError(errorMessage)
      console.error("Error deleting campaign:", err)
      throw err
    }
  }

  const createCampaign = async (campaignData: {
    name: string
    gameSystem: string
    gameMaster?: string
    startDate?: string
    currentDate?: string
    characterInfo?: string
    notes?: string
  }): Promise<string | null> => {
    try {
      setError(null)
      const campaignId = GameTimeStorage.generateCampaignId()

      const gameTimeData = {
        currentDate:
          campaignData.currentDate || campaignData.startDate || "Day 1",
        calendarSystem: "standard" as const,
        startDate: campaignData.startDate || "Day 1",
        totalDaysElapsed: 0,
        lastUpdated: new Date().toISOString(),
        campaignMetadata: {
          campaignName: campaignData.name,
          gameSystem: campaignData.gameSystem,
          gameMaster: campaignData.gameMaster,
          workspaceId,
          characterInfo: campaignData.characterInfo,
          notes: campaignData.notes ? [campaignData.notes] : []
        },
        campaignId
      }

      // Save the campaign
      GameTimeStorage.setCurrentCampaignId(campaignId)
      await GameTimeStorage.saveGameTime(gameTimeData)

      // Update state
      setCurrentCampaignId(campaignId)
      await loadCampaigns()

      return campaignId
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create campaign"
      setError(errorMessage)
      console.error("Error creating campaign:", err)
      return null
    }
  }

  // Load campaigns on mount and when workspace changes
  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  return {
    campaigns,
    currentCampaignId,
    isLoading,
    error,
    loadCampaigns,
    switchToCampaign,
    deleteCampaign,
    createCampaign
  }
}
