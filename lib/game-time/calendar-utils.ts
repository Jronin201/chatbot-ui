import {
  GameTimeData,
  DuneCalendarDate,
  CalendarSystem,
  CustomCalendarConfig
} from "@/types/game-time"

/**
 * Dune Calendar System utilities
 * Based on the Imperial Calendar system from Dune: Adventures in the Imperium
 */

export const DUNE_CALENDAR = {
  MONTHS: [
    "Ignis",
    "Leonis",
    "Nivis",
    "Ventus",
    "Stiria",
    "Vicus",
    "Salus",
    "Hetera",
    "Mollis",
    "Umbra",
    "Frigidus",
    "Kamar"
  ],
  DAYS_IN_MONTH: 30, // Each month has exactly 30 days
  DAYS_IN_YEAR: 360, // 12 months × 30 days = 360 days per year
  MONTHS_IN_YEAR: 12,
  DAYS_IN_WEEK: 6, // Six-day weeks
  WEEK_DAYS: [
    "Solis", // Day of the Sun
    "Lunis", // Day of the Moon
    "Terris", // Day of the Earth
    "Aquae", // Day of Water
    "Ventis", // Day of Wind
    "Ignis" // Day of Fire
  ],
  IMPERIAL_EPOCH: 10191 // Standard Imperial dating epoch (A.G. - After Guild)
}

export class GameTimeManager {
  /**
   * Parse a date string into components based on the calendar system
   */
  static parseDate(dateString: string, calendarSystem: CalendarSystem): any {
    switch (calendarSystem) {
      case "dune":
        return this.parseDuneDate(dateString)
      case "standard":
        return this.parseStandardDate(dateString)
      case "custom":
        // Will need custom calendar config for this
        return this.parseStandardDate(dateString)
      default:
        return this.parseStandardDate(dateString)
    }
  }

  /**
   * Parse Dune calendar date (format: "Day Month Year A.G." or "15 Ignis 10191 A.G.")
   */
  static parseDuneDate(dateString: string): DuneCalendarDate {
    // Remove "A.G." suffix if present
    const cleanDate = dateString.replace(/\s*A\.G\.?\s*$/i, "").trim()

    // Try different formats
    const patterns = [
      /^(\d{1,2})\s+(\w+)\s+(\d+)$/, // "15 Ignis 10191"
      /^(\w+)\s+(\d{1,2}),?\s+(\d+)$/, // "Ignis 15, 10191"
      /^(\d{1,2})\/(\d{1,2})\/(\d+)$/ // "15/1/10191" (day/month/year)
    ]

    for (const pattern of patterns) {
      const match = cleanDate.match(pattern)

      if (match) {
        if (pattern === patterns[0]) {
          // "15 Ignis 10191"
          const day = parseInt(match[1])
          const monthName = match[2]
          const year = parseInt(match[3])
          const monthIndex = DUNE_CALENDAR.MONTHS.findIndex(
            m => m.toLowerCase() === monthName.toLowerCase()
          )
          const month = monthIndex + 1

          if (month > 0 && day >= 1 && day <= 30) {
            return { year, month, day }
          }
        } else if (pattern === patterns[1]) {
          // "Ignis 15, 10191"
          const monthName = match[1]
          const day = parseInt(match[2])
          const year = parseInt(match[3])
          const monthIndex = DUNE_CALENDAR.MONTHS.findIndex(
            m => m.toLowerCase() === monthName.toLowerCase()
          )
          const month = monthIndex + 1

          if (month > 0 && day >= 1 && day <= 30) {
            return { year, month, day }
          }
        } else if (pattern === patterns[2]) {
          // "15/1/10191"
          const day = parseInt(match[1])
          const month = parseInt(match[2])
          const year = parseInt(match[3])

          if (month >= 1 && month <= 12 && day >= 1 && day <= 30) {
            return { year, month, day }
          }
        }
      }
    }

    const validFormats = [
      'Day Month Year A.G. (e.g., "1 Ignis 10191 A.G.")',
      'Day Month Year (e.g., "1 Ignis 10191")',
      'Month Day, Year (e.g., "Ignis 1, 10191")'
    ]

    throw new Error(
      `Invalid Dune calendar date format: "${dateString}"\n\n` +
        `Valid formats:\n${validFormats.map(f => `• ${f}`).join("\n")}\n\n` +
        `Valid months: ${DUNE_CALENDAR.MONTHS.join(", ")}`
    )
  }

