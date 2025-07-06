// Event-Driven Campaign Updates System
// Provides automated campaign state updates based on events and triggers

import {
  EnhancedCampaignData,
  KeyNPC,
  PlotLine,
  TimelineEvent
} from "@/types/enhanced-campaign-data"
import { SessionState } from "@/types/session-state"

// Types for event-driven updates
export interface CampaignEvent {
  id: string
  type: string
  timestamp: string
  data: any
  source: "user" | "ai" | "system"
  priority: "low" | "medium" | "high"
  processed: boolean
}

export interface EventTrigger {
  id: string
  name: string
  description: string

  // Trigger conditions
  eventTypes: string[]
  entityTypes: string[]
  conditions: EventCondition[]

  // Actions to execute
  actions: EventAction[]

  // Metadata
  enabled: boolean
  priority: number
  cooldownMinutes?: number
  lastTriggered?: string
}

export interface EventCondition {
  type: "entity_property" | "session_state" | "time_based" | "complex"
  target: string
  operator: "equals" | "contains" | "greater_than" | "less_than" | "changed"
  value: any
  negate?: boolean
}

export interface EventAction {
  type:
    | "update_entity"
    | "create_event"
    | "modify_relationship"
    | "trigger_dialogue"
    | "advance_plot"
  target: string
  changes: any
  conditions?: EventCondition[]
}

export interface EventDrivenConfig {
  enableAutomaticUpdates: boolean
  updateFrequency: "immediate" | "batched" | "session_end"
  batchSize: number
  maxEventsPerSession: number
  enableLogging: boolean
}

// Simple event processing system
export class EventTriggerSystem {
  private config: EventDrivenConfig
  private eventQueue: CampaignEvent[] = []
  private triggers: Map<string, EventTrigger> = new Map()

  constructor(config: Partial<EventDrivenConfig> = {}) {
    this.config = {
      enableAutomaticUpdates: true,
      updateFrequency: "immediate",
      batchSize: 10,
      maxEventsPerSession: 100,
      enableLogging: false,
      ...config
    }

    this.initializeDefaultTriggers()
  }

  // Register a new trigger
  registerTrigger(trigger: EventTrigger): void {
    this.triggers.set(trigger.id, trigger)
  }

  // Queue an event for processing
  queueEvent(event: CampaignEvent): void {
    if (this.eventQueue.length >= this.config.maxEventsPerSession) {
      return
    }

    this.eventQueue.push(event)
  }

  // Process all queued events and return updated campaign data
  async processEvents(
    campaignData: EnhancedCampaignData,
    sessionState: SessionState
  ): Promise<EnhancedCampaignData> {
    if (!this.config.enableAutomaticUpdates || this.eventQueue.length === 0) {
      return campaignData
    }

    let updatedCampaignData = { ...campaignData }

    // Process each event in the queue
    for (const event of this.eventQueue) {
      updatedCampaignData = await this.processEvent(
        event,
        updatedCampaignData,
        sessionState
      )
    }

    // Clear the queue after processing
    this.eventQueue = []

    return updatedCampaignData
  }

  // Process a single event
  private async processEvent(
    event: CampaignEvent,
    campaignData: EnhancedCampaignData,
    sessionState: SessionState
  ): Promise<EnhancedCampaignData> {
    const matchingTriggers = this.findMatchingTriggers(event)
    let updatedData = { ...campaignData }

    for (const trigger of matchingTriggers) {
      if (this.shouldTrigger(trigger, event, sessionState)) {
        updatedData = await this.executeTrigger(
          trigger,
          event,
          updatedData,
          sessionState
        )
      }
    }

    return updatedData
  }

  // Find triggers that match the event
  private findMatchingTriggers(event: CampaignEvent): EventTrigger[] {
    const matching: EventTrigger[] = []

    for (const trigger of this.triggers.values()) {
      if (!trigger.enabled) continue

      if (
        trigger.eventTypes.includes(event.type) ||
        trigger.eventTypes.includes("*")
      ) {
        matching.push(trigger)
      }
    }

    return matching.sort((a, b) => b.priority - a.priority)
  }

