/**
 * Advanced Relevance Scoring and Filtering System
 *
 * Implements sophisticated prioritization logic for AI context generation
 * in TTRPG campaigns
 */

import {
  SessionState,
  ContextType,
  ContextOptions
} from "@/types/session-state"
import {
  CharacterProfile,
  KeyNPC,
  MinorNPC,
  Location,
  PlotLine,
  TimelineEvent,
  Faction,
  EnhancedCampaignData
} from "@/types/enhanced-campaign-data"

// =====================================================
// RELEVANCE SCORING INTERFACES
// =====================================================

export interface RelevanceScore {
  id: string
  score: number
  reasons: string[]
  category: RelevanceCategory
  priority: Priority
}

export type RelevanceCategory =
  | "character"
  | "npc"
  | "location"
  | "plotline"
  | "event"
  | "faction"
  | "item"
  | "rule"

export type Priority =
  | "critical" // 9-10: Must be included
  | "high" // 7-8: Should be included
  | "medium" // 5-6: Include if space allows
  | "low" // 3-4: Background context only
  | "negligible" // 1-2: Exclude from AI context

export interface FilteringOptions {
  minScore?: number
  maxItems?: number
  includeBackground?: boolean
  prioritizeBy?: "score" | "recency" | "importance"
  contextType?: ContextType
  focusEntity?: string
  customWeights?: RelevanceWeights
}

export interface RelevanceWeights {
  presence: number // Entity is present in current scene
  recency: number // How recently entity was mentioned/active
  plotRelevance: number // Connection to active plots
  relationship: number // Connection to active characters
  importance: number // Inherent importance level
  contextType: number // Relevance to current context type
  focus: number // Relevance to specified focus entity
}

// =====================================================
// RELEVANCE SCORING ENGINE
// =====================================================

export class RelevanceEngine {
  private defaultWeights: RelevanceWeights = {
    presence: 10,
    recency: 8,
    plotRelevance: 9,
    relationship: 7,
    importance: 6,
    contextType: 8,
    focus: 15
  }

  constructor(private customWeights?: Partial<RelevanceWeights>) {}

  /**
   * Calculate relevance score for any entity
   */
  calculateScore(
    entity: any,
    sessionState: SessionState,
    campaignData: EnhancedCampaignData,
    contextType: ContextType,
    focus?: string
  ): RelevanceScore {
    const weights = { ...this.defaultWeights, ...this.customWeights }
    const reasons: string[] = []
    let score = 0

    // Base score for the entity type
    score += this.getBaseScore(entity, reasons)

    // Presence scoring
    const presenceScore = this.calculatePresenceScore(
      entity,
      sessionState,
      reasons
    )
    score += presenceScore * weights.presence

    // Recency scoring
    const recencyScore = this.calculateRecencyScore(
      entity,
      sessionState,
      reasons
    )
    score += recencyScore * weights.recency

    // Plot relevance scoring
    const plotScore = this.calculatePlotRelevanceScore(
      entity,
      sessionState,
      campaignData,
      reasons
    )
    score += plotScore * weights.plotRelevance

    // Relationship scoring
    const relationshipScore = this.calculateRelationshipScore(
      entity,
      sessionState,
      campaignData,
      reasons
    )
    score += relationshipScore * weights.relationship

    // Importance scoring
    const importanceScore = this.calculateImportanceScore(entity, reasons)
    score += importanceScore * weights.importance

    // Context type scoring
    const contextScore = this.calculateContextTypeScore(
      entity,
      contextType,
      reasons
    )
    score += contextScore * weights.contextType

    // Focus scoring
    const focusScore = this.calculateFocusScore(entity, focus, reasons)
    score += focusScore * weights.focus

    // Normalize score to 0-10 range
    const normalizedScore = Math.min(10, Math.max(0, score / 10))

    return {
      id: entity.id || entity.name,
      score: normalizedScore,
      reasons,
      category: this.getEntityCategory(entity),
      priority: this.scoreToPriority(normalizedScore)
    }
  }

