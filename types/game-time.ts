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
  /** Player characters */
  characters?: string[]
  /** Character sheet information */
  characterInfo?: string
  /** Key Non-Player Characters information */
  keyNPCs?: string
  /** Important notes or reminders */
  notes?: string[]
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
