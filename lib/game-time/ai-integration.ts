import { encode } from "gpt-tokenizer"
import { CampaignMetadata } from "@/types/game-time"
import { GameTimeService } from "./game-time-service"
import { GameTimeStorage } from "./storage"

// Token limits for each field to ensure they fit within context windows
const FIELD_TOKEN_LIMITS = {
  characterInfo: 800, // ~3200 characters
  keyNPCs: 600, // ~2400 characters
  notes: 400 // ~1600 characters
}

/**
 * AI integration utilities for Game Time system
 */
export class GameTimeAIIntegration {
  private static instance: GameTimeAIIntegration
  private gameTimeService: GameTimeService

  private constructor() {
    this.gameTimeService = GameTimeService.getInstance()
  }

  static getInstance(): GameTimeAIIntegration {
    if (!this.instance) {
      this.instance = new GameTimeAIIntegration()
    }
    return this.instance
  }

  /**
   * Smartly condense text to fit within token limits while preserving important information
   */
  private condenseText(text: string, maxTokens: number): string {
    if (!text?.trim()) return ""

    const tokens = encode(text)
    if (tokens.length <= maxTokens) return text

    // Smart condensation strategy:
    // 1. Split into sentences/sections
    // 2. Prioritize key information
    // 3. Maintain readability

    const lines = text.split("\n").filter(line => line.trim())
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())

    // If we have structured data (lines), preserve structure
    if (lines.length > 1 && lines.length < sentences.length) {
      return this.condenseLines(lines, maxTokens)
    }

