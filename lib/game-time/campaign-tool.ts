/**
 * AI Tool for updating Game Time campaign information
 * This allows the AI to read and write campaign data like character info and NPCs
 */

import GameTimeAIIntegration from "@/lib/game-time/ai-integration"
import { CampaignMetadata } from "@/types/game-time"

export interface GameTimeCampaignTool {
  name: "update_campaign_info"
  description: "Update campaign information including character details, key NPCs, and campaign notes"
  parameters: {
    type: "object"
    properties: {
      field: {
        type: "string"
        enum: ["characterInfo", "keyNPCs", "notes"]
        description: "The campaign field to update"
      }
      content: {
        type: "string"
        description: "The new content for the field"
      }
      action: {
        type: "string"
        enum: ["replace", "append", "update"]
        description: "How to handle the content - replace entirely, append to existing, or smart update"
      }
    }
    required: ["field", "content", "action"]
  }
}

export const gameTimeCampaignTool: GameTimeCampaignTool = {
  name: "update_campaign_info",
  description:
    "Update campaign information including character details, key NPCs, and campaign notes",
  parameters: {
    type: "object",
    properties: {
      field: {
        type: "string",
        enum: ["characterInfo", "keyNPCs", "notes"],
        description: "The campaign field to update"
      },
      content: {
        type: "string",
        description: "The new content for the field"
      },
      action: {
        type: "string",
        enum: ["replace", "append", "update"],
        description:
          "How to handle the content - replace entirely, append to existing, or smart update"
      }
    },
    required: ["field", "content", "action"]
  }
}

/**
 * Handle the campaign update tool call
 */
export async function handleCampaignUpdateTool(params: {
  field: "characterInfo" | "keyNPCs" | "notes"
  content: string
  action: "replace" | "append" | "update"
}): Promise<{
  success: boolean
  message: string
  updatedContent?: string
}> {
  try {
    const aiIntegration = GameTimeAIIntegration.getInstance()

    // Handle notes field differently
    if (params.field === "notes") {
      const success = await aiIntegration.updateCampaignNotes(params.content)
      return {
        success,
        message: success
          ? "Successfully updated campaign notes"
          : "Failed to update campaign notes"
      }
    }

    let finalContent = params.content

    if (params.action === "append" || params.action === "update") {
      // Get existing content
      const gameTimeService = aiIntegration["gameTimeService"]
      const gameTimeData = await gameTimeService.loadGameTime()

      if (gameTimeData?.campaignMetadata) {
        const existingContent =
          gameTimeData.campaignMetadata[params.field] || ""

        if (existingContent && params.action === "append") {
          finalContent = `${existingContent}\n\n${params.content}`
        } else if (existingContent && params.action === "update") {
          // Smart merge - preserve important existing info while adding new
          finalContent = smartMergeContent(
            existingContent,
            params.content,
            params.field
          )
        }
      }
    }

    const success = await aiIntegration.updateCampaignField(
      params.field as "characterInfo" | "keyNPCs",
      finalContent
    )

    if (success) {
      return {
        success: true,
        message: `Successfully updated ${params.field}`,
        updatedContent: finalContent
      }
    } else {
      return {
        success: false,
        message: `Failed to update ${params.field}`
      }
    }
  } catch (error) {
    console.error("Error in campaign update tool:", error)
    return {
      success: false,
      message: `Error updating ${params.field}: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

/**
 * Smart merge content for updates
 */
function smartMergeContent(
  existing: string,
  newContent: string,
  fieldType: "characterInfo" | "keyNPCs"
): string {
  if (fieldType === "characterInfo") {
    return mergeCharacterInfo(existing, newContent)
  } else {
    return mergeNPCInfo(existing, newContent)
  }
}

/**
 * Merge character information intelligently
 */
function mergeCharacterInfo(existing: string, newContent: string): string {
  const existingLines = existing.split("\n").filter(line => line.trim())
  const newLines = newContent.split("\n").filter(line => line.trim())

  // Create a map of existing info by category/key
  const existingMap = new Map<string, string>()
  const miscExisting: string[] = []

  for (const line of existingLines) {
    const match = line.match(/^([^:]+):\s*(.+)$/)
    if (match) {
      existingMap.set(match[1].toLowerCase().trim(), line)
    } else {
      miscExisting.push(line)
    }
  }

  // Process new content, updating existing or adding new
  const result: string[] = []
  const processedKeys = new Set<string>()

  for (const line of newLines) {
    const match = line.match(/^([^:]+):\s*(.+)$/)
    if (match) {
      const key = match[1].toLowerCase().trim()
      existingMap.set(key, line) // Update or add
      processedKeys.add(key)
    } else {
      result.push(line)
    }
  }

  // Add all entries from the map
  for (const [key, line] of existingMap.entries()) {
    result.push(line)
  }

  // Add any misc existing content that wasn't key-value pairs
  result.push(...miscExisting)

  return result.join("\n")
}

/**
 * Merge NPC information intelligently
 */
function mergeNPCInfo(existing: string, newContent: string): string {
  // For NPCs, look for character names and update their entries
  const existingSections = splitByNPCNames(existing)
  const newSections = splitByNPCNames(newContent)

  // Merge sections by NPC name
  const mergedMap = new Map<string, string>()

  // Add existing NPCs
  for (const [name, content] of existingSections) {
    mergedMap.set(name, content)
  }

  // Update with new NPC info
  for (const [name, content] of newSections) {
    if (mergedMap.has(name)) {
      // Merge existing NPC info with new info
      const existing = mergedMap.get(name)!
      mergedMap.set(name, mergeCharacterInfo(existing, content))
    } else {
      // Add new NPC
      mergedMap.set(name, content)
    }
  }

  return Array.from(mergedMap.values()).join("\n\n")
}

/**
 * Split NPC content by character names
 */
function splitByNPCNames(content: string): Map<string, string> {
  const sections = new Map<string, string>()
  const lines = content.split("\n")

  let currentName = ""
  let currentContent: string[] = []

  for (const line of lines) {
    // Look for potential NPC names (capitalized words, possibly with titles)
    const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*):?\s*(.*)$/)
    if (
      (nameMatch && !line.includes(":")) ||
      (nameMatch && line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]*)*\s*$/))
    ) {
      // Save previous NPC if any
      if (currentName && currentContent.length > 0) {
        sections.set(currentName, currentContent.join("\n").trim())
      }

      // Start new NPC
      currentName = nameMatch[1].trim()
      currentContent = nameMatch[2] ? [nameMatch[2]] : []
    } else if (currentName) {
      currentContent.push(line)
    } else {
      // Content without a clear NPC name, use generic key
      if (!sections.has("General")) {
        sections.set("General", "")
      }
      const existing = sections.get("General") || ""
      sections.set("General", existing + (existing ? "\n" : "") + line)
    }
  }

  // Save the last NPC
  if (currentName && currentContent.length > 0) {
    sections.set(currentName, currentContent.join("\n").trim())
  }

  return sections
}

export default gameTimeCampaignTool
