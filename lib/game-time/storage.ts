import {
  GameTimeData,
  TimePassageEvent,
  GameTimeSettings
} from "@/types/game-time"

// Storage keys for localStorage
const GAME_TIME_KEY = "chatbot-ui-game-time"
const TIME_HISTORY_KEY = "chatbot-ui-time-history"
const GAME_TIME_SETTINGS_KEY = "chatbot-ui-game-time-settings"
const CAMPAIGNS_KEY = "chatbot-ui-campaigns"
const CURRENT_CAMPAIGN_KEY = "chatbot-ui-current-campaign"

export interface CampaignSummary {
  id: string
  name: string
  gameSystem: string
  currentDate: string
  totalDaysElapsed: number
  lastUpdated: string
  workspaceId: string
  userId?: string
}

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
   * Load game time data from localStorage (for current campaign)
   */
  static async loadGameTime(): Promise<GameTimeData | null> {
    try {
      if (!this.isStorageAvailable()) {
        return null
      }

      const currentCampaignId = this.getCurrentCampaignId()
      const storageKey = currentCampaignId
        ? `${GAME_TIME_KEY}-${currentCampaignId}`
        : GAME_TIME_KEY

      const data = localStorage.getItem(storageKey)
      const gameTimeData = data ? JSON.parse(data) : null

      if (gameTimeData && currentCampaignId) {
        gameTimeData.campaignId = currentCampaignId
      }

      return gameTimeData
    } catch (error) {
      console.error("Error loading game time data:", error)
      return null
    }
  }

  /**
   * Save game time data to localStorage (for current campaign)
   */
  static async saveGameTime(gameTimeData: GameTimeData): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("Storage not available")
      }

      const currentCampaignId = this.getCurrentCampaignId()
      const storageKey = currentCampaignId
        ? `${GAME_TIME_KEY}-${currentCampaignId}`
        : GAME_TIME_KEY

      const data = JSON.stringify(gameTimeData)
      localStorage.setItem(storageKey, data)

      // Update campaign summary if we have a campaign ID
      if (currentCampaignId && gameTimeData.campaignMetadata) {
        const summary: CampaignSummary = {
          id: currentCampaignId,
          name:
            gameTimeData.campaignMetadata.campaignName || "Unnamed Campaign",
          gameSystem: gameTimeData.campaignMetadata.gameSystem || "Unknown",
          currentDate: gameTimeData.currentDate,
          totalDaysElapsed: gameTimeData.totalDaysElapsed,
          lastUpdated: gameTimeData.lastUpdated,
          workspaceId: gameTimeData.campaignMetadata.workspaceId || "default"
        }
        await this.saveCampaignSummary(summary)
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
      if (!this.isStorageAvailable()) {
        return
      }

      const currentCampaignId = this.getCurrentCampaignId()

      if (currentCampaignId) {
        await this.deleteCampaign(currentCampaignId)
      } else {
        // Fallback for legacy single campaign data
        localStorage.removeItem(GAME_TIME_KEY)
        localStorage.removeItem(TIME_HISTORY_KEY)
        localStorage.removeItem(GAME_TIME_SETTINGS_KEY)
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
      if (!this.isStorageAvailable()) {
        return []
      }

      const currentCampaignId = this.getCurrentCampaignId()
      const storageKey = currentCampaignId
        ? `${TIME_HISTORY_KEY}-${currentCampaignId}`
        : TIME_HISTORY_KEY

      const data = localStorage.getItem(storageKey)
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

      const currentCampaignId = this.getCurrentCampaignId()
      const storageKey = currentCampaignId
        ? `${TIME_HISTORY_KEY}-${currentCampaignId}`
        : TIME_HISTORY_KEY

      const data = JSON.stringify(history)
      localStorage.setItem(storageKey, data)
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
      const currentCampaignId = this.getCurrentCampaignId()
      const storageKey = currentCampaignId
        ? `${GAME_TIME_SETTINGS_KEY}-${currentCampaignId}`
        : GAME_TIME_SETTINGS_KEY

      if (!this.isStorageAvailable()) {
        return this.getDefaultSettings()
      }

      const data = localStorage.getItem(storageKey)
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

      const currentCampaignId = this.getCurrentCampaignId()
      const storageKey = currentCampaignId
        ? `${GAME_TIME_SETTINGS_KEY}-${currentCampaignId}`
        : GAME_TIME_SETTINGS_KEY

      const data = JSON.stringify(settings)
      localStorage.setItem(storageKey, data)
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

      const currentCampaignId = this.getCurrentCampaignId()
      const storageKey = currentCampaignId
        ? `${GAME_TIME_KEY}-${currentCampaignId}`
        : GAME_TIME_KEY

      return localStorage.getItem(storageKey) !== null
    } catch (error) {
      console.error("Error checking game time data existence:", error)
      return false
    }
  }

  /**
   * Load specific campaign by ID
   */
  static async loadCampaign(campaignId: string): Promise<GameTimeData | null> {
    try {
      if (!this.isStorageAvailable()) {
        return null
      }

      const data = localStorage.getItem(`${GAME_TIME_KEY}-${campaignId}`)
      const gameTimeData = data ? JSON.parse(data) : null

      if (gameTimeData) {
        gameTimeData.campaignId = campaignId
      }

      return gameTimeData
    } catch (error) {
      console.error("Error loading specific campaign:", error)
      return null
    }
  }

  /**
   * Switch to a different campaign
   */
  static async switchToCampaign(campaignId: string): Promise<boolean> {
    try {
      // Check if the campaign exists
      const campaignData = await this.loadCampaign(campaignId)
      if (!campaignData) {
        return false
      }

      // Set as current campaign
      this.setCurrentCampaignId(campaignId)
      return true
    } catch (error) {
      console.error("Error switching to campaign:", error)
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

  /**
   * Get current campaign ID from localStorage
   */
  static getCurrentCampaignId(): string | null {
    if (!this.isStorageAvailable()) return null
    return localStorage.getItem(CURRENT_CAMPAIGN_KEY)
  }

  /**
   * Set current campaign ID in localStorage
   */
  static setCurrentCampaignId(campaignId: string | null): void {
    if (!this.isStorageAvailable()) return

    if (campaignId) {
      localStorage.setItem(CURRENT_CAMPAIGN_KEY, campaignId)
    } else {
      localStorage.removeItem(CURRENT_CAMPAIGN_KEY)
    }
  }

  /**
   * Get all campaigns for the current workspace
   */
  static async getCampaigns(workspaceId: string): Promise<CampaignSummary[]> {
    try {
      if (!this.isStorageAvailable()) return []

      const data = localStorage.getItem(CAMPAIGNS_KEY)
      const allCampaigns: CampaignSummary[] = data ? JSON.parse(data) : []

      // Filter by workspace
      return allCampaigns.filter(
        campaign => campaign.workspaceId === workspaceId
      )
    } catch (error) {
      console.error("Error loading campaigns:", error)
      return []
    }
  }

  /**
   * Save campaign summary to the campaigns list
   */
  static async saveCampaignSummary(campaign: CampaignSummary): Promise<void> {
    try {
      if (!this.isStorageAvailable()) return

      const data = localStorage.getItem(CAMPAIGNS_KEY)
      const campaigns: CampaignSummary[] = data ? JSON.parse(data) : []

      // Update existing or add new
      const existingIndex = campaigns.findIndex(c => c.id === campaign.id)
      if (existingIndex >= 0) {
        campaigns[existingIndex] = campaign
      } else {
        campaigns.push(campaign)
      }

      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns))
    } catch (error) {
      console.error("Error saving campaign summary:", error)
    }
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(campaignId: string): Promise<void> {
    try {
      if (!this.isStorageAvailable()) return

      // Remove from campaigns list
      const data = localStorage.getItem(CAMPAIGNS_KEY)
      const campaigns: CampaignSummary[] = data ? JSON.parse(data) : []
      const filteredCampaigns = campaigns.filter(c => c.id !== campaignId)
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(filteredCampaigns))

      // Remove individual campaign data
      localStorage.removeItem(`${GAME_TIME_KEY}-${campaignId}`)
      localStorage.removeItem(`${TIME_HISTORY_KEY}-${campaignId}`)
      localStorage.removeItem(`${GAME_TIME_SETTINGS_KEY}-${campaignId}`)

      // Clear current campaign if it was the deleted one
      if (this.getCurrentCampaignId() === campaignId) {
        this.setCurrentCampaignId(null)
      }
    } catch (error) {
      console.error("Error deleting campaign:", error)
    }
  }

  /**
   * Generate a unique campaign ID
   */
  static generateCampaignId(): string {
    return `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
