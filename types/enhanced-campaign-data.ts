/**
 * Enhanced Campaign Data Structures for TTRPG Management
 *
 * This file defines modular data structures for comprehensive campaign management.
 * Each module is designed to be independently manageable while maintaining relationships
 * with other modules when necessary.
 */

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
  version: number
}

// =====================================================
// 1. CHARACTER PROFILES (PCs)
// =====================================================

export interface CharacterProfile extends BaseEntity {
  // Basic Information
  name: string
  playerName: string
  role: string
  background: string
  affiliation: string[]

  // Attributes and Skills
  attributes: Record<string, number>
  skills: Record<string, number>
  specialAbilities: string[]

  // Development Tracking
  level: number
  experience: number
  levelHistory: LevelProgression[]

  // Inventory
  inventory: InventoryItem[]
  currency: Record<string, number>
  assets: Asset[]

  // Relationships
  relationships: Relationship[]

  // Current Status
  currentLocation: string
  currentCondition: string[]
  notes: string
}

export interface LevelProgression {
  level: number
  experienceGained: number
  skillsImproved: string[]
  abilitiesGained: string[]
  date: string
  sessionId: string
}

export interface InventoryItem {
  id: string
  name: string
  type: string
  quantity: number
  description: string
  properties: Record<string, any>
  location: string // "carried", "stored", etc.
}

export interface Asset {
  id: string
  name: string
  type: string
  value: number
  description: string
  location: string
}

export interface Relationship {
  targetId: string
  targetType: "npc" | "pc" | "faction"
  relationshipType: string
  strength: number // -10 to 10
  description: string
  history: string[]
}

// =====================================================
// 2. NPC DATABASE
// =====================================================

export interface NPCDatabase extends BaseEntity {
  keyNPCs: KeyNPC[]
  minorNPCs: MinorNPC[]
  factions: Faction[]
}

export interface KeyNPC extends BaseEntity {
  // Basic Information
  name: string
  title: string
  description: string
  background: string

  // Motivations and Goals
  motivations: string[]
  goals: Goal[]
  fears: string[]

  // Attributes
  attributes: Record<string, number>
  skills: Record<string, number>
  specialAbilities: string[]

  // Status and Location
  currentStatus: string
  currentLocation: string
  alive: boolean

  // Relationships
  relationships: Relationship[]
  factionAffiliations: FactionAffiliation[]

  // Interaction History
  interactionHistory: NPCInteraction[]

  // Gameplay Data
  importanceLevel: "critical" | "major" | "supporting"
  plotRelevance: string[]

  notes: string
}

export interface MinorNPC extends BaseEntity {
  name: string
  role: string
  location: string
  description: string
  status: string
  notes: string
}

export interface Faction extends BaseEntity {
  name: string
  type: string
  description: string
  goals: Goal[]
  resources: Resource[]
  territory: string[]
  allies: string[]
  enemies: string[]
  currentStatus: string
  influence: number
  members: FactionMember[]
  notes: string
}

export interface Goal {
  id: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  status: "active" | "completed" | "failed" | "paused"
  deadline?: string
  progress: number
  obstacles: string[]
  history: string[]
}

export interface FactionAffiliation {
  factionId: string
  rank: string
  loyaltyLevel: number
  joinedDate: string
  status: "active" | "inactive" | "expelled" | "undercover"
}

export interface NPCInteraction {
  sessionId: string
  date: string
  type: string
  description: string
  outcome: string
  relationshipImpact: number
}

export interface FactionMember {
  npcId: string
  rank: string
  joinedDate: string
  status: string
}

export interface Resource {
  id: string
  name: string
  type: string
  amount: number
  description: string
  renewable: boolean
}

// =====================================================
// 3. WORLD STATE
// =====================================================

export interface WorldState extends BaseEntity {
  locations: Location[]
  politicalClimate: PoliticalClimate
  economicConditions: EconomicConditions
  culturalNorms: CulturalNorm[]
  events: WorldEvent[]
}

export interface Location extends BaseEntity {
  name: string
  type: string
  description: string
  significance: string
  currentCondition: string
  population: number
  government: string
  economy: string
  culture: string
  geography: string
  climate: string
  resources: Resource[]
  connectedLocations: LocationConnection[]
  currentEvents: string[]
  history: string[]
  notes: string
}

export interface LocationConnection {
  locationId: string
  connectionType: string
  distance: number
  travelTime: number
  difficulty: string
  description: string
}

