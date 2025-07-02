# Game Time Tracking System

A comprehensive time tracking system for TTRPG campaigns, designed to automatically monitor and manage in-game time passage based on narrative events.

## Features

### 🗓️ Multiple Calendar Systems
- **Dune Imperial Calendar**: 12 months × 30 days (360-day years) with A.G. dating
- **Standard Gregorian**: Modern Earth calendar system
- **Custom Calendars**: Configurable calendar systems (coming soon)

### 🤖 Intelligent Time Detection
The system automatically analyzes chat messages for time passage using advanced pattern recognition:

- **Travel Activities**: "traveled to", "journey", "voyage", etc.
- **Rest & Recovery**: "rested for", "recovered", "healed", etc.
- **Training**: "trained in", "practiced", "learned", etc.
- **Research**: "investigated", "studied", "researched", etc.
- **Explicit Time**: "3 days later", "after a week", etc.

### ⚙️ Smart Modifiers
Context-aware time calculations with modifiers:
- **Speed**: "quickly" (0.5x), "slowly" (2x)
- **Distance**: "nearby" (0.3x), "far" (3x), "interplanetary" (7x)
- **Intensity**: "intensive training" (2x), "basic lesson" (0.5x)

### 📊 Campaign Management
- **Campaign Metadata**: Track campaign name, GM, characters, notes
- **Time History**: Complete log of all time passage events
- **Statistics**: Total days elapsed, event count, etc.
- **Data Export/Import**: JSON-based backup and restore

## Usage

### 1. Initialize Game Time

```tsx
import { GameTimeProvider, useGameTime } from "@/components/game-time"

// Wrap your app with the provider
<GameTimeProvider>
  <YourApp />
</GameTimeProvider>

// In your component
const { initializeGameTime } = useGameTime()

await initializeGameTime(
  "1 Ignis 10191 A.G.",  // Start date
  "dune",                 // Calendar system
  {
    campaignName: "The Arrakis Chronicles",
    gameSystem: "Dune: Adventures in the Imperium",
    gameMaster: "Your Name"
  }
)
```

### 2. Add UI Components

```tsx
import { 
  GameTimeWidget, 
  GameTimeCompactDisplay,
  GameTimeInitDialog 
} from "@/components/game-time"

// Main widget with full controls
<GameTimeWidget />

// Compact display for space-constrained areas
<GameTimeCompactDisplay />

// Initialization dialog
<GameTimeInitDialog 
  isOpen={showDialog} 
  onClose={() => setShowDialog(false)} 
/>
```

### 3. Automatic Time Detection

The system automatically processes chat messages:

```tsx
import { useGameTimeIntegration } from "@/lib/hooks/use-game-time-integration"

const { processMessage } = useGameTimeIntegration()

// Process a message for time passage
const result = await processMessage(
  "We traveled to Arrakis, the journey took 3 days."
)

if (result.timeUpdated) {
  console.log(`Time advanced by ${result.daysElapsed} days`)
}
```

### 4. Manual Time Management

```tsx
const { updateGameTime, setGameTime } = useGameTime()

// Add time
await updateGameTime(3, "Traveled to the capital city")

// Set specific date
await setGameTime("15 Kamar 10191 A.G.", "Time skip to important event")
```

## Calendar Systems

### Dune Imperial Calendar

The Dune calendar system follows the official Dune: Adventures in the Imperium format:

- **Format**: `Day Month Year A.G.`
- **Example**: `15 Ignis 10191 A.G.`
- **Months**: Ignis, Leonis, Nivis, Ventus, Stiria, Vicus, Salus, Hetera, Mollis, Umbra, Frigidus, Kamar
- **Days per Month**: 30
- **Days per Year**: 360

### Standard Calendar

Uses the Gregorian calendar system:

- **Format**: `YYYY-MM-DD` or locale-specific formats
- **Example**: `2024-07-15`

## Configuration

### Settings

```tsx
const { updateSettings } = useGameTime()

await updateSettings({
  autoDetectTimePassage: true,
  showTimePassageNotifications: true,
  defaultTimeIntervals: {
    travel: 3,      // Default days for travel
    rest: 1,        // Default days for rest
    training: 7,    // Default days for training
    research: 3,    // Default days for research
    shopping: 0.5   // Default days for shopping
  },
  customKeywords: {
    "meditation": 1,
    "crafting": 2
  }
})
```

### Custom Keywords

Add custom time keywords for your campaign:

```tsx
const settings = await gameTimeService.getGameTimeSettings()
settings.customKeywords["ritual"] = 7  // "ritual" = 7 days
await gameTimeService.updateGameTimeSettings(settings)
```

## API Reference

### Core Services

```tsx
import { GameTimeService } from "@/lib/game-time"

const service = GameTimeService.getInstance()

// Initialize
await service.initializeGameTime(startDate, calendarSystem, metadata)

// Update time
await service.updateGameTime(days, description)

// Analyze message
const analysis = await service.analyzeMessageForTimePassage(message)

// Get statistics
const stats = await service.getCampaignStats()
```

### React Hooks

```tsx
import { useGameTime, useGameTimeIntegration } from "@/components/game-time"

// Basic game time management
const { 
  gameTimeData, 
  updateGameTime, 
  formatDate 
} = useGameTime()

// Advanced integration with chat
const { 
  processMessage, 
  timePassageNotifications 
} = useGameTimeIntegration()
```

