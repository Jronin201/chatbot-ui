/**
 * Enhanced Campaign Data Retrieval System
 *
 * This module provides efficient data retrieval, lazy loading, and contextual filtering
 * for the modular TTRPG campaign management system.
 */

import {
  EnhancedCampaignData,
  CharacterProfile,
  KeyNPC,
  MinorNPC,
  Faction,
  Location,
  PlotLine,
  SessionLog,
  TimelineEvent,
  HouseRule,
  ModuleType,
  BaseEntity
} from "@/types/enhanced-campaign-data"

// =====================================================
// CONTEXTUAL LOADER INTERFACES
// =====================================================

export interface LoadingContext {
  currentLocation?: string
  activeCharacters?: string[]
  currentSession?: string
  timeframe?: {
    startDate: string
    endDate: string
  }
  relevanceThreshold?: number
  maxResults?: number
}

export interface RetrievalOptions {
  includeInactive?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
  filterBy?: Record<string, any>
  limit?: number
  offset?: number
}

export interface SearchQuery {
  text?: string
  type?: string
  tags?: string[]
  dateRange?: {
    start: string
    end: string
  }
  location?: string
  participants?: string[]
}

// =====================================================
// MAIN DATA RETRIEVAL CLASS
// =====================================================

export class CampaignDataRetrieval {
  private campaignData: EnhancedCampaignData | null = null
  private loadedModules: Set<ModuleType> = new Set()
  private contextualCache: Map<string, any> = new Map()
  private lastUpdate: string = ""

  constructor(data?: EnhancedCampaignData) {
    this.campaignData = data || null
  }

  /**
   * Update the campaign data reference
   */
  updateCampaignData(data: EnhancedCampaignData): void {
    this.campaignData = data
    this.lastUpdate = new Date().toISOString()
    this.invalidateCache()
  }

  /**
   * Check if campaign data is loaded
   */
  isDataLoaded(): boolean {
    return this.campaignData !== null
  }

  /**
   * Invalidate contextual cache
   */
  invalidateCache(): void {
    this.contextualCache.clear()
  }

  // =====================================================
  // CONTEXTUAL LOADERS
  // =====================================================

  /**
   * Load characters relevant to current context
   */
  async loadContextualCharacters(
    context: LoadingContext
  ): Promise<CharacterProfile[]> {
    if (!this.campaignData) return []

    const cacheKey = `characters_${JSON.stringify(context)}`
    if (this.contextualCache.has(cacheKey)) {
      return this.contextualCache.get(cacheKey)
    }

    let characters = [...this.campaignData.characterProfiles]

    // Filter by location if specified
    if (context.currentLocation) {
      characters = characters.filter(
        char => char.currentLocation === context.currentLocation
      )
    }

    // Filter by active characters if specified
    if (context.activeCharacters && context.activeCharacters.length > 0) {
      characters = characters.filter(char =>
        context.activeCharacters!.includes(char.id)
      )
    }

    // Sort by relevance
    characters.sort((a, b) => {
      const aRelevance = this.calculateCharacterRelevance(a, context)
      const bRelevance = this.calculateCharacterRelevance(b, context)
      return bRelevance - aRelevance
    })

    // Apply limit
    if (context.maxResults) {
      characters = characters.slice(0, context.maxResults)
    }

    this.contextualCache.set(cacheKey, characters)
    return characters
  }

  /**
   * Load NPCs relevant to current context
   */
  async loadContextualNPCs(context: LoadingContext): Promise<{
    keyNPCs: KeyNPC[]
    minorNPCs: MinorNPC[]
    factions: Faction[]
  }> {
    if (!this.campaignData) return { keyNPCs: [], minorNPCs: [], factions: [] }

    const cacheKey = `npcs_${JSON.stringify(context)}`
    if (this.contextualCache.has(cacheKey)) {
      return this.contextualCache.get(cacheKey)
    }

    let keyNPCs = [...(this.campaignData.npcDatabase?.keyNPCs || [])]
    let minorNPCs = [...(this.campaignData.npcDatabase?.minorNPCs || [])]
    let factions = [...(this.campaignData.npcDatabase?.factions || [])]

    // Filter by location
    if (context.currentLocation) {
      keyNPCs = keyNPCs.filter(
        npc => npc.currentLocation === context.currentLocation
      )
      minorNPCs = minorNPCs.filter(
        npc => npc.location === context.currentLocation
      )
    }

    // Filter by relevance threshold
    if (context.relevanceThreshold) {
      keyNPCs = keyNPCs.filter(npc => {
        const relevance = this.calculateNPCRelevance(npc, context)
        return relevance >= context.relevanceThreshold!
      })
    }

    // Sort by importance and relevance
    keyNPCs.sort((a, b) => {
      const importanceOrder = { critical: 4, major: 3, supporting: 2 }
      const aImportance = importanceOrder[a.importanceLevel] || 1
      const bImportance = importanceOrder[b.importanceLevel] || 1
      if (aImportance !== bImportance) return bImportance - aImportance

      const aRelevance = this.calculateNPCRelevance(a, context)
      const bRelevance = this.calculateNPCRelevance(b, context)
      return bRelevance - aRelevance
    })

    // Apply limits
    if (context.maxResults) {
      keyNPCs = keyNPCs.slice(0, context.maxResults)
      minorNPCs = minorNPCs.slice(0, context.maxResults)
    }

    const result = { keyNPCs, minorNPCs, factions }
    this.contextualCache.set(cacheKey, result)
    return result
  }

