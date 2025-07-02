import {
  GameTimeData,
  TimePassageEvent,
  GameTimeSettings
} from "@/types/game-time"

const GAME_TIME_FILE = "game_time.json"
const TIME_HISTORY_FILE = "time_passage_history.json"
const GAME_TIME_SETTINGS_FILE = "game_time_settings.json"

export class GameTimeStorage {
  /**
   * Check if running in browser environment
   */
  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  /**
   * Load game time data from storage
   */
  static async loadGameTime(): Promise<GameTimeData | null> {
    try {
      if (this.isBrowser()) {
        const data = localStorage.getItem(GAME_TIME_FILE)
        return data ? JSON.parse(data) : null
      } else {
        // Server-side: use file system
        const fs = await import("fs/promises")
        const path = await import("path")

        const filePath = path.join(process.cwd(), "data", GAME_TIME_FILE)

        try {
          const data = await fs.readFile(filePath, "utf-8")
          return JSON.parse(data)
        } catch (error: any) {
          if (error.code === "ENOENT") {
            return null // File doesn't exist
          }
          throw error
        }
      }
    } catch (error) {
      console.error("Error loading game time data:", error)
      return null
    }
  }

  /**
   * Save game time data to storage
   */
  static async saveGameTime(gameTimeData: GameTimeData): Promise<void> {
    try {
      const data = JSON.stringify(gameTimeData, null, 2)

      if (this.isBrowser()) {
        localStorage.setItem(GAME_TIME_FILE, data)
      } else {
        // Server-side: use file system
        const fs = await import("fs/promises")
        const path = await import("path")

        const dataDir = path.join(process.cwd(), "data")
        const filePath = path.join(dataDir, GAME_TIME_FILE)

        // Ensure data directory exists
        try {
          await fs.access(dataDir)
        } catch {
          await fs.mkdir(dataDir, { recursive: true })
        }

        await fs.writeFile(filePath, data, "utf-8")
      }
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
      if (this.isBrowser()) {
        localStorage.removeItem(GAME_TIME_FILE)
        localStorage.removeItem(TIME_HISTORY_FILE)
        localStorage.removeItem(GAME_TIME_SETTINGS_FILE)
      } else {
        // Server-side: delete files
        const fs = await import("fs/promises")
        const path = await import("path")

        const dataDir = path.join(process.cwd(), "data")
        const files = [
          GAME_TIME_FILE,
          TIME_HISTORY_FILE,
          GAME_TIME_SETTINGS_FILE
        ]

        for (const file of files) {
          const filePath = path.join(dataDir, file)
          try {
            await fs.unlink(filePath)
          } catch (error: any) {
            if (error.code !== "ENOENT") {
              console.error(`Error deleting ${file}:`, error)
            }
          }
        }
      }
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
      if (this.isBrowser()) {
        const data = localStorage.getItem(TIME_HISTORY_FILE)
        return data ? JSON.parse(data) : []
      } else {
        // Server-side: use file system
        const fs = await import("fs/promises")
        const path = await import("path")

        const filePath = path.join(process.cwd(), "data", TIME_HISTORY_FILE)

        try {
          const data = await fs.readFile(filePath, "utf-8")
          return JSON.parse(data)
        } catch (error: any) {
          if (error.code === "ENOENT") {
            return [] // File doesn't exist
          }
          throw error
        }
      }
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
      const data = JSON.stringify(history, null, 2)

      if (this.isBrowser()) {
        localStorage.setItem(TIME_HISTORY_FILE, data)
      } else {
        // Server-side: use file system
        const fs = await import("fs/promises")
        const path = await import("path")

        const dataDir = path.join(process.cwd(), "data")
        const filePath = path.join(dataDir, TIME_HISTORY_FILE)

        // Ensure data directory exists
        try {
          await fs.access(dataDir)
        } catch {
          await fs.mkdir(dataDir, { recursive: true })
        }

        await fs.writeFile(filePath, data, "utf-8")
      }
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
      if (this.isBrowser()) {
        const data = localStorage.getItem(GAME_TIME_SETTINGS_FILE)
        return data ? JSON.parse(data) : this.getDefaultSettings()
      } else {
        // Server-side: use file system
        const fs = await import("fs/promises")
        const path = await import("path")

        const filePath = path.join(
          process.cwd(),
          "data",
          GAME_TIME_SETTINGS_FILE
        )

        try {
          const data = await fs.readFile(filePath, "utf-8")
          return JSON.parse(data)
        } catch (error: any) {
          if (error.code === "ENOENT") {
            return this.getDefaultSettings() // File doesn't exist
          }
          throw error
        }
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
      const data = JSON.stringify(settings, null, 2)

      if (this.isBrowser()) {
        localStorage.setItem(GAME_TIME_SETTINGS_FILE, data)
      } else {
        // Server-side: use file system
        const fs = await import("fs/promises")
        const path = await import("path")

        const dataDir = path.join(process.cwd(), "data")
        const filePath = path.join(dataDir, GAME_TIME_SETTINGS_FILE)

        // Ensure data directory exists
        try {
          await fs.access(dataDir)
        } catch {
          await fs.mkdir(dataDir, { recursive: true })
        }

        await fs.writeFile(filePath, data, "utf-8")
      }
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
      if (this.isBrowser()) {
        return localStorage.getItem(GAME_TIME_FILE) !== null
      } else {
        // Server-side: check file existence
        const fs = await import("fs/promises")
        const path = await import("path")

        const filePath = path.join(process.cwd(), "data", GAME_TIME_FILE)

        try {
          await fs.access(filePath)
          return true
        } catch {
          return false
        }
      }
    } catch (error) {
      console.error("Error checking game time data existence:", error)
      return false
    }
  }

  /**
   * Export all game time data as JSON
   */
  static async exportAllData(): Promise<{
    gameTime: GameTimeData | null
    history: TimePassageEvent[]
    settings: GameTimeSettings
  }> {
    const [gameTime, history, settings] = await Promise.all([
      this.loadGameTime(),
      this.loadTimePassageHistory(),
      this.loadGameTimeSettings()
    ])

    return {
      gameTime,
      history,
      settings
    }
  }

  /**
   * Import all game time data from JSON
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
