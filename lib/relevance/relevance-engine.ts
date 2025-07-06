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
