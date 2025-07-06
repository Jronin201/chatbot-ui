# TTRPG Campaign Data Schema Documentation

## Overview

This document provides comprehensive documentation for the enhanced campaign data structure used in the TTRPG Campaign Management System. The schema is designed to be modular, extensible, and AI-friendly.

## Core Design Principles

- **Modular Architecture**: Each component is self-contained and can be extended independently
- **Hierarchical Organization**: Clear parent-child relationships between entities
- **Temporal Tracking**: Built-in support for tracking changes over time
- **Relationship Mapping**: Explicit connections between all campaign entities
- **Metadata Integration**: Consistent metadata patterns across all entities
- **AI Optimization**: Structured for efficient context assembly and relevance scoring

## Base Entity Pattern

All campaign entities inherit from a common base pattern:

```typescript
interface BaseEntity {
  id: string                    // Unique identifier
  name: string                  // Human-readable name
  description?: string          // Detailed description
  tags?: string[]              // Categorization tags
  metadata?: EntityMetadata     // System metadata
  relationships?: Record<string, Relationship> // Entity relationships
  customFields?: Record<string, any> // Extensible custom data
}

interface EntityMetadata {
  createdDate: string
  lastModified: string
  version: number
  createdBy?: string
  modifiedBy?: string
  notes?: string[]
}
```

## 1. Character Profiles (Player Characters)

**Purpose**: Comprehensive tracking of player characters including progression, relationships, and story development.

### Schema Structure

```typescript
interface CharacterProfile extends BaseEntity {
  // Core Character Information
  role: string                  // Character class/profession
  level: number                 // Character level/progression
  background?: string           // Character backstory
  
  // Current Status
  currentLocation: string       // Where the character is now
  status: CharacterStatus       // Current state
  
  // Progression Tracking
  experience?: number           // Experience points
  milestones?: string[]         // Character achievements
  
  // Equipment & Resources
  equipment?: EquipmentItem[]   // Current equipment
  resources?: Resource[]        // Currency, supplies, etc.
  
  // Story Integration
  personalPlots?: string[]      // Character-specific plot threads
  secretsKnown?: string[]       // Information only this character knows
  
  // System Integration
  lastUpdated: string           // When this was last modified
  activeInSession: boolean      // Is this character in the current session
}

enum CharacterStatus {
  ACTIVE = 'active',
  INJURED = 'injured',
  UNCONSCIOUS = 'unconscious',
  ABSENT = 'absent',
  RETIRED = 'retired'
}
```

### Usage Examples

```typescript
// Creating a new character
const character: CharacterProfile = {
  id: 'char-aragorn-001',
  name: 'Aragorn',
  role: 'Ranger',
  level: 10,
  currentLocation: 'Minas Tirith',
  status: CharacterStatus.ACTIVE,
  relationships: {
    'npc-gandalf': {
      relationshipType: 'mentor',
      strength: 9,
      notes: 'Gandalf has guided Aragorn for years'
    }
  },
  personalPlots: ['reclaim-throne', 'unite-kingdoms'],
  activeInSession: true,
  lastUpdated: '2024-01-15T20:00:00Z'
}
```

## 2. NPC Database

**Purpose**: Comprehensive tracking of non-player characters with importance levels and dynamic status updates.

### Key NPCs

```typescript
interface KeyNPC extends BaseEntity {
  // Importance & Role
  importanceLevel: ImportanceLevel
  role?: string                 // Their function in the story
  
  // Personality & Motivation
  personality?: string[]        // Personality traits
  motivations?: string[]        // What drives them
  fears?: string[]             // What they're afraid of
  
  // Current Status
  currentLocation?: string      // Where they are
  status?: NPCStatus           // Current state
  
  // Story Integration
  knownBy?: string[]           // Which characters know them
  secrets?: string[]           // Information they possess
  
  // Interaction Tracking
  lastInteraction?: string      // When last encountered
  interactionCount?: number     // How many times encountered
  
  // AI Integration
  dialogueStyle?: string        // How they speak
  commonPhrases?: string[]      // Typical expressions
}

enum ImportanceLevel {
  CRITICAL = 'critical',      // Essential to main plot
  MAJOR = 'major',           // Important to multiple plots
  MODERATE = 'moderate',     // Relevant to specific plots
  MINOR = 'minor',          // Occasional appearances
  BACKGROUND = 'background'  // Atmosphere/world-building
}

enum NPCStatus {
  ACTIVE = 'active',
  TRAVELING = 'traveling',
  BUSY = 'busy',
  UNAVAILABLE = 'unavailable',
  DECEASED = 'deceased',
  UNKNOWN = 'unknown'
}
```

