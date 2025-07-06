/**
 * Session State Manager Implementation
 *
 * Manages current session state and provides contextual memory
 * for AI integration in TTRPG campaigns
 */

import {
  SessionState,
  ContextPacket,
  ContextType,
  ContextOptions,
  SessionEvent,
  MemoryItem,
  SessionExport,
  MemoryManager,
  createDefaultSessionState,
  calculateRelevanceScore,
  filterByRelevance
} from "@/types/session-state"
import {
  EnhancedCampaignData,
  CharacterProfile,
  KeyNPC,
  Location,
  PlotLine,
  TimelineEvent
} from "@/types/enhanced-campaign-data"

export class SessionStateManager implements MemoryManager {
  private sessionState: SessionState
  private campaignData: EnhancedCampaignData | null = null
  private eventHistory: SessionEvent[] = []
  private memoryStore: MemoryItem[] = []
  private contextCache: Map<string, ContextPacket> = new Map()

  constructor(initialState?: Partial<SessionState>) {
    this.sessionState = {
      ...createDefaultSessionState(),
      ...initialState
    }
  }

  // =====================================================
  // SESSION STATE MANAGEMENT
  // =====================================================

  get currentSession(): SessionState {
    return { ...this.sessionState }
  }

  updateSessionState(updates: Partial<SessionState>): void {
    this.sessionState = {
      ...this.sessionState,
      ...updates
    }

    // Clear context cache when session state changes
    this.contextCache.clear()

    // Track the update as an event
    this.trackEvent({
      id: `state-update-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "custom",
      description: "Session state updated",
      entities: [],
      importance: 3,
      metadata: { updates }
    })
  }

  setCampaignData(data: EnhancedCampaignData): void {
    this.campaignData = data
  }

  startSession(gameDate: string, sessionNumber?: number): void {
    this.updateSessionState({
      sessionInfo: {
        ...this.sessionState.sessionInfo,
        isActive: true,
        gameDate,
        sessionNumber:
          sessionNumber || this.sessionState.sessionInfo.sessionNumber,
        sessionDate: new Date().toISOString()
      }
    })

    this.trackEvent({
      id: `session-start-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "custom",
      description: `Session ${sessionNumber} started`,
      entities: [],
      importance: 5
    })
  }