export interface PoliticalClimate extends BaseEntity {
  overallStability: number
  majorPowers: PoliticalPower[]
  currentConflicts: Conflict[]
  alliances: Alliance[]
  treaties: Treaty[]
  recentEvents: PoliticalEvent[]
}

export interface PoliticalPower {
  id: string
  name: string
  type: string
  influence: number
  territory: string[]
  leadership: string[]
  agenda: string[]
  resources: Resource[]
}

export interface Conflict {
  id: string
  name: string
  type: string
  parties: string[]
  cause: string
  currentStatus: string
  intensity: number
  startDate: string
  keyEvents: string[]
  impact: string[]
}

export interface Alliance {
  id: string
  name: string
  members: string[]
  purpose: string
  strength: number
  formed: string
  terms: string[]
  status: string
}

export interface Treaty {
  id: string
  name: string
  signatories: string[]
  terms: string[]
  signed: string
  expires?: string
  status: string
}

export interface PoliticalEvent {
  id: string
  name: string
  date: string
  type: string
  description: string
  participants: string[]
  outcome: string
  impact: string[]
}

export interface EconomicConditions extends BaseEntity {
  overallHealth: number
  majorTradeCommodities: TradeCommodity[]
  tradeRoutes: TradeRoute[]
  currencies: Currency[]
  economicEvents: EconomicEvent[]
  marketConditions: MarketCondition[]
}

export interface TradeCommodity {
  id: string
  name: string
  type: string
  baseValue: number
  currentValue: number
  demand: number
  supply: number
  primarySources: string[]
  primaryMarkets: string[]
  trends: string[]
}

export interface TradeRoute {
  id: string
  name: string
  startLocation: string
  endLocation: string
  intermediateStops: string[]
  primaryGoods: string[]
  safety: number
  profitability: number
  travelTime: number
  status: string
}

export interface Currency {
  id: string
  name: string
  type: string
  exchangeRate: number
  stability: number
  acceptedRegions: string[]
  backingEntity: string
}

export interface EconomicEvent {
  id: string
  name: string
  date: string
  type: string
  description: string
  impact: string[]
  affectedRegions: string[]
  duration: string
}

export interface MarketCondition {
  locationId: string
  commodity: string
  supply: number
  demand: number
  price: number
  trend: string
  lastUpdated: string
}

export interface CulturalNorm extends BaseEntity {
  name: string
  region: string[]
  type: string
  description: string
  importance: number
  variations: string[]
  history: string
  currentStatus: string
}

export interface WorldEvent extends BaseEntity {
  name: string
  type: string
  date: string
  location: string[]
  description: string
  significance: number
  participants: string[]
  outcome: string
  consequences: string[]
  relatedEvents: string[]
}

// =====================================================
// 4. CAMPAIGN PROGRESSION
// =====================================================

export interface CampaignProgression extends BaseEntity {
  mainPlotline: PlotLine
  subplots: PlotLine[]
  timeline: TimelineEvent[]
  consequences: Consequence[]
  milestones: Milestone[]
}

export interface PlotLine extends BaseEntity {
  name: string
  type: "main" | "subplot" | "character_arc" | "side_quest"
  description: string
  status: "active" | "completed" | "paused" | "failed"
  priority: number

  // Structure
  acts: Act[]
  currentAct: number

  // Relationships
  relatedPlots: string[]
  dependentPlots: string[]

  // Tracking
  startDate: string
  endDate?: string
  keyEvents: string[]

  notes: string
}

export interface Act {
  id: string
  name: string
  description: string
  objectives: Objective[]
  status: "not_started" | "in_progress" | "completed" | "failed"
  startDate?: string
  endDate?: string
}

export interface Objective {
  id: string
  description: string
  type: string
  status: "active" | "completed" | "failed" | "optional"
  priority: number
  requirements: string[]
  rewards: string[]
  consequences: string[]
}

export interface TimelineEvent extends BaseEntity {
  name: string
  date: string
  type: string
  description: string
  participants: string[]
  location: string
  significance: number
  plotRelevance: string[]
  consequences: string[]
  sessionId?: string
}

export interface Consequence extends BaseEntity {
  name: string
  description: string
  type: string
  severity: number
  causedBy: string
  affects: string[]
  duration: string
  status: "active" | "resolved" | "permanent"
  mitigation: string[]
  opportunities: string[]
}