### Minor NPCs & Factions

```typescript
interface MinorNPC extends BaseEntity {
  importanceLevel: ImportanceLevel.MINOR | ImportanceLevel.BACKGROUND
  role?: string
  currentLocation?: string
  notableFeatures?: string[]    // What makes them memorable
  lastSeen?: string            // When last encountered
}

interface Faction extends BaseEntity {
  // Organization Structure
  leaderIds?: string[]         // Key leadership
  memberIds?: string[]         // Known members
  goals?: string[]             // Faction objectives
  
  // Political Status
  powerLevel: PowerLevel
  territory?: string[]         // Areas of influence
  allies?: string[]            // Allied factions
  enemies?: string[]           // Enemy factions
  
  // Resources & Capabilities
  resources?: Resource[]       // Available resources
  capabilities?: string[]      // What they can do
  
  // Current Status
  status: FactionStatus
  recentActions?: string[]     // Recent faction activities
}

enum PowerLevel {
  DOMINANT = 'dominant',
  MAJOR = 'major',
  MODERATE = 'moderate',
  MINOR = 'minor',
  DECLINING = 'declining'
}
```

## 3. World State

**Purpose**: Dynamic tracking of the campaign world including locations, politics, and economy.

### Locations

```typescript
interface Location extends BaseEntity {
  // Geographic Information
  type: LocationType
  parentLocation?: string       // Larger area this belongs to
  subLocations?: string[]       // Smaller areas within
  
  // Physical Description
  size?: LocationSize
  climate?: string
  terrain?: string[]
  keyFeatures?: string[]        // Notable landmarks
  
  // Political & Social
  ruler?: string               // Who controls this area
  population?: number          // How many people live here
  culture?: string[]           // Cultural characteristics
  languages?: string[]         // Languages spoken
  
  // Economic
  primaryIndustry?: string[]   // Main economic activities
  tradeRoutes?: string[]       // Connected trade routes
  resources?: Resource[]       // Available resources
  
  // Story Integration
  notableEvents?: string[]     // Important things that happened here
  secrets?: string[]           // Hidden information
  threats?: string[]           // Current dangers
  
  // Accessibility
  accessibilityNotes?: string  // How to get here
  travelTime?: Record<string, number> // Travel times to other locations
}

enum LocationType {
  CONTINENT = 'continent',
  KINGDOM = 'kingdom',
  CITY = 'city',
  TOWN = 'town',
  VILLAGE = 'village',
  WILDERNESS = 'wilderness',
  DUNGEON = 'dungeon',
  LANDMARK = 'landmark',
  BUILDING = 'building',
  ROOM = 'room'
}

enum LocationSize {
  VAST = 'vast',
  LARGE = 'large',
  MEDIUM = 'medium',
  SMALL = 'small',
  TINY = 'tiny'
}
```

### Political & Economic Systems

```typescript
interface PoliticalSituation {
  currentEvents: string[]      // Ongoing political events
  tensions: string[]           // Sources of conflict
  alliances: string[]          // Current alliances
  treaties?: Treaty[]          // Formal agreements
  succession?: string[]        // Succession issues
  wars?: War[]                // Active conflicts
}

interface EconomicState {
  tradeRoutes: string[]        // Active trade routes
  resources: string[]          // Available resources
  economicTrends: string[]     // Economic patterns
  majorTrades?: Trade[]        // Significant trade agreements
  marketPrices?: MarketPrice[] // Current market conditions
  economicEvents?: string[]    // Recent economic events
}
```

## 4. Campaign Progression

**Purpose**: Tracking the overarching story progression, plot threads, and narrative timeline.

### Plot Lines

```typescript
interface PlotLine extends BaseEntity {
  // Plot Structure
  status: PlotStatus
  objectives: string[]          // What needs to be accomplished
  
  // Story Integration
  keyNPCs: string[]            // Important NPCs in this plot
  keyLocations: string[]       // Important locations
  keyEvents?: string[]         // Significant events
  
  // Progression Tracking
  currentPhase?: string        // Current plot phase
  nextMilestones?: string[]    // Upcoming milestones
  completedObjectives?: string[] // Finished objectives
  
  // Relationships
  parentPlot?: string          // Main plot this belongs to
  subplots?: string[]          // Related subplot IDs
  
  // Consequences
  potentialOutcomes?: string[] // Possible endings
  consequences?: string[]      // Results of plot resolution
  
  // Timing
  urgency?: UrgencyLevel
  deadline?: string            // When this must be resolved
  estimatedDuration?: number   // Expected length in sessions
}

enum PlotStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABANDONED = 'abandoned'
}

enum UrgencyLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none'
}
```