  /**
   * Filter entities based on relevance scores
   */
  filterByRelevance<T>(
    entities: T[],
    sessionState: SessionState,
    campaignData: EnhancedCampaignData,
    contextType: ContextType,
    options: FilteringOptions = {}
  ): Array<T & { relevanceScore: RelevanceScore }> {
    const {
      minScore = 3,
      maxItems = 20,
      includeBackground = false,
      prioritizeBy = "score",
      focusEntity
    } = options

    // Calculate relevance scores for all entities
    const scoredEntities = entities.map(entity => {
      const relevanceScore = this.calculateScore(
        entity,
        sessionState,
        campaignData,
        contextType,
        focusEntity
      )
      return { ...entity, relevanceScore }
    })

    // Filter by minimum score
    let filteredEntities = scoredEntities.filter(entity => {
      if (
        !includeBackground &&
        entity.relevanceScore.priority === "negligible"
      ) {
        return false
      }
      return entity.relevanceScore.score >= minScore
    })

    // Sort by priority criteria
    filteredEntities.sort((a, b) => {
      switch (prioritizeBy) {
        case "score":
          return b.relevanceScore.score - a.relevanceScore.score
        case "recency":
          return (
            this.getEntityRecency(b, sessionState) -
            this.getEntityRecency(a, sessionState)
          )
        case "importance":
          return this.getEntityImportance(b) - this.getEntityImportance(a)
        default:
          return b.relevanceScore.score - a.relevanceScore.score
      }
    })

    // Limit to max items
    return filteredEntities.slice(0, maxItems)
  }

  /**
   * Generate prioritized context for AI
   */
  generatePrioritizedContext(
    sessionState: SessionState,
    campaignData: EnhancedCampaignData,
    contextType: ContextType,
    options: FilteringOptions = {}
  ): {
    critical: any[]
    high: any[]
    medium: any[]
    low: any[]
    excluded: any[]
  } {
    const allEntities = this.gatherAllEntities(campaignData)
    const scoredEntities = this.filterByRelevance(
      allEntities,
      sessionState,
      campaignData,
      contextType,
      { ...options, maxItems: 1000 }
    )

    return {
      critical: scoredEntities.filter(
        e => e.relevanceScore.priority === "critical"
      ),
      high: scoredEntities.filter(e => e.relevanceScore.priority === "high"),
      medium: scoredEntities.filter(
        e => e.relevanceScore.priority === "medium"
      ),
      low: scoredEntities.filter(e => e.relevanceScore.priority === "low"),
      excluded: scoredEntities.filter(
        e => e.relevanceScore.priority === "negligible"
      )
    }
  }

  // =====================================================
  // PRIVATE SCORING METHODS
  // =====================================================

  private getBaseScore(entity: any, reasons: string[]): number {
    const category = this.getEntityCategory(entity)
    const baseScores = {
      character: 5,
      npc: 4,
      location: 3,
      plotline: 6,
      event: 4,
      faction: 3,
      item: 2,
      rule: 2
    }

    const score = baseScores[category] || 2
    reasons.push(`Base ${category} score: ${score}`)
    return score
  }

  private calculatePresenceScore(
    entity: any,
    sessionState: SessionState,
    reasons: string[]
  ): number {
    let score = 0

    // Check if entity is in current location
    if (
      entity.currentLocation === sessionState.currentContext.primaryLocation
    ) {
      score += 5
      reasons.push(`Present in current location (${entity.currentLocation})`)
    }

    // Check if entity is in secondary locations
    if (
      sessionState.currentContext.secondaryLocations?.includes(
        entity.currentLocation
      )
    ) {
      score += 3
      reasons.push(`Present in nearby location (${entity.currentLocation})`)
    }

    // Check if entity is in active entities
    if (sessionState.activeEntities.characters.some(c => c.id === entity.id)) {
      score += 8
      reasons.push("Active character in session")
    }

    if (sessionState.activeEntities.npcs.some(n => n.id === entity.id)) {
      score += 6
      reasons.push("Active NPC in session")
    }

    return score
  }

  private calculateRecencyScore(
    entity: any,
    sessionState: SessionState,
    reasons: string[]
  ): number {
    const now = new Date().getTime()
    let score = 0

    // Check recent actions
    const recentMentions = sessionState.recentHistory.lastActions.filter(
      action => action.toLowerCase().includes(entity.name?.toLowerCase() || "")
    )

    if (recentMentions.length > 0) {
      score += Math.min(5, recentMentions.length)
      reasons.push(`Recently mentioned in ${recentMentions.length} actions`)
    }

    // Check recent dialogue
    const recentDialogue = sessionState.recentHistory.importantDialogue.filter(
      dialogue =>
        dialogue.toLowerCase().includes(entity.name?.toLowerCase() || "")
    )

    if (recentDialogue.length > 0) {
      score += Math.min(3, recentDialogue.length)
      reasons.push(`Recently mentioned in dialogue`)
    }

    return score
  }

