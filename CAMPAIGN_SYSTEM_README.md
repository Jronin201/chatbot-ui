# Multi-Campaign Game Time System

A comprehensive campaign management system for TTRPG AI assistants with persistent, multi-campaign support.

## Features

### Campaign Management
- ✅ Create and manage multiple campaigns
- ✅ Switch between campaigns seamlessly
- ✅ Delete campaigns with confirmation
- ✅ Campaign-specific data storage
- ✅ Workspace-based campaign categorization
- ✅ Both user-driven and AI-driven campaign creation

### Data Persistence
- ✅ All campaign data saved to localStorage
- ✅ Campaign-specific storage for notes, NPCs, settings
- ✅ Automatic data backup and restoration
- ✅ Cross-session persistence
- ✅ Export/import functionality

### UI Components
- ✅ Campaign selector dropdown
- ✅ Campaign creation dialogs
- ✅ Campaign management interface
- ✅ Integrated with existing game time widget

## Components

### CampaignSelector
The main campaign selection component with dropdown interface.

```tsx
import { CampaignSelector } from "@/components/game-time/campaign-selector"

<CampaignSelector
  workspaceId="workspace-123"
  userId="user-456"
  onCampaignChange={(campaignId) => {
    console.log("Campaign changed:", campaignId)
  }}
/>
```

### CampaignManager
Full campaign management interface with list view and actions.

```tsx
import { CampaignManager } from "@/components/game-time/campaign-manager"

<CampaignManager
  workspaceId="workspace-123"
  userId="user-456"
  onCampaignChange={(campaignId) => {
    console.log("Campaign changed:", campaignId)
  }}
  showCreateActions={true}
/>
```

### GameTimeWidget (Enhanced)
The existing game time widget now includes campaign selector.

```tsx
import { GameTimeWidget } from "@/components/game-time/game-time-widget"

<GameTimeWidget
  workspaceId="workspace-123"
  userId="user-456"
  className="w-full"
/>
```

### useCampaigns Hook
React hook for programmatic campaign management.

```tsx
import { useCampaigns } from "@/lib/game-time/use-campaigns"

const {
  campaigns,
  currentCampaignId,
  isLoading,
  error,
  loadCampaigns,
  switchToCampaign,
  deleteCampaign,
  createCampaign
} = useCampaigns("workspace-123")
```

## Data Structure

### Campaign Summary
```typescript
interface CampaignSummary {
  id: string
  name: string
  gameSystem: string
  currentDate: string
  totalDaysElapsed: number
  lastUpdated: string
  workspaceId: string
  userId?: string
}
```

### Campaign Metadata
```typescript
interface CampaignMetadata {
  campaignName: string
  gameSystem: string
  gameMaster?: string
  workspaceId: string
  characterInfo?: string
  keyNPCs?: string
  notes?: string[]
}
```

## Storage

### localStorage Keys
- `chatbot-ui-campaigns`: List of all campaign summaries
- `chatbot-ui-current-campaign`: Current campaign ID
- `chatbot-ui-game-time-{campaignId}`: Campaign-specific game time data
- `chatbot-ui-time-history-{campaignId}`: Campaign-specific time passage history
- `chatbot-ui-game-time-settings-{campaignId}`: Campaign-specific settings

### Campaign-Specific Data
Each campaign maintains its own:
- Game time data (current date, calendar system, etc.)
- Time passage history
- Game time settings
- Notes and NPC information
- Character information

## Usage Examples

### Basic Campaign Selection
```tsx
function MyComponent() {
  return (
    <GameTimeProvider>
      <CampaignSelector
        workspaceId="my-workspace"
        onCampaignChange={(campaignId) => {
          // Handle campaign change
        }}
      />
    </GameTimeProvider>
  )
}
```

### Full Campaign Management
```tsx
function CampaignDashboard() {
  return (
    <GameTimeProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CampaignManager
          workspaceId="my-workspace"
          userId="current-user"
          onCampaignChange={(campaignId) => {
            // Handle campaign switching
          }}
        />
        <GameTimeWidget
          workspaceId="my-workspace"
          userId="current-user"
        />
      </div>
    </GameTimeProvider>
  )
}
```

### Programmatic Campaign Management
```tsx
function useCampaignLogic() {
  const {
    campaigns,
    currentCampaignId,
    createCampaign,
    switchToCampaign
  } = useCampaigns("my-workspace")

  const handleCreateNewCampaign = async () => {
    const campaignId = await createCampaign({
      name: "New Adventure",
      gameSystem: "D&D 5e",
      gameMaster: "DM Name",
      startDate: "Day 1",
      characterInfo: "Level 1 adventurers"
    })
    
    if (campaignId) {
      console.log("Created campaign:", campaignId)
    }
  }

  return { campaigns, currentCampaignId, handleCreateNewCampaign }
}
```

## Integration with Existing System

### GameTime Context
The existing `useGameTime` hook automatically loads data for the current campaign. When campaigns are switched, the context refreshes to show the new campaign's data.

### AI Integration
The system supports AI-driven campaign creation where users can describe their campaign idea and the AI helps set up the initial structure.

### Multi-Tenant Support
Campaigns are categorized by `workspaceId`, allowing for proper multi-tenant support where different workspaces maintain separate campaign lists.

## Future Enhancements

### Database Migration (Ready)
The system is designed to easily migrate from localStorage to database storage using the provided SQL schema in `supabase/migrations/20250703000000_add_campaigns.sql`.

### Campaign Import/Export
- Export campaigns as JSON files
- Import campaigns from backups
- Share campaigns between users

### Advanced Campaign Features
- Campaign templates
- Campaign sharing and collaboration
- Campaign statistics and analytics
- Integration with external TTRPG tools

## Technical Details

### Error Handling
- Graceful fallbacks for localStorage unavailability
- User-friendly error messages
- Automatic retry mechanisms

### Performance
- Efficient localStorage usage
- Lazy loading of campaign data
- Optimized re-renders

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Migration Path

### From Single Campaign to Multi-Campaign
Existing single-campaign data is automatically preserved and can be accessed without a campaign ID. The system maintains backward compatibility.

### From localStorage to Database
When ready, the system can be migrated to use the provided database schema while maintaining the same API surface.

## Contributing

When adding new features:

1. Update the relevant TypeScript interfaces
2. Add comprehensive error handling
3. Include proper accessibility features
4. Write unit tests for new functionality
5. Update documentation

## License

This component is part of the chatbot-ui project and follows the same licensing terms.
