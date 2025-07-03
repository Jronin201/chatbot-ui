/**
 * Time Change Handler - Automatically updates campaign information when time changes
 */

import GameTimeAIIntegration from "@/lib/game-time/ai-integration"
import { GameTimeService } from "@/lib/game-time/game-time-service"
import { TimePassageEvent } from "@/types/game-time"

/**
 * Handle time changes and automatically update campaign information
 */
export class TimeChangeHandler {
  private static instance: TimeChangeHandler
  private aiIntegration: GameTimeAIIntegration
  private gameTimeService: GameTimeService

  private constructor() {
    this.aiIntegration = GameTimeAIIntegration.getInstance()
    this.gameTimeService = GameTimeService.getInstance()
  }

  static getInstance(): TimeChangeHandler {
    if (!this.instance) {
      this.instance = new TimeChangeHandler()
    }
    return this.instance
  }

  /**
   * Process a time change event and update campaign information
   */
  async handleTimeChange(
    timePassageEvent: TimePassageEvent,
    chatContext: string = ""
  ): Promise<{
    success: boolean
    updates: string[]
    errors: string[]
  }> {
    const updates: string[] = []
    const errors: string[] = []

    try {
      // Process the time change with AI integration
      const result = await this.aiIntegration.processTimeChange(
        timePassageEvent.previousDate,
        timePassageEvent.newDate,
        timePassageEvent.daysElapsed,
        chatContext
      )

      if (result.notesUpdated) {
        updates.push("Campaign notes updated for time progression")
      }

      if (result.npcsUpdated) {
        updates.push("NPC information updated for time progression")
      }

      updates.push(...result.updates)

      return {
        success: updates.length > 0,
        updates,
        errors
      }
    } catch (error) {
      const errorMessage = `Failed to process time change: ${error instanceof Error ? error.message : "Unknown error"}`
      errors.push(errorMessage)
      console.error("Time change handler error:", error)

      return {
        success: false,
        updates,
        errors
      }
    }
  }

  /**
   * Generate AI prompt for time-based updates
   */
  generateTimeUpdatePrompt(
    previousDate: string,
    newDate: string,
    daysElapsed: number,
    chatContext: string
  ): string {
    const timeframe = this.categorizeTimeframe(daysElapsed)

    return `
The in-game time has changed from ${previousDate} to ${newDate} (${daysElapsed} days elapsed).

Context of recent events: ${chatContext}

Please review and update the campaign information considering this ${timeframe} time passage:

1. CAMPAIGN NOTES: Update with time progression effects, consequences of recent events, and what might have happened during this time period.

2. KEY NPCs: Review each NPC and update their status, location, activities, or relationships based on the time that has passed and recent events.

Consider the following for ${timeframe} time passage:
${this.getTimeframConsiderations(daysElapsed)}

Use the update_campaign_info tool to make these updates.
`
  }

  /**
   * Categorize timeframe for appropriate updates
   */
  private categorizeTimeframe(daysElapsed: number): string {
    if (daysElapsed < 1) return "immediate"
    if (daysElapsed < 7) return "short-term"
    if (daysElapsed < 30) return "medium-term"
    if (daysElapsed < 365) return "long-term"
    return "extended"
  }

  /**
   * Get timeframe-specific considerations
   */
  private getTimeframConsiderations(daysElapsed: number): string {
    const considerations: string[] = []

    if (daysElapsed >= 1) {
      considerations.push("- Daily activities and immediate consequences")
      considerations.push("- Healing from injuries or illnesses")
      considerations.push("- Travel progress and arrival at destinations")
    }

    if (daysElapsed >= 7) {
      considerations.push("- Weekly routines and recurring events")
      considerations.push("- Market restocking and economic changes")
      considerations.push("- NPC mood and relationship changes")
      considerations.push("- Completion of short-term tasks")
    }

    if (daysElapsed >= 30) {
      considerations.push("- Monthly events and seasonal changes")
      considerations.push("- Completion of major projects or training")
      considerations.push(
        "- Significant life events (births, deaths, marriages)"
      )
      considerations.push("- Political and social developments")
    }

    if (daysElapsed >= 365) {
      considerations.push("- Annual events and long-term consequences")
      considerations.push("- Character aging and major life changes")
      considerations.push("- Societal and world-level changes")
      considerations.push("- Completion of epic quests or storylines")
    }

    return considerations.join("\n")
  }

  /**
   * Check if time change warrants automatic updates
   */
  shouldTriggerAutomaticUpdate(daysElapsed: number): boolean {
    // Trigger updates for any meaningful time passage
    return daysElapsed >= 1
  }

  /**
   * Extract relevant context from recent chat messages
   */
  extractRelevantContext(messages: string[]): string {
    // Combine recent messages and extract key events
    const recentContext = messages.slice(-3).join(" ")

    // Look for important events, character actions, NPC interactions
    const relevantPatterns = [
      /(?:met|encountered|spoke with|fought|helped|visited)/i,
      /(?:gained|lost|acquired|learned|discovered)/i,
      /(?:traveled to|arrived at|left|departed)/i,
      /(?:completed|finished|started|began)/i
    ]

    const relevantSentences = recentContext.split(/[.!?]+/).filter(sentence => {
      return relevantPatterns.some(pattern => pattern.test(sentence))
    })

    return relevantSentences.join(". ").trim()
  }
}

export default TimeChangeHandler
