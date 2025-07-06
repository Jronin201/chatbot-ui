/**
 * CRUD Utilities for Campaign Data Modules
 * Provides specific operations for each campaign module
 */

import {
  EnhancedCampaignData,
  CharacterProfile,
  KeyNPC,
  MinorNPC,
  Location,
  SessionLog,
  HouseRule,
  Faction,
  TimelineEvent
} from "@/types/enhanced-campaign-data"
import { CampaignDataStorage, StorageResult } from "./storage"

/**
 * Character CRUD operations
 */
export class CharacterCRUD {
  constructor(private storage: CampaignDataStorage) {}

  async createCharacter(
    campaignId: string,
    character: Omit<
      CharacterProfile,
      "id" | "createdAt" | "updatedAt" | "version"
    >
  ): Promise<StorageResult<CharacterProfile>> {
    const newCharacter: CharacterProfile = {
      ...character,
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }

    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "create",
          module: "characterProfiles",
          id: campaignId,
          data: character,
          timestamp: new Date()
        }
      }
    }

    const updatedData = [...campaign.data.characterProfiles, newCharacter]

    const result = await this.storage.updateModule(
      campaignId,
      "characterProfiles",
      updatedData
    )

    return {
      success: result.success,
      data: newCharacter,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async updateCharacter(
    campaignId: string,
    characterId: string,
    updates: Partial<CharacterProfile>
  ): Promise<StorageResult<CharacterProfile>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "characterProfiles",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const characters = campaign.data.characterProfiles
    const characterIndex = characters.findIndex(
      (c: CharacterProfile) => c.id === characterId
    )

    if (characterIndex === -1) {
      return {
        success: false,
        error: "Character not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "characterProfiles",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const updatedCharacter = {
      ...characters[characterIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: characters[characterIndex].version + 1
    }
    characters[characterIndex] = updatedCharacter

    const result = await this.storage.updateModule(
      campaignId,
      "characterProfiles",
      characters
    )

    return {
      success: result.success,
      data: updatedCharacter,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async deleteCharacter(
    campaignId: string,
    characterId: string
  ): Promise<StorageResult<boolean>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "characterProfiles",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const characters = campaign.data.characterProfiles
    const filteredCharacters = characters.filter(
      (c: CharacterProfile) => c.id !== characterId
    )

    if (characters.length === filteredCharacters.length) {
      return {
        success: false,
        error: "Character not found",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "characterProfiles",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const result = await this.storage.updateModule(
      campaignId,
      "characterProfiles",
      filteredCharacters
    )

    return {
      success: result.success,
      data: true,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async getCharacter(
    campaignId: string,
    characterId: string
  ): Promise<StorageResult<CharacterProfile>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "characterProfiles",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const character = campaign.data.characterProfiles.find(
      (c: CharacterProfile) => c.id === characterId
    )

    if (!character) {
      return {
        success: false,
        error: "Character not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "characterProfiles",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: character,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "characterProfiles",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }

  async listCharacters(
    campaignId: string
  ): Promise<StorageResult<CharacterProfile[]>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "characterProfiles",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: campaign.data.characterProfiles,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "characterProfiles",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }
}

/**
 * NPC CRUD operations
 */
export class NPCCRUD {
  constructor(private storage: CampaignDataStorage) {}

  async createKeyNPC(
    campaignId: string,
    npc: Omit<KeyNPC, "id" | "createdAt" | "updatedAt" | "version">
  ): Promise<StorageResult<KeyNPC>> {
    const newNPC: KeyNPC = {
      ...npc,
      id: `keynpc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }

    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "create",
          module: "npcDatabase",
          id: campaignId,
          data: npc,
          timestamp: new Date()
        }
      }
    }

    const updatedData = {
      ...campaign.data.npcDatabase,
      keyNPCs: [...campaign.data.npcDatabase.keyNPCs, newNPC]
    }

    const result = await this.storage.updateModule(
      campaignId,
      "npcDatabase",
      updatedData
    )

    return {
      success: result.success,
      data: newNPC,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async createMinorNPC(
    campaignId: string,
    npc: Omit<MinorNPC, "id" | "createdAt" | "updatedAt" | "version">
  ): Promise<StorageResult<MinorNPC>> {
    const newNPC: MinorNPC = {
      ...npc,
      id: `minornpc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }

    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "create",
          module: "npcDatabase",
          id: campaignId,
          data: npc,
          timestamp: new Date()
        }
      }
    }

    const updatedData = {
      ...campaign.data.npcDatabase,
      minorNPCs: [...campaign.data.npcDatabase.minorNPCs, newNPC]
    }

    const result = await this.storage.updateModule(
      campaignId,
      "npcDatabase",
      updatedData
    )

    return {
      success: result.success,
      data: newNPC,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async updateKeyNPC(
    campaignId: string,
    npcId: string,
    updates: Partial<KeyNPC>
  ): Promise<StorageResult<KeyNPC>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "npcDatabase",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const npcs = campaign.data.npcDatabase.keyNPCs
    const npcIndex = npcs.findIndex((n: KeyNPC) => n.id === npcId)

    if (npcIndex === -1) {
      return {
        success: false,
        error: "Key NPC not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "npcDatabase",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const updatedNPC = {
      ...npcs[npcIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: npcs[npcIndex].version + 1
    }
    npcs[npcIndex] = updatedNPC

    const result = await this.storage.updateModule(campaignId, "npcDatabase", {
      ...campaign.data.npcDatabase,
      keyNPCs: npcs
    })

    return {
      success: result.success,
      data: updatedNPC,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async updateMinorNPC(
    campaignId: string,
    npcId: string,
    updates: Partial<MinorNPC>
  ): Promise<StorageResult<MinorNPC>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "npcDatabase",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const npcs = campaign.data.npcDatabase.minorNPCs
    const npcIndex = npcs.findIndex((n: MinorNPC) => n.id === npcId)

    if (npcIndex === -1) {
      return {
        success: false,
        error: "Minor NPC not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "npcDatabase",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const updatedNPC = {
      ...npcs[npcIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: npcs[npcIndex].version + 1
    }
    npcs[npcIndex] = updatedNPC

    const result = await this.storage.updateModule(campaignId, "npcDatabase", {
      ...campaign.data.npcDatabase,
      minorNPCs: npcs
    })

    return {
      success: result.success,
      data: updatedNPC,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async deleteNPC(
    campaignId: string,
    npcId: string
  ): Promise<StorageResult<boolean>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "npcDatabase",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const keyNPCs = campaign.data.npcDatabase.keyNPCs.filter(
      (n: KeyNPC) => n.id !== npcId
    )
    const minorNPCs = campaign.data.npcDatabase.minorNPCs.filter(
      (n: MinorNPC) => n.id !== npcId
    )

    const originalCount =
      campaign.data.npcDatabase.keyNPCs.length +
      campaign.data.npcDatabase.minorNPCs.length
    const newCount = keyNPCs.length + minorNPCs.length

    if (originalCount === newCount) {
      return {
        success: false,
        error: "NPC not found",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "npcDatabase",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const result = await this.storage.updateModule(campaignId, "npcDatabase", {
      ...campaign.data.npcDatabase,
      keyNPCs,
      minorNPCs
    })

    return {
      success: result.success,
      data: true,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async getKeyNPC(
    campaignId: string,
    npcId: string
  ): Promise<StorageResult<KeyNPC>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "npcDatabase",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const npc = campaign.data.npcDatabase.keyNPCs.find(
      (n: KeyNPC) => n.id === npcId
    )

    if (!npc) {
      return {
        success: false,
        error: "Key NPC not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "npcDatabase",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: npc,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "npcDatabase",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }

  async getMinorNPC(
    campaignId: string,
    npcId: string
  ): Promise<StorageResult<MinorNPC>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "npcDatabase",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const npc = campaign.data.npcDatabase.minorNPCs.find(
      (n: MinorNPC) => n.id === npcId
    )

    if (!npc) {
      return {
        success: false,
        error: "Minor NPC not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "npcDatabase",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: npc,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "npcDatabase",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }

  async listKeyNPCs(campaignId: string): Promise<StorageResult<KeyNPC[]>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "npcDatabase",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: campaign.data.npcDatabase.keyNPCs,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "npcDatabase",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }

  async listMinorNPCs(campaignId: string): Promise<StorageResult<MinorNPC[]>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "npcDatabase",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: campaign.data.npcDatabase.minorNPCs,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "npcDatabase",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }
}

/**
 * Location CRUD operations
 */
export class LocationCRUD {
  constructor(private storage: CampaignDataStorage) {}

  async createLocation(
    campaignId: string,
    location: Omit<Location, "id">
  ): Promise<StorageResult<Location>> {
    const newLocation: Location = {
      ...location,
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "create",
          module: "worldState",
          id: campaignId,
          data: location,
          timestamp: new Date()
        }
      }
    }

    const updatedData = {
      ...campaign.data.worldState,
      locations: [...campaign.data.worldState.locations, newLocation]
    }

    const result = await this.storage.updateModule(
      campaignId,
      "worldState",
      updatedData
    )

    return {
      success: result.success,
      data: newLocation,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async updateLocation(
    campaignId: string,
    locationId: string,
    updates: Partial<Location>
  ): Promise<StorageResult<Location>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "worldState",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const locations = campaign.data.worldState.locations
    const locationIndex = locations.findIndex(l => l.id === locationId)

    if (locationIndex === -1) {
      return {
        success: false,
        error: "Location not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "worldState",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const updatedLocation = { ...locations[locationIndex], ...updates }
    locations[locationIndex] = updatedLocation

    const result = await this.storage.updateModule(campaignId, "worldState", {
      ...campaign.data.worldState,
      locations: locations
    })

    return {
      success: result.success,
      data: updatedLocation,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async deleteLocation(
    campaignId: string,
    locationId: string
  ): Promise<StorageResult<boolean>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "worldState",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const locations = campaign.data.worldState.locations
    const filteredLocations = locations.filter(l => l.id !== locationId)

    if (locations.length === filteredLocations.length) {
      return {
        success: false,
        error: "Location not found",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "worldState",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const result = await this.storage.updateModule(campaignId, "worldState", {
      ...campaign.data.worldState,
      locations: filteredLocations
    })

    return {
      success: result.success,
      data: true,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async getLocation(
    campaignId: string,
    locationId: string
  ): Promise<StorageResult<Location>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "worldState",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const location = campaign.data.worldState.locations.find(
      l => l.id === locationId
    )

    if (!location) {
      return {
        success: false,
        error: "Location not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "worldState",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: location,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "worldState",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }

  async listLocations(campaignId: string): Promise<StorageResult<Location[]>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "worldState",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: campaign.data.worldState.locations,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "worldState",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }
}

/**
 * Session CRUD operations
 */
export class SessionCRUD {
  constructor(private storage: CampaignDataStorage) {}

  async createSession(
    campaignId: string,
    session: Omit<SessionLog, "id" | "createdAt" | "updatedAt" | "version">
  ): Promise<StorageResult<SessionLog>> {
    const newSession: SessionLog = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }

    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "create",
          module: "sessionLogs",
          id: campaignId,
          data: session,
          timestamp: new Date()
        }
      }
    }

    const updatedSessions = [...campaign.data.sessionLogs, newSession]

    const result = await this.storage.updateModule(
      campaignId,
      "sessionLogs",
      updatedSessions
    )

    return {
      success: result.success,
      data: newSession,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async updateSession(
    campaignId: string,
    sessionId: string,
    updates: Partial<SessionLog>
  ): Promise<StorageResult<SessionLog>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "sessionLogs",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const sessions = campaign.data.sessionLogs
    const sessionIndex = sessions.findIndex(
      (s: SessionLog) => s.id === sessionId
    )

    if (sessionIndex === -1) {
      return {
        success: false,
        error: "Session not found",
        timestamp: new Date(),
        operation: {
          type: "update",
          module: "sessionLogs",
          id: campaignId,
          data: updates,
          timestamp: new Date()
        }
      }
    }

    const updatedSession = {
      ...sessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: sessions[sessionIndex].version + 1
    }
    sessions[sessionIndex] = updatedSession

    const result = await this.storage.updateModule(
      campaignId,
      "sessionLogs",
      sessions
    )

    return {
      success: result.success,
      data: updatedSession,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async deleteSession(
    campaignId: string,
    sessionId: string
  ): Promise<StorageResult<boolean>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "sessionLogs",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const sessions = campaign.data.sessionLogs
    const filteredSessions = sessions.filter(
      (s: SessionLog) => s.id !== sessionId
    )

    if (sessions.length === filteredSessions.length) {
      return {
        success: false,
        error: "Session not found",
        timestamp: new Date(),
        operation: {
          type: "delete",
          module: "sessionLogs",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const result = await this.storage.updateModule(
      campaignId,
      "sessionLogs",
      filteredSessions
    )

    return {
      success: result.success,
      data: true,
      error: result.error,
      timestamp: result.timestamp,
      operation: result.operation
    }
  }

  async getSession(
    campaignId: string,
    sessionId: string
  ): Promise<StorageResult<SessionLog>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "sessionLogs",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const session = campaign.data.sessionLogs.find(
      (s: SessionLog) => s.id === sessionId
    )

    if (!session) {
      return {
        success: false,
        error: "Session not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "sessionLogs",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: session,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "sessionLogs",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }

  async listSessions(campaignId: string): Promise<StorageResult<SessionLog[]>> {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "sessionLogs",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    return {
      success: true,
      data: campaign.data.sessionLogs,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "sessionLogs",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }
}

/**
 * Unified CRUD manager for all modules
 */
export class CampaignCRUD {
  public readonly characters: CharacterCRUD
  public readonly npcs: NPCCRUD
  public readonly locations: LocationCRUD
  public readonly sessions: SessionCRUD

  constructor(private storage: CampaignDataStorage) {
    this.characters = new CharacterCRUD(storage)
    this.npcs = new NPCCRUD(storage)
    this.locations = new LocationCRUD(storage)
    this.sessions = new SessionCRUD(storage)
  }

  /**
   * Create a new campaign with all modules
   */
  async createCampaign(
    campaignId: string,
    initialData: Partial<EnhancedCampaignData> = {}
  ): Promise<StorageResult<EnhancedCampaignData>> {
    return await this.storage.createCampaign(campaignId, initialData)
  }

  /**
   * Load a complete campaign
   */
  async loadCampaign(
    campaignId: string
  ): Promise<StorageResult<EnhancedCampaignData>> {
    return await this.storage.loadCampaign(campaignId)
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<StorageResult<boolean>> {
    return await this.storage.deleteCampaign(campaignId)
  }

  /**
   * Backup a campaign
   */
  async backupCampaign(campaignId: string): Promise<StorageResult<string>> {
    return await this.storage.backupCampaign(campaignId)
  }

  /**
   * Migrate legacy data
   */
  async migrateLegacyData(
    campaignId: string,
    legacyData: any
  ): Promise<StorageResult<EnhancedCampaignData>> {
    return await this.storage.migrateLegacyData(campaignId, legacyData)
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(campaignId: string): Promise<
    StorageResult<{
      totalCharacters: number
      totalNPCs: number
      totalLocations: number
      totalSessions: number
      lastUpdated: string
    }>
  > {
    const campaign = await this.storage.loadCampaign(campaignId)
    if (!campaign.success || !campaign.data) {
      return {
        success: false,
        error: "Campaign not found",
        timestamp: new Date(),
        operation: {
          type: "read",
          module: "characterProfiles",
          id: campaignId,
          timestamp: new Date()
        }
      }
    }

    const stats = {
      totalCharacters: campaign.data.characterProfiles.length,
      totalNPCs:
        campaign.data.npcDatabase.keyNPCs.length +
        campaign.data.npcDatabase.minorNPCs.length,
      totalLocations: campaign.data.worldState.locations.length,
      totalSessions: campaign.data.sessionLogs.length,
      lastUpdated: campaign.data.lastModified
    }

    return {
      success: true,
      data: stats,
      timestamp: new Date(),
      operation: {
        type: "read",
        module: "characterProfiles",
        id: campaignId,
        timestamp: new Date()
      }
    }
  }
}
