/**
 * Game Time AI Middleware - Handles automatic injection of campaign context and tool capabilities
 */

import { ChatPayload } from "@/types"
import GameTimeAIIntegration from "@/lib/game-time/ai-integration"
import {
  gameTimeCampaignTool,
  handleCampaignUpdateTool
} from "@/lib/game-time/campaign-tool"
import TimeChangeHandler from "@/lib/game-time/time-change-handler"

/**
 * Process AI response to extract and save campaign information updates
 */
export async function processAIResponseForCampaign(
  aiResponse: string,
  userMessage: string
): Promise<void> {
  try {
    const aiIntegration = GameTimeAIIntegration.getInstance()

    // Check if the response contains character information that should be saved
    const characterUpdates = extractCharacterUpdates(aiResponse)
    if (characterUpdates) {
      await aiIntegration.updateCampaignField("characterInfo", characterUpdates)
    }

    // Check if the response contains NPC information
    const npcUpdates = extractNPCUpdates(aiResponse)
    if (npcUpdates) {
      await aiIntegration.updateCampaignField("keyNPCs", npcUpdates)
    }

    // Look for function calls or explicit campaign updates in the response
    await processExplicitCampaignUpdates(aiResponse)
  } catch (error) {
    console.error("Error processing AI response for campaign updates:", error)
  }
}

/**
 * Extract character information from AI response
 */
function extractCharacterUpdates(response: string): string | null {
  // Look for character stat changes, level ups, equipment changes, etc.
  const characterPatterns = [
    /(?:gained?|earned?|learned?|acquired?|equipped?|leveled?\s+up).*(?:level|experience|skill|ability|spell|equipment|item|weapon|armor)/i,
    /(?:stats?|attributes?|abilities?).*(?:increased?|improved?|changed?|updated?)/i,
    /(?:hp|health|mana|energy).*(?:increased?|decreased?|changed?)/i,
    /(?:character.*(?:now|currently))/i
  ]

  for (const pattern of characterPatterns) {
    const match = response.match(pattern)
    if (match) {
      // Extract surrounding context for the update
      const sentences = response.split(/[.!?]+/)
      for (const sentence of sentences) {
        if (sentence.includes(match[0])) {
          return sentence.trim()
        }
      }
    }
  }

  return null
}

/**
 * Extract NPC information from AI response
 */
function extractNPCUpdates(response: string): string | null {
  // Look for NPC introductions, relationship changes, status updates
  const npcPatterns = [
    /(?:meets?|encounters?|introduces?|speaks?\s+with).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)\s+(?:is|was|appears?|seems?|tells?|says?|explains?)/i,
    /(?:new\s+(?:ally|enemy|contact|friend|character)).*?([A-Z][a-z]+)/i
  ]

  for (const pattern of npcPatterns) {
    const match = response.match(pattern)
    if (match) {
      // Extract surrounding context
      const sentences = response.split(/[.!?]+/)
      for (const sentence of sentences) {
        if (sentence.includes(match[0])) {
          return sentence.trim()
        }
      }
    }
  }

  return null
}

/**
 * Process explicit campaign update function calls or structured updates
 */
async function processExplicitCampaignUpdates(response: string): Promise<void> {
  // Look for structured campaign information in the response
  const updatePatterns = [
    {
      pattern: /\[CHARACTER_UPDATE\](.*?)\[\/CHARACTER_UPDATE\]/s,
      field: "characterInfo" as const
    },
    {
      pattern: /\[NPC_UPDATE\](.*?)\[\/NPC_UPDATE\]/s,
      field: "keyNPCs" as const
    },
    {
      pattern: /\[CAMPAIGN_UPDATE\](.*?)\[\/CAMPAIGN_UPDATE\]/s,
      field: "notes" as const
    }
  ]

  for (const { pattern, field } of updatePatterns) {
    const match = response.match(pattern)
    if (match) {
      const content = match[1].trim()
      if (content) {
        await handleCampaignUpdateTool({
          field,
          content,
          action: "update"
        })
      }
    }
  }
}

/**
 * Add Game Time awareness instructions to AI prompts
 */
export function addGameTimeInstructions(basePrompt: string): string {
  const instructions = `

<GAME_TIME_INSTRUCTIONS>
You are running a TTRPG campaign with persistent character and world state. When appropriate:

1. AUTOMATICALLY track character changes:
   - Level ups, skill improvements, stat changes
   - Equipment acquired, lost, or changed  
   - Health/status changes
   - Character development and growth

2. AUTOMATICALLY track NPCs:
   - New characters introduced
   - Relationship changes with player
   - NPC goals, motivations, current status
   - Important NPC actions or developments

3. AUTOMATICALLY track campaign progression:
   - Important events and their consequences
   - Time-sensitive developments
   - World state changes
   - Story progression notes

4. When time passes in-game:
   - Update campaign notes with progression effects
   - Review and update NPC statuses and situations
   - Consider what happens during time passage
   - Update character circumstances as appropriate

5. Use these special tags in your responses to update campaign data:
   - [CHARACTER_UPDATE]new character info here[/CHARACTER_UPDATE]
   - [NPC_UPDATE]new NPC info here[/NPC_UPDATE]
   - [CAMPAIGN_UPDATE]campaign progression notes here[/CAMPAIGN_UPDATE]

6. Use the update_campaign_info function to make explicit updates to:
   - characterInfo: Character stats, abilities, equipment, status
   - keyNPCs: NPC information, relationships, current situations
   - notes: Campaign progression, important events, consequences

7. Maintain campaign continuity by:
   - Referencing established character details
   - Remembering NPC relationships and history
   - Considering time passage and its effects
   - Building on previous campaign events

The system will automatically save important campaign information from your responses and process time changes.
</GAME_TIME_INSTRUCTIONS>

`

  return basePrompt + instructions
}

/**
 * Get current campaign awareness prompt section
 */
export async function getCampaignAwarenessPrompt(): Promise<string> {
  try {
    const aiIntegration = GameTimeAIIntegration.getInstance()
    const context = await aiIntegration.getCampaignContextForAI()

    if (!context) return ""

    return `

<CAMPAIGN_STATE>
${context}

Remember: You have access to update this campaign information as the story progresses. Keep character details and NPC information current and accurate.
</CAMPAIGN_STATE>

`
  } catch (error) {
    console.error("Error getting campaign awareness prompt:", error)
    return ""
  }
}

/**
 * Process time change events and update campaign information
 */
export async function processTimeChangeForCampaign(
  timePassageEvent: {
    previousDate: string
    newDate: string
    daysElapsed: number
    description: string
  },
  chatContext: string = ""
): Promise<void> {
  try {
    const timeChangeHandler = TimeChangeHandler.getInstance()

    // Check if this time change warrants automatic updates
    if (
      timeChangeHandler.shouldTriggerAutomaticUpdate(
        timePassageEvent.daysElapsed
      )
    ) {
      const result = await timeChangeHandler.handleTimeChange(
        {
          ...timePassageEvent,
          timestamp: new Date().toISOString()
        },
        chatContext
      )

      if (result.success) {
        console.log("Time change processed successfully:", result.updates)
      } else {
        console.error("Time change processing failed:", result.errors)
      }
    }
  } catch (error) {
    console.error("Error processing time change for campaign:", error)
  }
}

export default {
  processAIResponseForCampaign,
  processTimeChangeForCampaign,
  addGameTimeInstructions,
  getCampaignAwarenessPrompt
}