  /**
   * Load locations relevant to current context
   */
  async loadContextualLocations(context: LoadingContext): Promise<Location[]> {
    if (!this.campaignData) return []

    const cacheKey = `locations_${JSON.stringify(context)}`
    if (this.contextualCache.has(cacheKey)) {
      return this.contextualCache.get(cacheKey)
    }

    let locations = [...(this.campaignData.worldState?.locations || [])]

    // If current location is specified, include it and connected locations
    if (context.currentLocation) {
      const currentLoc = locations.find(
        loc => loc.id === context.currentLocation
      )
      if (currentLoc) {
        const connectedIds = currentLoc.connectedLocations.map(
          conn => conn.locationId
        )
        locations = locations.filter(
          loc =>
            loc.id === context.currentLocation || connectedIds.includes(loc.id)
        )
      }
    }

    // Sort by significance and current events
    locations.sort((a, b) => {
      const aScore = this.calculateLocationRelevance(a, context)
      const bScore = this.calculateLocationRelevance(b, context)
      return bScore - aScore
    })

    if (context.maxResults) {
      locations = locations.slice(0, context.maxResults)
    }

    this.contextualCache.set(cacheKey, locations)
    return locations
  }

  /**
   * Load active plotlines and subplots
   */
  async loadActivePlotlines(context: LoadingContext): Promise<{
    mainPlotline: PlotLine | null
    activeSubplots: PlotLine[]
  }> {
    if (!this.campaignData) return { mainPlotline: null, activeSubplots: [] }

    const cacheKey = `plotlines_${JSON.stringify(context)}`
    if (this.contextualCache.has(cacheKey)) {
      return this.contextualCache.get(cacheKey)
    }

    const mainPlotline =
      this.campaignData.campaignProgression?.mainPlotline || null
    let activeSubplots = [
      ...(this.campaignData.campaignProgression?.subplots || [])
    ]

    // Filter to only active plotlines
    activeSubplots = activeSubplots.filter(plot => plot.status === "active")

    // Sort by priority
    activeSubplots.sort((a, b) => b.priority - a.priority)

    if (context.maxResults) {
      activeSubplots = activeSubplots.slice(0, context.maxResults)
    }

    const result = { mainPlotline, activeSubplots }
    this.contextualCache.set(cacheKey, result)
    return result
  }

  // =====================================================
  // DYNAMIC RETRIEVAL & SEARCH
  // =====================================================

