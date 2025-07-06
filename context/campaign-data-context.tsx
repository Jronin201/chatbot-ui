/**
 * Campaign Data Context Provider
 *
 * Provides access to the campaign data retrieval system throughout the application
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
import {
  CampaignDataRetrieval,
  LoadingContext,
  SearchQuery,
  RetrievalOptions
} from "@/lib/campaign-data/retrieval"
import {
  EnhancedCampaignData,
  CharacterProfile,
  KeyNPC,
  MinorNPC,
  Faction,
  Location,
  PlotLine,
  SessionLog,
  TimelineEvent
} from "@/types/enhanced-campaign-data"

interface CampaignDataContextType {
  // Core retrieval instance
  retrieval: CampaignDataRetrieval

  // Loading states
  isLoading: boolean

  // Contextual data loaders
  loadContextualCharacters: (
    context: LoadingContext
  ) => Promise<CharacterProfile[]>
  loadContextualNPCs: (context: LoadingContext) => Promise<{
    keyNPCs: KeyNPC[]
    minorNPCs: MinorNPC[]
    factions: Faction[]
  }>
  loadContextualLocations: (context: LoadingContext) => Promise<Location[]>
  loadActivePlotlines: (context: LoadingContext) => Promise<{
    mainPlotline: PlotLine | null
    activeSubplots: PlotLine[]
  }>

  // Search and filter functions
  searchCampaignData: (
    query: SearchQuery,
    options?: RetrievalOptions
  ) => Promise<{
    characters: CharacterProfile[]
    npcs: KeyNPC[]
    locations: Location[]
    plotlines: PlotLine[]
    sessions: SessionLog[]
    total: number
  }>

  // Quick access functions
  getNPCsByLocation: (
    locationId: string,
    options?: RetrievalOptions
  ) => Promise<{
    keyNPCs: KeyNPC[]
    minorNPCs: MinorNPC[]
  }>
  getActiveSubplots: (options?: RetrievalOptions) => Promise<PlotLine[]>
  getRecentTimelineEvents: (
    days?: number,
    options?: RetrievalOptions
  ) => Promise<TimelineEvent[]>

  // Batch processing
  processBatchUpdates: (
    updates: Array<{
      type: "create" | "update" | "delete"
      module:
        | "characters"
        | "npcs"
        | "world"
        | "progression"
        | "sessions"
        | "mechanics"
      entityId?: string
      data: any
    }>
  ) => Promise<{ success: boolean; results: any[]; errors: string[] }>

  // Cache management
  invalidateCache: () => void

  // Current context
  currentContext: LoadingContext
  setCurrentContext: (context: LoadingContext) => void
}

const CampaignDataContext = createContext<CampaignDataContextType | undefined>(
  undefined
)

interface CampaignDataProviderProps {
  children: React.ReactNode
}

export function CampaignDataProvider({ children }: CampaignDataProviderProps) {
  const { gameTimeData } = useGameTime()
  const [retrieval] = useState(() => new CampaignDataRetrieval())
  const [isLoading, setIsLoading] = useState(false)
  const [currentContext, setCurrentContext] = useState<LoadingContext>({
    relevanceThreshold: 5,
    maxResults: 50
  })

  // Update retrieval system when game time data changes
  useEffect(() => {
    if (gameTimeData?.enhancedData) {
      retrieval.updateCampaignData(gameTimeData.enhancedData)
    }
  }, [gameTimeData?.enhancedData, retrieval])

  // Wrapped methods with loading states
  const loadContextualCharacters = useCallback(
    async (context: LoadingContext) => {
      setIsLoading(true)
      try {
        return await retrieval.loadContextualCharacters(context)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const loadContextualNPCs = useCallback(
    async (context: LoadingContext) => {
      setIsLoading(true)
      try {
        return await retrieval.loadContextualNPCs(context)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const loadContextualLocations = useCallback(
    async (context: LoadingContext) => {
      setIsLoading(true)
      try {
        return await retrieval.loadContextualLocations(context)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const loadActivePlotlines = useCallback(
    async (context: LoadingContext) => {
      setIsLoading(true)
      try {
        return await retrieval.loadActivePlotlines(context)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const searchCampaignData = useCallback(
    async (query: SearchQuery, options?: RetrievalOptions) => {
      setIsLoading(true)
      try {
        return await retrieval.searchCampaignData(query, options)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const getNPCsByLocation = useCallback(
    async (locationId: string, options?: RetrievalOptions) => {
      setIsLoading(true)
      try {
        return await retrieval.getNPCsByLocation(locationId, options)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const getActiveSubplots = useCallback(
    async (options?: RetrievalOptions) => {
      setIsLoading(true)
      try {
        return await retrieval.getActiveSubplots(options)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const getRecentTimelineEvents = useCallback(
    async (days?: number, options?: RetrievalOptions) => {
      setIsLoading(true)
      try {
        return await retrieval.getRecentTimelineEvents(days, options)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const processBatchUpdates = useCallback(
    async (
      updates: Array<{
        type: "create" | "update" | "delete"
        module:
          | "characters"
          | "npcs"
          | "world"
          | "progression"
          | "sessions"
          | "mechanics"
        entityId?: string
        data: any
      }>
    ) => {
      setIsLoading(true)
      try {
        return await retrieval.processBatchUpdates(updates)
      } finally {
        setIsLoading(false)
      }
    },
    [retrieval]
  )

  const invalidateCache = useCallback(() => {
    retrieval.invalidateCache()
  }, [retrieval])

  const contextValue: CampaignDataContextType = {
    retrieval,
    isLoading,
    loadContextualCharacters,
    loadContextualNPCs,
    loadContextualLocations,
    loadActivePlotlines,
    searchCampaignData,
    getNPCsByLocation,
    getActiveSubplots,
    getRecentTimelineEvents,
    processBatchUpdates,
    invalidateCache,
    currentContext,
    setCurrentContext
  }

  return (
    <CampaignDataContext.Provider value={contextValue}>
      {children}
    </CampaignDataContext.Provider>
  )
}

export function useCampaignData(): CampaignDataContextType {
  const context = useContext(CampaignDataContext)
  if (context === undefined) {
    throw new Error(
      "useCampaignData must be used within a CampaignDataProvider"
    )
  }
  return context
}

// Convenience hooks for specific data types
export function useContextualCharacters(context?: LoadingContext) {
  const { loadContextualCharacters, currentContext } = useCampaignData()
  const [characters, setCharacters] = useState<CharacterProfile[]>([])
  const [loading, setLoading] = useState(false)

  const loadCharacters = useCallback(async () => {
    setLoading(true)
    try {
      const result = await loadContextualCharacters(context || currentContext)
      setCharacters(result)
    } finally {
      setLoading(false)
    }
  }, [loadContextualCharacters, context, currentContext])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  return { characters, loading, reload: loadCharacters }
}

export function useContextualNPCs(context?: LoadingContext) {
  const { loadContextualNPCs, currentContext } = useCampaignData()
  const [npcs, setNPCs] = useState<{
    keyNPCs: KeyNPC[]
    minorNPCs: MinorNPC[]
    factions: Faction[]
  }>({ keyNPCs: [], minorNPCs: [], factions: [] })
  const [loading, setLoading] = useState(false)

  const loadNPCs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await loadContextualNPCs(context || currentContext)
      setNPCs(result)
    } finally {
      setLoading(false)
    }
  }, [loadContextualNPCs, context, currentContext])

  useEffect(() => {
    loadNPCs()
  }, [loadNPCs])

  return { npcs, loading, reload: loadNPCs }
}

export function useActivePlotlines(context?: LoadingContext) {
  const { loadActivePlotlines, currentContext } = useCampaignData()
  const [plotlines, setPlotlines] = useState<{
    mainPlotline: PlotLine | null
    activeSubplots: PlotLine[]
  }>({ mainPlotline: null, activeSubplots: [] })
  const [loading, setLoading] = useState(false)

  const loadPlotlines = useCallback(async () => {
    setLoading(true)
    try {
      const result = await loadActivePlotlines(context || currentContext)
      setPlotlines(result)
    } finally {
      setLoading(false)
    }
  }, [loadActivePlotlines, context, currentContext])

  useEffect(() => {
    loadPlotlines()
  }, [loadPlotlines])

  return { plotlines, loading, reload: loadPlotlines }
}
