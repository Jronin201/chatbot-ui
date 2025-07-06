# TTRPG Campaign Management - Quick Reference Guide

## 🚀 Getting Started

### Accessing the System
1. Open the **Campaign Information Window** (Game Time interface)
2. Navigate to the **Management** tab
3. All campaign data management features are available here

### Core Components
- **Campaign Data Editor**: Create, edit, and manage all campaign entities
- **Batch Operations**: Bulk operations for efficiency
- **Search & Filter**: Advanced search across all campaign data
- **AI Context**: Generate contextual information for AI interactions
- **Relevance Engine**: Intelligent content prioritization

## 📊 Data Management

### Creating New Entities
```typescript
// Click "Add [Entity Type]" buttons in the Management tab
// Available types: Character, NPC, Location, Session
```

### Editing Existing Data
- Click the edit icon (✏️) next to any entity
- Form validation ensures data integrity
- Changes are automatically saved with versioning

### Bulk Operations
- Select multiple items using checkboxes
- Choose from 9 batch operations:
  - Export (JSON, CSV, Markdown)
  - Import from files
  - Bulk edit multiple items
  - Bulk delete
  - Bulk tag management
  - Duplicate entities
  - Validate data integrity
  - Backup/Restore

## 🎯 Search & Filtering

### Real-time Search
```typescript
// Search across all campaign data
// Filters: location, entity type, tags
// Results categorized by type
```

### Contextual Loading
- System automatically loads relevant data based on:
  - Current location
  - Active characters
  - Recent events
  - Plot progression

## 🤖 AI Integration

### Context Generation
```typescript
// Generate context packets for different scenarios:
sessionState.generateContext("dialogue")  // NPC interactions
sessionState.generateContext("combat")    // Combat scenarios
sessionState.generateContext("exploration") // Location discovery
```

### Relevance Scoring
- Multi-factor scoring system
- Configurable weights for different criteria
- Automatic prioritization of important information

## 🛠️ Session Management

### Starting a Session
```typescript
// Click "Start Session" in the AI Context tab
// Tracks: characters, location, events, decisions
```

### Event Tracking
```typescript
// Automatically logs:
trackAction("Party defeated the goblin patrol", ["char1", "char2"], 4)
trackDialogue("Captain: The kingdom is in danger!", ["npc1"])
trackCombat("Battle at the bridge", ["char1", "char2", "npc1"])
```

### Memory Persistence
- Events persist across sessions
- AI context maintains continuity
- Recent history influences relevance scoring

## 📁 Data Structure

### Character Profile
```typescript
interface CharacterProfile {
  id: string
  name: string
  player: string
  class: string
  level: number
  attributes: AttributeSet
  currentHealth: number
  maxHealth: number
  inventory: ItemRecord[]
  relationships: RelationshipMap
  questLog: QuestObjective[]
  // ... additional fields
}
```

### NPC Database
```typescript
interface KeyNPC {
  id: string
  name: string
  importance: "key" | "minor"
  role: string
  faction: string
  location: string
  personality: string
  motivations: string[]
  relationships: RelationshipMap
  // ... additional fields
}
```

### Location System
```typescript
interface Location {
  id: string
  name: string
  locationType: "settlement" | "structure" | "region" | "dungeon"
  parentLocation: string
  population: number
  government: string
  economy: string
  pointsOfInterest: PointOfInterest[]
  // ... additional fields
}
```

## 🎮 Usage Examples

### Basic Campaign Setup
1. Create player characters
2. Add key NPCs and locations
3. Set up initial plot hooks
4. Start first session

### Session Management
1. Start session with date and participants
2. Set current location
3. Add active characters
4. Track events as they happen
5. Generate AI context as needed

### Data Export
1. Select entities to export
2. Choose format (JSON, CSV, Markdown)
3. System generates downloadable file

## 🚨 Best Practices

### Data Organization
- Use consistent naming conventions
- Tag entities for easy filtering
- Keep relationships up to date
- Regular backup of campaign data

### Session Management
- Start sessions to enable tracking
- Update current location frequently
- Log important events immediately
- End sessions to preserve memory

### AI Integration
- Generate context packets before AI interactions
- Adjust relevance weights based on campaign style
- Use focus parameters for specific queries
- Monitor AI context size for performance

## 🔧 Troubleshooting

### Common Issues
- **Data not loading**: Check network connection, refresh page
- **Search not working**: Clear search filters, check spelling
- **Export failing**: Reduce number of selected items
- **Slow performance**: Use contextual filtering, limit batch size

### Performance Tips
- Use lazy loading for large datasets
- Enable contextual filtering
- Limit AI context size
- Regular cleanup of old session data

## 📚 Advanced Features

### Custom Relevance Weights
```typescript
const customWeights = {
  presence: 10,    // Entity is present in scene
  recency: 8,      // Recently mentioned
  plotRelevance: 9, // Connected to active plots
  relationship: 7,  // Connected to active characters
  importance: 6,    // Inherent importance
  contextType: 8,   // Relevant to current context
  focus: 15        // Specific focus entity
}
```

### Batch Operations API
```typescript
// Example: Bulk tag operation
const batchTask = {
  operation: "bulk-tag",
  selectedItems: ["char1", "char2", "npc1"],
  operationData: {
    tags: ["important", "main-story", "chapter-1"]
  }
}
```

### Context Packet Structure
```typescript
interface ContextPacket {
  sessionInfo: SessionInfo
  activeEntities: ActiveEntities
  recentHistory: RecentHistory
  relevantMemories: MemoryItem[]
  aiContext: {
    priority: "critical" | "high" | "medium" | "low"
    relevanceScore: number
    focusAreas: string[]
    contextType: ContextType
  }
}
```

## 🎯 Quick Commands

| Action | Location | Shortcut |
|--------|----------|----------|
| Create Entity | Management Tab | Click "Add [Type]" |
| Edit Entity | Any Tab | Click edit icon |
| Search | Search Tab | Type in search box |
| Export Data | Batch Operations | Select → Export |
| Start Session | AI Context Tab | Click "Start Session" |
| Generate Context | AI Context Tab | Click context button |

## 🏆 Key Benefits

- **Centralized Management**: All campaign data in one place
- **AI-Optimized**: Intelligent content prioritization
- **Performance**: Efficient loading and filtering
- **Extensible**: Easy to add new data types
- **User-Friendly**: Intuitive interface with powerful features

This system transforms campaign management from a manual process into an intelligent, automated workflow that enhances storytelling and reduces GM workload.