  /**
   * Search across all campaign data
   */
  async searchCampaignData(
    query: SearchQuery,
    options: RetrievalOptions = {}
  ): Promise<{
    characters: CharacterProfile[]
    npcs: KeyNPC[]
    locations: Location[]
    plotlines: PlotLine[]
    sessions: SessionLog[]
    total: number
  }> {
    if (!this.campaignData) {
      return {
        characters: [],
        npcs: [],
        locations: [],
        plotlines: [],
        sessions: [],
        total: 0
      }
    }

    const results = {
      characters: [] as CharacterProfile[],
      npcs: [] as KeyNPC[],
      locations: [] as Location[],
      plotlines: [] as PlotLine[],
      sessions: [] as SessionLog[],
      total: 0
    }

    // Search characters
    if (query.text) {
      results.characters = this.campaignData.characterProfiles.filter(char =>
        this.matchesTextSearch(char, query.text!)
      )
    }

    // Search NPCs
    if (query.text) {
      results.npcs = (this.campaignData.npcDatabase?.keyNPCs || []).filter(
        npc => this.matchesTextSearch(npc, query.text!)
      )
    }

    // Search locations
    if (query.text) {
      results.locations = (
        this.campaignData.worldState?.locations || []
      ).filter(loc => this.matchesTextSearch(loc, query.text!))
    }

    // Search plotlines
    if (query.text) {
      const allPlotlines = [
        ...(this.campaignData.campaignProgression?.mainPlotline
          ? [this.campaignData.campaignProgression.mainPlotline]
          : []),
        ...(this.campaignData.campaignProgression?.subplots || [])
      ]
      results.plotlines = allPlotlines.filter(plot =>
        this.matchesTextSearch(plot, query.text!)
      )
    }

    // Search sessions
    if (query.text) {
      results.sessions = (this.campaignData.sessionLogs || []).filter(session =>
        this.matchesTextSearch(session, query.text!)
      )
    }

    // Filter by date range
    if (query.dateRange) {
      results.sessions = results.sessions.filter(
        session =>
          session.date >= query.dateRange!.start &&
          session.date <= query.dateRange!.end
      )
    }

    // Filter by location
    if (query.location) {
      results.characters = results.characters.filter(
        char => char.currentLocation === query.location
      )
      results.npcs = results.npcs.filter(
        npc => npc.currentLocation === query.location
      )
    }

    // Apply limits
    if (options.limit) {
      results.characters = results.characters.slice(0, options.limit)
      results.npcs = results.npcs.slice(0, options.limit)
      results.locations = results.locations.slice(0, options.limit)
      results.plotlines = results.plotlines.slice(0, options.limit)
      results.sessions = results.sessions.slice(0, options.limit)
    }

    results.total =
      results.characters.length +
      results.npcs.length +
      results.locations.length +
      results.plotlines.length +
      results.sessions.length

    return results
  }

  /**
   * Get NPCs by location
   */
  async getNPCsByLocation(
    locationId: string,
    options: RetrievalOptions = {}
  ): Promise<{
    keyNPCs: KeyNPC[]
    minorNPCs: MinorNPC[]
  }> {
    if (!this.campaignData) return { keyNPCs: [], minorNPCs: [] }

    let keyNPCs = (this.campaignData.npcDatabase?.keyNPCs || []).filter(
      npc => npc.currentLocation === locationId
    )
    let minorNPCs = (this.campaignData.npcDatabase?.minorNPCs || []).filter(
      npc => npc.location === locationId
    )

    if (!options.includeInactive) {
      keyNPCs = keyNPCs.filter(npc => npc.alive)
    }

    return { keyNPCs, minorNPCs }
  }

  /**
   * Get active subplots
   */
  async getActiveSubplots(options: RetrievalOptions = {}): Promise<PlotLine[]> {
    if (!this.campaignData) return []

    let subplots = (
      this.campaignData.campaignProgression?.subplots || []
    ).filter(plot => plot.status === "active")

    if (options.sortBy === "priority") {
      subplots.sort((a, b) =>
        options.sortOrder === "asc"
          ? a.priority - b.priority
          : b.priority - a.priority
      )
    }

    if (options.limit) {
      subplots = subplots.slice(0, options.limit)
    }

    return subplots
  }

  /**
   * Get recent timeline events
   */
  async getRecentTimelineEvents(
    days: number = 30,
    options: RetrievalOptions = {}
  ): Promise<TimelineEvent[]> {
    if (!this.campaignData) return []

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffStr = cutoffDate.toISOString().split("T")[0]

    let events = (this.campaignData.campaignProgression?.timeline || []).filter(
      event => event.date >= cutoffStr
    )

    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    if (options.limit) {
      events = events.slice(0, options.limit)
    }

    return events
  }

  // =====================================================
  // BATCH PROCESSING
  // =====================================================

  /**
   * Process multiple updates in a batch
   */
  async processBatchUpdates(
    updates: Array<{
      type: "create" | "update" | "delete"
      module: ModuleType
      entityId?: string
      data: any
    }>
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    const results: any[] = []
    const errors: string[] = []

    for (const update of updates) {
      try {
        const result = await this.processUpdate(update)
        results.push(result)
      } catch (error) {
        errors.push(
          `Error processing ${update.type} on ${update.module}: ${error}`
        )
      }
    }

    // Invalidate cache after batch processing
    this.invalidateCache()

    return {
      success: errors.length === 0,
      results,
      errors
    }
  }

