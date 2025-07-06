/**
 * Enhanced Campaign Data View Component
 *
 * Provides advanced search, filtering, and contextual loading for campaign data
 */

"use client"

import React, { useState, useEffect, useCallback } from "react"
import { GameTimeData } from "@/types/game-time"
import { useCampaignData } from "@/context/campaign-data-context"
import { useSessionState } from "@/context/session-state-context"
import {
  createLoadingContext,
  createSearchQuery
} from "@/lib/campaign-data/retrieval"
import {
  CharacterProfile,
  KeyNPC,
  MinorNPC,
  Faction,
  Location,
  PlotLine,
  SessionLog,
  TimelineEvent
} from "@/types/enhanced-campaign-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  IconUsers,
  IconUser,
  IconFlag,
  IconMap,
  IconBook,
  IconClock,
  IconNotes,
  IconSettings,
  IconDatabase,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerStop,
  IconBrain,
  IconHistory
} from "@tabler/icons-react"
import { CampaignDataEditor } from "./campaign-data-editor"
import { BatchOperations } from "./batch-operations"

interface CampaignDataViewProps {
  gameTimeData: GameTimeData | null
}

export function CampaignDataView({ gameTimeData }: CampaignDataViewProps) {
  const {
    searchCampaignData,
    loadContextualCharacters,
    loadContextualNPCs,
    loadContextualLocations,
    loadActivePlotlines,
    getRecentTimelineEvents,
    isLoading,
    currentContext,
    setCurrentContext
  } = useCampaignData()

  const {
    sessionState,
    startSession,
    endSession,
    isSessionActive,
    generateContext,
    addCharacterToSession,
    setCurrentLocation,
    trackAction,
    getRecentEvents,
    getAIContext,
    getPrioritizedContext,
    getRelevantEntitiesWithScores,
    updateRelevanceSettings,
    calculateEntityRelevance
  } = useSessionState()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{
    characters: CharacterProfile[]
    npcs: KeyNPC[]
    locations: Location[]
    plotlines: PlotLine[]
    sessions: SessionLog[]
    total: number
  }>({
    characters: [],
    npcs: [],
    locations: [],
    plotlines: [],
    sessions: [],
    total: 0
  })

  // Filter state
  const [locationFilter, setLocationFilter] = useState<string>("__all__")
  const [activeTab, setActiveTab] = useState("overview")

  // Contextual data
  const [contextualData, setContextualData] = useState<{
    characters: CharacterProfile[]
    npcs: { keyNPCs: KeyNPC[]; minorNPCs: MinorNPC[]; factions: Faction[] }
    locations: Location[]
    plotlines: { mainPlotline: PlotLine | null; activeSubplots: PlotLine[] }
    recentEvents: TimelineEvent[]
  }>({
    characters: [],
    npcs: { keyNPCs: [], minorNPCs: [], factions: [] },
    locations: [],
    plotlines: { mainPlotline: null, activeSubplots: [] },
    recentEvents: []
  })

  // Available locations for filtering
  const [availableLocations, setAvailableLocations] = useState<string[]>([])

  // Load contextual data when context changes
  const loadContextualData = useCallback(async () => {
    if (!gameTimeData?.enhancedData) return

    try {
      const context = createLoadingContext({
        currentLocation:
          locationFilter === "__all__" ? undefined : locationFilter,
        maxResults: 20,
        relevanceThreshold: 3
      })

      const [characters, npcs, locations, plotlines, recentEvents] =
        await Promise.all([
          loadContextualCharacters(context),
          loadContextualNPCs(context),
          loadContextualLocations(context),
          loadActivePlotlines(context),
          getRecentTimelineEvents(30, { limit: 10 })
        ])

      setContextualData({
        characters,
        npcs,
        locations,
        plotlines,
        recentEvents
      })
    } catch (error) {
      console.error("Error loading contextual data:", error)
    }
  }, [
    gameTimeData?.enhancedData,
    locationFilter,
    loadContextualCharacters,
    loadContextualNPCs,
    loadContextualLocations,
    loadActivePlotlines,
    getRecentTimelineEvents
  ])

  // Extract available locations
  useEffect(() => {
    if (gameTimeData?.enhancedData?.worldState?.locations) {
      const locations = gameTimeData.enhancedData.worldState.locations.map(
        loc => loc.name
      )
      setAvailableLocations(locations)
    }
  }, [gameTimeData?.enhancedData?.worldState?.locations])

  // Load data when component mounts or dependencies change
  useEffect(() => {
    loadContextualData()
  }, [loadContextualData])

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults({
        characters: [],
        npcs: [],
        locations: [],
        plotlines: [],
        sessions: [],
        total: 0
      })
      return
    }

    try {
      const query = createSearchQuery({
        text: searchQuery,
        location: locationFilter === "__all__" ? undefined : locationFilter
      })

      const results = await searchCampaignData(query, { limit: 50 })
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching campaign data:", error)
    }
  }, [searchQuery, locationFilter, searchCampaignData])

  // Handle filter changes
  const handleLocationFilterChange = (value: string) => {
    setLocationFilter(value)
    setCurrentContext({
      ...currentContext,
      currentLocation: value === "__all__" ? undefined : value
    })
  }

  // Auto-search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch()
      } else {
        setSearchResults({
          characters: [],
          npcs: [],
          locations: [],
          plotlines: [],
          sessions: [],
          total: 0
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  if (!gameTimeData) {
    return (
      <div className="py-8 text-center">
        <IconDatabase className="text-muted-foreground mx-auto size-12" />
        <h3 className="mt-2 text-sm font-medium">No Campaign Data</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Create or load a campaign to view detailed data
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSearch className="size-4" />
            Campaign Data Explorer
          </CardTitle>
          <CardDescription>
            Search and filter your campaign data with contextual relevance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Campaign Data</Label>
              <Input
                id="search"
                placeholder="Search characters, NPCs, locations, plots..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="location-filter">Filter by Location</Label>
              <Select
                value={locationFilter}
                onValueChange={handleLocationFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Locations</SelectItem>
                  {availableLocations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadContextualData} variant="outline" size="sm">
                <IconRefresh className="mr-2 size-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session State Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBrain className="size-4" />
            Session Management & AI Context
          </CardTitle>
          <CardDescription>
            Manage current session state and generate AI context packets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={isSessionActive ? "default" : "secondary"}>
                {isSessionActive ? "Session Active" : "Session Inactive"}
              </Badge>
              {isSessionActive && (
                <span className="text-muted-foreground text-sm">
                  Session #{sessionState.sessionInfo.sessionNumber}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {!isSessionActive ? (
                <Button
                  onClick={() =>
                    startSession(
                      gameTimeData?.currentDate || new Date().toISOString()
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  <IconPlayerPlay className="mr-2 size-4" />
                  Start Session
                </Button>
              ) : (
                <Button onClick={endSession} size="sm" variant="outline">
                  <IconPlayerStop className="mr-2 size-4" />
                  End Session
                </Button>
              )}

              <Button
                onClick={async () => {
                  const context = await getAIContext()
                  navigator.clipboard.writeText(context)
                  // Could add toast notification here
                }}
                size="sm"
                variant="outline"
              >
                <IconBrain className="mr-2 size-4" />
                Copy AI Context
              </Button>
            </div>
          </div>

          {isSessionActive && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-sm">
                <Label className="text-muted-foreground text-xs">
                  Active Characters
                </Label>
                <div className="mt-1">
                  {sessionState.activeEntities.characters.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {sessionState.activeEntities.characters.map(char => (
                        <Badge
                          key={char.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {char.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <Label className="text-muted-foreground text-xs">
                  Current Location
                </Label>
                <div className="mt-1">
                  {sessionState.currentContext.location ? (
                    <Badge variant="secondary" className="text-xs">
                      {sessionState.currentContext.location.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <Label className="text-muted-foreground text-xs">
                  Recent Events
                </Label>
                <div className="mt-1">
                  <span className="text-muted-foreground">
                    {getRecentEvents(5).length} events
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
          <TabsTrigger value="world">World</TabsTrigger>
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="ai-context">AI Context</TabsTrigger>
          <TabsTrigger value="relevance">Relevance</TabsTrigger>
          <TabsTrigger value="search">Search Results</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Contextual Summary */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUsers className="size-4" />
                  Active Characters
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contextualData.characters.length > 0 ? (
                  <div className="space-y-2">
                    {contextualData.characters.slice(0, 3).map(character => (
                      <div
                        key={character.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">
                          {character.name}
                        </span>
                        <Badge variant="outline">
                          {character.currentLocation}
                        </Badge>
                      </div>
                    ))}
                    {contextualData.characters.length > 3 && (
                      <p className="text-muted-foreground text-xs">
                        +{contextualData.characters.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No active characters
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUser className="size-4" />
                  Key NPCs Nearby
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contextualData.npcs.keyNPCs.length > 0 ? (
                  <div className="space-y-2">
                    {contextualData.npcs.keyNPCs.slice(0, 3).map(npc => (
                      <div
                        key={npc.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">{npc.name}</span>
                        <Badge variant="secondary">{npc.importanceLevel}</Badge>
                      </div>
                    ))}
                    {contextualData.npcs.keyNPCs.length > 3 && (
                      <p className="text-muted-foreground text-xs">
                        +{contextualData.npcs.keyNPCs.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No key NPCs nearby
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBook className="size-4" />
                  Active Plotlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contextualData.plotlines.activeSubplots.length > 0 ? (
                  <div className="space-y-2">
                    {contextualData.plotlines.activeSubplots
                      .slice(0, 3)
                      .map(plot => (
                        <div
                          key={plot.id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">
                            {plot.name}
                          </span>
                          <Badge variant="outline">{plot.status}</Badge>
                        </div>
                      ))}
                    {contextualData.plotlines.activeSubplots.length > 3 && (
                      <p className="text-muted-foreground text-xs">
                        +{contextualData.plotlines.activeSubplots.length - 3}{" "}
                        more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No active subplots
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconClock className="size-4" />
                  Recent Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contextualData.recentEvents.length > 0 ? (
                  <div className="space-y-2">
                    {contextualData.recentEvents.slice(0, 3).map(event => (
                      <div key={event.id} className="space-y-1">
                        <span className="text-sm font-medium">
                          {event.name}
                        </span>
                        <p className="text-muted-foreground text-xs">
                          {event.date}
                        </p>
                      </div>
                    ))}
                    {contextualData.recentEvents.length > 3 && (
                      <p className="text-muted-foreground text-xs">
                        +{contextualData.recentEvents.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No recent events
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Characters Tab */}
        <TabsContent value="characters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Characters</CardTitle>
              <CardDescription>
                {locationFilter !== "__all__"
                  ? `Characters in ${locationFilter}`
                  : "All player characters"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contextualData.characters.length > 0 ? (
                <div className="grid gap-4">
                  {contextualData.characters.map(character => (
                    <Card key={character.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-medium">{character.name}</h4>
                          <p className="text-muted-foreground text-sm">
                            {character.role} • Level {character.level}
                          </p>
                          <p className="text-sm">{character.background}</p>
                        </div>
                        <Badge variant="secondary">
                          {character.currentLocation}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <IconUsers className="text-muted-foreground mx-auto size-12" />
                  <h3 className="mt-2 text-sm font-medium">
                    {locationFilter !== "__all__"
                      ? "No Characters in Location"
                      : "No Character Profiles"}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {locationFilter !== "__all__"
                      ? `No characters found in ${locationFilter}`
                      : "Character profiles will appear here as they are created"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Results Tab */}
        <TabsContent value="search" className="space-y-4">
          {searchQuery ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Search Results for &quot;{searchQuery}&quot;
                </h3>
                <Badge variant="outline">{searchResults.total} results</Badge>
              </div>

              {searchResults.total > 0 ? (
                <div className="space-y-4">
                  {searchResults.characters.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Characters ({searchResults.characters.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {searchResults.characters.map(character => (
                            <div
                              key={character.id}
                              className="flex items-center justify-between rounded border p-2"
                            >
                              <span className="font-medium">
                                {character.name}
                              </span>
                              <Badge variant="outline">
                                {character.currentLocation}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {searchResults.npcs.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          NPCs ({searchResults.npcs.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {searchResults.npcs.map(npc => (
                            <div
                              key={npc.id}
                              className="flex items-center justify-between rounded border p-2"
                            >
                              <span className="font-medium">{npc.name}</span>
                              <Badge variant="secondary">
                                {npc.importanceLevel}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {searchResults.locations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Locations ({searchResults.locations.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {searchResults.locations.map(location => (
                            <div
                              key={location.id}
                              className="flex items-center justify-between rounded border p-2"
                            >
                              <span className="font-medium">
                                {location.name}
                              </span>
                              <Badge variant="outline">{location.type}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <IconSearch className="text-muted-foreground mx-auto size-12" />
                  <h3 className="mt-2 text-sm font-medium">No Results Found</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <IconSearch className="text-muted-foreground mx-auto size-12" />
              <h3 className="mt-2 text-sm font-medium">Enter Search Terms</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Search for characters, NPCs, locations, plots, and more
              </p>
            </div>
          )}
        </TabsContent>

        {/* AI Context Tab */}
        <TabsContent value="ai-context" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBrain className="size-4" />
                AI Context Generation
              </CardTitle>
              <CardDescription>
                Generate contextual information packets for AI interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button
                    onClick={async () => {
                      const context = await generateContext("session-start")
                      console.log("Session Start Context:", context)
                    }}
                    variant="outline"
                  >
                    <IconPlayerPlay className="mr-2 size-4" />
                    Generate Session Start Context
                  </Button>

                  <Button
                    onClick={async () => {
                      const context = await generateContext("dialogue")
                      console.log("Dialogue Context:", context)
                    }}
                    variant="outline"
                  >
                    <IconUsers className="mr-2 size-4" />
                    Generate Dialogue Context
                  </Button>

                  <Button
                    onClick={async () => {
                      const context = await generateContext("exploration")
                      console.log("Exploration Context:", context)
                    }}
                    variant="outline"
                  >
                    <IconMap className="mr-2 size-4" />
                    Generate Exploration Context
                  </Button>

                  <Button
                    onClick={async () => {
                      const context = await generateContext("combat")
                      console.log("Combat Context:", context)
                    }}
                    variant="outline"
                  >
                    <IconFlag className="mr-2 size-4" />
                    Generate Combat Context
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Recent Session Events</Label>
                  <div className="rounded border p-3">
                    {isSessionActive ? (
                      <div className="space-y-2">
                        {getRecentEvents(5).map(event => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{event.description}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                        ))}
                        {getRecentEvents(5).length === 0 && (
                          <p className="text-muted-foreground text-sm">
                            No recent events
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Start a session to track events
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current AI Context Summary</Label>
                  <div className="bg-muted/50 rounded border p-3">
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Active Characters:</strong>{" "}
                        {sessionState.activeEntities.characters
                          .map(c => c.name)
                          .join(", ") || "None"}
                      </p>
                      <p>
                        <strong>Current Location:</strong>{" "}
                        {sessionState.currentContext.location?.name ||
                          "Not set"}
                      </p>
                      <p>
                        <strong>Session Active:</strong>{" "}
                        {isSessionActive ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Recent Events:</strong>{" "}
                        {getRecentEvents(3).length} events
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relevance Tab */}
        <TabsContent value="relevance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFilter className="size-4" />
                Relevance Settings & Filtering
              </CardTitle>
              <CardDescription>
                Configure how the AI prioritizes and filters campaign data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Relevance Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    AI Context Preferences
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="relevance-threshold">
                        Relevance Threshold (
                        {sessionState.aiContext.relevanceThreshold}/10)
                      </Label>
                      <Input
                        id="relevance-threshold"
                        type="range"
                        min="1"
                        max="10"
                        value={sessionState.aiContext.relevanceThreshold}
                        onChange={e =>
                          updateRelevanceSettings({
                            relevanceThreshold: parseInt(e.target.value)
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        Higher values show only the most relevant information
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="memory-depth">
                        Memory Depth ({sessionState.aiContext.memoryDepth}{" "}
                        events)
                      </Label>
                      <Input
                        id="memory-depth"
                        type="range"
                        min="5"
                        max="50"
                        value={sessionState.aiContext.memoryDepth}
                        onChange={e =>
                          updateRelevanceSettings({
                            memoryDepth: parseInt(e.target.value)
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        How many past events to remember
                      </p>
                    </div>
                  </div>
                </div>

                {/* Priority Breakdown */}
                {isSessionActive && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      Current Priority Breakdown
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const prioritized =
                          getPrioritizedContext("general-query")
                        return (
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                            <div className="rounded border p-3">
                              <div className="text-sm font-medium text-red-600">
                                Critical
                              </div>
                              <div className="text-2xl font-bold">
                                {prioritized.critical.length}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Must include
                              </div>
                            </div>
                            <div className="rounded border p-3">
                              <div className="text-sm font-medium text-orange-600">
                                High
                              </div>
                              <div className="text-2xl font-bold">
                                {prioritized.high.length}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Should include
                              </div>
                            </div>
                            <div className="rounded border p-3">
                              <div className="text-sm font-medium text-yellow-600">
                                Medium
                              </div>
                              <div className="text-2xl font-bold">
                                {prioritized.medium.length}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Include if space
                              </div>
                            </div>
                            <div className="rounded border p-3">
                              <div className="text-sm font-medium text-gray-600">
                                Low/Background
                              </div>
                              <div className="text-2xl font-bold">
                                {prioritized.low.length +
                                  prioritized.excluded.length}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Background only
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* Entity Relevance Examples */}
                {isSessionActive && contextualData.characters.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      Sample Entity Relevance Scores
                    </h4>
                    <div className="space-y-2">
                      {contextualData.characters.slice(0, 3).map(character => {
                        const relevance = calculateEntityRelevance(
                          character,
                          "general-query"
                        )
                        return (
                          <div
                            key={character.id}
                            className="flex items-center justify-between rounded border p-2"
                          >
                            <div>
                              <span className="font-medium">
                                {character.name}
                              </span>
                              <div className="text-muted-foreground text-xs">
                                {relevance.reasons.slice(0, 2).join(", ")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  relevance.priority === "critical"
                                    ? "destructive"
                                    : relevance.priority === "high"
                                      ? "default"
                                      : relevance.priority === "medium"
                                        ? "secondary"
                                        : "outline"
                                }
                              >
                                {relevance.priority}
                              </Badge>
                              <span className="font-mono text-sm">
                                {relevance.score.toFixed(1)}/10
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {!isSessionActive && (
                  <div className="py-8 text-center">
                    <IconFilter className="text-muted-foreground mx-auto size-12" />
                    <h3 className="mt-2 text-sm font-medium">
                      Start a Session
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Start a session to see relevance scoring and filtering in
                      action
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="management" className="space-y-4">
          <CampaignDataEditor onDataChange={loadContextualData} />
          <BatchOperations onDataChange={loadContextualData} />
        </TabsContent>

        {/* AI Context Tab */}
        <TabsContent value="ai-context" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBrain className="size-4" />
                AI Context Generation
              </CardTitle>
              <CardDescription>
                Generate contextual information packets for AI interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button
                    onClick={async () => {
                      const context = await generateContext("session-start")
                      console.log("Session Start Context:", context)
                    }}
                    variant="outline"
                  >
                    <IconPlayerPlay className="mr-2 size-4" />
                    Generate Session Start Context
                  </Button>

                  <Button
                    onClick={async () => {
                      const context = await generateContext("dialogue")
                      console.log("Dialogue Context:", context)
                    }}
                    variant="outline"
                  >
                    <IconUsers className="mr-2 size-4" />
                    Generate Dialogue Context
                  </Button>

                  <Button
                    onClick={async () => {
                      const context = await generateContext("exploration")
                      console.log("Exploration Context:", context)
                    }}
                    variant="outline"
                  >
                    <IconMap className="mr-2 size-4" />
                    Generate Exploration Context
                  </Button>

                  <Button
                    onClick={async () => {
                      const context = await generateContext("combat")
                      console.log("Combat Context:", context)
                    }}
                    variant="outline"
                  >
                    <IconFlag className="mr-2 size-4" />
                    Generate Combat Context
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Recent Session Events</Label>
                  <div className="rounded border p-3">
                    {isSessionActive ? (
                      <div className="space-y-2">
                        {getRecentEvents(5).map(event => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{event.description}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                        ))}
                        {getRecentEvents(5).length === 0 && (
                          <p className="text-muted-foreground text-sm">
                            No recent events
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Start a session to track events
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current AI Context Summary</Label>
                  <div className="bg-muted/50 rounded border p-3">
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Active Characters:</strong>{" "}
                        {sessionState.activeEntities.characters
                          .map(c => c.name)
                          .join(", ") || "None"}
                      </p>
                      <p>
                        <strong>Current Location:</strong>{" "}
                        {sessionState.currentContext.location?.name ||
                          "Not set"}
                      </p>
                      <p>
                        <strong>Session Active:</strong>{" "}
                        {isSessionActive ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Recent Events:</strong>{" "}
                        {getRecentEvents(3).length} events
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relevance Tab */}
        <TabsContent value="relevance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFilter className="size-4" />
                Relevance Settings & Filtering
              </CardTitle>
              <CardDescription>
                Configure how the AI prioritizes and filters campaign data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Relevance Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    AI Context Preferences
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="relevance-threshold">
                        Relevance Threshold (
                        {sessionState.aiContext.relevanceThreshold}/10)
                      </Label>
                      <Input
                        id="relevance-threshold"
                        type="range"
                        min="1"
                        max="10"
                        value={sessionState.aiContext.relevanceThreshold}
                        onChange={e =>
                          updateRelevanceSettings({
                            relevanceThreshold: parseInt(e.target.value)
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        Higher values show only the most relevant information
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="memory-depth">
                        Memory Depth ({sessionState.aiContext.memoryDepth}{" "}
                        events)
                      </Label>
                      <Input
                        id="memory-depth"
                        type="range"
                        min="5"
                        max="50"
                        value={sessionState.aiContext.memoryDepth}
                        onChange={e =>
                          updateRelevanceSettings({
                            memoryDepth: parseInt(e.target.value)
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        How many past events to remember
                      </p>
                    </div>
                  </div>
                </div>

                {/* Priority Breakdown */}
                {isSessionActive && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      Current Priority Breakdown
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const prioritized =
                          getPrioritizedContext("general-query")
                        return (
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                            <div className="rounded border p-3">
                              <div className="text-sm font-medium text-red-600">
                                Critical
                              </div>
                              <div className="text-2xl font-bold">
                                {prioritized.critical.length}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Must include
                              </div>
                            </div>
                            <div className="rounded border p-3">
                              <div className="text-sm font-medium text-orange-600">
                                High
                              </div>
                              <div className="text-2xl font-bold">
                                {prioritized.high.length}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Should include
                              </div>
                            </div>
                            <div className="rounded border p-3">
                              <div className="text-sm font-medium text-yellow-600">
                                Medium
                              </div>
                              <div className="text-2xl font-bold">
                                {prioritized.medium.length}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Include if space
                              </div>
                            </div>
                            <div className="rounded border p-3">
                              <div className="text-sm font-medium text-gray-600">
                                Low/Background
                              </div>
                              <div className="text-2xl font-bold">
                                {prioritized.low.length +
                                  prioritized.excluded.length}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Background only
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* Entity Relevance Examples */}
                {isSessionActive && contextualData.characters.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      Sample Entity Relevance Scores
                    </h4>
                    <div className="space-y-2">
                      {contextualData.characters.slice(0, 3).map(character => {
                        const relevance = calculateEntityRelevance(
                          character,
                          "general-query"
                        )
                        return (
                          <div
                            key={character.id}
                            className="flex items-center justify-between rounded border p-2"
                          >
                            <div>
                              <span className="font-medium">
                                {character.name}
                              </span>
                              <div className="text-muted-foreground text-xs">
                                {relevance.reasons.slice(0, 2).join(", ")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  relevance.priority === "critical"
                                    ? "destructive"
                                    : relevance.priority === "high"
                                      ? "default"
                                      : relevance.priority === "medium"
                                        ? "secondary"
                                        : "outline"
                                }
                              >
                                {relevance.priority}
                              </Badge>
                              <span className="font-mono text-sm">
                                {relevance.score.toFixed(1)}/10
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {!isSessionActive && (
                  <div className="py-8 text-center">
                    <IconFilter className="text-muted-foreground mx-auto size-12" />
                    <h3 className="mt-2 text-sm font-medium">
                      Start a Session
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Start a session to see relevance scoring and filtering in
                      action
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add other tabs as needed - NPCs, World, etc. */}
        {/* For brevity, using the existing static content structure */}
      </Tabs>

      {isLoading && (
        <div className="py-4 text-center">
          <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
            <IconRefresh className="size-4 animate-spin" />
            Loading campaign data...
          </div>
        </div>
      )}
    </div>
  )
}
