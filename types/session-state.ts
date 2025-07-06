/**
 * Session State Management for TTRPG Campaign System
 *
 * Tracks current session state, active entities, and provides
 * contextual memory for AI integration
 */

import {
  CharacterProfile,
  KeyNPC,
  MinorNPC,
  Location,
  PlotLine,
  SessionLog,
  TimelineEvent,
  Faction
} from "@/types/enhanced-campaign-data"

// =====================================================
// SESSION STATE INTERFACES
// =====================================================

export interface SessionState {
  /** Current session metadata */
  sessionInfo: {
    sessionId: string
    sessionDate: string
    gameDate: string
    sessionNumber: number
    isActive: boolean
    duration?: number // in minutes
    notes?: string
  }

  /** Active entities in current session */
  activeEntities: {
    characters: CharacterProfile[]
    npcs: KeyNPC[]
    minorNPCs: MinorNPC[]
    factions: Faction[]
  }

  /** Current scene/location context */
  currentContext: {
    location?: Location
    primaryLocation?: string
    secondaryLocations?: string[]
    timeOfDay?: string
    weather?: string
    mood?: string
  }

  /** Active plot elements */
  activePlots: {
    mainPlotline?: PlotLine
    activeSubplots: PlotLine[]
    recentEvents: TimelineEvent[]
    pendingEvents: TimelineEvent[]
  }

  /** Recent session history */
  recentHistory: {
    lastActions: string[]
    keyDecisions: string[]
    importantDialogue: string[]
    combatEvents: string[]
  }

  /** AI context preferences */
  aiContext: {
    memoryDepth: number // how many past events to remember
    relevanceThreshold: number // minimum relevance score for inclusion
    maxContextSize: number // maximum context packet size
    preferredDetails: string[] // types of details to prioritize
  }
}

// =====================================================
// CONTEXTUAL MEMORY INTERFACES
// =====================================================

export interface ContextPacket {
  /** Packet metadata */
  metadata: {
    generatedAt: string
    sessionId: string
    contextType: ContextType
    relevanceScore: number
    dataVersion: string
  }

  /** Core context information */
  coreContext: {
    currentLocation: string
    currentDate: string
    activeCharacters: string[]
    currentObjectives: string[]
    recentEvents: string[]
  }

  /** Relevant entities */
  relevantEntities: {
    characters: CharacterProfile[]
    npcs: KeyNPC[]
    locations: Location[]
    factions: Faction[]
  }

  /** Plot context */
  plotContext: {
    mainPlotStatus: string
    activeSubplots: PlotLine[]
    recentPlotEvents: TimelineEvent[]
    pendingPlotPoints: string[]
  }

  /** Relationship context */
  relationshipContext: {
    characterRelationships: Array<{
      character1: string
      character2: string
      relationship: string
      status: string
    }>
    factionRelationships: Array<{
      faction1: string
      faction2: string
      relationship: string
      status: string
    }>
  }

  /** Additional context based on type */
  additionalContext: Record<string, any>
}

export type ContextType =
  | "session-start"
  | "scene-change"
  | "combat"
  | "dialogue"
  | "exploration"
  | "plot-advancement"
  | "general-query"
  | "character-focus"
  | "location-focus"
  | "faction-focus"

// =====================================================
// MEMORY MANAGER INTERFACES
// =====================================================

export interface MemoryManager {
  /** Current session state */
  currentSession: SessionState

  /** Update session state */
  updateSessionState: (updates: Partial<SessionState>) => void

  /** Generate context packet for AI */
  generateContextPacket: (
    contextType: ContextType,
    focus?: string,
    options?: ContextOptions
  ) => Promise<ContextPacket>

  /** Track session events */
  trackEvent: (event: SessionEvent) => void

  /** Get relevant memories */
  getRelevantMemories: (query: string, limit?: number) => Promise<MemoryItem[]>

  /** Clear session state */
  clearSession: () => void

  /** Export session data */
  exportSession: () => SessionExport
}

export interface ContextOptions {
  includeHistory?: boolean
  historyDepth?: number
  includeRelationships?: boolean
  includeDetailedStats?: boolean
  customFilters?: Record<string, any>
  maxSize?: number
}

export interface SessionEvent {
  id: string
  timestamp: string
  type: SessionEventType
  description: string
  entities: string[]
  location?: string
  importance: number // 1-10 scale
  metadata?: Record<string, any>
}

export type SessionEventType =
  | "character-action"
  | "dialogue"
  | "combat-start"
  | "combat-end"
  | "location-change"
  | "plot-advancement"
  | "item-found"
  | "quest-start"
  | "quest-complete"
  | "relationship-change"
  | "faction-event"
  | "world-event"
  | "custom"

export interface MemoryItem {
  id: string
  timestamp: string
  content: string
  type: string
  relevanceScore: number
  entities: string[]
  location?: string
  sessionId?: string
}

export interface SessionExport {
  sessionState: SessionState
  events: SessionEvent[]
  memories: MemoryItem[]
  contextPackets: ContextPacket[]
  metadata: {
    exportDate: string
    sessionDuration: number
    totalEvents: number
    totalMemories: number
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function createDefaultSessionState(): SessionState {
  return {
    sessionInfo: {
      sessionId: `session-${Date.now()}`,
      sessionDate: new Date().toISOString(),
      gameDate: "",
      sessionNumber: 1,
      isActive: false
    },
    activeEntities: {
      characters: [],
      npcs: [],
      minorNPCs: [],
      factions: []
    },
    currentContext: {},
    activePlots: {
      activeSubplots: [],
      recentEvents: [],
      pendingEvents: []
    },
    recentHistory: {
      lastActions: [],
      keyDecisions: [],
      importantDialogue: [],
      combatEvents: []
    },
    aiContext: {
      memoryDepth: 10,
      relevanceThreshold: 3,
      maxContextSize: 2000,
      preferredDetails: ["location", "characters", "objectives"]
    }
  }
}

export function calculateRelevanceScore(
  item: any,
  context: SessionState,
  query?: string
): number {
  let score = 0

  // Base relevance for active entities
  if (context.activeEntities.characters.some(c => c.id === item.id)) score += 5
  if (context.activeEntities.npcs.some(n => n.id === item.id)) score += 4

  // Location relevance
  if (item.location === context.currentContext.location?.name) score += 3
  if (context.currentContext.secondaryLocations?.includes(item.location))
    score += 2

  // Time relevance (more recent = higher score)
  if (item.timestamp) {
    const hoursSince =
      (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60)
    if (hoursSince < 1) score += 3
    else if (hoursSince < 6) score += 2
    else if (hoursSince < 24) score += 1
  }

  // Query relevance (if provided)
  if (query && item.name?.toLowerCase().includes(query.toLowerCase()))
    score += 2
  if (query && item.description?.toLowerCase().includes(query.toLowerCase()))
    score += 1

  return score
}

export function filterByRelevance<T>(
  items: T[],
  context: SessionState,
  minScore: number = 3,
  maxItems: number = 20
): T[] {
  return items
    .map(item => ({
      item,
      score: calculateRelevanceScore(item, context)
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(({ item }) => item)
}
