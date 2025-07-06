/**
 * Campaign Data Storage System
 * Handles CRUD operations for modular campaign data
 */

import { EnhancedCampaignData } from "@/types/enhanced-campaign-data"
import { GameTimeData } from "@/types/game-time"

export type StorageAdapter = "json" | "database" | "memory"

export interface StorageConfig {
  adapter: StorageAdapter
  basePath?: string
  databaseUrl?: string
  encryptionKey?: string
  autoBackup?: boolean
}

export interface StorageOperation {
  type: "create" | "read" | "update" | "delete"
  module: keyof EnhancedCampaignData
  id?: string
  data?: any
  timestamp: Date
}

export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
  operation: StorageOperation
}

/**
 * Base storage class for campaign data
 */
export class CampaignDataStorage {
  private config: StorageConfig
  private cache: Map<string, any> = new Map()
  private pendingOperations: StorageOperation[] = []

  constructor(config: StorageConfig) {
    this.config = config
  }

  /**
   * Create a new campaign with enhanced data structure
   */
  async createCampaign(
    campaignId: string,
    initialData: Partial<EnhancedCampaignData> = {}
  ): Promise<StorageResult<EnhancedCampaignData>> {
    const operation: StorageOperation = {
      type: "create",
      module: "name",
      id: campaignId,
      data: initialData,
      timestamp: new Date()
    }

    try {
      const defaultData: EnhancedCampaignData = {
        id: campaignId,
        name: initialData.name || "New Campaign",
        gameSystem: initialData.gameSystem || "Generic",
        startDate: initialData.startDate || new Date().toISOString(),
        currentDate: initialData.currentDate || new Date().toISOString(),
        characterProfiles: initialData.characterProfiles || [],
        npcDatabase: initialData.npcDatabase || {
          id: `npcdb_${campaignId}`,
          keyNPCs: [],
          minorNPCs: [],
          factions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        worldState: initialData.worldState || {
          id: `world_${campaignId}`,
          locations: [],
          politicalClimate: {
            id: `politics_${campaignId}`,
            overallStability: 5,
            majorPowers: [],
            currentConflicts: [],
            alliances: [],
            treaties: [],
            recentEvents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
          },
          economicConditions: {
            id: `economy_${campaignId}`,
            overallHealth: 5,
            majorTradeCommodities: [],
            tradeRoutes: [],
            currencies: [],
            economicEvents: [],
            marketConditions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
          },
          culturalNorms: [],
          events: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        campaignProgression: initialData.campaignProgression || {
          id: `progression_${campaignId}`,
          mainPlotline: {
            id: `main_${campaignId}`,
            name: "Main Campaign",
            type: "main",
            description: "The main campaign storyline",
            status: "active",
            priority: 1,
            acts: [],
            currentAct: 0,
            relatedPlots: [],
            dependentPlots: [],
            startDate: new Date().toISOString(),
            keyEvents: [],
            notes: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
          },
          subplots: [],
          timeline: [],
          consequences: [],
          milestones: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        sessionLogs: initialData.sessionLogs || [],
        mechanicsAndRules: initialData.mechanicsAndRules || {
          id: `mechanics_${campaignId}`,
          gameSystem: initialData.gameSystem || "Generic",
          houseRules: [],
          activeMechanics: [],
          challenges: [],
          customSystems: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        lastModified: new Date().toISOString(),
        dataVersion: "1.0",
        gameMaster: initialData.gameMaster || "",
        activePlayers: initialData.activePlayers || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        ...initialData
      }

      const result = await this.writeData(campaignId, defaultData)

      if (result.success) {
        this.cache.set(campaignId, defaultData)
      }

      return {
        success: result.success,
        data: defaultData,
        error: result.error,
        timestamp: operation.timestamp,
        operation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: operation.timestamp,
        operation
      }
    }
  }

  /**
   * Load campaign data
   */
  async loadCampaign(
    campaignId: string
  ): Promise<StorageResult<EnhancedCampaignData>> {
    const operation: StorageOperation = {
      type: "read",
      module: "name",
      id: campaignId,
      timestamp: new Date()
    }

    try {
      // Check cache first
      const cached = this.cache.get(campaignId)
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: operation.timestamp,
          operation
        }
      }

      const result = await this.readData(campaignId)

      if (result.success && result.data) {
        this.cache.set(campaignId, result.data)
      }

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        timestamp: operation.timestamp,
        operation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: operation.timestamp,
        operation
      }
    }
  }

  /**
   * Update a specific module within a campaign
   */
  async updateModule<K extends keyof EnhancedCampaignData>(
    campaignId: string,
    module: K,
    data: EnhancedCampaignData[K]
  ): Promise<StorageResult<EnhancedCampaignData[K]>> {
    const operation: StorageOperation = {
      type: "update",
      module,
      id: campaignId,
      data,
      timestamp: new Date()
    }

    try {
      const campaignResult = await this.loadCampaign(campaignId)
      if (!campaignResult.success || !campaignResult.data) {
        return {
          success: false,
          error: "Campaign not found",
          timestamp: operation.timestamp,
          operation
        }
      }

      const campaignData = campaignResult.data

      // Update the module data
      campaignData[module] = data
      campaignData.lastModified = new Date().toISOString()
      campaignData.updatedAt = new Date().toISOString()
      campaignData.version = campaignData.version + 1

      const writeResult = await this.writeData(campaignId, campaignData)

      if (writeResult.success) {
        this.cache.set(campaignId, campaignData)
      }

      return {
        success: writeResult.success,
        data: data,
        error: writeResult.error,
        timestamp: operation.timestamp,
        operation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: operation.timestamp,
        operation
      }
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<StorageResult<boolean>> {
    const operation: StorageOperation = {
      type: "delete",
      module: "name",
      id: campaignId,
      timestamp: new Date()
    }

    try {
      const result = await this.deleteData(campaignId)

      if (result.success) {
        this.cache.delete(campaignId)
      }

      return {
        success: result.success,
        data: result.success,
        error: result.error,
        timestamp: operation.timestamp,
        operation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: operation.timestamp,
        operation
      }
    }
  }

  /**
   * Migrate from legacy GameTimeData format
   */
  async migrateLegacyData(
    campaignId: string,
    legacyData: GameTimeData
  ): Promise<StorageResult<EnhancedCampaignData>> {
    const operation: StorageOperation = {
      type: "create",
      module: "name",
      id: campaignId,
      data: legacyData,
      timestamp: new Date()
    }

    try {
      const enhancedData: EnhancedCampaignData = {
        id: campaignId,
        name: "Migrated Campaign",
        gameSystem: "Generic",
        startDate: new Date().toISOString(),
        currentDate: new Date().toISOString(),
        characterProfiles: [],
        npcDatabase: {
          id: `npcdb_${campaignId}`,
          keyNPCs: [],
          minorNPCs: [],
          factions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        worldState: {
          id: `world_${campaignId}`,
          locations: [],
          politicalClimate: {
            id: `politics_${campaignId}`,
            overallStability: 5,
            majorPowers: [],
            currentConflicts: [],
            alliances: [],
            treaties: [],
            recentEvents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
          },
          economicConditions: {
            id: `economy_${campaignId}`,
            overallHealth: 5,
            majorTradeCommodities: [],
            tradeRoutes: [],
            currencies: [],
            economicEvents: [],
            marketConditions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
          },
          culturalNorms: [],
          events: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        campaignProgression: {
          id: `progression_${campaignId}`,
          mainPlotline: {
            id: `main_${campaignId}`,
            name: "Main Campaign",
            type: "main",
            description: "The main campaign storyline",
            status: "active",
            priority: 1,
            acts: [],
            currentAct: 0,
            relatedPlots: [],
            dependentPlots: [],
            startDate: new Date().toISOString(),
            keyEvents: [],
            notes: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
          },
          subplots: [],
          timeline: [],
          consequences: [],
          milestones: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        sessionLogs: [],
        mechanicsAndRules: {
          id: `mechanics_${campaignId}`,
          gameSystem: "Generic",
          houseRules: [],
          activeMechanics: [],
          challenges: [],
          customSystems: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        },
        lastModified: new Date().toISOString(),
        dataVersion: "1.0",
        gameMaster: "",
        activePlayers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      const result = await this.writeData(campaignId, enhancedData)

      if (result.success) {
        this.cache.set(campaignId, enhancedData)
      }

      return {
        success: result.success,
        data: enhancedData,
        error: result.error,
        timestamp: operation.timestamp,
        operation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: operation.timestamp,
        operation
      }
    }
  }

  /**
   * Backup campaign data
   */
  async backupCampaign(campaignId: string): Promise<StorageResult<string>> {
    const operation: StorageOperation = {
      type: "read",
      module: "name",
      id: campaignId,
      timestamp: new Date()
    }

    try {
      const campaignResult = await this.loadCampaign(campaignId)
      if (!campaignResult.success || !campaignResult.data) {
        return {
          success: false,
          error: "Campaign not found",
          timestamp: operation.timestamp,
          operation
        }
      }

      const backupId = `${campaignId}_backup_${Date.now()}`
      const backupResult = await this.writeData(backupId, campaignResult.data)

      return {
        success: backupResult.success,
        data: backupId,
        error: backupResult.error,
        timestamp: operation.timestamp,
        operation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: operation.timestamp,
        operation
      }
    }
  }

  /**
   * Get operation history
   */
  getOperationHistory(): StorageOperation[] {
    return [...this.pendingOperations]
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Abstract methods to be implemented by specific storage adapters
   */
  protected async writeData(
    id: string,
    data: any
  ): Promise<StorageResult<any>> {
    throw new Error("writeData method must be implemented by storage adapter")
  }

  protected async readData(id: string): Promise<StorageResult<any>> {
    throw new Error("readData method must be implemented by storage adapter")
  }

  protected async deleteData(id: string): Promise<StorageResult<boolean>> {
    throw new Error("deleteData method must be implemented by storage adapter")
  }
}

/**
 * JSON file storage adapter
 */
export class JSONStorageAdapter extends CampaignDataStorage {
  private basePath: string

  constructor(config: StorageConfig) {
    super(config)
    this.basePath = config.basePath || "./campaign-data"
  }

  protected async writeData(
    id: string,
    data: any
  ): Promise<StorageResult<any>> {
    try {
      // In a real implementation, this would write to the file system
      // For now, we'll simulate it with localStorage or memory
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(`campaign_${id}`, JSON.stringify(data))
      }

      return {
        success: true,
        data,
        timestamp: new Date(),
        operation: {
          type: "create",
          module: "name",
          id,
          data,
          timestamp: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Write failed",
        timestamp: new Date(),
        operation: {
          type: "create",
          module: "name",
          id,
          data,
          timestamp: new Date()
        }
      }
    }
  }

  protected async readData(id: string): Promise<StorageResult<any>> {
    try {
      // In a real implementation, this would read from the file system
      // For now, we'll simulate it with localStorage or memory
      if (typeof window !== "undefined" && window.localStorage) {
        const data = localStorage.getItem(`campaign_${id}`)
        if (data) {
          return {
            success: true,
            data: JSON.parse(data),
            timestamp: new Date(),
            operation: {
              type: "read",
              module: "name",
              id,
              timestamp: new Date()
            }
          }
        }
      }

      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "name",
          id,
          timestamp: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Read failed",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "name",
          id,
          timestamp: new Date()
        }
      }
    }
  }

  protected async deleteData(id: string): Promise<StorageResult<boolean>> {
    try {
      // In a real implementation, this would delete from the file system
      // For now, we'll simulate it with localStorage or memory
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(`campaign_${id}`)
      }

      return {
        success: true,
        data: true,
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "name",
          id,
          timestamp: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : "Delete failed",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "name",
          id,
          timestamp: new Date()
        }
      }
    }
  }
}

/**
 * Default storage instance
 */
export const defaultStorage = new JSONStorageAdapter({
  adapter: "json",
  basePath: "./campaign-data",
  autoBackup: true
})