  // Check if trigger should fire
  private shouldTrigger(
    trigger: EventTrigger,
    event: CampaignEvent,
    sessionState: SessionState
  ): boolean {
    // Check cooldown
    if (trigger.cooldownMinutes && trigger.lastTriggered) {
      const lastTriggered = new Date(trigger.lastTriggered)
      const now = new Date()
      const minutesSince =
        (now.getTime() - lastTriggered.getTime()) / (1000 * 60)

      if (minutesSince < trigger.cooldownMinutes) {
        return false
      }
    }

    // Check conditions
    for (const condition of trigger.conditions) {
      if (!this.evaluateCondition(condition, event, sessionState)) {
        return false
      }
    }

    return true
  }

  // Execute a trigger's actions
  private async executeTrigger(
    trigger: EventTrigger,
    event: CampaignEvent,
    campaignData: EnhancedCampaignData,
    sessionState: SessionState
  ): Promise<EnhancedCampaignData> {
    let updatedData = { ...campaignData }

    for (const action of trigger.actions) {
      updatedData = await this.executeAction(
        action,
        event,
        updatedData,
        sessionState
      )
    }

    // Update trigger last triggered time
    trigger.lastTriggered = new Date().toISOString()

    return updatedData
  }

  // Execute a specific action
  private async executeAction(
    action: EventAction,
    event: CampaignEvent,
    campaignData: EnhancedCampaignData,
    sessionState: SessionState
  ): Promise<EnhancedCampaignData> {
    const updatedData = { ...campaignData }

    switch (action.type) {
      case "update_entity":
        return this.updateEntity(action.target, action.changes, updatedData)

      case "advance_plot":
        return this.advancePlot(action.target, action.changes, updatedData)

      case "create_event":
        return this.createTimelineEvent(action.changes, updatedData)

      default:
        return updatedData
    }
  }

  // Update an entity
  private updateEntity(
    entityId: string,
    changes: any,
    campaignData: EnhancedCampaignData
  ): EnhancedCampaignData {
    const updatedData = { ...campaignData }

    // Update NPCs
    if (updatedData.npcDatabase?.keyNPCs) {
      const npcIndex = updatedData.npcDatabase.keyNPCs.findIndex(
        (npc: KeyNPC) => npc.id === entityId
      )
      if (npcIndex !== -1) {
        updatedData.npcDatabase.keyNPCs[npcIndex] = {
          ...updatedData.npcDatabase.keyNPCs[npcIndex],
          ...changes
        }
      }
    }

    return updatedData
  }

  // Advance a plot
  private advancePlot(
    plotId: string,
    changes: any,
    campaignData: EnhancedCampaignData
  ): EnhancedCampaignData {
    const updatedData = { ...campaignData }

    // Update main plotline
    if (updatedData.campaignProgression?.mainPlotline?.id === plotId) {
      const plot = updatedData.campaignProgression.mainPlotline
      if (changes.advance && plot.currentAct < plot.acts.length - 1) {
        plot.currentAct += 1
        plot.status = "active"
      }
    }

    return updatedData
  }

  // Create a timeline event
  private createTimelineEvent(
    eventData: any,
    campaignData: EnhancedCampaignData
  ): EnhancedCampaignData {
    const updatedData = { ...campaignData }

    if (!updatedData.campaignProgression) {
      const now = new Date().toISOString()
      updatedData.campaignProgression = {
        id: "default",
        createdAt: now,
        updatedAt: now,
        version: 1,
        mainPlotline: {
          id: "main",
          name: "Main Plot",
          description: "Main storyline",
          type: "main",
          status: "active",
          priority: 10,
          acts: [],
          currentAct: 0,
          relatedPlots: [],
          dependentPlots: [],
          startDate: now,
          keyEvents: [],
          notes: "",
          createdAt: now,
          updatedAt: now,
          version: 1
        },
        subplots: [],
        timeline: [],
        consequences: [],
        milestones: []
      }
    }

    if (!updatedData.campaignProgression.timeline) {
      updatedData.campaignProgression.timeline = []
    }

    const now = new Date().toISOString()
    const newEvent: TimelineEvent = {
      id: `event_${Date.now()}`,
      name: eventData.title || "Auto-generated Event",
      date: now,
      type: eventData.type || "story",
      description:
        eventData.description || "An event occurred during the campaign",
      participants: eventData.participants || [],
      location: eventData.location || "",
      significance: eventData.significance || 1,
      plotRelevance: eventData.plotRelevance || [],
      consequences: eventData.consequences || [],
      createdAt: now,
      updatedAt: now,
      version: 1
    }

    updatedData.campaignProgression.timeline.push(newEvent)

    return updatedData
  }

