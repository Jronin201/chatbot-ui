"use client"

import { useEffect, useRef, useState } from "react"
import { useGameTime } from "@/context/game-time-context"
import { GameTimeService } from "@/lib/game-time/game-time-service"
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

  const { gameTimeData, settings, formatDate, updateGameTime } = useGameTime()
  const gameTimeService = GameTimeService.getInstance()
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<
    string | null
  >(null)
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

    // Don't process the same message twice
    if (messageId && messageId === lastProcessedMessageId) {
      return { timeUpdated: false }
    }

    try {
      const result = await gameTimeService.processMessage(messageContent)

      if (result.timeUpdated && result.timePassageInfo) {
        setLastProcessedMessageId(messageId || null)

        const timePassageResult: TimePassageResult = {
          timeUpdated: true,
          daysElapsed: result.timePassageInfo.daysElapsed,
          description: result.timePassageInfo.description,
          confidence: result.timePassageInfo.confidence,
          previousDate: gameTimeData.currentDate,
          newDate: result.gameTimeData?.currentDate
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

  // Auto-cleanup old notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      setTimePassageNotifications(prev =>
        prev.filter(notification => notification.timestamp > fiveMinutesAgo)
      )
    }, 60000) // Check every minute

    return () => clearInterval(cleanup)
  }, [])

  return {
    processMessage,
    analyzeMessage,
    addTimeManually,
    getTimePassageSuggestions,
    timePassageNotifications,
    dismissNotification,
    clearAllNotifications,
    isEnabled: enabled && !!gameTimeData && settings.autoDetectTimePassage,
    gameTimeData,
    settings
  }
}

export type { TimePassageResult, UseGameTimeIntegrationOptions }