  private calculatePlotRelevanceScore(
    entity: any,
    sessionState: SessionState,
    campaignData: EnhancedCampaignData,
    reasons: string[]
  ): number {
    let score = 0

    // Check connection to main plotline
    if (sessionState.activePlots.mainPlotline) {
      if (
        this.isEntityConnectedToPlot(
          entity,
          sessionState.activePlots.mainPlotline
        )
      ) {
        score += 6
        reasons.push("Connected to main plotline")
      }
    }

    // Check connection to active subplots
    sessionState.activePlots.activeSubplots.forEach(subplot => {
      if (this.isEntityConnectedToPlot(entity, subplot)) {
        score += 4
        reasons.push(`Connected to subplot: ${subplot.name}`)
      }
    })

    // Check connection to recent events
    sessionState.activePlots.recentEvents.forEach(event => {
      if (this.isEntityConnectedToEvent(entity, event)) {
        score += 2
        reasons.push(`Connected to recent event: ${event.name}`)
      }
    })

    return score
  }

  private calculateRelationshipScore(
    entity: any,
    sessionState: SessionState,
    campaignData: EnhancedCampaignData,
    reasons: string[]
  ): number {
    let score = 0

    // Check relationships with active characters
    sessionState.activeEntities.characters.forEach(character => {
      if (character.relationships && character.relationships[entity.id]) {
        const relationship = character.relationships[entity.id]
        const strength = Math.abs(relationship.strength)
        score += strength / 2
        reasons.push(
          `${relationship.relationshipType} with ${character.name} (${strength}/10)`
        )
      }
    })

    return score
  }

  private calculateImportanceScore(entity: any, reasons: string[]): number {
    let score = 0

    // Check importance level for NPCs
    if (entity.importanceLevel) {
      const importanceScores: Record<string, number> = {
        critical: 8,
        major: 6,
        moderate: 4,
        minor: 2,
        background: 1
      }
      score += importanceScores[entity.importanceLevel as string] || 2
      reasons.push(`Importance level: ${entity.importanceLevel}`)
    }

    // Check status for plots
    if (entity.status === "active") {
      score += 4
      reasons.push("Active status")
    }

    return score
  }

  private calculateContextTypeScore(
    entity: any,
    contextType: ContextType,
    reasons: string[]
  ): number {
    let score = 0

    switch (contextType) {
      case "combat":
        if (entity.combatRole || entity.combatStats) {
          score += 5
          reasons.push("Combat-relevant entity")
        }
        break
      case "dialogue":
        if (entity.personality || entity.motivations) {
          score += 5
          reasons.push("Dialogue-relevant entity")
        }
        break
      case "exploration":
        if (entity.type === "location" || entity.currentLocation) {
          score += 5
          reasons.push("Exploration-relevant entity")
        }
        break
      case "character-focus":
        if (entity.type === "character") {
          score += 8
          reasons.push("Character-focused context")
        }
        break
      case "location-focus":
        if (entity.type === "location") {
          score += 8
          reasons.push("Location-focused context")
        }
        break
    }

    return score
  }