## File Structure

```
lib/game-time/
├── calendar-utils.ts           # Calendar system utilities
├── time-passage-analyzer.ts    # Message analysis engine
├── game-time-service.ts        # Main service layer
├── storage.ts                  # Data persistence
└── index.ts                    # Exports

components/game-time/
├── game-time-widget.tsx        # Main UI widget
├── game-time-compact-display.tsx # Compact display
├── game-time-init-dialog.tsx   # Initialization dialog
├── game-time-settings-dialog.tsx # Settings dialog
├── game-time-history-dialog.tsx # History viewer
├── time-passage-notification.tsx # Notification component
└── index.ts                    # Exports

context/
└── game-time-context.tsx       # React context provider

types/
└── game-time.ts                # TypeScript definitions
```

## Examples

### Message Analysis Examples

| Message | Detected Days | Confidence |
|---------|---------------|------------|
| "We traveled to Arrakis for 3 days" | 3.0 | 95% |
| "The characters rested quickly" | 0.5 | 70% |
| "Intensive training for a week" | 14.0 | 85% |
| "After researching ancient texts" | 3.0 | 70% |
| "The journey across the desert was long" | 9.0 | 75% |

### Dune Calendar Examples

```
Start: 1 Ignis 10191 A.G.
+ 29 days → 30 Ignis 10191 A.G. (end of first month)
+ 30 days → 1 Leonis 10191 A.G. (start of second month)
+ 44 days → 15 Leonis 10191 A.G. (15th day of second month)
+ 360 days → 1 Ignis 10192 A.G. (next year)
```

The Dune Imperial Calendar system:
- **12 months** with 30 days each = **360 days per year**
- **6-day weeks**: Solis, Lunis, Terris, Aquae, Ventis, Ignis
- **A.G. dating**: After Guild (from Spacing Guild establishment)
- **No leap years**: Precise 360-day calendar system

## Storage

The system stores data in JSON files:

- `game_time.json` - Current game time data
- `time_passage_history.json` - Event history
- `game_time_settings.json` - User preferences

Data is automatically persisted to localStorage (browser) or file system (server).

## Integration Tips

1. **Chat Integration**: Add `GameTimeCompactDisplay` to your chat interface
2. **Sidebar Widget**: Include `GameTimeWidget` in a collapsible sidebar
3. **Campaign Setup**: Use `GameTimeInitDialog` during campaign creation
4. **Notifications**: Enable time passage notifications for better awareness
5. **Manual Override**: Always allow manual time adjustments for edge cases

## Troubleshooting

### Common Issues

1. **Date Format Errors**: Ensure dates match the selected calendar system format
2. **Missing Time Detection**: Adjust confidence thresholds in settings
3. **Storage Issues**: Check file permissions for server-side storage
4. **Performance**: Disable auto-detection for very long messages

### Debug Mode

Enable detailed logging:

```tsx
const analysis = await service.analyzeMessageForTimePassage(message)
console.log("Time Analysis:", analysis)
```

## Contributing

The system is designed to be extensible. Key areas for contribution:

1. **Calendar Systems**: Add new calendar types
2. **Language Patterns**: Improve time detection accuracy
3. **UI Components**: Create new interface elements
4. **Integrations**: Connect with other systems

## 🎉 PROJECT COMPLETION STATUS

### ✅ COMPLETED FEATURES

**Core System**:
- ✅ Modular TypeScript architecture with full type safety
- ✅ Support for Dune Imperial Calendar and Standard Gregorian calendar
- ✅ JSON-based persistent storage (browser localStorage + file system)
- ✅ Extensible calendar system architecture for future custom calendars

**Time Detection & Analysis**:
- ✅ Intelligent narrative analysis with regex-based heuristics
- ✅ Configurable keywords and time intervals
- ✅ Automatic time passage detection from chat messages
- ✅ Manual time adjustment capabilities

**User Interface**:
- ✅ Complete initialization dialog with campaign metadata
- ✅ Interactive widget for time management
- ✅ Compact display integrated into chat UI
- ✅ Settings dialog for user preferences
- ✅ History dialog showing time passage events
- ✅ Toast notifications for time passage events

**Integration**:
- ✅ Full React context integration
- ✅ Game time provider integrated into global state
- ✅ Chat message flow integration with automatic detection
- ✅ Error handling and graceful degradation

**Documentation & Testing**:
- ✅ Comprehensive README with usage examples
- ✅ Test script for system verification
- ✅ TypeScript types and interfaces documented
- ✅ Integration guidelines and troubleshooting

### 🚀 READY FOR PRODUCTION

The system is now **complete and ready for use** in TTRPG campaigns! 

**To get started**:
1. Click the game time icon in the chat interface
2. Initialize with your campaign details
3. Start chatting - time will be tracked automatically
4. Use the widget for manual adjustments as needed

### 🔮 FUTURE ENHANCEMENTS (OPTIONAL)

- Custom calendar system implementation
- Machine learning-based time detection
- Multi-campaign workspace support
- Advanced analytics and reporting
- Import/export functionality for campaign data

---

## License

This game time tracking system is designed for use with TTRPG campaigns and educational purposes.
