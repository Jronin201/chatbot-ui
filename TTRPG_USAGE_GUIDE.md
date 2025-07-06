# TTRPG Campaign Management System - Usage Guide

## Table of Contents

1. [Game Master Guide](#game-master-guide)
2. [Developer Guide](#developer-guide)
3. [API Reference](#api-reference)
4. [Integration Examples](#integration-examples)
5. [Troubleshooting](#troubleshooting)

---

## Game Master Guide

### Getting Started

#### 1. Initial Setup

**Opening the Campaign Manager**
1. Navigate to the Campaign Information Window
2. Click on the "Campaign Data" tab
3. You'll see eight sub-tabs for different data modules

**First Time Setup**
1. Start with the "Overview" tab to set up basic campaign information
2. Add your main characters in the "Characters" tab
3. Create key NPCs in the "NPCs" tab
4. Set up your world locations in the "World" tab

#### 2. Campaign Creation Workflow

**Step 1: Define Your Campaign**
```
Campaign Name: "The War of the Ring"
Setting: Middle-earth
System: D&D 5e
Start Date: January 15, 2024
```

**Step 2: Add Main Characters**
- Import existing character sheets or create new profiles
- Define relationships between characters
- Set starting locations and status

**Step 3: Create Your World**
- Add key locations (cities, dungeons, wilderness areas)
- Define political situations and factions
- Set up economic systems and trade routes

**Step 4: Plan Your Plots**
- Create your main plotline
- Add subplots and side quests
- Define objectives and milestones

### Day-to-Day Usage

#### Managing Sessions

**Starting a Session**
1. Go to the "Sessions" tab
2. Click "Start New Session"
3. Set the game date and session information
4. Select active characters and NPCs

**During the Session**
- Use the "AI Context" tab to get relevant information
- Update character locations and status in real-time
- Track important events and decisions
- Monitor plot progression

**Ending a Session**
1. Click "End Session" in the Sessions tab
2. Review the automatic session summary
3. Confirm any suggested updates
4. Save session notes

#### Working with NPCs

**Adding New NPCs**
1. Go to the "NPCs" tab
2. Click "Add NPC"
3. Fill in the form:
   - **Name**: Character name
   - **Importance**: Critical/Major/Moderate/Minor/Background
   - **Role**: Their function in the story
   - **Location**: Where they currently are
   - **Personality**: Key traits
   - **Motivations**: What drives them

**Managing NPC Relationships**
1. Select an NPC from the list
2. Click "Edit Relationships"
3. Add connections to characters and other NPCs
4. Set relationship strength (1-10 scale)

**NPC Status Updates**
- The system automatically updates NPC status based on interactions
- You can manually override these updates if needed
- Review suggested changes in the notifications

#### Plot Management

**Creating Plot Lines**
1. Go to the "Progression" tab
2. Click "Add Plot"
3. Define the plot structure:
   - **Name**: Plot title
   - **Type**: Main plot or subplot
   - **Objectives**: What needs to be accomplished
   - **Key NPCs**: Important characters
   - **Locations**: Where this plot takes place
   - **Status**: Active/Inactive/Paused/Completed

**Tracking Plot Progress**
- Mark objectives as completed during sessions
- Add new milestones as they emerge
- Link plots to specific events and decisions

#### Using AI Context

**Getting AI Assistance**
1. Go to the "AI Context" tab
2. Select the context type (Combat, Dialogue, Exploration, etc.)
3. Choose focus entities if needed
4. Review the generated context summary

**Context Types Available**
- **Combat**: Tactical information, combat capabilities
- **Dialogue**: Character motivations, relationships, personality
- **Exploration**: Location details, environmental factors
- **Plot Advancement**: Story progression, consequences
- **General Query**: Comprehensive context for any question

### Advanced Features

#### Batch Operations

**Mass Updates**
1. Go to the "Batch Operations" section
2. Select multiple entities of the same type
3. Choose the operation (Update Status, Change Location, etc.)
4. Apply changes to all selected entities

**Import/Export**
- Export campaign data for backup
- Import data from other campaigns
- Share specific modules with other GMs

#### Relevance Filtering

**Customizing Relevance**
1. In the AI Context tab, click "Advanced Settings"
2. Adjust relevance weights:
   - **Presence**: How much to weight entities in current scene
   - **Recency**: How much to weight recently mentioned entities
   - **Plot Relevance**: How much to weight plot-connected entities
   - **Relationships**: How much to weight connected entities

**Understanding Relevance Scores**
- **Critical (9-10)**: Must be included in AI context
- **High (7-8)**: Should be included if space allows
- **Medium (5-6)**: Include for background context
- **Low (3-4)**: Background context only
- **Negligible (1-2)**: Exclude from AI context

### Best Practices for GMs

#### 1. Regular Maintenance

**Weekly Tasks**
- Review and update NPC statuses
- Check plot progression
- Update location information
- Review relationship changes

**Monthly Tasks**
- Export campaign data for backup
- Review session summaries
- Update campaign timeline
- Clean up unused entities

#### 2. Effective Organization

**Naming Conventions**
- Use consistent naming patterns
- Include location or faction prefixes
- Example: "MT_Guard_Captain" for Minas Tirith Guard Captain

**Tagging System**
- Use tags to categorize entities
- Examples: "combat-encounter", "plot-critical", "player-favorite"
- This helps with filtering and searching

**Relationship Management**
- Update relationships after significant interactions
- Use the notes field to explain relationship changes
- Track relationship history for continuity

#### 3. AI Integration

**Optimizing AI Context**
- Review AI context before important scenes
- Adjust relevance weights based on session type
- Use focus entities to get targeted information

**Working with AI Suggestions**
- Review automatic updates before accepting
- Use AI context to inspire new plot developments
- Let AI help identify overlooked connections

### Common Workflows

#### Scenario 1: Planning a New Arc

1. **Identify the Hook**
   - Create a new plot line
   - Define initial objectives
   - Set up key NPCs and locations

2. **Establish Connections**
   - Link to existing characters and plots
   - Create relationships between new NPCs
   - Update location information

3. **Test the Context**
   - Use AI Context to review the setup
   - Check that all necessary information is included
   - Adjust relevance weights if needed

#### Scenario 2: Running a Session

1. **Pre-Session Setup**
   - Start a new session
   - Review active plots and NPCs
   - Check character status and locations

2. **During the Session**
   - Use AI Context for real-time assistance
   - Track important events and decisions
   - Update entity statuses as needed

3. **Post-Session Cleanup**
   - End the session
   - Review and confirm automatic updates
   - Add any missed information

#### Scenario 3: Introducing New Characters

1. **Character Creation**
   - Add the new character profile
   - Set initial relationships
   - Define their role in existing plots

2. **Integration**
   - Update existing NPCs who would know them
   - Adjust plot lines to include them
   - Set up potential storylines

3. **Testing**
   - Use AI Context to see how they fit
   - Adjust relevance weights if needed
   - Plan introduction scenes

---

## Developer Guide

### System Architecture

#### Core Components

**Data Layer**
- `EnhancedCampaignData`: Core data structures
- `SessionState`: Session management and contextual memory
- `CampaignDataManager`: CRUD operations and data management

**Logic Layer**
- `RelevanceEngine`: Relevance scoring and filtering
- `AIContextAssembler`: AI context generation
- `EventTriggerSystem`: Automated updates and event handling

**UI Layer**
- React components for data visualization and editing
- Context providers for state management
- Batch operation interfaces

#### Data Flow

```
User Input → UI Components → Context Providers → Data Managers → Storage Layer
                                                      ↓
AI Context ← AIContextAssembler ← RelevanceEngine ← Data Layer
```

### Setting Up Development Environment

#### 1. Prerequisites

```bash
# Node.js and npm
node --version  # Should be 18+
npm --version   # Should be 8+

# TypeScript
npm install -g typescript
tsc --version   # Should be 4.5+
```

#### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/chatbot-ui.git
cd chatbot-ui

# Install dependencies
npm install

# Run type checking
npm run type-check

# Start development server
npm run dev
```

#### 3. Running Tests

```bash
# Run all tests
npm test

# Run TTRPG system tests specifically
npm test -- --testNamePattern="TTRPG"

# Run with coverage
npm run test:coverage
```

### Adding New Features

#### 1. Creating New Entity Types

**Step 1: Define the Interface**
```typescript
// In /types/enhanced-campaign-data.ts
export interface MyNewEntity extends BaseEntity {
  // Add your specific fields
  customField: string
  numericField: number
  optionalField?: string
}
```

**Step 2: Update the Main Data Structure**
```typescript
// In /types/enhanced-campaign-data.ts
export interface EnhancedCampaignData {
  // existing fields...
  myNewEntities?: MyNewEntity[]
}
```

**Step 3: Add CRUD Operations**
```typescript
// In /lib/campaign-data/crud.ts
export async function createMyNewEntity(
  data: Partial<MyNewEntity>
): Promise<MyNewEntity> {
  return createEntity('myNewEntity', data)
}

export async function updateMyNewEntity(
  id: string,
  updates: Partial<MyNewEntity>
): Promise<MyNewEntity> {
  return updateEntity('myNewEntity', id, updates)
}
```

**Step 4: Update Relevance Engine**
```typescript
// In /lib/relevance/relevance-engine.ts
private getEntityCategory(entity: any): RelevanceCategory {
  // existing checks...
  if (entity.customField) return "my-new-category"
  return "item"
}
```

#### 2. Adding New Context Types

**Step 1: Update Context Type Enum**
```typescript
// In /types/session-state.ts
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
  | "my-new-context"  // Add your new context type
```

**Step 2: Update Context Type Scoring**
```typescript
// In /lib/relevance/relevance-engine.ts
private calculateContextTypeScore(
  entity: any,
  contextType: ContextType,
  reasons: string[]
): number {
  let score = 0

  switch (contextType) {
    // existing cases...
    case "my-new-context":
      if (entity.customField) {
        score += 5
        reasons.push("Relevant to my new context")
      }
      break
  }

  return score
}
```

#### 3. Creating Custom Event Triggers

**Step 1: Define Event Type**
```typescript
// In /lib/campaign-data/event-driven-updates.ts
export type CampaignEventType = 
  | "plot-milestone"
  | "character-development"
  | "npc-status-change"
  // existing types...
  | "my-custom-event"
```

**Step 2: Create Event Handler**
```typescript
// In /lib/campaign-data/event-driven-updates.ts
export function createMyCustomEventTrigger(): EventTrigger {
  return {
    id: 'my-custom-trigger',
    condition: 'my-custom-condition',
    entityTypes: ['character', 'npc'],
    actions: [
      {
        type: 'update-entity',
        targetId: 'affected-entity',
        updateData: { customField: 'updated-value' }
      }
    ]
  }
}
```

### API Reference

#### Core Data Management

**CampaignDataManager**
```typescript
import { CampaignDataManager } from '@/lib/campaign-data/campaign-data-manager'

// Initialize
const manager = new CampaignDataManager()

// Load campaign data
const campaignData = await manager.loadCampaignData()

// Save campaign data
await manager.saveCampaignData(campaignData)

// CRUD operations
const character = await manager.createCharacter(characterData)
const npc = await manager.updateNPC(npcId, updates)
const plot = await manager.deletePlot(plotId)
```

**RelevanceEngine**
```typescript
import { RelevanceEngine, createRelevanceEngine } from '@/lib/relevance/relevance-engine'

// Create engine with custom weights
const engine = createRelevanceEngine({
  presence: 15,
  recency: 10,
  plotRelevance: 12
})

// Calculate relevance score
const score = engine.calculateScore(
  entity,
  sessionState,
  campaignData,
  'combat'
)

// Filter by relevance
const relevant = engine.filterByRelevance(
  entities,
  sessionState,
  campaignData,
  'dialogue',
  { minScore: 7, maxItems: 10 }
)
```

**AIContextAssembler**
```typescript
import { AIContextAssembler, createAIContextAssembler } from '@/lib/relevance/relevance-engine'

// Create assembler
const assembler = createAIContextAssembler()

// Assemble context
const context = assembler.assembleContext(
  sessionState,
  campaignData,
  'combat',
  { maxTokens: 3000 }
)

// Generate AI prompt
const prompt = assembler.generateAIPrompt(
  context,
  'What should the characters do?'
)
```

#### Event System

**EventTriggerSystem**
```typescript
import { EventTriggerSystem, createEventTriggerSystem } from '@/lib/campaign-data/event-driven-updates'

// Create system
const eventSystem = createEventTriggerSystem(campaignManager, {
  enableAutomaticUpdates: true,
  updateFrequency: 'immediate'
})

// Register event
await eventSystem.registerEvent({
  id: 'event-1',
  type: 'plot-milestone',
  description: 'Major plot point reached',
  sessionId: 'session-123',
  priority: 'high',
  affectedEntities: ['character-1', 'npc-1'],
  triggers: [],
  automaticUpdates: []
})
```

### Integration Examples

#### 1. Custom AI Assistant Integration

```typescript
import { assembleAIContext, generateQuickPrompt } from '@/lib/relevance/relevance-engine'

// Create AI-ready context
const aiContext = assembleAIContext(
  sessionState,
  campaignData,
  'dialogue',
  { maxTokens: 2000 }
)

// Generate prompt for external AI
const prompt = generateQuickPrompt(
  sessionState,
  campaignData,
  'How should this NPC respond?',
  'dialogue'
)

// Send to AI service
const response = await sendToAI(prompt)
```

#### 2. Discord Bot Integration

```typescript
import { optimizeContextForAI } from '@/lib/relevance/relevance-engine'

// Optimize context for Discord bot
const { context, tokenEstimate } = optimizeContextForAI(
  allEntities,
  sessionState,
  campaignData,
  2000 // Discord message limit
)

// Send to Discord
await discordChannel.send(`**Campaign Context**\n${context}`)
```

#### 3. Voice Assistant Integration

```typescript
import { createAIContextAssembler } from '@/lib/relevance/relevance-engine'

const assembler = createAIContextAssembler()

// Get quick context for voice queries
const quickContext = assembler.assembleQuickContext(
  sessionState,
  campaignData,
  'general-query'
)

// Process voice input
const response = await processVoiceQuery(quickContext, voiceInput)
```

### Testing

#### Unit Tests

```typescript
import { RelevanceEngine } from '@/lib/relevance/relevance-engine'
import { mockSessionState, mockCampaignData } from '@/test/mocks'

describe('RelevanceEngine', () => {
  let engine: RelevanceEngine

  beforeEach(() => {
    engine = new RelevanceEngine()
  })

  it('should calculate relevance scores correctly', () => {
    const score = engine.calculateScore(
      mockEntity,
      mockSessionState,
      mockCampaignData,
      'combat'
    )

    expect(score.score).toBeGreaterThan(0)
    expect(score.category).toBe('npc')
  })
})
```

#### Integration Tests

```typescript
import { CampaignDataManager } from '@/lib/campaign-data/campaign-data-manager'
import { EventTriggerSystem } from '@/lib/campaign-data/event-driven-updates'

describe('Campaign Management Integration', () => {
  it('should process complete workflow', async () => {
    // Set up
    const manager = new CampaignDataManager()
    const eventSystem = new EventTriggerSystem(manager)
    
    // Create campaign data
    const campaignData = await manager.createCampaign({
      name: 'Test Campaign'
    })
    
    // Add entities
    const character = await manager.createCharacter(mockCharacterData)
    const npc = await manager.createNPC(mockNPCData)
    
    // Trigger event
    await eventSystem.registerEvent(mockEvent)
    
    // Verify updates
    const updatedData = await manager.loadCampaignData()
    expect(updatedData.characterProfiles).toHaveLength(1)
    expect(updatedData.npcDatabase.keyNPCs).toHaveLength(1)
  })
})
```

### Performance Optimization

#### 1. Data Loading

```typescript
// Lazy loading for large datasets
const entities = await manager.loadEntities({
  limit: 50,
  offset: 0,
  filter: { type: 'character' }
})

// Batch loading
const batchData = await manager.loadBatch([
  { type: 'character', ids: characterIds },
  { type: 'npc', ids: npcIds }
])
```

#### 2. Caching

```typescript
import { LRUCache } from 'lru-cache'

const relevanceCache = new LRUCache<string, RelevanceScore>({
  max: 1000,
  ttl: 5 * 60 * 1000 // 5 minutes
})

// Cache relevance scores
const cacheKey = `${entity.id}-${contextType}`
const cachedScore = relevanceCache.get(cacheKey)
if (!cachedScore) {
  const score = engine.calculateScore(/* ... */)
  relevanceCache.set(cacheKey, score)
}
```

#### 3. Optimization Monitoring

```typescript
import { performance } from 'perf_hooks'

// Performance monitoring
const startTime = performance.now()
const result = await expensiveOperation()
const endTime = performance.now()

console.log(`Operation took ${endTime - startTime} milliseconds`)

// Memory monitoring
const memoryUsage = process.memoryUsage()
console.log(`Memory usage: ${memoryUsage.heapUsed / 1024 / 1024} MB`)
```

---

## Troubleshooting

### Common Issues

#### 1. Context Assembly Taking Too Long

**Problem**: AI context assembly is slow with large datasets

**Solution**:
```typescript
// Reduce token limit
const context = assembler.assembleContext(
  sessionState,
  campaignData,
  'combat',
  { maxTokens: 1000, compressionLevel: 'aggressive' }
)

// Use relevance filtering
const relevantEntities = getHighPriorityEntities(
  allEntities,
  sessionState,
  campaignData,
  'combat',
  10 // limit to 10 most relevant
)
```

#### 2. Memory Usage Too High

**Problem**: Application using too much memory

**Solution**:
```typescript
// Enable lazy loading
const manager = new CampaignDataManager({
  lazyLoading: true,
  cacheSize: 100
})

// Clear unused data
manager.clearCache()
```

#### 3. Relevance Scores Not Accurate

**Problem**: AI context doesn't include expected entities

**Solution**:
```typescript
// Adjust relevance weights
const engine = createRelevanceEngine({
  presence: 20,    // Increase presence weight
  recency: 15,     // Increase recency weight
  plotRelevance: 10
})

// Check entity data
console.log('Entity location:', entity.currentLocation)
console.log('Session location:', sessionState.currentContext.primaryLocation)
```

### Debug Tools

#### 1. Relevance Score Debugging

```typescript
// Debug relevance calculation
const score = engine.calculateScore(entity, sessionState, campaignData, 'combat')
console.log('Relevance Score:', score.score)
console.log('Reasons:', score.reasons)
console.log('Priority:', score.priority)
```

#### 2. Context Assembly Debugging

```typescript
// Debug context assembly
const context = assembler.assembleContext(/* ... */)
console.log('Token estimate:', context.tokenEstimate)
console.log('Warnings:', context.warnings)
console.log('Critical entities:', context.criticalEntities.length)
```

#### 3. Event System Debugging

```typescript
// Debug event processing
eventSystem.on('event-processed', (event) => {
  console.log('Processed event:', event.id)
  console.log('Triggered actions:', event.triggers.length)
})
```

### Performance Monitoring

```typescript
// Add performance monitoring
const monitor = new PerformanceMonitor()

monitor.startTimer('relevance-calculation')
const scores = calculateRelevanceScores(entities)
monitor.endTimer('relevance-calculation')

monitor.startTimer('context-assembly')
const context = assembler.assembleContext(/* ... */)
monitor.endTimer('context-assembly')

// Report performance
console.log(monitor.getReport())
```

This comprehensive guide should help both Game Masters and developers effectively use and extend the TTRPG Campaign Management System. For additional support, refer to the API documentation and example implementations in the codebase.
