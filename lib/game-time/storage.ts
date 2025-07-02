import {
  GameTimeData,
  TimePassageEvent,
  GameTimeSettings
} from "@/types/game-time"

// Storage keys for localStorage
const GAME_TIME_KEY = "chatbot-ui-game-time"
const TIME_HISTORY_KEY = "chatbot-ui-time-history"
const GAME_TIME_SETTINGS_KEY = "chatbot-ui-game-time-settings"

/**
 * Simple localStorage-based storage for game time data.
 * This avoids Node.js file system dependencies that cause issues in production builds.
 */
export class GameTimeStorage {
  /**
   * Check if localStorage is available
   */
  private static isStorageAvailable(): boolean {
    try {
      return (
        typeof window !== "undefined" && typeof localStorage !== "undefined"
      )
    } catch {
      return false
    }
  }

  /**
   * Load game time data from localStorage
   */
  static async loadGameTime(): Promise<GameTimeData | null> {
    try {
      if (!this.isStorageAvailable()) {
        return null
      }

      const data = localStorage.getItem(GAME_TIME_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error("Error loading game time data:", error)
      return null
    }
  }

  /**
   * Save game time data to localStorage
   */
  static async saveGameTime(gameTimeData: GameTimeData): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Storage not available")
      }

      const data = JSON.stringify(gameTimeData)
      localStorage.setItem(GAME_TIME_KEY, data)
    } catch (error) {
      console.error("Error saving game time data:", error)
      throw new Error("Failed to save game time data")
    }
  }

  /**
   * Delete game time data
   */
  static async deleteGameTime(): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        return
      }

      localStorage.removeItem(GAME_TIME_KEY)
      localStorage.removeItem(TIME_HISTORY_KEY)
      localStorage.removeItem(GAME_TIME_SETTINGS_KEY)
    } catch (error) {
      console.error("Error deleting game time data:", error)
      throw new Error("Failed to delete game time data")
    }
  }

  /**
   * Load time passage history
   */
  static async loadTimePassageHistory(): Promise<TimePassageEvent[]> {
    try {
      if (!this.isStorageAvailable()) {
        return []
      }

      const data = localStorage.getItem(TIME_HISTORY_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error loading time passage history:", error)
      return []
    }
  }

  /**
   * Save time passage history
   */
  static async saveTimePassageHistory(
    history: TimePassageEvent[]
  ): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Storage not available")
      }

      const data = JSON.stringify(history)
      localStorage.setItem(TIME_HISTORY_KEY, data)
    } catch (error) {
      console.error("Error saving time passage history:", error)
      throw new Error("Failed to save time passage history")
    }
  }

  /**
   * Add time passage event to history
   */
  static async addTimePassageEvent(event: TimePassageEvent): Promise<void> {
    const history = await this.loadTimePassageHistory()
    history.push(event)

    // Keep only the last 100 events to prevent storage bloat
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }

    await this.saveTimePassageHistory(history)
  }

  /**
   * Load game time settings
   */
  static async loadGameTimeSettings(): Promise<GameTimeSettings> {
    try {
      if (!this.isStorageAvailable()) {
        return this.getDefaultSettings()
      }

      const data = localStorage.getItem(GAME_TIME_SETTINGS_KEY)
      const settings = data ? JSON.parse(data) : this.getDefaultSettings()

      // Ensure all required properties exist (for backward compatibility)
      return {
        ...this.getDefaultSettings(),
        ...settings
      }
    } catch (error) {
      console.error("Error loading game time settings:", error)
      return this.getDefaultSettings()
    }
  }

  /**
   * Save game time settings
   */
  static async saveGameTimeSettings(settings: GameTimeSettings): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Storage not available")
      }

      const data = JSON.stringify(settings)
      localStorage.setItem(GAME_TIME_SETTINGS_KEY, data)
    } catch (error) {
      console.error("Error saving game time settings:", error)
      throw new Error("Failed to save game time settings")
    }
  }

  /**
   * Get default settings
   */
  static getDefaultSettings(): GameTimeSettings {
    return {
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
    }
  }

  /**
   * Check if game time data exists
   */
  static async hasGameTimeData(): Promise<boolean> {
    try {
      if (!this.isStorageAvailable()) {
        return false
      }

      return localStorage.getItem(GAME_TIME_KEY) !== null
    } catch (error) {
      console.error("Error checking game time data existence:", error)
      return false
    }
  }

  /**
   * Export all game time data for backup
   */
  static async exportAllData(): Promise<{
    gameTime: GameTimeData | null
    history: TimePassageEvent[]
    settings: GameTimeSettings
    exportDate: string
    version: string
  }> {
    const [gameTime, history, settings] = await Promise.all([
      this.loadGameTime(),
      this.loadTimePassageHistory(),
      this.loadGameTimeSettings()
    ])

    return {
      gameTime,
      history,
      settings,
      exportDate: new Date().toISOString(),
      version: "1.0"
    }
  }

  /**
   * Import all game time data from backup
   */
  static async importAllData(data: {
    gameTime?: GameTimeData
    history?: TimePassageEvent[]
    settings?: GameTimeSettings
  }): Promise<void> {
    const promises: Promise<void>[] = []

    if (data.gameTime) {
      promises.push(this.saveGameTime(data.gameTime))
    }

    if (data.history) {
      promises.push(this.saveTimePassageHistory(data.history))
    }

    if (data.settings) {
      promises.push(this.saveGameTimeSettings(data.settings))
    }

    await Promise.all(promises)
  }
}