### Timeline Events

```typescript
interface TimelineEvent extends BaseEntity {
  // Event Details
  date: string                 // When it happened (game time)
  realDate?: string           // When it happened (real time)
  
  // Participants
  participants: string[]       // Who was involved
  witnesses?: string[]         // Who saw it happen
  
  // Impact
  consequences: string[]       // What resulted from this event
  affectedPlots?: string[]     // Plots this event influenced
  affectedLocations?: string[] // Locations this event affected
  
  // Categorization
  eventType: EventType
  importance: ImportanceLevel
  
  // Visibility
  publicKnowledge: boolean     // Is this widely known
  secretDetails?: string[]     // Hidden aspects
}

enum EventType {
  POLITICAL = 'political',
  MILITARY = 'military',
  ECONOMIC = 'economic',
  SOCIAL = 'social',
  MAGICAL = 'magical',
  NATURAL = 'natural',
  PERSONAL = 'personal',
  DISCOVERY = 'discovery'
}
```

## 5. Session Logs

**Purpose**: Detailed tracking of individual game sessions for continuity and reference.

```typescript
interface SessionLog extends BaseEntity {
  // Session Metadata
  sessionNumber: number
  gameDate: string             // Date in game world
  realDate: string             // Real-world date
  duration: number             // Session length in minutes
  
  // Participants
  presentCharacters: string[]  // Characters in this session
  gmNotes?: string            // Private GM notes
  
  // Session Content
  summary: string             // Brief session summary
  keyEvents: string[]         // Important events
  importantDialogue: string[] // Memorable conversations
  keyDecisions: string[]      // Major decisions made
  
  // Story Progression
  plotsAdvanced: string[]     // Plots that progressed
  newPlotHooks: string[]      // New plot threads introduced
  resolvedPlots: string[]     // Plots that were resolved
  
  // World Changes
  worldStateChanges: string[] // How the world changed
  npcStatusChanges: string[]  // NPC status updates
  locationChanges: string[]   // Location updates
  
  // Character Development
  characterDevelopment: Record<string, string[]> // Character growth
  relationshipChanges: Record<string, string>    // Relationship updates
  
  // Mechanical
  experienceGained?: number   // XP awarded
  lootGained?: string[]       // Items acquired
  
  // Quality & Engagement
  playerEngagement?: number   // 1-10 scale
  sessionHighlights?: string[] // Best moments
  lessonsLearned?: string[]   // What to improve
}
```

## 6. Mechanics & Rules

**Purpose**: Tracking of house rules, modifications, and mechanical systems.

```typescript
interface MechanicsAndRules {
  // Rule Modifications
  houseRules: HouseRule[]
  activeModifications: RuleModification[]
  
  // Challenge & Balance
  challengeRatings: Record<string, number>
  difficultyAdjustments: DifficultyAdjustment[]
  
  // Custom Systems
  customMechanics: CustomMechanic[]
  specialRules: SpecialRule[]
  
  // Tracking
  mechanicUsage: Record<string, number>
  ruleReferences: RuleReference[]
}

interface HouseRule {
  id: string
  name: string
  description: string
  replacesRule?: string        // What official rule this replaces
  rationale: string           // Why this rule exists
  examples?: string[]         // Usage examples
  active: boolean
  introducedDate: string
}

interface RuleModification {
  id: string
  targetRule: string
  modificationType: 'addition' | 'removal' | 'change'
  description: string
  impact: string
  active: boolean
}
```

## Relationships System

**Purpose**: Explicit tracking of connections between all campaign entities.

```typescript
interface Relationship {
  relationshipType: RelationshipType
  strength: number             // 1-10 scale
  notes?: string              // Additional context
  history?: string[]          // How this relationship developed
  secrets?: string[]          // Hidden aspects
  lastUpdated: string         // When last modified
  
  // Temporal Tracking
  established?: string        // When relationship began
  events?: RelationshipEvent[] // Significant moments
  
  // Mechanical Effects
  mechanicalEffects?: string[] // Game rule impacts
  socialBonuses?: Record<string, number> // Social interaction modifiers
}

enum RelationshipType {
  // Personal
  FAMILY = 'family',
  FRIEND = 'friend',
  ROMANTIC = 'romantic',
  MENTOR = 'mentor',
  RIVAL = 'rival',
  ENEMY = 'enemy',
  
  // Professional
  ALLY = 'ally',
  EMPLOYER = 'employer',
  SUBORDINATE = 'subordinate',
  COLLEAGUE = 'colleague',
  
  // Organizational
  MEMBER = 'member',
  LEADER = 'leader',
  CONTACT = 'contact',
  INFORMANT = 'informant',
  
  // Circumstantial
  ACQUAINTANCE = 'acquaintance',
  STRANGER = 'stranger',
  UNKNOWN = 'unknown'
}

interface RelationshipEvent {
  date: string
  description: string
  impact: number               // Change in relationship strength
  witnesses?: string[]
}
```

