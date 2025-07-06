/**
 * Session State Context Provider
 *
 * Provides access to session state management and contextual memory
 * throughout the application
 */

"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from "react"
import { useGameTime } from "@/context/game-time-context"
import { SessionStateManager } from "@/lib/session-state/session-manager"
import {
  SessionState,
  ContextPacket,
  ContextType,
  ContextOptions,
  SessionEvent,
  MemoryItem,
  MemoryManager
} from "@/types/session-state"
import {
  CharacterProfile,
  KeyNPC,
  Location,
  EnhancedCampaignData
} from "@/types/enhanced-campaign-data"

interface SessionStateContextType {
  // Core session manager
  sessionManager: MemoryManager

  // Current session state
  sessionState: SessionState

  // Session control
  startSession: (gameDate: string, sessionNumber?: number) => void
  endSession: () => void
  isSessionActive: boolean

  // Context generation
  generateContext: (
    contextType: ContextType,
    focus?: string,
    options?: ContextOptions
  ) => Promise<ContextPacket>

  // Entity management
  addCharacterToSession: (character: CharacterProfile) => void
  addNPCToSession: (npc: KeyNPC) => void
  setCurrentLocation: (location: Location) => void

  // Event tracking
  trackEvent: (event: SessionEvent) => void
  trackAction: (
    description: string,
    entities?: string[],
    importance?: number
  ) => void
  trackDialogue: (dialogue: string, participants?: string[]) => void
  trackCombat: (description: string, combatants?: string[]) => void

  // Memory and context retrieval
  getRelevantMemories: (query: string, limit?: number) => Promise<MemoryItem[]>
  getRecentEvents: (limit?: number) => SessionEvent[]

  // Quick context generators
  generateSessionStartContext: () => Promise<ContextPacket>
  generateCombatContext: (combatants?: string[]) => Promise<ContextPacket>
  generateDialogueContext: (participants?: string[]) => Promise<ContextPacket>
  generateLocationContext: (locationName: string) => Promise<ContextPacket>
  generateCharacterContext: (characterName: string) => Promise<ContextPacket>

  // AI-ready context
  getAIContext: (query?: string) => Promise<string>

  // Session management
  clearSession: () => void
  exportSession: () => void
}

const SessionStateContext = createContext<SessionStateContextType | undefined>(
  undefined
)

export function useSessionState(): SessionStateContextType {
  const context = useContext(SessionStateContext)
  if (!context) {
    throw new Error(
      "useSessionState must be used within a SessionStateProvider"
    )
  }
  return context
}

interface SessionStateProviderProps {
  children: React.ReactNode
}