  // Evaluate a condition
  private evaluateCondition(
    condition: EventCondition,
    event: CampaignEvent,
    sessionState: SessionState
  ): boolean {
    switch (condition.type) {
      case "entity_property":
        return this.evaluateEntityProperty(condition, event)

      case "session_state":
        return this.evaluateSessionState(condition, sessionState)

      case "time_based":
        return this.evaluateTimeCondition(condition)

      default:
        return true
    }
  }

  // Evaluate entity property condition
  private evaluateEntityProperty(
    condition: EventCondition,
    event: CampaignEvent
  ): boolean {
    const value = event.data[condition.target]
    return this.compareValues(value, condition.operator, condition.value)
  }

  // Evaluate session state condition
  private evaluateSessionState(
    condition: EventCondition,
    sessionState: SessionState
  ): boolean {
    const value = this.getNestedProperty(sessionState, condition.target)
    return this.compareValues(value, condition.operator, condition.value)
  }

  // Evaluate time-based condition
  private evaluateTimeCondition(condition: EventCondition): boolean {
    const now = new Date()
    const compareTime = new Date(condition.value)

    switch (condition.operator) {
      case "greater_than":
        return now > compareTime
      case "less_than":
        return now < compareTime
      default:
        return true
    }
  }

  // Compare values based on operator
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case "equals":
        return actual === expected
      case "contains":
        return String(actual).includes(String(expected))
      case "greater_than":
        return actual > expected
      case "less_than":
        return actual < expected
      case "changed":
        return actual !== expected
      default:
        return true
    }
  }

  // Get nested property from object
  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  // Initialize default triggers
  private initializeDefaultTriggers(): void {
    // NPC Status Change Trigger
    this.registerTrigger({
      id: "npc_status_change",
      name: "NPC Status Change",
      description: "Triggers when an NPC status changes",
      eventTypes: ["npc_update"],
      entityTypes: ["npc"],
      conditions: [
        {
          type: "entity_property",
          target: "status",
          operator: "changed",
          value: null
        }
      ],
      actions: [
        {
          type: "create_event",
          target: "timeline",
          changes: {
            type: "character",
            significance: "minor",
            title: "Character Status Change",
            description: "A character's status has changed"
          }
        }
      ],
      enabled: true,
      priority: 5
    })

    // Plot Progress Trigger
    this.registerTrigger({
      id: "plot_progress",
      name: "Plot Progress",
      description: "Triggers when plot progresses",
      eventTypes: ["plot_update"],
      entityTypes: ["plotline"],
      conditions: [],
      actions: [
        {
          type: "create_event",
          target: "timeline",
          changes: {
            type: "story",
            significance: "major",
            title: "Plot Development",
            description: "The main story has progressed"
          }
        }
      ],
      enabled: true,
      priority: 8
    })
  }

  // Get system status
  getStatus(): {
    queuedEvents: number
    registeredTriggers: number
    config: EventDrivenConfig
  } {
    return {
      queuedEvents: this.eventQueue.length,
      registeredTriggers: this.triggers.size,
      config: this.config
    }
  }
}

// Convenience functions

export function createEventTriggerSystem(
  config?: Partial<EventDrivenConfig>
): EventTriggerSystem {
  return new EventTriggerSystem(config)
}

export function createCampaignEvent(
  type: string,
  data: any,
  source: "user" | "ai" | "system" = "system",
  priority: "low" | "medium" | "high" = "medium"
): CampaignEvent {
  return {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    data,
    source,
    priority,
    processed: false
  }
}

export function createEventTrigger(
  id: string,
  name: string,
  eventTypes: string[],
  actions: EventAction[],
  conditions: EventCondition[] = []
): EventTrigger {
  return {
    id,
    name,
    description: `Auto-generated trigger for ${name}`,
    eventTypes,
    entityTypes: ["*"],
    conditions,
    actions,
    enabled: true,
    priority: 5
  }
}