  /**
   * Process a single update
   */
  private async processUpdate(update: {
    type: "create" | "update" | "delete"
    module: ModuleType
    entityId?: string
    data: any
  }): Promise<any> {
    if (!this.campaignData) throw new Error("No campaign data loaded")

    switch (update.module) {
      case "characters":
        return this.processCharacterUpdate(update)
      case "npcs":
        return this.processNPCUpdate(update)
      case "world":
        return this.processWorldUpdate(update)
      case "progression":
        return this.processProgressionUpdate(update)
      case "sessions":
        return this.processSessionUpdate(update)
      case "mechanics":
        return this.processMechanicsUpdate(update)
      default:
        throw new Error(`Unknown module type: ${update.module}`)
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private calculateCharacterRelevance(
    character: CharacterProfile,
    context: LoadingContext
  ): number {
    let relevance = 0

    // Location relevance
    if (
      context.currentLocation &&
      character.currentLocation === context.currentLocation
    ) {
      relevance += 10
    }

    // Active character bonus
    if (
      context.activeCharacters &&
      context.activeCharacters.includes(character.id)
    ) {
      relevance += 15
    }

    // Recent activity bonus
    if (character.levelHistory.length > 0) {
      const lastActivity =
        character.levelHistory[character.levelHistory.length - 1]
      const daysSinceActivity = this.daysSince(lastActivity.date)
      if (daysSinceActivity < 7) relevance += 5
    }

    return relevance
  }

  private calculateNPCRelevance(npc: KeyNPC, context: LoadingContext): number {
    let relevance = 0

    // Importance level
    const importanceScore = { critical: 15, major: 10, supporting: 5 }
    relevance += importanceScore[npc.importanceLevel] || 0

    // Location relevance
    if (
      context.currentLocation &&
      npc.currentLocation === context.currentLocation
    ) {
      relevance += 10
    }

    // Recent interaction
    if (npc.interactionHistory.length > 0) {
      const lastInteraction =
        npc.interactionHistory[npc.interactionHistory.length - 1]
      const daysSinceInteraction = this.daysSince(lastInteraction.date)
      if (daysSinceInteraction < 7) relevance += 5
    }

    return relevance
  }

  private calculateLocationRelevance(
    location: Location,
    context: LoadingContext
  ): number {
    let relevance = 0

    // Current location bonus
    if (context.currentLocation && location.id === context.currentLocation) {
      relevance += 20
    }

    // Current events bonus
    if (location.currentEvents.length > 0) {
      relevance += location.currentEvents.length * 3
    }

    // Significance bonus
    if (location.significance) {
      relevance += location.significance.length / 10
    }

    return relevance
  }

  private matchesTextSearch(entity: any, searchText: string): boolean {
    const searchLower = searchText.toLowerCase()
    const searchableFields = [
      "name",
      "description",
      "background",
      "notes",
      "summary"
    ]

    return searchableFields.some(field => {
      const value = entity[field]
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchLower)
      }
      return false
    })
  }

  private daysSince(dateString: string): number {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private processCharacterUpdate(update: any): Promise<any> {
    // Character update logic would go here
    return Promise.resolve({
      success: true,
      type: "character",
      data: update.data
    })
  }

  private processNPCUpdate(update: any): Promise<any> {
    // NPC update logic would go here
    return Promise.resolve({ success: true, type: "npc", data: update.data })
  }

  private processWorldUpdate(update: any): Promise<any> {
    // World update logic would go here
    return Promise.resolve({ success: true, type: "world", data: update.data })
  }

  private processProgressionUpdate(update: any): Promise<any> {
    // Progression update logic would go here
    return Promise.resolve({
      success: true,
      type: "progression",
      data: update.data
    })
  }

  private processSessionUpdate(update: any): Promise<any> {
    // Session update logic would go here
    return Promise.resolve({
      success: true,
      type: "session",
      data: update.data
    })
  }

  private processMechanicsUpdate(update: any): Promise<any> {
    // Mechanics update logic would go here
    return Promise.resolve({
      success: true,
      type: "mechanics",
      data: update.data
    })
  }
}

// =====================================================
// CONTEXT HELPER FUNCTIONS
// =====================================================

export function createLoadingContext(
  options: Partial<LoadingContext> = {}
): LoadingContext {
  return {
    relevanceThreshold: 5,
    maxResults: 50,
    ...options
  }
}

export function createSearchQuery(
  options: Partial<SearchQuery> = {}
): SearchQuery {
  return {
    ...options
  }
}

export function createRetrievalOptions(
  options: Partial<RetrievalOptions> = {}
): RetrievalOptions {
  return {
    includeInactive: false,
    sortOrder: "desc",
    limit: 100,
    ...options
  }
}
