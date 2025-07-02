import {
  GameTimeData,
  TimePassageEvent,
  GameTimeSettings,
  CalendarSystem,
  CampaignMetadata
} from "@/types/game-time"
import { GameTimeManager } from "./calendar-utils"
import { TimePassageAnalyzer } from "./time-passage-analyzer"
import { GameTimeStorage } from "./storage"

export class GameTimeService {
  private analyzer: TimePassageAnalyzer
  private static instance: GameTimeService | null = null

  constructor() {
    this.analyzer = new TimePassageAnalyzer()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GameTimeService {
    if (!this.instance) {
      this.instance = new GameTimeService()
    }
    return this.instance
  }

  /**
   * Initialize a new game time tracking session
   */
  async initializeGameTime(
    startDate: string,
    calendarSystem: CalendarSystem,
    campaignMetadata?: CampaignMetadata
  ): Promise<GameTimeData> {
    // Validate the start date
    if (!GameTimeManager.isValidDate(startDate, calendarSystem)) {
      throw new Error(
        `Invalid start date for ${calendarSystem} calendar: ${startDate}`
      )
    }

    const gameTimeData: GameTimeData = {
      currentDate: startDate,
      calendarSystem,
      startDate,
      totalDaysElapsed: 0,
      lastUpdated: new Date().toISOString(),
      campaignMetadata: campaignMetadata || {
        gameSystem: "Unknown",
        campaignName: "New Campaign"
      }
    }

    await GameTimeStorage.saveGameTime(gameTimeData)

    // Create initial time passage event
    const initialEvent: TimePassageEvent = {
      description: "Campaign started",
      daysElapsed: 0,
      previousDate: startDate,
      newDate: startDate,
      timestamp: new Date().toISOString()
    }

    await GameTimeStorage.addTimePassageEvent(initialEvent)

    return gameTimeData
  }

  /**
   * Load existing game time data
   */
  async loadGameTime(): Promise<GameTimeData | null> {
    return await GameTimeStorage.loadGameTime()
  }

  /**
   * Check if game time data exists
   */
  async hasGameTimeData(): Promise<boolean> {
    return await GameTimeStorage.hasGameTimeData()
  }

  /**
   * Update game time by adding days
   */
  async updateGameTime(
    daysElapsed: number,
    description: string
  ): Promise<GameTimeData> {
    const currentData = await GameTimeStorage.loadGameTime()
    if (!currentData) {
      throw new Error(
        "No game time data found. Please initialize game time first."
      )
    }

    const previousDate = currentData.currentDate
    const newDate = GameTimeManager.addDays(
      currentData.currentDate,
      daysElapsed,
      currentData.calendarSystem
    )

    const updatedData: GameTimeData = {
      ...currentData,
      currentDate: newDate,
      totalDaysElapsed: currentData.totalDaysElapsed + daysElapsed,
      lastUpdated: new Date().toISOString()
    }

    await GameTimeStorage.saveGameTime(updatedData)

    // Record the time passage event
    const event: TimePassageEvent = {
      description,
      daysElapsed,
      previousDate,
      newDate,
      timestamp: new Date().toISOString()
    }

    await GameTimeStorage.addTimePassageEvent(event)

    return updatedData
  }

  /**
   * Set game time to a specific date
   */
  async setGameTime(
    newDate: string,
    description: string
  ): Promise<GameTimeData> {
    const currentData = await GameTimeStorage.loadGameTime()
    if (!currentData) {
      throw new Error(
        "No game time data found. Please initialize game time first."
      )
    }

    // Validate the new date
    if (!GameTimeManager.isValidDate(newDate, currentData.calendarSystem)) {
      throw new Error(
        `Invalid date for ${currentData.calendarSystem} calendar: ${newDate}`
      )
    }

    const previousDate = currentData.currentDate
    const daysDifference = GameTimeManager.daysDifference(
      currentData.startDate,
      newDate,
      currentData.calendarSystem
    )

    const updatedData: GameTimeData = {
      ...currentData,
      currentDate: newDate,
      totalDaysElapsed: daysDifference,
      lastUpdated: new Date().toISOString()
    }

    await GameTimeStorage.saveGameTime(updatedData)

    // Record the time change event
    const event: TimePassageEvent = {
      description,
      daysElapsed: GameTimeManager.daysDifference(
        previousDate,
        newDate,
        currentData.calendarSystem
      ),
      previousDate,
      newDate,
      timestamp: new Date().toISOString()
    }

    await GameTimeStorage.addTimePassageEvent(event)

    return updatedData
  }

  /**
   * Delete all game time data
   */
  async deleteGameTime(): Promise<void> {
    await GameTimeStorage.deleteGameTime()
  }

  /**
   * Analyze a message for time passage
   */
  async analyzeMessageForTimePassage(message: string): Promise<{
    hasTimePassage: boolean
    daysElapsed: number
    confidence: number
    explanation: string
  }> {
    const settings = await GameTimeStorage.loadGameTimeSettings()

    // Update analyzer with custom keywords if any
    if (Object.keys(settings.customKeywords).length > 0) {
      // Convert custom keywords to the format expected by analyzer
      for (const [keyword, days] of Object.entries(settings.customKeywords)) {
        this.analyzer.addCustomActivity(`custom_${keyword}`, [keyword], days)
      }
    }

    const analysis = this.analyzer.analyzeMessage(message)
    const suggestion = this.analyzer.getSuggestedTimePassage(message)

    return {
      hasTimePassage: suggestion.suggested,
      daysElapsed: suggestion.days,
      confidence: suggestion.confidence,
      explanation: suggestion.explanation
    }
  }

  /**
   * Get formatted current date
   */
  async getCurrentDateFormatted(): Promise<string> {
    const gameTimeData = await GameTimeStorage.loadGameTime()
    if (!gameTimeData) {
      return "No game time set"
    }

    return GameTimeManager.formatDate(
      gameTimeData.currentDate,
      gameTimeData.calendarSystem,
      gameTimeData.customCalendarConfig
    )
  }

  /**
   * Get time passage history
   */
  async getTimePassageHistory(): Promise<TimePassageEvent[]> {
    return await GameTimeStorage.loadTimePassageHistory()
  }

  /**
   * Get game time settings
   */
  async getGameTimeSettings(): Promise<GameTimeSettings> {
    return await GameTimeStorage.loadGameTimeSettings()
  }

  /**
   * Update game time settings
   */
  async updateGameTimeSettings(
    newSettings: Partial<GameTimeSettings>
  ): Promise<GameTimeSettings> {
    const currentSettings = await GameTimeStorage.loadGameTimeSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }
    await GameTimeStorage.saveGameTimeSettings(updatedSettings)
    return updatedSettings
  }

