"use client"

import { useState, useCallback } from "react"
import { CampaignMetadata } from "@/types/game-time"
import GameTimeAIIntegration from "@/lib/game-time/ai-integration"
import { toast } from "sonner"

/**
 * Hook for AI integration with Game Time campaign data
 */
export const useGameTimeAI = () => {
  const [isUpdating, setIsUpdating] = useState(false)
  const aiIntegration = GameTimeAIIntegration.getInstance()

  /**
   * Update character information field with AI-generated content
   */
  const updateCharacterInfo = useCallback(
    async (newContent: string): Promise<boolean> => {
      setIsUpdating(true)
      try {
        const success = await aiIntegration.updateCampaignField(
          "characterInfo",
          newContent
        )
        if (success) {
          toast.success("Character information updated")
        } else {
          toast.error("Failed to update character information")
        }
        return success
      } catch (error) {
        console.error("Error updating character info:", error)
        toast.error("Error updating character information")
        return false
      } finally {
        setIsUpdating(false)
      }
    },
    [aiIntegration]
  )

  /**
   * Update key NPCs field with AI-generated content
   */
  const updateKeyNPCs = useCallback(
    async (newContent: string): Promise<boolean> => {
      setIsUpdating(true)
      try {
        const success = await aiIntegration.updateCampaignField(
          "keyNPCs",
          newContent
        )
        if (success) {
          toast.success("Key NPCs updated")
        } else {
          toast.error("Failed to update key NPCs")
        }
        return success
      } catch (error) {
        console.error("Error updating key NPCs:", error)
        toast.error("Error updating key NPCs")
        return false
      } finally {
        setIsUpdating(false)
      }
    },
    [aiIntegration]
  )

  /**
   * Get the current campaign context that's being sent to AI
   */
  const getCampaignContext = useCallback(async (): Promise<string> => {
    try {
      return await aiIntegration.getCampaignContextForAI()
    } catch (error) {
      console.error("Error getting campaign context:", error)
      return ""
    }
  }, [aiIntegration])

  /**
   * Get token count for current campaign context
   */
  const getContextTokenCount = useCallback(async (): Promise<number> => {
    try {
      return await aiIntegration.getCampaignContextTokenCount()
    } catch (error) {
      console.error("Error getting token count:", error)
      return 0
    }
  }, [aiIntegration])

  /**
   * Extract content from AI response for a specific field
   */
  const extractFieldContent = useCallback(
    (aiResponse: string, fieldType: "characterInfo" | "keyNPCs"): string => {
      return aiIntegration.extractFieldContent(aiResponse, fieldType)
    },
    [aiIntegration]
  )

  return {
    updateCharacterInfo,
    updateKeyNPCs,
    getCampaignContext,
    getContextTokenCount,
    extractFieldContent,
    isUpdating
  }
}

export default useGameTimeAI