  private calculateFocusScore(
    entity: any,
    focus: string | undefined,
    reasons: string[]
  ): number {
    if (!focus) return 0

    let score = 0

    // Direct name match
    if (entity.name?.toLowerCase() === focus.toLowerCase()) {
      score += 10
      reasons.push("Direct focus match")
    }

    // Partial name match
    if (entity.name?.toLowerCase().includes(focus.toLowerCase())) {
      score += 5
      reasons.push("Partial focus match")
    }

    // Location match
    if (entity.currentLocation?.toLowerCase() === focus.toLowerCase()) {
      score += 3
      reasons.push("Located in focus area")
    }

    return score
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private getEntityCategory(entity: any): RelevanceCategory {
    if (entity.role || entity.level) return "character"
    if (entity.importanceLevel) return "npc"
    if (entity.type === "location") return "location"
    if (entity.status && entity.objectives) return "plotline"
    if (entity.date && entity.description) return "event"
    if (entity.goals && entity.members) return "faction"
    return "item"
  }

  private scoreToPriority(score: number): Priority {
    if (score >= 9) return "critical"
    if (score >= 7) return "high"
    if (score >= 5) return "medium"
    if (score >= 3) return "low"
    return "negligible"
  }

  private isEntityConnectedToPlot(entity: any, plot: PlotLine): boolean {
    // Check if entity is mentioned in plot objectives or description
    const plotObjectives = (plot as any).objectives || []
    const text =
      `${plot.description} ${plotObjectives.join(" ") || ""}`.toLowerCase()
    return text.includes(entity.name?.toLowerCase() || "")
  }

  private isEntityConnectedToEvent(entity: any, event: TimelineEvent): boolean {
    // Check if entity is mentioned in event description
    return event.description
      .toLowerCase()
      .includes(entity.name?.toLowerCase() || "")
  }

  private gatherAllEntities(campaignData: EnhancedCampaignData): any[] {
    const entities: any[] = []

    if (campaignData.characterProfiles) {
      entities.push(...campaignData.characterProfiles)
    }

    if (campaignData.npcDatabase) {
      if (campaignData.npcDatabase.keyNPCs) {
        entities.push(...campaignData.npcDatabase.keyNPCs)
      }
      if (campaignData.npcDatabase.minorNPCs) {
        entities.push(...campaignData.npcDatabase.minorNPCs)
      }
      if (campaignData.npcDatabase.factions) {
        entities.push(...campaignData.npcDatabase.factions)
      }
    }

    if (campaignData.worldState?.locations) {
      entities.push(...campaignData.worldState.locations)
    }

    if (campaignData.campaignProgression) {
      if (campaignData.campaignProgression.mainPlotline) {
        entities.push(campaignData.campaignProgression.mainPlotline)
      }
      if (campaignData.campaignProgression.subplots) {
        entities.push(...campaignData.campaignProgression.subplots)
      }
    }

    return entities
  }

  private getEntityRecency(entity: any, sessionState: SessionState): number {
    // Simple recency calculation based on recent mentions
    const recentMentions = sessionState.recentHistory.lastActions.filter(
      action => action.toLowerCase().includes(entity.name?.toLowerCase() || "")
    )
    return recentMentions.length
  }

  private getEntityImportance(entity: any): number {
    if (entity.importanceLevel) {
      const importanceScores: Record<string, number> = {
        critical: 8,
        major: 6,
        moderate: 4,
        minor: 2,
        background: 1
      }
      return importanceScores[entity.importanceLevel as string] || 2
    }
    return entity.level || 3
  }
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

export function createRelevanceEngine(
  weights?: Partial<RelevanceWeights>
): RelevanceEngine {
  return new RelevanceEngine(weights)
}

export function getHighPriorityEntities<T>(
  entities: T[],
  sessionState: SessionState,
  campaignData: EnhancedCampaignData,
  contextType: ContextType,
  maxItems: number = 10
): T[] {
  const engine = createRelevanceEngine()
  const filtered = engine.filterByRelevance(
    entities,
    sessionState,
    campaignData,
    contextType,
    { minScore: 7, maxItems }
  )
  return filtered.map(item => {
    const { relevanceScore, ...entity } = item
    return entity as T
  })
}

export function filterBackgroundEntities<T>(
  entities: T[],
  sessionState: SessionState,
  campaignData: EnhancedCampaignData,
  contextType: ContextType
): { foreground: T[]; background: T[] } {
  const engine = createRelevanceEngine()
  const scored = engine.filterByRelevance(
    entities,
    sessionState,
    campaignData,
    contextType,
    { minScore: 0, maxItems: 1000 }
  )

  const foreground = scored
    .filter(item => item.relevanceScore.priority !== "negligible")
    .map(item => {
      const { relevanceScore, ...entity } = item
      return entity as T
    })

  const background = scored
    .filter(item => item.relevanceScore.priority === "negligible")
    .map(item => {
      const { relevanceScore, ...entity } = item
      return entity as T
    })

  return { foreground, background }
}

// =====================================================
// AI CONTEXT ASSEMBLY INTERFACES
// =====================================================

export interface AIContextPacket {
  sessionInfo: {
    sessionId: string
    timestamp: string
    contextType: ContextType
    primaryLocation: string
    secondaryLocations: string[]
    activeCharacters: string[]
    currentPlots: string[]
  }
  criticalEntities: AIEntityContext[]
  highPriorityEntities: AIEntityContext[]
  backgroundContext: AIEntityContext[]
  recentEvents: string[]
  activeDialogue: string[]
  gameState: {
    timeOfDay?: string
    weather?: string
    tension?: number
    mood?: string
  }
  contextSummary: string
  tokenEstimate: number
  warnings: string[]
}

export interface AIEntityContext {
  id: string
  name: string
  type: RelevanceCategory
  priority: Priority
  relevanceScore: number
  keyInfo: string[]
  relationships: string[]
  currentStatus: string
  relevanceReasons: string[]
}

export interface ContextAssemblyOptions {
  maxTokens?: number
  includeBackground?: boolean
  focusEntity?: string
  contextType?: ContextType
  customPrompt?: string
  includeMetadata?: boolean
  compressionLevel?: "none" | "minimal" | "aggressive"
}

export interface AIPromptTemplate {
  systemPrompt: string
  contextPrompt: string
  userPrompt: string
  variables: Record<string, any>
}

// =====================================================
// AI CONTEXT ASSEMBLY CLASS
// =====================================================

export class AIContextAssembler {
  private relevanceEngine: RelevanceEngine
  private maxTokensDefault = 4000
  private tokenEstimateMultiplier = 4 // rough estimate: 1 token = 4 characters

  constructor(customWeights?: Partial<RelevanceWeights>) {
    this.relevanceEngine = new RelevanceEngine(customWeights)
  }

  /**
   * Assemble comprehensive AI context packet
   */
  assembleContext(
    sessionState: SessionState,
    campaignData: EnhancedCampaignData,
    contextType: ContextType,
    options: ContextAssemblyOptions = {}
  ): AIContextPacket {
    const {
      maxTokens = this.maxTokensDefault,
      includeBackground = false,
      focusEntity,
      compressionLevel = "minimal"
    } = options

    // Generate prioritized context
    const prioritizedContext = this.relevanceEngine.generatePrioritizedContext(
      sessionState,
      campaignData,
      contextType,
      { focusEntity, includeBackground }
    )

    // Convert entities to AI context format
    const criticalEntities = this.convertToAIContext(
      prioritizedContext.critical,
      sessionState,
      campaignData,
      compressionLevel
    )

    const highPriorityEntities = this.convertToAIContext(
      prioritizedContext.high,
      sessionState,
      campaignData,
      compressionLevel
    )

    const backgroundContext = includeBackground
      ? this.convertToAIContext(
          prioritizedContext.medium.slice(0, 10),
          sessionState,
          campaignData,
          "aggressive"
        )
      : []

    // Build context packet
    const contextPacket: AIContextPacket = {
      sessionInfo: {
        sessionId: sessionState.sessionInfo.sessionId,
        timestamp: new Date().toISOString(),
        contextType,
        primaryLocation:
          sessionState.currentContext.primaryLocation || "Unknown",
        secondaryLocations:
          sessionState.currentContext.secondaryLocations || [],
        activeCharacters: sessionState.activeEntities.characters.map(
          c => c.name
        ),
        currentPlots: sessionState.activePlots.activeSubplots.map(p => p.name)
      },
      criticalEntities,
      highPriorityEntities,
      backgroundContext,
      recentEvents: sessionState.recentHistory.lastActions.slice(0, 5),
      activeDialogue: sessionState.recentHistory.importantDialogue.slice(0, 3),
      gameState: {
        timeOfDay: sessionState.currentContext.timeOfDay,
        weather: sessionState.currentContext.weather,
        tension: undefined, // Remove tension property since it doesn't exist
        mood: sessionState.currentContext.mood
      },
      contextSummary: "",
      tokenEstimate: 0,
      warnings: []
    }

    // Generate context summary
    contextPacket.contextSummary = this.generateContextSummary(contextPacket)

    // Calculate token estimate
    contextPacket.tokenEstimate = this.estimateTokens(contextPacket)

    // Add warnings if over token limit
    if (contextPacket.tokenEstimate > maxTokens) {
      contextPacket.warnings.push(
        `Context exceeds token limit (${contextPacket.tokenEstimate}/${maxTokens})`
      )

      // Auto-compress if needed
      if (compressionLevel !== "none") {
        return this.compressContext(contextPacket, maxTokens)
      }
    }

    return contextPacket
  }

  /**
   * Generate AI-optimized prompt with context
   */
  generateAIPrompt(
    contextPacket: AIContextPacket,
    userQuery: string,
    systemPrompt?: string
  ): AIPromptTemplate {
    const defaultSystemPrompt = `You are an expert Game Master assistant for a TTRPG campaign. 
Use the provided campaign context to give accurate, immersive responses that maintain consistency with the established world and story.
Focus on the most relevant information and maintain the appropriate tone for ${contextPacket.sessionInfo.contextType} scenarios.`

    const contextPrompt = this.buildContextPrompt(contextPacket)

    return {
      systemPrompt: systemPrompt || defaultSystemPrompt,
      contextPrompt,
      userPrompt: userQuery,
      variables: {
        contextType: contextPacket.sessionInfo.contextType,
        location: contextPacket.sessionInfo.primaryLocation,
        characters: contextPacket.sessionInfo.activeCharacters,
        tokenCount: contextPacket.tokenEstimate
      }
    }
  }

  /**
   * Quick context assembly for common scenarios
   */
  assembleQuickContext(
    sessionState: SessionState,
    campaignData: EnhancedCampaignData,
    scenario: "combat" | "dialogue" | "exploration" | "general-query"
  ): string {
    const contextType = scenario as ContextType
    const packet = this.assembleContext(
      sessionState,
      campaignData,
      contextType,
      {
        maxTokens: 2000,
        compressionLevel: "aggressive"
      }
    )

    return this.buildContextPrompt(packet)
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private convertToAIContext(
    entities: any[],
    sessionState: SessionState,
    campaignData: EnhancedCampaignData,
    compressionLevel: "none" | "minimal" | "aggressive"
  ): AIEntityContext[] {
    return entities.map(entity => {
      const relevanceScore =
        entity.relevanceScore ||
        this.relevanceEngine.calculateScore(
          entity,
          sessionState,
          campaignData,
          "general-query"
        )

      return {
        id: entity.id || entity.name,
        name: entity.name,
        type: relevanceScore.category,
        priority: relevanceScore.priority,
        relevanceScore: relevanceScore.score,
        keyInfo: this.extractKeyInfo(entity, compressionLevel),
        relationships: this.extractRelationships(entity, compressionLevel),
        currentStatus: this.extractCurrentStatus(entity),
        relevanceReasons: relevanceScore.reasons
      }
    })
  }

  private extractKeyInfo(entity: any, compressionLevel: string): string[] {
    const info: string[] = []

    // Always include basic info
    if (entity.description) {
      info.push(
        compressionLevel === "aggressive"
          ? entity.description.substring(0, 100) + "..."
          : entity.description
      )
    }

    // Entity-specific info
    if (entity.role) info.push(`Role: ${entity.role}`)
    if (entity.level) info.push(`Level: ${entity.level}`)
    if (entity.importanceLevel)
      info.push(`Importance: ${entity.importanceLevel}`)
    if (entity.currentLocation) info.push(`Location: ${entity.currentLocation}`)
    if (entity.status) info.push(`Status: ${entity.status}`)

    // Limit info based on compression
    const maxItems =
      compressionLevel === "aggressive"
        ? 3
        : compressionLevel === "minimal"
          ? 5
          : 10

    return info.slice(0, maxItems)
  }

  private extractRelationships(
    entity: any,
    compressionLevel: string
  ): string[] {
    const relationships: string[] = []

    if (entity.relationships) {
      Object.entries(entity.relationships).forEach(
        ([targetId, rel]: [string, any]) => {
          if (compressionLevel === "aggressive" && relationships.length >= 2)
            return
          relationships.push(
            `${rel.relationshipType} with ${targetId} (${rel.strength}/10)`
          )
        }
      )
    }

    return relationships
  }

  private extractCurrentStatus(entity: any): string {
    if (entity.currentStatus) return entity.currentStatus
    if (entity.status) return entity.status
    if (entity.health) return `Health: ${entity.health}`
    return "Unknown"
  }

  private generateContextSummary(packet: AIContextPacket): string {
    const { sessionInfo, criticalEntities, highPriorityEntities } = packet

    let summary = `${sessionInfo.contextType} scenario at ${sessionInfo.primaryLocation}. `

    if (criticalEntities.length > 0) {
      summary += `Critical: ${criticalEntities.map(e => e.name).join(", ")}. `
    }

    if (highPriorityEntities.length > 0) {
      summary += `Important: ${highPriorityEntities.map(e => e.name).join(", ")}. `
    }

    if (packet.recentEvents.length > 0) {
      summary += `Recent: ${packet.recentEvents[0]}. `
    }

    return summary
  }

  public buildContextPrompt(packet: AIContextPacket): string {
    let prompt = `## Current Session Context\n`
    prompt += `**Location:** ${packet.sessionInfo.primaryLocation}\n`
    prompt += `**Context:** ${packet.sessionInfo.contextType}\n`
    prompt += `**Active Characters:** ${packet.sessionInfo.activeCharacters.join(", ")}\n\n`

    if (packet.criticalEntities.length > 0) {
      prompt += `## Critical Entities\n`
      packet.criticalEntities.forEach(entity => {
        prompt += `**${entity.name}** (${entity.type})\n`
        prompt += `- ${entity.keyInfo.join("\n- ")}\n`
        if (entity.relationships.length > 0) {
          prompt += `- Relationships: ${entity.relationships.join(", ")}\n`
        }
        prompt += `\n`
      })
    }

    if (packet.highPriorityEntities.length > 0) {
      prompt += `## Important Context\n`
      packet.highPriorityEntities.forEach(entity => {
        prompt += `**${entity.name}:** ${entity.keyInfo[0] || "No description"}\n`
      })
      prompt += `\n`
    }

    if (packet.recentEvents.length > 0) {
      prompt += `## Recent Events\n`
      packet.recentEvents.forEach(event => {
        prompt += `- ${event}\n`
      })
      prompt += `\n`
    }

    return prompt
  }

  private estimateTokens(packet: AIContextPacket): number {
    const content = JSON.stringify(packet)
    return Math.ceil(content.length / this.tokenEstimateMultiplier)
  }

  private compressContext(
    packet: AIContextPacket,
    maxTokens: number
  ): AIContextPacket {
    // Aggressive compression - keep only the most critical information
    const compressed = { ...packet }

    // Reduce entities
    compressed.criticalEntities = compressed.criticalEntities.slice(0, 3)
    compressed.highPriorityEntities = compressed.highPriorityEntities.slice(
      0,
      5
    )
    compressed.backgroundContext = []

    // Reduce events and dialogue
    compressed.recentEvents = compressed.recentEvents.slice(0, 3)
    compressed.activeDialogue = compressed.activeDialogue.slice(0, 2)

    // Update estimates
    compressed.tokenEstimate = this.estimateTokens(compressed)
    compressed.warnings.push(
      "Context was automatically compressed to fit token limit"
    )

    return compressed
  }
}

// =====================================================
// AI CONTEXT ASSEMBLY CONVENIENCE FUNCTIONS
// =====================================================

export function createAIContextAssembler(
  weights?: Partial<RelevanceWeights>
): AIContextAssembler {
  return new AIContextAssembler(weights)
}

export function assembleAIContext(
  sessionState: SessionState,
  campaignData: EnhancedCampaignData,
  contextType: ContextType,
  options?: ContextAssemblyOptions
): AIContextPacket {
  const assembler = createAIContextAssembler()
  return assembler.assembleContext(
    sessionState,
    campaignData,
    contextType,
    options
  )
}

export function generateQuickPrompt(
  sessionState: SessionState,
  campaignData: EnhancedCampaignData,
  userQuery: string,
  scenario: "combat" | "dialogue" | "exploration" | "general-query" = "dialogue"
): string {
  const assembler = createAIContextAssembler()
  const contextPacket = assembler.assembleContext(
    sessionState,
    campaignData,
    scenario,
    { maxTokens: 2000, compressionLevel: "minimal" }
  )

  const prompt = assembler.generateAIPrompt(contextPacket, userQuery)
  return `${prompt.systemPrompt}\n\n${prompt.contextPrompt}\n\n${prompt.userPrompt}`
}

export function optimizeContextForAI(
  entities: any[],
  sessionState: SessionState,
  campaignData: EnhancedCampaignData,
  maxTokens: number = 3000
): {
  context: string
  tokenEstimate: number
  entitiesIncluded: number
} {
  const assembler = createAIContextAssembler()
  const packet = assembler.assembleContext(
    sessionState,
    campaignData,
    "general-query",
    { maxTokens, compressionLevel: "minimal" }
  )

  return {
    context: packet.contextSummary, // Use contextSummary instead of private method
    tokenEstimate: packet.tokenEstimate,
    entitiesIncluded:
      packet.criticalEntities.length + packet.highPriorityEntities.length
  }
}