  /**
   * Parse standard Gregorian date
   */
  static parseStandardDate(dateString: string): Date {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid standard date format: ${dateString}`)
    }
    return date
  }

  /**
   * Format a date according to the calendar system
   */
  static formatDate(
    dateString: string,
    calendarSystem: CalendarSystem = "standard",
    customConfig?: CustomCalendarConfig
  ): string {
    try {
      switch (calendarSystem) {
        case "dune":
          return this.formatDuneDate(dateString)
        case "custom":
          return this.formatCustomDate(dateString, customConfig)
        case "standard":
        default:
          return this.formatStandardDate(dateString)
      }
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString // Return original if formatting fails
    }
  }

  /**
   * Format a Dune calendar date
   */
  static formatDuneDate(dateString: string): string {
    try {
      const duneDate = this.parseDuneDate(dateString)
      const monthName = DUNE_CALENDAR.MONTHS[duneDate.month - 1]
      return `${duneDate.day} ${monthName} ${duneDate.year} A.G.`
    } catch (error) {
      // If parsing fails, return the original string
      console.warn(`Could not format Dune date: ${dateString}`, error)
      return dateString
    }
  }

  /**
   * Format a Dune date with additional information (day of week, etc.)
   */
  static formatDuneDateExtended(dateString: string): string {
    try {
      const duneDate = this.parseDuneDate(dateString)
      const monthName = DUNE_CALENDAR.MONTHS[duneDate.month - 1]
      const weekDay = this.getDuneWeekDay(duneDate)
      const baseFormat = `${duneDate.day} ${monthName} ${duneDate.year} A.G.`
      return `${weekDay}, ${baseFormat}`
    } catch (error) {
      return dateString
    }
  }

  /**
   * Format a standard date
   */
  static formatStandardDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    } catch (error) {
      return dateString
    }
  }

  /**
   * Format a custom calendar date
   */
  static formatCustomDate(
    dateString: string,
    customConfig?: CustomCalendarConfig
  ): string {
    if (!customConfig) {
      return this.formatStandardDate(dateString)
    }

    // Implementation would depend on custom calendar configuration
    // For now, fall back to standard formatting
    return this.formatStandardDate(dateString)
  }

  /**
   * Add days to a date string
   */
  static addDays(
    dateString: string,
    daysToAdd: number,
    calendarSystem: CalendarSystem = "standard"
  ): string {
    try {
      switch (calendarSystem) {
        case "dune":
          return this.addDaysDuneDate(dateString, daysToAdd)
        case "standard":
        default:
          return this.addDaysStandardDate(dateString, daysToAdd)
      }
    } catch (error) {
      console.error("Error adding days to date:", error)
      return dateString
    }
  }

  /**
   * Add days to a Dune calendar date string
   */
  static addDaysDuneDate(dateString: string, daysToAdd: number): string {
    const duneDate = this.parseDuneDate(dateString)
    const newDuneDate = this.addDaysToDuneDate(duneDate, daysToAdd)
    const monthName = DUNE_CALENDAR.MONTHS[newDuneDate.month - 1]
    return `${newDuneDate.day} ${monthName} ${newDuneDate.year} A.G.`
  }

  /**
   * Add days to a standard date
   */
  static addDaysStandardDate(dateString: string, daysToAdd: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + daysToAdd)
    return date.toISOString().split("T")[0] // Return in YYYY-MM-DD format
  }

  /**
   * Calculate the difference in days between two dates
   */
  static daysDifference(
    date1: string,
    date2: string,
    calendarSystem: CalendarSystem = "standard"
  ): number {
    try {
      switch (calendarSystem) {
        case "dune":
          return this.daysDifferenceDune(date1, date2)
        case "standard":
        default:
          return this.daysDifferenceStandard(date1, date2)
      }
    } catch (error) {
      console.error("Error calculating days difference:", error)
      return 0
    }
  }

  /**
   * Calculate days difference for Dune calendar
   */
  static daysDifferenceDune(date1: string, date2: string): number {
    const duneDate1 = this.parseDuneDate(date1)
    const duneDate2 = this.parseDuneDate(date2)
    return this.daysBetweenDuneDates(duneDate1, duneDate2)
  }

  /**
   * Calculate days difference for standard calendar
   */
  static daysDifferenceStandard(date1: string, date2: string): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const timeDifference = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(timeDifference / (1000 * 3600 * 24))
  }

  /**
   * Validate a date string for the given calendar system
   */
  static isValidDate(
    dateString: string,
    calendarSystem: CalendarSystem
  ): boolean {
    try {
      switch (calendarSystem) {
        case "dune":
          this.parseDuneDate(dateString)
          return true
        case "standard":
          const date = new Date(dateString)
          return !isNaN(date.getTime())
        default:
          return true
      }
    } catch (error) {
      return false
    }
  }

  /**
   * Get a default starting date for a calendar system
   */
  static getDefaultStartDate(calendarSystem: CalendarSystem): string {
    switch (calendarSystem) {
      case "dune":
        return "1 Ignis 10191 A.G."
      case "standard":
        return new Date().toISOString().split("T")[0]
      default:
        return new Date().toISOString().split("T")[0]
    }
  }

  /**
   * Convert a Dune calendar date to total days since epoch
   * This enables proper date arithmetic for the Dune calendar system
   */
  static duneDateToDays(duneDate: DuneCalendarDate): number {
    const { year, month, day } = duneDate

    // Calculate total days from years (360 days per year)
    const yearDays =
      (year - DUNE_CALENDAR.IMPERIAL_EPOCH) * DUNE_CALENDAR.DAYS_IN_YEAR

    // Calculate days from completed months in current year (30 days per month)
    const monthDays = (month - 1) * DUNE_CALENDAR.DAYS_IN_MONTH

    // Add the current day
    return yearDays + monthDays + day - 1 // -1 because we count from day 0
  }

  /**
   * Convert total days since epoch back to Dune calendar date
   */
  static daysToDuneDate(totalDays: number): DuneCalendarDate {
    // Calculate the year
    const yearsSinceEpoch = Math.floor(totalDays / DUNE_CALENDAR.DAYS_IN_YEAR)
    const year = DUNE_CALENDAR.IMPERIAL_EPOCH + yearsSinceEpoch

    // Calculate remaining days in the current year
    const daysInCurrentYear = totalDays % DUNE_CALENDAR.DAYS_IN_YEAR

    // Calculate the month (1-based)
    const month =
      Math.floor(daysInCurrentYear / DUNE_CALENDAR.DAYS_IN_MONTH) + 1

    // Calculate the day within the month (1-based)
    const day = (daysInCurrentYear % DUNE_CALENDAR.DAYS_IN_MONTH) + 1

    return { year, month, day }
  }

  /**
   * Add days to a Dune calendar date
   */
  static addDaysToDuneDate(
    duneDate: DuneCalendarDate,
    daysToAdd: number
  ): DuneCalendarDate {
    const totalDays = this.duneDateToDays(duneDate)
    const newTotalDays = totalDays + daysToAdd
    return this.daysToDuneDate(newTotalDays)
  }

  /**
   * Calculate the difference in days between two Dune calendar dates
   */
  static daysBetweenDuneDates(
    startDate: DuneCalendarDate,
    endDate: DuneCalendarDate
  ): number {
    const startDays = this.duneDateToDays(startDate)
    const endDays = this.duneDateToDays(endDate)
    return endDays - startDays
  }

  /**
   * Get the day of the week for a Dune calendar date
   */
  static getDuneWeekDay(duneDate: DuneCalendarDate): string {
    const totalDays = this.duneDateToDays(duneDate)
    const weekDayIndex = totalDays % DUNE_CALENDAR.DAYS_IN_WEEK
    return DUNE_CALENDAR.WEEK_DAYS[weekDayIndex]
  }
}