## Metadata & Versioning

**Purpose**: System-level tracking for data integrity and change management.

```typescript
interface EntityMetadata {
  // Creation & Modification
  createdDate: string
  lastModified: string
  version: number
  createdBy?: string
  modifiedBy?: string
  
  // Change Tracking
  changeLog?: ChangeLogEntry[]
  
  // Quality & Validation
  validated?: boolean
  validationErrors?: string[]
  
  // System Integration
  aiRelevanceScore?: number
  lastAIUpdate?: string
  
  // User Notes
  notes?: string[]
  tags?: string[]
  
  // Access Control
  visibility?: 'public' | 'gm-only' | 'private'
  editPermissions?: string[]
}

interface ChangeLogEntry {
  timestamp: string
  userId?: string
  changeType: 'create' | 'update' | 'delete'
  fieldsChanged: string[]
  previousValues?: Record<string, any>
  newValues?: Record<string, any>
  reason?: string
}
```

## Usage Guidelines

### 1. Creating New Entities

```typescript
// Always include required base fields
const newEntity: BaseEntity = {
  id: generateUniqueId(),
  name: 'Entity Name',
  description: 'Detailed description',
  metadata: {
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: 1,
    createdBy: 'user-id'
  }
}
```

### 2. Updating Entities

```typescript
// Always update metadata when changing entities
entity.metadata.lastModified = new Date().toISOString()
entity.metadata.version += 1

// Log changes for audit trail
entity.metadata.changeLog = entity.metadata.changeLog || []
entity.metadata.changeLog.push({
  timestamp: new Date().toISOString(),
  changeType: 'update',
  fieldsChanged: ['fieldName'],
  previousValues: { fieldName: oldValue },
  newValues: { fieldName: newValue }
})
```

### 3. Establishing Relationships

```typescript
// Always create bidirectional relationships
const relationship: Relationship = {
  relationshipType: RelationshipType.ALLY,
  strength: 8,
  notes: 'Strong alliance formed through shared battle',
  lastUpdated: new Date().toISOString()
}

// Add to both entities
entity1.relationships[entity2.id] = relationship
entity2.relationships[entity1.id] = {
  ...relationship,
  relationshipType: RelationshipType.ALLY // May be different
}
```

### 4. AI Integration

```typescript
// Entities should be structured for AI context assembly
interface AIOptimizedEntity extends BaseEntity {
  // Include AI-relevant fields
  aiSummary?: string           // Concise AI description
  aiKeywords?: string[]        // Important terms for AI
  aiContext?: string[]         // Contextual information
  
  // Relevance scoring data
  lastMentioned?: string       // When last referenced
  mentionCount?: number        // How often referenced
  importance?: ImportanceLevel // Overall importance
}
```

## Best Practices

### 1. Consistency
- Use consistent naming conventions
- Follow the same structure patterns
- Maintain uniform data types

### 2. Completeness
- Fill in all relevant fields
- Provide meaningful descriptions
- Include relationship mappings

### 3. Maintainability
- Keep metadata up to date
- Document changes in change logs
- Use clear, descriptive names

### 4. Performance
- Use efficient data structures
- Avoid deeply nested objects
- Keep descriptions concise but informative

### 5. Extensibility
- Use custom fields for game-specific data
- Add tags for flexible categorization
- Design for future expansion

## Integration with AI Systems

### Context Assembly
The schema is designed to work seamlessly with AI context assembly systems:

```typescript
// AI systems can efficiently extract relevant information
const aiContext = {
  entities: filterRelevantEntities(campaignData),
  relationships: extractRelationships(entities),
  currentState: getCurrentState(sessionState),
  relevantHistory: getRelevantHistory(entities, sessionState)
}
```

### Relevance Scoring
Built-in support for AI relevance scoring:

```typescript
interface RelevanceScoring {
  presence: boolean            // Is entity present in current scene
  recency: number             // How recently mentioned
  importance: ImportanceLevel // Inherent importance
  relationships: string[]     // Connected entities
  plotRelevance: number       // Connection to active plots
}
```

This schema provides the foundation for a robust, scalable, and AI-friendly TTRPG campaign management system that can grow and adapt with your campaign needs.
