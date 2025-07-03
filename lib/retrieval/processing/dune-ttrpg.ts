import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export interface DuneTTRPGChunk extends FileItemChunk {
  chunkType:
    | "rules"
    | "character"
    | "combat"
    | "lore"
    | "house-creation"
    | "gm-advice"
    | "equipment"
    | "overview"
  duneSpecific: boolean
  mechanicsLevel: "basic" | "intermediate" | "advanced"
  playerRelevance: number // 0-1 score for player vs GM content
  gamePhase: "character-creation" | "gameplay" | "campaign" | "reference"
}

export const processDuneTTRPG = async (
  content: string
): Promise<DuneTTRPGChunk[]> => {
  const chunks: DuneTTRPGChunk[] = []

  // 1. Game System Overview
  const overviewChunks = await createSystemOverviewChunks(content)
  chunks.push(...overviewChunks)

  // 2. Character Creation (crucial for AI assistant)
  const characterChunks = await createCharacterCreationChunks(content)
  chunks.push(...characterChunks)

  // 3. House Creation (unique to Dune)
  const houseChunks = await createHouseCreationChunks(content)
  chunks.push(...houseChunks)

  // 4. Combat & Conflict Rules
  const combatChunks = await createCombatRulesChunks(content)
  chunks.push(...combatChunks)

  // 5. Dune-Specific Lore & Setting
  const loreChunks = await createDuneLoreChunks(content)
  chunks.push(...loreChunks)

  // 6. Equipment & Technology
  const equipmentChunks = await createEquipmentChunks(content)
  chunks.push(...equipmentChunks)

  // 7. GM Guidance & Campaign Rules
  const gmChunks = await createGMGuidanceChunks(content)
  chunks.push(...gmChunks)

  // 8. Quick Reference Rules
  const referenceChunks = await createQuickReferenceChunks(content)
  chunks.push(...referenceChunks)

  return chunks
}

async function createSystemOverviewChunks(
  content: string
): Promise<DuneTTRPGChunk[]> {
  const chunks: DuneTTRPGChunk[] = []

  // Extract the core game system explanation
  const systemSections = extractSectionsByKeywords(content, [
    "how to play",
    "system",
    "game mechanics",
    "dice",
    "d20",
    "momentum",
    "threat",
    "difficulty",
    "introduction",
    "overview"
  ])

  for (const section of systemSections.slice(0, 3)) {
    chunks.push({
      content: `[GAME SYSTEM] ${section}`,
      tokens: encode(section).length,
      chunkType: "rules",
      duneSpecific: false,
      mechanicsLevel: "basic",
      playerRelevance: 1.0,
      gamePhase: "reference"
    })
  }

  return chunks
}

async function createCharacterCreationChunks(
  content: string
): Promise<DuneTTRPGChunk[]> {
  const chunks: DuneTTRPGChunk[] = []

  // Character archetypes specific to Dune
  const archetypeKeywords = [
    "mentat",
    "bene gesserit",
    "swordmaster",
    "noble",
    "fremen",
    "spy",
    "advisor",
    "agent",
    "character creation",
    "archetype",
    "background"
  ]

  const characterSections = extractSectionsByKeywords(content, [
    "character creation",
    "character",
    "attributes",
    "skills",
    "traits",
    "talents",
    "focuses",
    "drives",
    "backgrounds",
    "archetype",
    ...archetypeKeywords
  ])

  for (const section of characterSections.slice(0, 8)) {
    const isDuneSpecific = archetypeKeywords.some(keyword =>
      section.toLowerCase().includes(keyword)
    )

    chunks.push({
      content: `[CHARACTER CREATION] ${section}`,
      tokens: encode(section).length,
      chunkType: "character",
      duneSpecific: isDuneSpecific,
      mechanicsLevel: "basic",
      playerRelevance: 0.9,
      gamePhase: "character-creation"
    })
  }

  return chunks
}

async function createHouseCreationChunks(
  content: string
): Promise<DuneTTRPGChunk[]> {
  const chunks: DuneTTRPGChunk[] = []

  const houseSections = extractSectionsByKeywords(content, [
    "house creation",
    "house",
    "domain",
    "homeworld",
    "resources",
    "house attributes",
    "house traits",
    "house rules",
    "landsraad",
    "major house",
    "minor house",
    "siridar",
    "fief"
  ])

  for (const section of houseSections.slice(0, 6)) {
    chunks.push({
      content: `[HOUSE CREATION] ${section}`,
      tokens: encode(section).length,
      chunkType: "house-creation",
      duneSpecific: true,
      mechanicsLevel: "intermediate",
      playerRelevance: 0.7,
      gamePhase: "character-creation"
    })
  }

  return chunks
}

async function createCombatRulesChunks(
  content: string
): Promise<DuneTTRPGChunk[]> {
  const chunks: DuneTTRPGChunk[] = []

  const combatSections = extractSectionsByKeywords(content, [
    "combat",
    "conflict",
    "attack",
    "defense",
    "damage",
    "weapons",
    "shields",
    "armor",
    "initiative",
    "actions",
    "dueling",
    "kanly",
    "assassination",
    "violence",
    "warfare",
    "battle"
  ])

  for (const section of combatSections.slice(0, 8)) {
    const mechanicsLevel =
      section.toLowerCase().includes("advanced") ||
      section.toLowerCase().includes("optional")
        ? "advanced"
        : "intermediate"

    chunks.push({
      content: `[COMBAT RULES] ${section}`,
      tokens: encode(section).length,
      chunkType: "combat",
      duneSpecific:
        section.toLowerCase().includes("shield") ||
        section.toLowerCase().includes("kanly"),
      mechanicsLevel: mechanicsLevel as "basic" | "intermediate" | "advanced",
      playerRelevance: 0.8,
      gamePhase: "gameplay"
    })
  }

  return chunks
}

