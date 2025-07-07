# Window Identifier Reference

This document provides a comprehensive list of all window identifiers used throughout the application. Each window/dialog has a unique identifier displayed in the upper left corner for easy reference.

## Window Identifier Format

Window IDs follow the pattern: `[COMPONENT]-[NUMBER]` or `[COMPONENT]-A[NUMBER]` for alerts

- Component abbreviation (2-3 letters)
- Dash separator
- Sequential number (001, 002, etc.) or A+number for alert dialogs

## Complete Window Identifier List

### Campaign & Game Time Management

- **CI-001** - Campaign Information Dialog (`CampaignInformationDialog`)
  - Campaign management window with Management tab only (Overview, Campaign Data, and Settings tabs removed)
- **CI-A01** - Campaign Information Delete Confirmation Alert
  - Alert dialog for confirming campaign deletion
- **GTI-001** - Game Time Init Dialog (`GameTimeInitDialog`)
  - Campaign initialization and setup dialog
- **GTS-001** - Game Time Settings Dialog (`GameTimeSettingsDialog`)
  - Game time configuration and settings
- **GTH-001** - Game Time History Dialog (`GameTimeHistoryDialog`)
  - Time passage history viewer
- **GTW-001** - Game Time Widget - Adjust Time Dialog
  - Dialog for adding/subtracting time from campaign
- **GTW-002** - Game Time Widget - Set Date Dialog
  - Dialog for setting specific campaign dates
- **CS-001** - Campaign Selector - Create Campaign Dialog
  - Manual campaign creation dialog
- **CS-002** - Campaign Selector - AI Create Campaign Dialog
  - AI-assisted campaign creation dialog
- **CS-A01** - Campaign Selector Delete Confirmation Alert
  - Alert dialog for confirming campaign deletion from selector
- **CDE-001** - Campaign Data Editor Dialog
  - Campaign data editing interface
- **CDE-A01** - Campaign Data Editor Delete Confirmation Alert
  - Alert dialog for confirming data deletion in editor
- **CM-A01** - Campaign Manager Delete Confirmation Alert
  - Alert dialog for campaign management deletions
- **BO-001** - Batch Operations Dialog
  - Bulk operations for campaign data

### User Interface & Settings

- **PS-001** - Profile Settings Sheet
  - User profile and API key configuration (left sidebar sheet)
- **CK-001** - Command K Dialog
  - Quick command and AI interaction dialog
- **IM-001** - Import Dialog
  - Data import interface
- **CP-001** - Change Password Dialog
  - Password modification dialog

### Chat & Content Management

- **UC-001** - Update Chat Dialog
  - Chat rename/edit dialog
- **DC-001** - Delete Chat Dialog
  - Chat deletion confirmation dialog
- **UF-001** - Update Folder Dialog
  - Folder rename/edit dialog
- **DF-001** - Delete Folder Dialog
  - Folder deletion confirmation dialog
- **SDI-001** - Sidebar Delete Item Dialog
  - Generic item deletion dialog (prompts, assistants, etc.)
- **CRS-001** - Chat Retrieval Settings Dialog
  - File retrieval configuration dialog
- **PP-001** - Prompt Picker Variables Dialog
  - Dialog for entering prompt variables

### Workspace Management

- **DW-001** - Delete Workspace Dialog
  - Workspace deletion confirmation dialog

### File & Media

- **FP-001** - File Preview Dialog
  - File and image preview modal

## Usage Guidelines

When referring to a specific window or dialog:

1. Use the window identifier (e.g., "CI-001") for precise reference
2. Include the descriptive name for clarity (e.g., "CI-001 (Campaign Information Dialog)")
3. Mention the current tab/section if applicable (e.g., "CI-001 Management tab")

## Examples of Window References

- "Open the Campaign Information Dialog (CI-001)"
- "In CI-001, navigate to the Management tab"
- "The Game Time Settings (GTS-001) can be accessed from the widget dropdown"
- "Configure your API keys in Profile Settings (PS-001)"
- "Use Command K (CK-001) for quick AI interactions"

## Visual Identification

Each window identifier appears as:

- Small gray badge in the upper left corner
- Monospace font for easy reading
- Semi-transparent background
- Dark theme: Light text on dark background
- Light theme: Dark text on light background

This system ensures consistent and unambiguous window identification throughout the application.