    // Otherwise, condense sentences
    return this.condenseSentences(sentences, maxTokens)
  }

  /**
   * Condense structured lines (e.g., character stats, NPC entries)
   */
  private condenseLines(lines: string[], maxTokens: number): string {
    const prioritizedLines: Array<{
      line: string
      priority: number
      tokens: number
    }> = []

    for (const line of lines) {
      const tokens = encode(line).length
      let priority = 1

      // Prioritize lines with key information
      if (line.match(/name|level|class|race|stats?|hp|health|armor|AC/i))
        priority += 3
      if (line.match(/attitude|relationship|goal|motivation|important/i))
        priority += 2
      if (line.match(/background|history|description/i)) priority += 1
      if (line.match(/\d+|[+-]\d/)) priority += 1 // Numbers are often important

      prioritizedLines.push({ line: line.trim(), priority, tokens })
    }

    // Sort by priority (higher first)
    prioritizedLines.sort((a, b) => b.priority - a.priority)

    const result: string[] = []
    let tokenCount = 0

    for (const item of prioritizedLines) {
      if (tokenCount + item.tokens <= maxTokens) {
        result.push(item.line)
        tokenCount += item.tokens
      }
    }

    return result.join("\n")
  }

  /**
   * Condense sentences while preserving meaning
   */
  private condenseSentences(sentences: string[], maxTokens: number): string {
    const prioritizedSentences: Array<{
      sentence: string
      priority: number
      tokens: number
    }> = []

    for (const sentence of sentences) {
      const clean = sentence.trim()
      if (!clean) continue

      const tokens = encode(clean).length
      let priority = 1

      // Prioritize sentences with key information
      if (clean.match(/name|important|key|main|primary|critical/i))
        priority += 3
      if (clean.match(/stats?|abilities|skills|powers|equipment/i))
        priority += 2
      if (clean.match(/goal|motivation|attitude|relationship|alliance/i))
        priority += 2
      if (clean.match(/background|history|origin/i)) priority += 1

      prioritizedSentences.push({ sentence: clean, priority, tokens })
    }

    // Sort by priority
    prioritizedSentences.sort((a, b) => b.priority - a.priority)

    const result: string[] = []
    let tokenCount = 0

    for (const item of prioritizedSentences) {
      if (tokenCount + item.tokens <= maxTokens) {
        result.push(item.sentence)
        tokenCount += item.tokens
      }
    }

    return result.join(". ") + (result.length > 0 ? "." : "")
  }

  /**
   * Update a campaign field with AI-generated content, applying smart condensation
   */
  async updateCampaignField(
    fieldName: keyof Pick<CampaignMetadata, "characterInfo" | "keyNPCs">,
    newContent: string
  ): Promise<boolean> {
    try {
      const gameTimeData = await this.gameTimeService.loadGameTime()
      if (!gameTimeData?.campaignMetadata) {
        console.warn("No campaign metadata found")
        return false
      }

      const maxTokens = FIELD_TOKEN_LIMITS[fieldName]
      const condensedContent = this.condenseText(newContent, maxTokens)

      // Update the campaign metadata
      const updatedMetadata: CampaignMetadata = {
        ...gameTimeData.campaignMetadata,
        [fieldName]: condensedContent
      }

      // Save the updated metadata
      const updatedGameTimeData = {
        ...gameTimeData,
        campaignMetadata: updatedMetadata
      }

      await GameTimeStorage.saveGameTime(updatedGameTimeData)
      return true
    } catch (error) {
      console.error(`Error updating campaign field ${fieldName}:`, error)
      return false
    }
  }

  /**
   * Get condensed campaign information formatted for AI context
   */
  async getCampaignContextForAI(): Promise<string> {
    try {
      const gameTimeData = await this.gameTimeService.loadGameTime()
      if (!gameTimeData?.campaignMetadata) return ""

      const metadata = gameTimeData.campaignMetadata
      const contextParts: string[] = []

      // Campaign basic info
      if (metadata.campaignName) {
        contextParts.push(`Campaign: ${metadata.campaignName}`)
      }
      if (metadata.gameSystem) {
        contextParts.push(`System: ${metadata.gameSystem}`)
      }

      // Current game time
      contextParts.push(`Current Date: ${gameTimeData.currentDate}`)
      contextParts.push(`Calendar: ${gameTimeData.calendarSystem}`)
      contextParts.push(`Days Elapsed: ${gameTimeData.totalDaysElapsed}`)

      // Character information
      if (metadata.characters?.length) {
        contextParts.push(`Character: ${metadata.characters[0]}`)
      }

      if (metadata.characterInfo?.trim()) {
        const condensed = this.condenseText(
          metadata.characterInfo,
          FIELD_TOKEN_LIMITS.characterInfo
        )
        if (condensed) {
          contextParts.push(`Character Details:\n${condensed}`)
        }
      }

      // NPCs
      if (metadata.keyNPCs?.trim()) {
        const condensed = this.condenseText(
          metadata.keyNPCs,
          FIELD_TOKEN_LIMITS.keyNPCs
        )
        if (condensed) {
          contextParts.push(`Key NPCs:\n${condensed}`)
        }
      }

      // Campaign notes
      if (metadata.notes?.length) {
        const notesText = metadata.notes.join("\n")
        const condensed = this.condenseText(notesText, FIELD_TOKEN_LIMITS.notes)
        if (condensed) {
          contextParts.push(`Campaign Notes:\n${condensed}`)
        }
      }

      return contextParts.join("\n\n")
    } catch (error) {
      console.error("Error getting campaign context for AI:", error)
      return ""
    }
  }

  /**
   * Extract and condense content for a specific field from AI response
   */
  extractFieldContent(
    aiResponse: string,
    fieldType: "characterInfo" | "keyNPCs"
  ): string {
    // Look for structured content in the AI response
    const patterns = {
      characterInfo: [
        /(?:character\s+(?:sheet|info|details|stats))[\s\S]*?(?=\n\n|\n[A-Z]|$)/i,
        /(?:player\s+character)[\s\S]*?(?=\n\n|\n[A-Z]|$)/i,
        /(?:stats|abilities|skills)[\s\S]*?(?=\n\n|\n[A-Z]|$)/i
      ],
      keyNPCs: [
        /(?:npc|non-player\s+character|character)s?[\s\S]*?(?=\n\n|\n[A-Z]|$)/i,
        /(?:important\s+character)s?[\s\S]*?(?=\n\n|\n[A-Z]|$)/i,
        /(?:ally|enemy|contact)[\s\S]*?(?=\n\n|\n[A-Z]|$)/i
      ]
    }

    const fieldPatterns = patterns[fieldType]
    for (const pattern of fieldPatterns) {
      const match = aiResponse.match(pattern)
      if (match) {
        return this.condenseText(match[0].trim(), FIELD_TOKEN_LIMITS[fieldType])
      }
    }

    // If no specific patterns found, condense the entire response
    return this.condenseText(aiResponse, FIELD_TOKEN_LIMITS[fieldType])
  }

  /**
   * Calculate total tokens used by campaign context
   */
  async getCampaignContextTokenCount(): Promise<number> {
    const context = await this.getCampaignContextForAI()
    return encode(context).length
  }
}

export default GameTimeAIIntegration