async function createDuneLoreChunks(
  content: string
): Promise<DuneTTRPGChunk[]> {
  const chunks: DuneTTRPGChunk[] = []

  const loreSections = extractSectionsByKeywords(content, [
    "imperium",
    "emperor",
    "landsraad",
    "spacing guild",
    "bene gesserit",
    "fremen",
    "arrakis",
    "spice",
    "melange",
    "sandworm",
    "shai-hulud",
    "caladan",
    "giedi prime",
    "kaitain",
    "ix",
    "tleilax",
    "history",
    "great houses",
    "atreides",
    "harkonnen",
    "corrino",
    "politics"
  ])

  for (const section of loreSections.slice(0, 12)) {
    chunks.push({
      content: `[DUNE LORE] ${section}`,
      tokens: encode(section).length,
      chunkType: "lore",
      duneSpecific: true,
      mechanicsLevel: "basic",
      playerRelevance: 0.6,
      gamePhase: "reference"
    })
  }

  return chunks
}

async function createEquipmentChunks(
  content: string
): Promise<DuneTTRPGChunk[]> {
  const chunks: DuneTTRPGChunk[] = []

  const equipmentSections = extractSectionsByKeywords(content, [
    "equipment",
    "weapons",
    "armor",
    "gear",
    "technology",
    "devices",
    "stillsuit",
    "lasgun",
    "maula pistol",
    "crysknife",
    "shield",
    "ornithopter",
    "thumper",
    "tools",
    "artifacts",
    "items"
  ])

  for (const section of equipmentSections.slice(0, 6)) {
    chunks.push({
      content: `[EQUIPMENT] ${section}`,
      tokens: encode(section).length,
      chunkType: "equipment",
      duneSpecific: true,
      mechanicsLevel: "basic",
      playerRelevance: 0.8,
      gamePhase: "reference"
    })
  }

  return chunks
}

async function createGMGuidanceChunks(
  content: string
): Promise<DuneTTRPGChunk[]> {
  const chunks: DuneTTRPGChunk[] = []

  const gmSections = extractSectionsByKeywords(content, [
    "gamemaster",
    "gm",
    "narrator",
    "running",
    "campaign",
    "adventure",
    "scenarios",
    "threats",
    "intrigue",
    "plotting",
    "planning",
    "storytelling",
    "managing",
    "guidance",
    "advice"
  ])

  for (const section of gmSections.slice(0, 5)) {
    chunks.push({
      content: `[GM GUIDANCE] ${section}`,
      tokens: encode(section).length,
      chunkType: "gm-advice",
      duneSpecific: false,
      mechanicsLevel: "intermediate",
      playerRelevance: 0.2,
      gamePhase: "campaign"
    })
  }

  return chunks
}

async function createQuickReferenceChunks(
  content: string
): Promise<DuneTTRPGChunk[]> {
  const chunks: DuneTTRPGChunk[] = []

  // Look for tables, quick rules, and reference material
  const referenceSections = extractSectionsByKeywords(content, [
    "quick reference",
    "table",
    "summary",
    "difficulty",
    "modifiers",
    "reference",
    "index",
    "glossary",
    "terms",
    "definitions"
  ])

  for (const section of referenceSections.slice(0, 4)) {
    chunks.push({
      content: `[QUICK REFERENCE] ${section}`,
      tokens: encode(section).length,
      chunkType: "rules",
      duneSpecific: false,
      mechanicsLevel: "basic",
      playerRelevance: 1.0,
      gamePhase: "reference"
    })
  }

  return chunks
}

function extractSectionsByKeywords(
  content: string,
  keywords: string[]
): string[] {
  const sections = content.split(/\n\s*\n/)
  const matchingSections: Array<{ section: string; score: number }> = []

  for (const section of sections) {
    if (section.trim().length < 100) continue

    const lowerSection = section.toLowerCase()
    const score = keywords.reduce((acc, keyword) => {
      return acc + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (score > 0) {
      matchingSections.push({ section, score })
    }
  }

  // Sort by relevance score and return sections
  return matchingSections
    .sort((a, b) => b.score - a.score)
    .map(item => item.section)
}

// Helper function to further split large sections while preserving context
async function splitLargeTTRPGSection(
  section: string,
  chunkType: string,
  duneSpecific: boolean
): Promise<DuneTTRPGChunk[]> {
  if (encode(section).length <= CHUNK_SIZE) {
    return [
      {
        content: section,
        tokens: encode(section).length,
        chunkType: chunkType as any,
        duneSpecific,
        mechanicsLevel: "intermediate" as const,
        playerRelevance: 0.7,
        gamePhase: "reference" as const
      }
    ]
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: [
      "\n\n", // Paragraph breaks
      "\n", // Line breaks
      ". ", // Sentence endings
      "? ", // Question endings
      "! ", // Exclamation endings
      "; ", // Semicolon breaks
      ", ", // Comma breaks
      " ", // Word breaks
      "" // Character breaks
    ]
  })

  const docs = await splitter.createDocuments([section])

  return docs.map(doc => ({
    content: doc.pageContent,
    tokens: encode(doc.pageContent).length,
    chunkType: chunkType as any,
    duneSpecific,
    mechanicsLevel: "intermediate" as const,
    playerRelevance: 0.7,
    gamePhase: "reference" as const
  }))
}
