import { EnhancedCampaignData } from "./enhanced-campaign-data"

export interface GameTimeData {
  /** Current in-game date */
  currentDate: string
  /** Calendar system being used (e.g., "dune", "standard", "custom") */
  calendarSystem: CalendarSystem
  /** Starting date of the campaign */
  startDate: string
  /** Total days elapsed since campaign start */
  totalDaysElapsed: number
  /** Timestamp when this was last updated */
  lastUpdated: string
  /** Custom calendar configuration if using a custom system */
  customCalendarConfig?: CustomCalendarConfig
  /** Campaign-specific metadata */
  campaignMetadata?: CampaignMetadata
  /** Campaign ID for database persistence */
  campaignId?: string
  /** Enhanced modular campaign data */
  enhancedData?: EnhancedCampaignData
}

export interface CampaignRecord {
  /** Database ID */
  id: string
  /** User ID who owns this campaign */
  user_id: string
  /** Workspace this campaign belongs to */
  workspace_id: string
  /** Name of the campaign */
  name: string
  /** TTRPG system being used */
  game_system: string
  /** Game Master name */
  game_master?: string
  /** Current in-game date */
  current_date: string
  /** Calendar system being used */
  calendar_system: CalendarSystem
  /** Starting date of the campaign */
  start_date: string
  /** Total days elapsed since campaign start */
  total_days_elapsed: number
  /** Custom calendar configuration if using a custom system */
  custom_calendar_config?: CustomCalendarConfig
  /** Character sheet information */
  character_info?: string
  /** Key Non-Player Characters information */
  key_npcs?: string
  /** Important notes or reminders */
  notes?: string[]
  /** Player characters */
  characters?: string[]
  /** Creation timestamp */
  created_at: string
  /** Last updated timestamp */
  updated_at: string
}

export interface CustomCalendarConfig {
  /** Names of months */
  monthNames: string[]
  /** Number of days in each month */
  daysInMonth: number[]
  /** Names of days of the week */
  dayNames: string[]
  /** Starting year for the calendar */
  startingYear: number
  /** Any special events or holidays */
  specialEvents?: SpecialEvent[]
}

export interface SpecialEvent {
  /** Name of the event */
  name: string
  /** Date when the event occurs (recurring or specific) */
  date: string
  /** Description of the event */
  description?: string
  /** Whether this event recurs annually */
  recurring: boolean
}

export interface CampaignMetadata {
  /** Name of the campaign */
  campaignName?: string
  /** TTRPG system being used */
  gameSystem: string
  /** Game Master name */
  gameMaster?: string
  /** Game Master Assistant ID */
  gameMasterAssistantId?: string
  /** Player characters */
  characters?: string[]
  /** Character sheet information */
  characterInfo?: string
  /** Key Non-Player Characters information */
  keyNPCs?: string
  /** Important notes or reminders */
  notes?: string[]
  /** Campaign plot overview */
  campaignPlot?: string
  /** Campaign goal and objectives */
  campaignGoal?: string
  /** First subplot */
  subplot1?: string
  /** Second subplot */
  subplot2?: string
  /** Third subplot */
  subplot3?: string
  /** Starting location */
  startingLocation?: string
  /** Starting situation */
  startingSituation?: string
  /** Workspace ID this campaign belongs to */
  workspaceId?: string
}

export interface TimePassageEvent {
  /** Description of what happened */
  description: string
  /** Number of days that passed */
  daysElapsed: number
  /** Previous date */
  previousDate: string
  /** New date after time passage */
  newDate: string
  /** Timestamp when this event was recorded */
  timestamp: string
}

export interface DuneCalendarDate {
  /** Year in the Dune calendar */
  year: number
  /** Month (1-12) */
  month: number
  /** Day of the month */
  day: number
  /** Optional: Guild calendar reference */
  guildYear?: number
}

export interface GameTimeSettings {
  /** Whether to automatically detect time passage from chat messages */
  autoDetectTimePassage: boolean
  /** Whether to show time passage notifications */
  showTimePassageNotifications: boolean
  /** Default number of days for common activities */
  defaultTimeIntervals: {
    travel: number
    rest: number
    training: number
    research: number
    shopping: number
  }
  /** Custom time passage keywords and their associated durations */
  customKeywords: Record<string, number>
}

export type CalendarSystem = "dune" | "standard" | "custom"

export interface GameTimeContextType {
  gameTimeData: GameTimeData | null
  timePassageHistory: TimePassageEvent[]
  settings: GameTimeSettings
  isLoading: boolean
  error: string | null

  // Actions
  initializeGameTime: (
    startDate: string,
    calendarSystem: CalendarSystem,
    campaignMetadata?: CampaignMetadata
  ) => Promise<void>
  updateGameTime: (daysElapsed: number, description: string) => Promise<void>
  setGameTime: (newDate: string, description: string) => Promise<void>
  deleteGameTime: () => Promise<void>
  loadGameTime: () => Promise<void>
  analyzeMessageForTimePassage: (message: string) => Promise<number>
  formatDate: (dateString: string, calendarSystem?: CalendarSystem) => string
  updateSettings: (newSettings: Partial<GameTimeSettings>) => Promise<void>
}
