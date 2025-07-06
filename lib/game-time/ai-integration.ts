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
   * Update campaign notes with AI-generated content and chat context
   */
  async updateCampaignNotes(
    newNotes: string,
    chatContext?: string
  ): Promise<boolean> {
    try {
      const gameTimeData = await this.gameTimeService.loadGameTime()
      if (!gameTimeData?.campaignMetadata) {
        console.warn("No campaign metadata found")
        return false
      }

      // Skip update if the new notes are empty or just technical metadata
      if (!newNotes || newNotes.trim().length < 10) {
        return false
      }

      const existingNotes = gameTimeData.campaignMetadata.notes || []
      const existingNotesText = existingNotes.join("\n")

      // Instead of appending technical information, create a clean narrative update
      let updatedContent = existingNotesText

      // Only add meaningful story content
      if (
        newNotes &&
        !newNotes.match(/^(Time Progression|Context|Duration|Auto-detected)/i)
      ) {
        // Add the new notes as a story progression entry
        if (updatedContent.trim()) {
          updatedContent += "\n\n" + newNotes
        } else {
          updatedContent = newNotes
        }
      }

      // Condense the content to keep it manageable
      const condensedContent = this.condenseText(
        updatedContent,
        FIELD_TOKEN_LIMITS.notes
      )

      // Convert back to array format, filtering out empty lines
      const updatedNotes = condensedContent
        .split("\n")
        .filter(line => line.trim())
        .filter(
          line =>
            !line.match(/^(Time Progression|Context|Duration|Auto-detected)/i)
        )

      // Update the campaign metadata
      const updatedMetadata: CampaignMetadata = {
        ...gameTimeData.campaignMetadata,
        notes: updatedNotes
      }

      // Save the updated metadata
      const updatedGameTimeData = {
        ...gameTimeData,
        campaignMetadata: updatedMetadata
      }

      await GameTimeStorage.saveGameTime(updatedGameTimeData)
      return true
    } catch (error) {
      console.error("Error updating campaign notes:", error)
      return false
    }
  }

  /**
   * Process time change and update campaign information accordingly
   */
  async processTimeChange(
    previousDate: string,
    newDate: string,
    daysElapsed: number,
    chatContext: string
  ): Promise<{
    notesUpdated: boolean
    npcsUpdated: boolean
    updates: string[]
  }> {
    const updates: string[] = []
    let notesUpdated = false
    let npcsUpdated = false

    try {
      // First, clean up any existing contaminated campaign notes
      await this.cleanupExistingCampaignNotes()

      // Generate meaningful campaign summary instead of technical notes
      const campaignSummary = await this.generateCampaignSummary(
        chatContext,
        daysElapsed
      )

      if (campaignSummary) {
        // Update campaign notes with the comprehensive summary
        const gameTimeData = await this.gameTimeService.loadGameTime()
        if (gameTimeData?.campaignMetadata) {
          const updatedMetadata = {
            ...gameTimeData.campaignMetadata,
            notes: campaignSummary.split("\n").filter(line => line.trim())
          }

          const updatedGameTimeData = {
            ...gameTimeData,
            campaignMetadata: updatedMetadata
          }

          await GameTimeStorage.saveGameTime(updatedGameTimeData)
          notesUpdated = true
          updates.push("Campaign notes updated with story progression")
        }
      }

      // Check and update NPC information based on time passage
      const npcUpdates = await this.checkAndUpdateNPCsForTimeChange(
        daysElapsed,
        chatContext
      )

      if (npcUpdates) {
        npcsUpdated = await this.updateCampaignField("keyNPCs", npcUpdates)
        if (npcsUpdated) {
          updates.push("NPC information updated for time progression")
        }
      }

      return { notesUpdated, npcsUpdated, updates }
    } catch (error) {
      console.error("Error processing time change:", error)
      return { notesUpdated: false, npcsUpdated: false, updates: [] }
    }
  }

  /**
   * Generate time-based notes for campaign progression
   */
  private generateTimeBasedNotes(
    previousDate: string,
    newDate: string,
    daysElapsed: number,
    chatContext: string
  ): string {
    // Filter out technical auto-detection information from chat context
    const cleanContext = this.cleanChatContext(chatContext)

    if (!cleanContext || cleanContext.length < 10) {
      // If no meaningful context, return empty string to avoid cluttering notes
      return ""
    }

    // Create story-focused notes based on the cleaned context
    const storyNotes = this.extractStoryElements(cleanContext, daysElapsed)

    return storyNotes
  }

  /**
   * Clean chat context by removing technical auto-detection metadata
   */
  private cleanChatContext(chatContext: string): string {
    if (!chatContext) return ""

    // Remove auto-detection prefixes and technical information
    let cleaned = chatContext
      .replace(/Auto-detected:\s*/gi, "")
      .replace(/Detected\s+\w+\s+activity:\s*/gi, "")
      .replace(/Estimated\s+\d+\s+day\(s\)\s+elapsed\.?/gi, "")
      .replace(/Context:\s*/gi, "")
      .replace(/Time Progression:[^\n]*/gi, "")
      .replace(/Duration:[^\n]*/gi, "")
      .replace(/\[Recent Events\][^\n]*/gi, "")
      .replace(/\[Updated Notes\][^\n]*/gi, "")
      .replace(/Primary Goals:/gi, "")
      .replace(
        /\*\*\s*(Story Progress|Plot Elements|Active Goals|Current Situation)\s*:\*\*$/gim,
        ""
      )

    // Remove lines that are purely auto-detection information
    cleaned = cleaned
      .split("\n")
      .filter(line => {
        const trimmed = line.trim()
        if (trimmed.length < 5) return false

        // Remove auto-detection lines
        if (
          trimmed.match(
            /^Auto-detected:|^Context:|^Time Progression:|^Duration:|^Estimated|\d+\s+day\(s\)\s+elapsed|and \d+ other time indicator|time indicator\(s\)/i
          )
        ) {
          return false
        }

        // Remove lines that are just technical metadata
        if (trimmed.match(/^\d+\s+(day|week|month|year)s?\s+ago:\s*$/i)) {
          return false
        }

        return true
      })
      .join("\n")

    // Remove quoted fragments that are just detection descriptions
    cleaned = cleaned.replace(
      /"[^"]*(?:travel|journey|rest|activity)[^"]*"/gi,
      ""
    )

    // Remove patterns like "X days ago: Auto-detected"
    cleaned = cleaned.replace(
      /\d+\s+(day|week|month|year)s?\s+ago:\s*Auto-detected[^\n]*/gi,
      ""
    )

    // Clean up multiple newlines and spaces
    cleaned = cleaned
      .replace(/\n\s*\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim()

    return cleaned
  }

  /**
   * Extract meaningful story elements from the cleaned context
   */
  private extractStoryElements(context: string, daysElapsed: number): string {
    if (!context) return ""

    // Look for story elements in the context
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 5)
    const storyElements: string[] = []

    // Prioritize sentences that contain story elements
    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (trimmed.length < 5) continue

      // Skip purely technical sentences
      if (trimmed.match(/^\d+\s+day|duration|progression|elapsed/i)) continue

      // Include sentences that seem to contain story content
      if (
        trimmed.match(
          /\b(character|npc|location|event|quest|mission|goal|situation|plot|story)\b/i
        ) ||
        trimmed.match(
          /\b(traveled|journeyed|arrived|departed|met|encountered|discovered|found|completed)\b/i
        ) ||
        trimmed.length > 20
      ) {
        storyElements.push(trimmed)
      }
    }

    if (storyElements.length === 0) return ""

    // Create a concise summary focusing on story progression
    const timeContext = this.getTimeContext(daysElapsed)
    const summary = storyElements.slice(0, 2).join(". ") + "."

    return `${timeContext}: ${summary}`
  }

  /**
   * Get appropriate time context description
   */
  private getTimeContext(daysElapsed: number): string {
    if (daysElapsed < 1) return "Recently"
    if (daysElapsed === 1) return "Yesterday"
    if (daysElapsed < 7) return `${daysElapsed} days ago`
    if (daysElapsed < 30)
      return `${Math.floor(daysElapsed / 7)} week${Math.floor(daysElapsed / 7) > 1 ? "s" : ""} ago`
    if (daysElapsed < 365)
      return `${Math.floor(daysElapsed / 30)} month${Math.floor(daysElapsed / 30) > 1 ? "s" : ""} ago`
    return `${Math.floor(daysElapsed / 365)} year${Math.floor(daysElapsed / 365) > 1 ? "s" : ""} ago`
  }

  /**
   * Check and update NPC information based on time passage
   */
  private async checkAndUpdateNPCsForTimeChange(
    daysElapsed: number,
    chatContext: string
  ): Promise<string | null> {
    try {
      const gameTimeData = await this.gameTimeService.loadGameTime()
      const currentNPCs = gameTimeData?.campaignMetadata?.keyNPCs || ""
      const npcUpdates: string[] = []

      // First, detect any new NPCs from the chat context
      const newNPCs = this.extractNewNPCsFromContext(chatContext)

      // Parse existing NPCs
      const npcLines = currentNPCs.split("\n").filter(line => line.trim())
      const existingNPCNames = new Set<string>()

      // Extract existing NPC names for comparison
      for (const npcLine of npcLines) {
        const nameMatch = npcLine.match(/^([^:\-]+)/)
        if (nameMatch) {
          existingNPCNames.add(nameMatch[1].trim().toLowerCase())
        }
      }

      // Add new NPCs that aren't already in the list
      for (const newNPC of newNPCs) {
        const nameMatch = newNPC.match(/^([^:\-]+)/)
        if (nameMatch) {
          const npcName = nameMatch[1].trim().toLowerCase()
          if (!existingNPCNames.has(npcName)) {
            npcUpdates.push(`[New]: ${newNPC}`)
          }
        }
      }

      // Generate time-based updates for existing NPCs
      for (const npcLine of npcLines) {
        const timeBasedUpdate = this.generateNPCTimeUpdate(
          npcLine,
          daysElapsed,
          chatContext
        )
        if (timeBasedUpdate) {
          npcUpdates.push(timeBasedUpdate)
        }
      }

      if (npcUpdates.length === 0) return null

      // Combine original NPCs with updates and new NPCs
      const sections: string[] = []

      if (currentNPCs.trim()) {
        sections.push(currentNPCs.trim())
      }

      if (npcUpdates.length > 0) {
        sections.push("")
        sections.push("[Recent Updates]")
        sections.push(...npcUpdates)
      }

      return sections.join("\n")
    } catch (error) {
      console.error("Error checking NPCs for time change:", error)
      return null
    }
  }

  /**
   * Generate time-based updates for individual NPCs
   */
  private generateNPCTimeUpdate(
    npcLine: string,
    daysElapsed: number,
    chatContext: string
  ): string | null {
    // Extract NPC name (assuming format like "Name: description" or "Name - description")
    const nameMatch = npcLine.match(/^([^:\-]+)/)
    if (!nameMatch) return null

    const npcName = nameMatch[1].trim()
    const updates: string[] = []

    // Generate context-aware updates based on time passage
    if (daysElapsed >= 1) {
      // Daily considerations
      if (npcLine.match(/injured|wounded|sick|ill/i)) {
        updates.push(`${npcName}: May have recovered from injuries/illness`)
      }
      if (npcLine.match(/traveling|journey|quest/i)) {
        updates.push(`${npcName}: Travel progress should be considered`)
      }
    }

    if (daysElapsed >= 7) {
      // Weekly considerations
      if (npcLine.match(/merchant|trader|shopkeeper/i)) {
        updates.push(`${npcName}: Likely restocked inventory`)
      }
      if (npcLine.match(/angry|hostile|upset/i)) {
        updates.push(`${npcName}: Anger may have cooled over time`)
      }
    }

    if (daysElapsed >= 30) {
      // Monthly considerations
      if (npcLine.match(/pregnant|expecting/i)) {
        updates.push(`${npcName}: Pregnancy progression should be noted`)
      }
      if (npcLine.match(/training|learning|studying/i)) {
        updates.push(`${npcName}: May have completed training/studies`)
      }
    }

    if (daysElapsed >= 365) {
      // Yearly considerations
      updates.push(`${npcName}: Consider aging and long-term life changes`)
    }

    // Context-specific updates
    if (chatContext.toLowerCase().includes(npcName.toLowerCase())) {
      updates.push(`${npcName}: Directly involved in recent events`)
    }

    return updates.length > 0 ? updates.join("\n") : null
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

  /**
   * Generate a comprehensive campaign summary focusing on story elements
   */
  async generateCampaignSummary(
    recentEvents: string,
    daysElapsed: number
  ): Promise<string> {
    const gameTimeData = await this.gameTimeService.loadGameTime()
    if (!gameTimeData?.campaignMetadata) {
      return ""
    }

    // Clean the recent events first
    const cleanEvents = this.cleanChatContext(recentEvents)
    if (!cleanEvents || cleanEvents.length < 10) {
      // If no meaningful recent events, just return cleaned existing notes
      const currentNotes = gameTimeData.campaignMetadata.notes || []
      const cleanExistingNotes = currentNotes
        .map(note => this.cleanChatContext(note))
        .filter(note => note && note.length > 10)
        .join("\n")

      return cleanExistingNotes
    }

    // Extract story elements from recent events
    const storyElements = this.extractStoryElements(cleanEvents, daysElapsed)

    if (!storyElements) {
      // Return cleaned existing notes if no story elements found
      const currentNotes = gameTimeData.campaignMetadata.notes || []
      const cleanExistingNotes = currentNotes
        .map(note => this.cleanChatContext(note))
        .filter(note => note && note.length > 10)
        .join("\n")

      return cleanExistingNotes
    }

    // Get existing clean notes
    const currentNotes = gameTimeData.campaignMetadata.notes || []
    const cleanExistingNotes = currentNotes
      .map(note => this.cleanChatContext(note))
      .filter(note => note && note.length > 10)
      .join("\n")

    // Create a focused summary that builds on existing notes
    const sections = this.organizeCampaignNotes(
      cleanExistingNotes,
      storyElements
    )

    return sections.join("\n\n")
  }

  /**
   * Organize campaign notes into logical sections
   */
  private organizeCampaignNotes(
    existingNotes: string,
    newEvents: string
  ): string[] {
    const sections: string[] = []

    // Clean the existing notes first to remove auto-detection content
    const cleanExistingNotes = this.cleanChatContext(existingNotes)

    // Parse existing notes to identify different sections
    const existingLines = cleanExistingNotes.split("\n").filter(line => {
      const trimmed = line.trim()
      if (trimmed.length < 5) return false

      // Filter out auto-detection lines
      if (
        trimmed.match(
          /^Auto-detected:|^Context:|^Time Progression:|^Duration:|^Estimated|\d+\s+day\(s\)\s+elapsed/i
        )
      ) {
        return false
      }

      // Filter out repetitive or technical lines
      if (
        trimmed.match(
          /^\*\*\s*(Story Progress|Plot Elements|Active Goals|Current Situation)\s*:\*\*$/
        )
      ) {
        return false
      }

      return true
    })

    const storyLines: string[] = []
    const plotLines: string[] = []
    const goalLines: string[] = []
    const situationLines: string[] = []

    // Categorize existing notes with better filtering
    for (const line of existingLines) {
      const lower = line.toLowerCase()
      const trimmed = line.trim()

      // Skip auto-detection content that might have slipped through
      if (
        trimmed.match(
          /auto-detected|detected.*activity|estimated.*day|time progression|duration|context:/i
        )
      ) {
        continue
      }

      // Categorize meaningful content
      if (
        lower.includes("plot") ||
        lower.includes("story") ||
        lower.includes("narrative") ||
        lower.includes("storyline")
      ) {
        plotLines.push(trimmed)
      } else if (
        lower.includes("goal") ||
        lower.includes("objective") ||
        lower.includes("mission") ||
        lower.includes("quest") ||
        lower.includes("task")
      ) {
        goalLines.push(trimmed)
      } else if (
        lower.includes("situation") ||
        lower.includes("current") ||
        lower.includes("status") ||
        lower.includes("location") ||
        lower.includes("position")
      ) {
        situationLines.push(trimmed)
      } else if (
        trimmed.length > 15 &&
        !trimmed.match(/^\d+\s+(day|week|month|year)/)
      ) {
        // General story content - but exclude time references
        storyLines.push(trimmed)
      }
    }

    // Add story progression section with only meaningful content
    if (storyLines.length > 0 || newEvents) {
      const storySection = ["**Story Progress:**"]
      if (storyLines.length > 0) {
        // Filter and clean story lines
        const cleanStoryLines = storyLines
          .filter(
            line =>
              !line.match(/auto-detected|detected.*activity|estimated.*day/i)
          )
          .slice(-3) // Keep last 3 story entries
        storySection.push(...cleanStoryLines)
      }
      if (newEvents) {
        storySection.push(newEvents)
      }
      if (storySection.length > 1) {
        // Only add if there's actual content
        sections.push(storySection.join("\n"))
      }
    }

    // Add current situation
    if (situationLines.length > 0) {
      const cleanSituationLines = situationLines
        .filter(
          line =>
            !line.match(/auto-detected|detected.*activity|estimated.*day/i)
        )
        .slice(-2)
      if (cleanSituationLines.length > 0) {
        sections.push(
          "**Current Situation:**\n" + cleanSituationLines.join("\n")
        )
      }
    }

    // Add active goals
    if (goalLines.length > 0) {
      const cleanGoalLines = goalLines
        .filter(
          line =>
            !line.match(/auto-detected|detected.*activity|estimated.*day/i)
        )
        .slice(-3)
      if (cleanGoalLines.length > 0) {
        sections.push("**Active Goals:**\n" + cleanGoalLines.join("\n"))
      }
    }

    // Add plot elements
    if (plotLines.length > 0) {
      const cleanPlotLines = plotLines
        .filter(
          line =>
            !line.match(/auto-detected|detected.*activity|estimated.*day/i)
        )
        .slice(-2)
      if (cleanPlotLines.length > 0) {
        sections.push("**Plot Elements:**\n" + cleanPlotLines.join("\n"))
      }
    }

    return sections
  }

  /**
   * Clean up existing campaign notes by removing auto-detection content
   */
  async cleanupExistingCampaignNotes(): Promise<boolean> {
    try {
      const gameTimeData = await this.gameTimeService.loadGameTime()
      if (!gameTimeData?.campaignMetadata?.notes) {
        return false
      }

      const existingNotes = gameTimeData.campaignMetadata.notes
      const cleanedNotes: string[] = []

      for (const note of existingNotes) {
        const cleaned = this.cleanChatContext(note)
        if (cleaned && cleaned.length > 10) {
          // Only keep notes that have meaningful content after cleaning
          cleanedNotes.push(cleaned)
        }
      }

      // Update the campaign metadata with cleaned notes
      const updatedMetadata = {
        ...gameTimeData.campaignMetadata,
        notes: cleanedNotes
      }

      const updatedGameTimeData = {
        ...gameTimeData,
        campaignMetadata: updatedMetadata
      }

      await GameTimeStorage.saveGameTime(updatedGameTimeData)
      return true
    } catch (error) {
      console.error("Error cleaning up existing campaign notes:", error)
      return false
    }
  }

  /**
   * Extract new NPCs from chat context that should be added to Key NPCs
   */
  private extractNewNPCsFromContext(chatContext: string): string[] {
    if (!chatContext) return []

    const cleanContext = this.cleanChatContext(chatContext)
    const newNPCs: string[] = []
    const sentences = cleanContext
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 10)

    // Patterns to identify NPCs in the text
    const npcPatterns = [
      // Pattern: "Sir Lucan Merras" or "Sir Lucan" - titles with names (most specific first)
      /\b(Sir|Lady|Lord|Duke|Baron|Baroness|Count|Countess|Captain|General|Admiral|Commander|Dr|Professor|Master|Maester|Septon|Sister)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g,

      // Pattern: Full names in key positions (3 parts: First Middle Last)
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)\b(?=\s*[,.]|\s+(?:his|her|their|sits|stands|nods|leans|begins|says|explains|offers|turns))/g,

      // Pattern: Full names (2 parts: First Last)
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b(?=\s*[,.]|\s+(?:his|her|their|sits|stands|nods|leans|begins|says|explains|offers|turns))/g,

      // Pattern: Names at the head of the table or in positions of authority
      /(?:sits|stands|leads|heads|commands|presides)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,

      // Pattern: Names with explicit roles or titles
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,?\s*(?:the|a|an)?\s*(?:councilor|advisor|captain|leader|guard|merchant|trader|pilot|engineer|doctor|healer|priest|warrior|knight|ambassador|diplomat|spy|agent|commander|general|admiral|sergeant|lieutenant|major|colonel|duke|baron|lord|lady|sir|master|mistress)\b/gi,

      // Pattern: Dialogue attribution - "text," Name said/explains/continues
      /"[^"]*,?\s*"\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:said|says|explains|continues|adds|replies|responds|notes|observes|remarks)/g,

      // Pattern: Character actions - Name does something
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:nods|leans|gestures|approaches|enters|sits|stands|turns|offers|begins|explains|pauses|rises|meets)/g,

      // Pattern: Possessive constructions - "Name's X" or "Name, his/her/their"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(?:his|her|their)\s+(?:expression|voice|gaze|presence|eyes|hand|words)/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'s\s+(?:expression|voice|gaze|presence|eyes|hand|words)/g,

      // Pattern: "As Name..." - starting narrative with a character
      /\bAs\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:enters|approaches|speaks|nods|leans|gestures|turns|offers|begins|explains)/g,

      // Pattern: Direct address - "Name," at the beginning of dialogue
      /"\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,"/g
    ]

    for (const sentence of sentences) {
      for (const pattern of npcPatterns) {
        pattern.lastIndex = 0 // Reset regex
        let match
        while ((match = pattern.exec(sentence)) !== null) {
          const potentialName = match[1] || match[2]
          if (potentialName && this.isValidNPCName(potentialName)) {
            // Extract context about this NPC
            const npcInfo = this.extractNPCInfo(
              potentialName,
              sentence,
              cleanContext
            )
            if (npcInfo) {
              newNPCs.push(npcInfo)
            }
          }
        }
      }
    }

    return [...new Set(newNPCs)] // Remove duplicates
  }

  /**
   * Check if a potential name is valid for an NPC
   */
  private isValidNPCName(name: string): boolean {
    const trimmed = name.trim()

    // Must be at least 2 characters
    if (trimmed.length < 2) return false

    // Filter out common false positives
    const commonWords = [
      "House",
      "Council",
      "Hall",
      "Chamber",
      "Room",
      "Advisor",
      "Councilor",
      "Table",
      "The",
      "And",
      "With",
      "From",
      "Into",
      "Upon",
      "Over",
      "Under",
      "Door",
      "Voice",
      "Spice",
      "Arrakis",
      "Imperium",
      "Virellan",
      "Fremen",
      "Harkonnen",
      "Atreides",
      "Ship",
      "Spacecraft",
      "Ornithopter",
      "Desert",
      "Planet",
      "System",
      "Space",
      "Production",
      "Trade",
      "Alliance",
      "Mission",
      "Journey",
      "Travel",
      "Great",
      "Your",
      "Their",
      "Head",
      "Center",
      "Future",
      "Power",
      "Time",
      "Place"
    ]

    // Check each word in the name
    const words = trimmed.split(/\s+/)
    for (const word of words) {
      if (commonWords.includes(word)) return false
    }

    // Must start with capital letter
    if (!/^[A-Z]/.test(trimmed)) return false

    // Should not be all caps (likely an acronym or place)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) return false

    // For compound names, each part should be capitalized
    const nameParts = trimmed.split(/\s+/)
    for (const part of nameParts) {
      if (part.length > 1 && !/^[A-Z][a-z]/.test(part)) {
        return false
      }
    }

    // Avoid single words that are likely common nouns
    if (nameParts.length === 1 && nameParts[0].length < 4) {
      return false
    }

    return true
  }

  /**
   * Extract information about an NPC from the context
   */
  private extractNPCInfo(
    npcName: string,
    sentence: string,
    fullContext: string
  ): string | null {
    const info: string[] = []

    // Start with the clean name
    let cleanName = npcName.trim()

    // Look for titles within the name itself (e.g., "Sir Lucan Merras")
    const titleInName = cleanName.match(
      /^(Sir|Lady|Lord|Duke|Baron|Baroness|Count|Countess|Captain|General|Admiral|Commander|Dr|Professor|Master)\s+(.+)$/i
    )
    if (titleInName) {
      const title = titleInName[1]
      const nameWithoutTitle = titleInName[2]
      info.push(`${title} ${nameWithoutTitle}`)
    } else {
      info.push(cleanName)
    }

    // Look for additional titles, roles, or descriptions in the context
    const contextPatterns = [
      new RegExp(
        `${this.escapeRegex(cleanName)}[^.]*?\\b(councilor|advisor|captain|leader|guard|merchant|trader|pilot|engineer|doctor|healer|priest|warrior|knight|ambassador|diplomat|spy|agent|commander|general|admiral)\\b`,
        "i"
      ),
      new RegExp(
        `\\b(councilor|advisor|captain|leader|guard|merchant|trader|pilot|engineer|doctor|healer|priest|warrior|knight|ambassador|diplomat|spy|agent|commander|general|admiral)[^.]*?${this.escapeRegex(cleanName)}`,
        "i"
      ),
      new RegExp(
        `${this.escapeRegex(cleanName)}[^.]*?\\b(commanding|approachable|respected|influential|authority|stewardship|service|embodying|presence|resonant|steady|intent|measured|intensity)\\b`,
        "i"
      )
    ]

    const roles = new Set<string>()
    for (const pattern of contextPatterns) {
      const match = sentence.match(pattern) || fullContext.match(pattern)
      if (match && match[1]) {
        roles.add(match[1].toLowerCase())
      }
    }

    // Look for descriptive context about this character
    const sentences = fullContext.split(/[.!?]+/)
    let bestDescription = ""

    for (const contextSentence of sentences) {
      if (contextSentence.toLowerCase().includes(cleanName.toLowerCase())) {
        const cleanSentence = contextSentence.trim()

        // Prioritize sentences that describe the character's role or attributes
        if (cleanSentence.length > 30 && cleanSentence.length < 250) {
          if (
            cleanSentence.match(
              /\b(commanding|approachable|respected|influential|authority|stewardship|service|embodying|voice|presence|expression|resonant|steady|council|head|table)\b/i
            )
          ) {
            bestDescription = cleanSentence
            break
          } else if (
            !bestDescription &&
            cleanSentence.length > bestDescription.length
          ) {
            bestDescription = cleanSentence
          }
        }
      }
    }

    // Build the final description
    let result = info[0]

    if (roles.size > 0) {
      const roleList = Array.from(roles).join(", ")
      result += ` - ${roleList}`
    }

    if (bestDescription && bestDescription.length > result.length + 20) {
      // Extract key descriptive phrases
      const descriptors = []
      if (bestDescription.match(/commanding\s+(?:yet\s+)?approachable/i)) {
        descriptors.push("commanding yet approachable presence")
      }
      if (bestDescription.match(/embodying.*?ideals/i)) {
        descriptors.push("embodies ideals of service and stewardship")
      }
      if (bestDescription.match(/head\s+of\s+the\s+table|sits.*?head/i)) {
        descriptors.push("leads the council")
      }
      if (bestDescription.match(/voice\s+resonant|steady/i)) {
        descriptors.push("speaks with authority")
      }

      if (descriptors.length > 0) {
        result += ` - ${descriptors.join(", ")}`
      } else {
        // Use a cleaned version of the best description
        const cleanDesc = bestDescription
          .replace(new RegExp(this.escapeRegex(cleanName), "gi"), "")
          .replace(/^\s*[,.-]\s*/, "")
          .trim()
        if (cleanDesc.length > 20 && cleanDesc.length < 150) {
          result += ` - ${cleanDesc}`
        }
      }
    }

    return result.length > cleanName.length + 5
      ? result
      : `${cleanName} - Important character encountered in the story`
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  /**
   * Process a broader conversation context to detect NPCs and update campaign information
   * This can be called when we have access to more conversation history
   */
  async processConversationContext(conversationHistory: string[]): Promise<{
    npcsFound: string[]
    notesGenerated: string[]
  }> {
    const npcsFound: string[] = []
    const notesGenerated: string[] = []

    try {
      // Combine the conversation history into a single context
      const fullContext = conversationHistory.join("\n\n")
      const cleanContext = this.cleanChatContext(fullContext)

      // Extract NPCs from the full conversation
      const detectedNPCs = this.extractNewNPCsFromContext(cleanContext)

      if (detectedNPCs.length > 0) {
        // Get existing NPCs to avoid duplicates
        const gameTimeData = await this.gameTimeService.loadGameTime()
        const currentNPCs = gameTimeData?.campaignMetadata?.keyNPCs || ""
        const existingNPCNames = new Set<string>()

        const npcLines = currentNPCs.split("\n").filter(line => line.trim())
        for (const npcLine of npcLines) {
          const nameMatch = npcLine.match(/^([^:\-]+)/)
          if (nameMatch) {
            existingNPCNames.add(nameMatch[1].trim().toLowerCase())
          }
        }

        // Filter out NPCs that already exist
        const newNPCs = detectedNPCs.filter(npc => {
          const nameMatch = npc.match(/^([^:\-]+)/)
          if (nameMatch) {
            const npcName = nameMatch[1].trim().toLowerCase()
            return !existingNPCNames.has(npcName)
          }
          return false
        })

        if (newNPCs.length > 0) {
          // Update the Key NPCs with new characters
          const updatedNPCs = currentNPCs
            ? `${currentNPCs}\n\n[Recently Encountered]\n${newNPCs.join("\n")}`
            : newNPCs.join("\n")

          const success = await this.updateCampaignField("keyNPCs", updatedNPCs)
          if (success) {
            npcsFound.push(...newNPCs)
          }
        }
      }

      // Generate story notes from the conversation
      const storyElements = this.extractStoryElements(cleanContext, 0)
      if (storyElements) {
        notesGenerated.push(storyElements)
      }

      return { npcsFound, notesGenerated }
    } catch (error) {
      console.error("Error processing conversation context:", error)
      return { npcsFound: [], notesGenerated: [] }
    }
  }

  /**
   * Manually process conversation history to update NPCs (can be called externally)
   */
  async processFullConversationForNPCs(conversationText: string): Promise<{
    success: boolean
    npcsFound: string[]
    message: string
  }> {
    try {
      const detectedNPCs = this.extractNewNPCsFromContext(conversationText)

      if (detectedNPCs.length === 0) {
        return {
          success: false,
          npcsFound: [],
          message: "No new NPCs detected in the conversation"
        }
      }

      // Get existing NPCs to avoid duplicates
      const gameTimeData = await this.gameTimeService.loadGameTime()
      const currentNPCs = gameTimeData?.campaignMetadata?.keyNPCs || ""
      const existingNPCNames = new Set<string>()

      const npcLines = currentNPCs.split("\n").filter(line => line.trim())
      for (const npcLine of npcLines) {
        const nameMatch = npcLine.match(/^([^:\-]+)/)
        if (nameMatch) {
          existingNPCNames.add(nameMatch[1].trim().toLowerCase())
        }
      }

      // Filter out NPCs that already exist
      const newNPCs = detectedNPCs.filter(npc => {
        const nameMatch = npc.match(/^([^:\-]+)/)
        if (nameMatch) {
          const npcName = nameMatch[1].trim().toLowerCase()
          return !existingNPCNames.has(npcName)
        }
        return false
      })

      if (newNPCs.length === 0) {
        return {
          success: false,
          npcsFound: detectedNPCs,
          message: "All detected NPCs already exist in the campaign"
        }
      }

      // Update the Key NPCs with new characters
      const updatedNPCs = currentNPCs.trim()
        ? `${currentNPCs.trim()}\n\n[Recently Encountered]\n${newNPCs.join("\n")}`
        : newNPCs.join("\n")

      const success = await this.updateCampaignField("keyNPCs", updatedNPCs)

      return {
        success,
        npcsFound: newNPCs,
        message: success
          ? `Successfully added ${newNPCs.length} new NPC(s) to the campaign`
          : "Failed to update campaign with new NPCs"
      }
    } catch (error) {
      console.error("Error processing conversation for NPCs:", error)
      return {
        success: false,
        npcsFound: [],
        message: `Error processing conversation: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    }
  }
}

export default GameTimeAIIntegration