  /**
   * Get default start date for a calendar system
   */
  getDefaultStartDate(calendarSystem: CalendarSystem): string {
    return GameTimeManager.getDefaultStartDate(calendarSystem)
  }

  /**
   * Validate a date string for a calendar system
   */
  isValidDate(dateString: string, calendarSystem: CalendarSystem): boolean {
    return GameTimeManager.isValidDate(dateString, calendarSystem)
  }

  /**
   * Format a date string
   */
  formatDate(
    dateString: string,
    calendarSystem: CalendarSystem = "standard",
    customConfig?: any
  ): string {
    return GameTimeManager.formatDate(dateString, calendarSystem, customConfig)
  }

  /**
   * Process a chat message and automatically update time if enabled
   */
  async processMessage(message: string): Promise<{
    timeUpdated: boolean
    gameTimeData?: GameTimeData
    timePassageInfo?: {
      daysElapsed: number
      description: string
      confidence: number
    }
  }> {
    const settings = await this.getGameTimeSettings()
    const gameTimeData = await this.loadGameTime()

    if (!settings.autoDetectTimePassage || !gameTimeData) {
      return { timeUpdated: false }
    }

    const analysis = await this.analyzeMessageForTimePassage(message)

    if (analysis.hasTimePassage && analysis.confidence >= 0.7) {
      const updatedData = await this.updateGameTime(
        analysis.daysElapsed,
        `Auto-detected: ${analysis.explanation}`
      )

      return {
        timeUpdated: true,
        gameTimeData: updatedData,
        timePassageInfo: {
          daysElapsed: analysis.daysElapsed,
          description: analysis.explanation,
          confidence: analysis.confidence
        }
      }
    }

    return { timeUpdated: false }
  }

  /**
   * Export all game time data
   */
  async exportData(): Promise<string> {
    const data = await GameTimeStorage.exportAllData()
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import game time data
   */
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData)
      await GameTimeStorage.importAllData(data)
    } catch (error) {
      throw new Error(`Invalid JSON data: ${error}`)
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<{
    totalDaysElapsed: number
    campaignStartDate: string
    currentDate: string
    formattedCurrentDate: string
    timePassageEvents: number
    calendarSystem: string
    campaignMetadata?: CampaignMetadata
  }> {
    const gameTimeData = await this.loadGameTime()
    const history = await this.getTimePassageHistory()

    if (!gameTimeData) {
      throw new Error("No game time data found")
    }

    return {
      totalDaysElapsed: gameTimeData.totalDaysElapsed,
      campaignStartDate: gameTimeData.startDate,
      currentDate: gameTimeData.currentDate,
      formattedCurrentDate: this.formatDate(
        gameTimeData.currentDate,
        gameTimeData.calendarSystem
      ),
      timePassageEvents: history.length,
      calendarSystem: gameTimeData.calendarSystem,
      campaignMetadata: gameTimeData.campaignMetadata
    }
  }
}