export interface Milestone extends BaseEntity {
  name: string
  description: string
  type: string
  achievedDate: string
  sessionId: string
  participants: string[]
  rewards: string[]
  significance: number
  plotImpact: string[]
}

// =====================================================
// 5. SESSION LOGS
// =====================================================

export interface SessionLog extends BaseEntity {
  sessionNumber: number
  date: string
  duration: number
  participants: string[]
  gamemaster: string

  // Content
  summary: string
  keyEvents: SessionEvent[]
  playerDecisions: PlayerDecision[]
  emergentStorylines: EmergentStoryline[]

  // Tracking
  experienceAwarded: number
  treasureGained: InventoryItem[]
  plotAdvancement: PlotAdvancement[]

  // Outcomes
  consequences: string[]
  nextSessionHooks: string[]

  notes: string
}

export interface SessionEvent {
  id: string
  name: string
  description: string
  type: string
  participants: string[]
  location: string
  outcome: string
  significance: number
  plotRelevance: string[]
}

export interface PlayerDecision {
  id: string
  description: string
  decisionMaker: string
  alternatives: string[]
  reasoning: string
  outcome: string
  consequences: string[]
  plotImpact: string[]
}

export interface EmergentStoryline {
  id: string
  name: string
  description: string
  origin: string
  potential: string[]
  development: string[]
  status: "developing" | "active" | "resolved" | "abandoned"
}

export interface PlotAdvancement {
  plotId: string
  advancement: string
  significanceLevel: number
  newObjectives: string[]
  completedObjectives: string[]
  complications: string[]
}

// =====================================================
// 6. MECHANICS AND RULES
// =====================================================

export interface MechanicsAndRules extends BaseEntity {
  gameSystem: string
  houseRules: HouseRule[]
  activeMechanics: ActiveMechanic[]
  challenges: Challenge[]
  customSystems: CustomSystem[]
}

export interface HouseRule extends BaseEntity {
  name: string
  category: string
  description: string
  reasoning: string
  baseRuleModified: string
  implementation: string
  examples: string[]
  status: "active" | "testing" | "inactive"
  playerFeedback: string[]
}

export interface ActiveMechanic extends BaseEntity {
  name: string
  type: string
  description: string
  implementation: string
  frequency: string
  participants: string[]
  effects: string[]
  notes: string
}

export interface Challenge extends BaseEntity {
  name: string
  type: string
  description: string
  difficulty: number
  requirements: string[]
  solutions: Solution[]
  rewards: string[]
  consequences: string[]
  usageHistory: ChallengeUsage[]
  variations: string[]
}

export interface Solution {
  id: string
  description: string
  type: string
  difficulty: number
  requirements: string[]
  outcome: string
  discovered: boolean
}

export interface ChallengeUsage {
  sessionId: string
  date: string
  variation: string
  participants: string[]
  approach: string
  outcome: string
  effectiveness: number
}

export interface CustomSystem extends BaseEntity {
  name: string
  purpose: string
  description: string
  mechanics: string[]
  implementation: string
  balancing: string[]
  examples: string[]
  effectiveness: number
  modifications: string[]
}

// =====================================================
// CONTAINER INTERFACE
// =====================================================

export interface EnhancedCampaignData extends BaseEntity {
  // Basic Campaign Info
  name: string
  gameSystem: string
  startDate: string
  currentDate: string

  // Modular Data
  characterProfiles: CharacterProfile[]
  npcDatabase: NPCDatabase
  worldState: WorldState
  campaignProgression: CampaignProgression
  sessionLogs: SessionLog[]
  mechanicsAndRules: MechanicsAndRules

  // Metadata
  lastModified: string
  dataVersion: string // Changed from 'version' to avoid conflict
  gameMaster: string
  activePlayers: string[]

  // Legacy compatibility
  legacyMetadata?: {
    characterInfo?: string
    keyNPCs?: string
    notes?: string[]
  }
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type ModuleType =
  | "characters"
  | "npcs"
  | "world"
  | "progression"
  | "sessions"
  | "mechanics"

export interface ModuleMetadata {
  type: ModuleType
  lastUpdated: string
  version: number
  size: number
  dependencies: ModuleType[]
}

export interface CampaignSummary {
  id: string
  name: string
  gameSystem: string
  lastPlayed: string
  sessionCount: number
  playerCount: number
  status: "active" | "paused" | "completed" | "archived"
  summary: string
}
