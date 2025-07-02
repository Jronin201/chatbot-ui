"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react"
import {
  GameTimeData,
  TimePassageEvent,
  GameTimeSettings,
  CalendarSystem,
  CampaignMetadata,
  GameTimeContextType
} from "@/types/game-time"
import { GameTimeService } from "@/lib/game-time/game-time-service"

const GameTimeContext = createContext<GameTimeContextType | undefined>(
  undefined
)

interface GameTimeProviderProps {
  children: ReactNode
}

export const GameTimeProvider: React.FC<GameTimeProviderProps> = ({
  children
}) => {
  const [gameTimeData, setGameTimeData] = useState<GameTimeData | null>(null)
  const [timePassageHistory, setTimePassageHistory] = useState<
    TimePassageEvent[]
  >([])
  const [settings, setSettings] = useState<GameTimeSettings>({
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const gameTimeService = GameTimeService.getInstance()

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [gameTime, history, gameSettings] = await Promise.all([
          gameTimeService.loadGameTime(),
          gameTimeService.getTimePassageHistory(),
          gameTimeService.getGameTimeSettings()
        ])

        setGameTimeData(gameTime)
        setTimePassageHistory(history)
        setSettings(gameSettings)
      } catch (err) {
        console.error("Error loading game time data:", err)
        setError(
          err instanceof Error ? err.message : "Failed to load game time data"
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [gameTimeService])

  const initializeGameTime = async (
    startDate: string,
    calendarSystem: CalendarSystem,
    campaignMetadata?: CampaignMetadata
  ): Promise<void> => {
    try {
      setError(null)
      const newGameTime = await gameTimeService.initializeGameTime(
        startDate,
        calendarSystem,
        campaignMetadata
      )
      setGameTimeData(newGameTime)

      // Reload history to include the initial event
      const history = await gameTimeService.getTimePassageHistory()
      setTimePassageHistory(history)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize game time"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateGameTime = async (
    daysElapsed: number,
    description: string
  ): Promise<void> => {
    try {
      setError(null)
      const updatedGameTime = await gameTimeService.updateGameTime(
        daysElapsed,
        description
      )
      setGameTimeData(updatedGameTime)

      // Reload history to include the new event
      const history = await gameTimeService.getTimePassageHistory()
      setTimePassageHistory(history)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update game time"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const setGameTime = async (
    newDate: string,
    description: string
  ): Promise<void> => {
    try {
      setError(null)
      const updatedGameTime = await gameTimeService.setGameTime(
        newDate,
        description
      )
      setGameTimeData(updatedGameTime)

      // Reload history to include the new event
      const history = await gameTimeService.getTimePassageHistory()
      setTimePassageHistory(history)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set game time"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteGameTime = async (): Promise<void> => {
    try {
      setError(null)
      await gameTimeService.deleteGameTime()
      setGameTimeData(null)
      setTimePassageHistory([])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete game time"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const loadGameTime = async (): Promise<void> => {
    try {
      setError(null)
      const gameTime = await gameTimeService.loadGameTime()
      setGameTimeData(gameTime)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load game time"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const analyzeMessageForTimePassage = async (
    message: string
  ): Promise<number> => {
    try {
      const analysis =
        await gameTimeService.analyzeMessageForTimePassage(message)
      return analysis.daysElapsed
    } catch (err) {
      console.error("Error analyzing message for time passage:", err)
      return 0
    }
  }

  const formatDate = (
    dateString: string,
    calendarSystem?: CalendarSystem
  ): string => {
    try {
      return gameTimeService.formatDate(
        dateString,
        calendarSystem || gameTimeData?.calendarSystem || "standard"
      )
    } catch (err) {
      console.error("Error formatting date:", err)
      return dateString
    }
  }

  const updateSettings = async (
    newSettings: Partial<GameTimeSettings>
  ): Promise<void> => {
    try {
      setError(null)
      const updatedSettings =
        await gameTimeService.updateGameTimeSettings(newSettings)
      setSettings(updatedSettings)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update settings"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const contextValue: GameTimeContextType = {
    gameTimeData,
    timePassageHistory,
    settings,
    isLoading,
    error,
    initializeGameTime,
    updateGameTime,
    setGameTime,
    deleteGameTime,
    loadGameTime,
    analyzeMessageForTimePassage,
    formatDate,
    updateSettings
  }

  return (
    <GameTimeContext.Provider value={contextValue}>
      {children}
    </GameTimeContext.Provider>
  )
}

export const useGameTime = (): GameTimeContextType => {
  const context = useContext(GameTimeContext)
  if (context === undefined) {
    throw new Error("useGameTime must be used within a GameTimeProvider")
  }
  return context
}

export { GameTimeContext }
