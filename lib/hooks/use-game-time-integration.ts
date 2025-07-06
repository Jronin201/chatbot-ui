"use client"

import { useEffect, useRef, useState } from "react"
import { useGameTime } from "@/context/game-time-context"
import { GameTimeService } from "@/lib/game-time/game-time-service"
import { TimeChangeHandler } from "@/lib/game-time/time-change-handler"
import GameTimeAIIntegration from "@/lib/game-time/ai-integration"
import { toast } from "sonner"

interface UseGameTimeIntegrationOptions {
  /** Whether to automatically process messages for time passage */
  enabled?: boolean
  /** Minimum confidence required for automatic updates */
  minimumConfidence?: number
  /** Whether to show notifications for time passage */
  showNotifications?: boolean
}

interface TimePassageResult {
  timeUpdated: boolean
  daysElapsed?: number
  description?: string
  confidence?: number
  previousDate?: string
  newDate?: string
}

export const useGameTimeIntegration = (
  options: UseGameTimeIntegrationOptions = {}
) => {
  const {
    enabled = true,
    minimumConfidence = 0.7,
    showNotifications = true
  } = options

  const { gameTimeData, settings, formatDate, updateGameTime, loadGameTime } =
    useGameTime()
  const gameTimeService = GameTimeService.getInstance()
  const timeChangeHandler = TimeChangeHandler.getInstance()

  // Simple hash function for message content
  const hashMessage = (message: string): string => {
    let hash = 0
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<
    string | null
  >(null)
  const [processedMessageHashes, setProcessedMessageHashes] = useState<
    Set<string>
  >(new Set())
  const [timePassageNotifications, setTimePassageNotifications] = useState<
    Array<{
      id: string
      result: TimePassageResult
      timestamp: number
    }>
  >([])

  /**
   * Process a message for time passage
   */
  const processMessage = async (
    messageContent: string,
    messageId?: string
  ): Promise<TimePassageResult> => {
    if (!enabled || !gameTimeData || !settings.autoDetectTimePassage) {
      return { timeUpdated: false }
    }

    // Create a hash of the message content for deduplication
    const messageHash = hashMessage(messageContent.trim().toLowerCase())

    // Don't process the same message content twice
    if (processedMessageHashes.has(messageHash)) {
      return { timeUpdated: false }
    }

    // Also check by message ID if provided
    if (messageId && messageId === lastProcessedMessageId) {
      return { timeUpdated: false }
    }

    try {
      const result = await gameTimeService.processMessage(messageContent)

      if (result.timeUpdated && result.timePassageInfo) {
        // Mark this message as processed
        setLastProcessedMessageId(messageId || null)
        setProcessedMessageHashes(prev => {
          const newSet = new Set([...prev, messageHash])
          // Limit to last 100 hashes to prevent memory issues
          if (newSet.size > 100) {
            const hashArray = Array.from(newSet)
            return new Set(hashArray.slice(-100))
          }
          return newSet
        })

        const timePassageResult: TimePassageResult = {
          timeUpdated: true,
          daysElapsed: result.timePassageInfo.daysElapsed,
          description: result.timePassageInfo.description,
          confidence: result.timePassageInfo.confidence,
          previousDate: gameTimeData.currentDate,
          newDate: result.gameTimeData?.currentDate
        }

        // Trigger AI updates for Key NPCs and Campaign Notes
        try {
          const timePassageEvent = {
            previousDate: gameTimeData.currentDate,
            newDate:
              result.gameTimeData?.currentDate || gameTimeData.currentDate,
            daysElapsed: result.timePassageInfo.daysElapsed,
            description: result.timePassageInfo.description,
            timestamp: new Date().toISOString()
          }

          // Clean the message content to remove auto-detection metadata
          const cleanedContext = cleanMessageContent(messageContent)

          // Process time change with AI integration
          const aiUpdateResult = await timeChangeHandler.handleTimeChange(
            timePassageEvent,
            cleanedContext
          )

          if (aiUpdateResult.success) {
            // Refresh game time data to get updated campaign info
            await loadGameTime()

            // Show success notification for AI updates
            if (showNotifications) {
              toast.success(`Campaign information updated for time passage`, {
                description: aiUpdateResult.updates.join(", "),
                duration: 3000
              })
            }
          }
        } catch (error) {
          console.error("Error processing AI updates for time passage:", error)
          // Don't fail the entire operation if AI updates fail
        }

        // Show notification if enabled
        if (showNotifications && settings.showTimePassageNotifications) {
          const notification = {
            id: `time-passage-${Date.now()}`,
            result: timePassageResult,
            timestamp: Date.now()
          }
          setTimePassageNotifications(prev => [...prev, notification])

          // Auto-dismiss notification after 10 seconds
          setTimeout(() => {
            dismissNotification(notification.id)
          }, 10000)

          // Show toast notification
          const formattedNewDate = formatDate(
            result.gameTimeData?.currentDate || "",
            gameTimeData.calendarSystem
          )

          toast.success(
            `Time passed: ${result.timePassageInfo.daysElapsed} day(s). New date: ${formattedNewDate}`,
            {
              duration: 5000,
              description: result.timePassageInfo.description
            }
          )
        }

        return timePassageResult
      }

      return { timeUpdated: false }
    } catch (error) {
      console.error("Error processing message for time passage:", error)
      return { timeUpdated: false }
    }
  }

  /**
   * Enhanced processMessage that can optionally take conversation context
   */
  const processMessageWithContext = async (
    messageContent: string,
    messageId?: string,
    conversationContext?: string[]
  ): Promise<TimePassageResult> => {
    // First, process with the regular single-message approach
    const result = await processMessage(messageContent, messageId)

    // If we have broader conversation context and time was updated,
    // also process the full context for better NPC detection
    if (
      result.timeUpdated &&
      conversationContext &&
      conversationContext.length > 1
    ) {
      try {
        const aiIntegration = GameTimeAIIntegration.getInstance()
        const fullConversation = conversationContext.join("\n\n")
        await aiIntegration.processFullConversationForNPCs(fullConversation)
      } catch (error) {
        console.error("Error processing full conversation context:", error)
        // Don't fail the main operation if this fails
      }
    }

    return result
  }

  /**
   * Manually analyze a message for time passage without updating
   */
  const analyzeMessage = async (messageContent: string) => {
    if (!gameTimeData) return null

    try {
      const analysis =
        await gameTimeService.analyzeMessageForTimePassage(messageContent)
      return analysis
    } catch (error) {
      console.error("Error analyzing message:", error)
      return null
    }
  }

  /**
   * Dismiss a time passage notification
   */
  const dismissNotification = (notificationId: string) => {
    setTimePassageNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  /**
   * Clear all notifications
   */
  const clearAllNotifications = () => {
    setTimePassageNotifications([])
  }

  /**
   * Manually add time based on user input
   */
  const addTimeManually = async (days: number, description: string) => {
    try {
      await updateGameTime(days, description)

      if (showNotifications) {
        toast.success(`Added ${days} day(s) to game time`)
      }

      return true
    } catch (error) {
      if (showNotifications) {
        toast.error("Failed to add time")
      }
      return false
    }
  }

  /**
   * Get suggestions for time passage based on message content
   */
  const getTimePassageSuggestions = async (messageContent: string) => {
    try {
      const analysis = await analyzeMessage(messageContent)
      if (!analysis || !analysis.hasTimePassage) {
        return null
      }

      return {
        suggested: true,
        days: analysis.daysElapsed,
        description: analysis.explanation,
        confidence: analysis.confidence
      }
    } catch (error) {
      console.error("Error getting time passage suggestions:", error)
      return null
    }
  }

  /**
   * Clean message content by removing auto-detection metadata
   */
  const cleanMessageContent = (message: string): string => {
    if (!message) return ""

    // Remove auto-detection prefixes and technical information
    let cleaned = message
      .replace(/Auto-detected:\s*/gi, "")
      .replace(/Detected\s+\w+\s+activity:\s*/gi, "")
      .replace(/Estimated\s+\d+\s+day\(s\)\s+elapsed\.?/gi, "")
      .replace(/Context:\s*/gi, "")
      .replace(/Primary Goals:/gi, "")
      .replace(/and \d+ other time indicator\(s\)/gi, "")

    // Remove quoted fragments that contain only auto-detection descriptions
    cleaned = cleaned.replace(
      /"[^"]*(?:travel to|journey to|rest activity)[^"]*"/gi,
      ""
    )

    // Clean up multiple spaces and trim
    cleaned = cleaned.replace(/\s+/g, " ").trim()

    return cleaned
  }

  // Return all hook functions
  return {
    // Main processing functions
    processMessage,
    processMessageWithContext,

    // Analysis functions
    analyzeMessage,

    // Manual operations
    addTimeManually,

    // Utility functions
    getTimePassageSuggestions,
    cleanMessageContent,

    // Notification management
    dismissNotification,
    clearAllNotifications,

    // State
    timePassageNotifications,
    lastProcessedMessageId
  }
}