  endSession(): void {
    const duration = this.sessionState.sessionInfo.sessionDate
      ? Math.floor(
          (Date.now() -
            new Date(this.sessionState.sessionInfo.sessionDate).getTime()) /
            (1000 * 60)
        )
      : 0

    this.updateSessionState({
      sessionInfo: {
        ...this.sessionState.sessionInfo,
        isActive: false,
        duration
      }
    })

    this.trackEvent({
      id: `session-end-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "custom",
      description: `Session ended (${duration} minutes)`,
      entities: [],
      importance: 5
    })
  }

  // =====================================================
  // CONTEXTUAL MEMORY GENERATION
  // =====================================================

  async generateContextPacket(
    contextType: ContextType,
    focus?: string,
    options: ContextOptions = {}
  ): Promise<ContextPacket> {
    const cacheKey = `${contextType}-${focus || "general"}-${JSON.stringify(options)}`

    // Check cache first
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!
    }

    const packet = await this.buildContextPacket(contextType, focus, options)
    this.contextCache.set(cacheKey, packet)

    return packet
  }

  private async buildContextPacket(
    contextType: ContextType,
    focus?: string,
    options: ContextOptions = {}
  ): Promise<ContextPacket> {
    const {
      includeHistory = true,
      historyDepth = 10,
      includeRelationships = true,
      includeDetailedStats = false,
      maxSize = 2000
    } = options

    // Get relevant entities based on context type and focus
    const relevantEntities = await this.getRelevantEntities(contextType, focus)

    // Build core context
    const coreContext = {
      currentLocation:
        this.sessionState.currentContext.location?.name || "Unknown",
      currentDate: this.sessionState.sessionInfo.gameDate,
      activeCharacters: this.sessionState.activeEntities.characters.map(
        c => c.name
      ),
      currentObjectives: this.getCurrentObjectives(),
      recentEvents: this.getRecentEvents(5).map(e => e.description)
    }

    // Build plot context
    const plotContext = {
      mainPlotStatus:
        this.sessionState.activePlots.mainPlotline?.status || "Unknown",
      activeSubplots: this.sessionState.activePlots.activeSubplots,
      recentPlotEvents: this.sessionState.activePlots.recentEvents.slice(0, 3),
      pendingPlotPoints: this.getPendingPlotPoints()
    }

    // Build relationship context
    const relationshipContext = includeRelationships
      ? {
          characterRelationships: this.getCharacterRelationships(),
          factionRelationships: this.getFactionRelationships()
        }
      : { characterRelationships: [], factionRelationships: [] }

    // Build additional context based on type
    const additionalContext = this.buildAdditionalContext(
      contextType,
      focus,
      options
    )

    const packet: ContextPacket = {
      metadata: {
        generatedAt: new Date().toISOString(),
        sessionId: this.sessionState.sessionInfo.sessionId,
        contextType,
        relevanceScore: this.calculatePacketRelevance(contextType, focus),
        dataVersion: "1.0"
      },
      coreContext,
      relevantEntities,
      plotContext,
      relationshipContext,
      additionalContext
    }

    return packet
  }

  private async getRelevantEntities(contextType: ContextType, focus?: string) {
    if (!this.campaignData) {
      return {
        characters: this.sessionState.activeEntities.characters,
        npcs: this.sessionState.activeEntities.npcs,
        locations: this.sessionState.currentContext.location
          ? [this.sessionState.currentContext.location]
          : [],
        factions: this.sessionState.activeEntities.factions
      }
    }

    // Filter entities based on relevance to current context
    const relevantCharacters = filterByRelevance(
      this.campaignData.characterProfiles || [],
      this.sessionState,
      2,
      10
    )

    const relevantNPCs = filterByRelevance(
      this.campaignData.npcDatabase?.keyNPCs || [],
      this.sessionState,
      2,
      10
    )

    const relevantLocations = filterByRelevance(
      this.campaignData.worldState?.locations || [],
      this.sessionState,
      2,
      5
    )

    const relevantFactions = filterByRelevance(
      this.campaignData.npcDatabase?.factions || [],
      this.sessionState,
      2,
      5
    )

    return {
      characters: relevantCharacters,
      npcs: relevantNPCs,
      locations: relevantLocations,
      factions: relevantFactions
    }
  }

  private getCurrentObjectives(): string[] {
    // Extract objectives from active plots
    const objectives: string[] = []

    if (this.sessionState.activePlots.mainPlotline) {
      objectives.push(this.sessionState.activePlots.mainPlotline.description)
    }

    this.sessionState.activePlots.activeSubplots.forEach(subplot => {
      objectives.push(subplot.description)
    })

    return objectives.slice(0, 5)
  }

  private getRecentEvents(limit: number = 10): SessionEvent[] {
    return this.eventHistory
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit)
  }

  private getPendingPlotPoints(): string[] {
    return this.sessionState.activePlots.pendingEvents.map(
      event => event.description
    )
  }

  private getCharacterRelationships() {
    // Build character relationships from campaign data
    const relationships: Array<{
      character1: string
      character2: string
      relationship: string
      status: string
    }> = []

    if (this.campaignData?.characterProfiles) {
      this.campaignData.characterProfiles.forEach(char => {
        if (char.relationships) {
          Object.entries(char.relationships).forEach(
            ([otherId, relationship]) => {
              relationships.push({
                character1: char.name,
                character2: otherId,
                relationship: relationship.relationshipType,
                status: `${relationship.strength}/10`
              })
            }
          )
        }
      })
    }

    return relationships
  }

  private getFactionRelationships() {
    // Build faction relationships from campaign data
    const relationships: Array<{
      faction1: string
      faction2: string
      relationship: string
      status: string
    }> = []

    if (this.campaignData?.npcDatabase?.factions) {
      this.campaignData.npcDatabase.factions.forEach(faction => {
        // Create relationships based on allies and enemies
        faction.allies.forEach(allyId => {
          relationships.push({
            faction1: faction.name,
            faction2: allyId,
            relationship: "ally",
            status: "active"
          })
        })

        faction.enemies.forEach(enemyId => {
          relationships.push({
            faction1: faction.name,
            faction2: enemyId,
            relationship: "enemy",
            status: "active"
          })
        })
      })
    }

    return relationships
  }

  private buildAdditionalContext(
    contextType: ContextType,
    focus?: string,
    options: ContextOptions = {}
  ): Record<string, any> {
    const additional: Record<string, any> = {}

    switch (contextType) {
      case "combat":
        additional.combatState = {
          inCombat: true,
          combatants: this.sessionState.activeEntities.characters.map(
            c => c.name
          ),
          currentTurn: 1,
          initiative: []
        }
        break

      case "dialogue":
        additional.dialogueState = {
          participants: this.sessionState.activeEntities.characters.map(
            c => c.name
          ),
          npcsPresent: this.sessionState.activeEntities.npcs.map(n => n.name),
          mood: this.sessionState.currentContext.mood,
          recentDialogue: this.sessionState.recentHistory.importantDialogue
        }
        break

      case "exploration":
        additional.explorationState = {
          currentLocation: this.sessionState.currentContext.location?.name,
          visibleLocations: this.sessionState.currentContext.secondaryLocations,
          weatherConditions: this.sessionState.currentContext.weather,
          timeOfDay: this.sessionState.currentContext.timeOfDay
        }
        break

      case "character-focus":
        if (focus) {
          const character = this.sessionState.activeEntities.characters.find(
            c => c.name === focus
          )
          if (character) {
            additional.focusCharacter = character
            additional.characterState = {
              currentLocation: character.currentLocation,
              recentActions: this.sessionState.recentHistory.lastActions.filter(
                a => a.includes(focus)
              ),
              relationships: character.relationships
            }
          }
        }
        break

      case "location-focus":
        if (focus && this.campaignData?.worldState?.locations) {
          const location = this.campaignData.worldState.locations.find(
            l => l.name === focus
          )
          if (location) {
            additional.focusLocation = location
            additional.locationState = {
              presentCharacters: this.sessionState.activeEntities.characters
                .filter(c => c.currentLocation === focus)
                .map(c => c.name),
              presentNPCs: this.sessionState.activeEntities.npcs
                .filter(n => n.currentLocation === focus)
                .map(n => n.name),
              recentEvents: this.eventHistory
                .filter(e => e.location === focus)
                .slice(0, 5)
            }
          }
        }
        break
    }

    return additional
  }

  private calculatePacketRelevance(
    contextType: ContextType,
    focus?: string
  ): number {
    let score = 5 // base score

    // Higher relevance for specific context types
    if (contextType === "combat" || contextType === "dialogue") score += 2
    if (focus) score += 1

    // Relevance based on current session activity
    if (this.sessionState.sessionInfo.isActive) score += 1

    return score
  }

  // =====================================================
  // EVENT TRACKING
  // =====================================================

  trackEvent(event: SessionEvent): void {
    this.eventHistory.push(event)

    // Create memory item from event
    const memoryItem: MemoryItem = {
      id: `memory-${event.id}`,
      timestamp: event.timestamp,
      content: event.description,
      type: event.type,
      relevanceScore: event.importance,
      entities: event.entities,
      location: event.location,
      sessionId: this.sessionState.sessionInfo.sessionId
    }

    this.memoryStore.push(memoryItem)

    // Update session state based on event
    this.updateSessionStateFromEvent(event)

    // Clear context cache since new event might change relevance
    this.contextCache.clear()
  }

  private updateSessionStateFromEvent(event: SessionEvent): void {
    switch (event.type) {
      case "location-change":
        if (event.location) {
          this.sessionState.currentContext.primaryLocation = event.location
        }
        break

      case "dialogue":
        this.sessionState.recentHistory.importantDialogue.push(
          event.description
        )
        // Keep only last 10 dialogue entries
        if (this.sessionState.recentHistory.importantDialogue.length > 10) {
          this.sessionState.recentHistory.importantDialogue.shift()
        }
        break

      case "combat-start":
      case "combat-end":
        this.sessionState.recentHistory.combatEvents.push(event.description)
        // Keep only last 5 combat events
        if (this.sessionState.recentHistory.combatEvents.length > 5) {
          this.sessionState.recentHistory.combatEvents.shift()
        }
        break
    }

    // Update recent actions
    this.sessionState.recentHistory.lastActions.push(event.description)
    if (this.sessionState.recentHistory.lastActions.length > 20) {
      this.sessionState.recentHistory.lastActions.shift()
    }
  }

  // =====================================================
  // MEMORY RETRIEVAL
  // =====================================================

  async getRelevantMemories(
    query: string,
    limit: number = 10
  ): Promise<MemoryItem[]> {
    const lowerQuery = query.toLowerCase()

    return this.memoryStore
      .filter(
        memory =>
          memory.content.toLowerCase().includes(lowerQuery) ||
          memory.entities.some(entity =>
            entity.toLowerCase().includes(lowerQuery)
          )
      )
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  clearSession(): void {
    this.sessionState = createDefaultSessionState()
    this.eventHistory = []
    this.memoryStore = []
    this.contextCache.clear()
  }

  exportSession(): SessionExport {
    return {
      sessionState: this.sessionState,
      events: this.eventHistory,
      memories: this.memoryStore,
      contextPackets: Array.from(this.contextCache.values()),
      metadata: {
        exportDate: new Date().toISOString(),
        sessionDuration: this.sessionState.sessionInfo.duration || 0,
        totalEvents: this.eventHistory.length,
        totalMemories: this.memoryStore.length
      }
    }
  }

  // =====================================================
  // CONVENIENCE METHODS
  // =====================================================

  addCharacterToSession(character: CharacterProfile): void {
    const currentCharacters = this.sessionState.activeEntities.characters
    if (!currentCharacters.find(c => c.id === character.id)) {
      this.updateSessionState({
        activeEntities: {
          ...this.sessionState.activeEntities,
          characters: [...currentCharacters, character]
        }
      })

      this.trackEvent({
        id: `char-add-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "custom",
        description: `${character.name} joined the session`,
        entities: [character.name],
        importance: 4
      })
    }
  }

  setCurrentLocation(location: Location): void {
    this.updateSessionState({
      currentContext: {
        ...this.sessionState.currentContext,
        location,
        primaryLocation: location.name
      }
    })

    this.trackEvent({
      id: `loc-change-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "location-change",
      description: `Party moved to ${location.name}`,
      entities: this.sessionState.activeEntities.characters.map(c => c.name),
      location: location.name,
      importance: 5
    })
  }

  advancePlot(plotId: string, description: string): void {
    this.trackEvent({
      id: `plot-advance-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "plot-advancement",
      description,
      entities: [],
      importance: 6
    })
  }
}