export function SessionStateProvider({ children }: SessionStateProviderProps) {
  const { gameTimeData } = useGameTime()
  const [sessionManager] = useState(() => new SessionStateManager())
  const [sessionState, setSessionState] = useState<SessionState>(
    () => sessionManager.currentSession
  )

  // Update session state when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionState(sessionManager.currentSession)
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionManager])

  // Update campaign data when game time data changes
  useEffect(() => {
    if (gameTimeData?.enhancedData) {
      sessionManager.setCampaignData(gameTimeData.enhancedData)
    }
  }, [gameTimeData?.enhancedData, sessionManager])

  // Session control functions
  const startSession = useCallback(
    (gameDate: string, sessionNumber?: number) => {
      sessionManager.startSession(gameDate, sessionNumber)
      setSessionState(sessionManager.currentSession)
    },
    [sessionManager]
  )

  const endSession = useCallback(() => {
    sessionManager.endSession()
    setSessionState(sessionManager.currentSession)
  }, [sessionManager])

  const isSessionActive = sessionState.sessionInfo.isActive

  // Context generation
  const generateContext = useCallback(
    async (
      contextType: ContextType,
      focus?: string,
      options?: ContextOptions
    ) => {
      return await sessionManager.generateContextPacket(
        contextType,
        focus,
        options
      )
    },
    [sessionManager]
  )

  // Entity management
  const addCharacterToSession = useCallback(
    (character: CharacterProfile) => {
      sessionManager.addCharacterToSession(character)
      setSessionState(sessionManager.currentSession)
    },
    [sessionManager]
  )

  const addNPCToSession = useCallback(
    (npc: KeyNPC) => {
      const currentNPCs = sessionState.activeEntities.npcs
      if (!currentNPCs.find(n => n.id === npc.id)) {
        sessionManager.updateSessionState({
          activeEntities: {
            ...sessionState.activeEntities,
            npcs: [...currentNPCs, npc]
          }
        })

        sessionManager.trackEvent({
          id: `npc-add-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "custom",
          description: `${npc.name} entered the scene`,
          entities: [npc.name],
          importance: 4
        })
      }
    },
    [sessionManager, sessionState]
  )

  const setCurrentLocation = useCallback(
    (location: Location) => {
      sessionManager.setCurrentLocation(location)
      setSessionState(sessionManager.currentSession)
    },
    [sessionManager]
  )

  // Event tracking
  const trackEvent = useCallback(
    (event: SessionEvent) => {
      sessionManager.trackEvent(event)
      setSessionState(sessionManager.currentSession)
    },
    [sessionManager]
  )

  const trackAction = useCallback(
    (description: string, entities: string[] = [], importance: number = 3) => {
      trackEvent({
        id: `action-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "character-action",
        description,
        entities,
        importance
      })
    },
    [trackEvent]
  )

  const trackDialogue = useCallback(
    (dialogue: string, participants: string[] = []) => {
      trackEvent({
        id: `dialogue-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "dialogue",
        description: dialogue,
        entities: participants,
        importance: 4
      })
    },
    [trackEvent]
  )

  const trackCombat = useCallback(
    (description: string, combatants: string[] = []) => {
      trackEvent({
        id: `combat-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "combat-start",
        description,
        entities: combatants,
        importance: 6
      })
    },
    [trackEvent]
  )

  // Memory and context retrieval
  const getRelevantMemories = useCallback(
    async (query: string, limit?: number) => {
      return await sessionManager.getRelevantMemories(query, limit)
    },
    [sessionManager]
  )

  const getRecentEvents = useCallback(
    (limit: number = 10) => {
      return sessionManager.exportSession().events.slice(-limit)
    },
    [sessionManager]
  )

  // Quick context generators
  const generateSessionStartContext = useCallback(async () => {
    return await generateContext("session-start")
  }, [generateContext])

  const generateCombatContext = useCallback(
    async (combatants?: string[]) => {
      return await generateContext("combat", undefined, {
        customFilters: { combatants }
      })
    },
    [generateContext]
  )

  const generateDialogueContext = useCallback(
    async (participants?: string[]) => {
      return await generateContext("dialogue", undefined, {
        customFilters: { participants }
      })
    },
    [generateContext]
  )

  const generateLocationContext = useCallback(
    async (locationName: string) => {
      return await generateContext("location-focus", locationName)
    },
    [generateContext]
  )

  const generateCharacterContext = useCallback(
    async (characterName: string) => {
      return await generateContext("character-focus", characterName)
    },
    [generateContext]
  )

  // AI-ready context
  const getAIContext = useCallback(
    async (query?: string) => {
      const contextType: ContextType = query ? "general-query" : "session-start"
      const context = await generateContext(contextType, query)

      // Convert context packet to AI-friendly string
      const aiContext = `
**Current Session Context:**
- Location: ${context.coreContext.currentLocation}
- Date: ${context.coreContext.currentDate}
- Active Characters: ${context.coreContext.activeCharacters.join(", ")}
- Current Objectives: ${context.coreContext.currentObjectives.join(", ")}

**Recent Events:**
${context.coreContext.recentEvents.map(event => `- ${event}`).join("\n")}

**Active NPCs:**
${context.relevantEntities.npcs.map(npc => `- ${npc.name} (${npc.importanceLevel})`).join("\n")}

**Plot Status:**
- Main Plot: ${context.plotContext.mainPlotStatus}
- Active Subplots: ${context.plotContext.activeSubplots.map(p => p.name).join(", ")}

**Additional Context:**
${Object.entries(context.additionalContext)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join("\n")}
    `.trim()

      return aiContext
    },
    [generateContext]
  )

  // Session management
  const clearSession = useCallback(() => {
    sessionManager.clearSession()
    setSessionState(sessionManager.currentSession)
  }, [sessionManager])

  const exportSession = useCallback(() => {
    const exported = sessionManager.exportSession()
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `session-${sessionState.sessionInfo.sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [sessionManager, sessionState])

  const value: SessionStateContextType = {
    sessionManager,
    sessionState,
    startSession,
    endSession,
    isSessionActive,
    generateContext,
    addCharacterToSession,
    addNPCToSession,
    setCurrentLocation,
    trackEvent,
    trackAction,
    trackDialogue,
    trackCombat,
    getRelevantMemories,
    getRecentEvents,
    generateSessionStartContext,
    generateCombatContext,
    generateDialogueContext,
    generateLocationContext,
    generateCharacterContext,
    getAIContext,
    clearSession,
    exportSession
  }

  return (
    <SessionStateContext.Provider value={value}>
      {children}
    </SessionStateContext.Provider>
  )
}
