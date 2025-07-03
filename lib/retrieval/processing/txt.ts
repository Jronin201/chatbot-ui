import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."
import { processDuneTTRPG } from "./dune-ttrpg"

export const processTxt = async (txt: Blob): Promise<FileItemChunk[]> => {
  const fileBuffer = Buffer.from(await txt.arrayBuffer())
  const textDecoder = new TextDecoder("utf-8")
  const textContent = textDecoder.decode(fileBuffer)

  // Check for Dune TTRPG content first (most specific)
  const isDuneDocument = detectDuneContent(textContent)
  if (isDuneDocument) {
    return await processDuneTTRPG(textContent)
  }

  // Detect if this is a general TTRPG manual
  const isTTRPGDocument = detectTTRPGContent(textContent)
  if (isTTRPGDocument) {
    return await processTTRPGTextDocument(textContent)
  }

  // Standard text processing
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    // Better separators for natural language text
    separators: ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""]
  })
  const splitDocs = await splitter.createDocuments([textContent])

  let chunks: FileItemChunk[] = []

  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]

    chunks.push({
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length
    })
  }

  return chunks
}

function detectDuneContent(content: string): boolean {
  const lowerContent = content.toLowerCase()

  const duneKeywords = [
    "arrakis",
    "dune",
    "imperium",
    "atreides",
    "harkonnen",
    "corrino",
    "bene gesserit",
    "fremen",
    "spice",
    "melange",
    "sandworm",
    "guild",
    "spacing guild",
    "mentat",
    "swordmaster",
    "sardaukar",
    "landsraad",
    "padishah emperor",
    "great houses",
    "muad'dib",
    "kwisatz haderach",
    "giedi prime",
    "caladan",
    "kaitain",
    "ornithopter",
    "stillsuit"
  ]

  const score = duneKeywords.reduce((acc, keyword) => {
    return acc + (lowerContent.includes(keyword) ? 1 : 0)
  }, 0)

  // If 4+ Dune-specific keywords found, it's likely a Dune document
  return score >= 4
}

function detectTTRPGContent(content: string): boolean {
  const lowerContent = content.toLowerCase()

  const ttrpgKeywords = [
    "roleplaying",
    "gamemaster",
    "character",
    "dice",
    "skills",
    "attributes",
    "combat",
    "weapon",
    "armor",
    "spells",
    "magic",
    "adventure",
    "campaign",
    "player character",
    "gm",
    "dm",
    "dungeon master",
    "stats",
    "experience",
    "class",
    "race",
    "level",
    "hit points",
    "damage",
    "initiative",
    "dune",
    "imperium",
    "houses",
    "bene gesserit",
    "fremen",
    "spice",
    "arrakis"
  ]

  const score = ttrpgKeywords.reduce((acc, keyword) => {
    return acc + (lowerContent.includes(keyword) ? 1 : 0)
  }, 0)

  return score >= 3 // If 3+ TTRPG keywords found
}

async function processTTRPGTextDocument(
  content: string
): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []

  // 1. Create game overview chunk
  const overview = createTTRPGOverview(content)
  chunks.push({
    content: `[GAME OVERVIEW] ${overview}`,
    tokens: encode(overview).length
  })

  // 2. Create character creation chunks
  const characterChunks = await createCharacterChunks(content)
  chunks.push(...characterChunks)

  // 3. Create combat mechanics chunks
  const combatChunks = await createCombatChunks(content)
  chunks.push(...combatChunks)

  // 4. Create skills and abilities chunks
  const skillsChunks = await createSkillsChunks(content)
  chunks.push(...skillsChunks)

  // 5. Create lore and worldbuilding chunks
  const loreChunks = await createWorldbuildingChunks(content)
  chunks.push(...loreChunks)

  // 6. Create equipment and gear chunks
  const equipmentChunks = await createEquipmentChunks(content)
  chunks.push(...equipmentChunks)

  // 7. Create GM advice chunks
  const gmChunks = await createGMAdviceChunks(content)
  chunks.push(...gmChunks)

  return chunks
}

function createTTRPGOverview(content: string): string {
  const lines = content.split("\n").filter(line => line.trim())

  // Find title or game name
  const titleCandidates = lines.filter(
    line =>
      line.toLowerCase().includes("adventure") ||
      line.toLowerCase().includes("roleplaying") ||
      line.toLowerCase().includes("dune") ||
      (line.length < 80 && line.split(" ").length < 10)
  )

  const title = titleCandidates[0] || "TTRPG Manual"

  // Extract key game concepts
  const gameInfo = lines
    .filter(line => {
      const lower = line.toLowerCase()
      return (
        lower.includes("universe") ||
        lower.includes("setting") ||
        lower.includes("imperium") ||
        lower.includes("system") ||
        lower.includes("players") ||
        lower.includes("characters")
      )
    })
    .slice(0, 5)

  return `${title}\n\nGame Setting Overview:\n${gameInfo.join("\n")}`
}

async function createCharacterChunks(
  content: string
): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []
  const characterKeywords = [
    "character creation",
    "character",
    "stats",
    "attributes",
    "skills",
    "background",
    "class",
    "race",
    "house",
    "noble",
    "traits",
    "talents",
    "abilities",
    "statistics",
    "mentat",
    "bene gesserit",
    "swordmaster"
  ]

  return await createThematicChunks(
    content,
    characterKeywords,
    "[CHARACTER CREATION]",
    6
  )
}

async function createCombatChunks(content: string): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []
  const combatKeywords = [
    "combat",
    "fight",
    "battle",
    "attack",
    "damage",
    "weapon",
    "armor",
    "initiative",
    "action",
    "round",
    "turn",
    "hit points",
    "wound",
    "injury",
    "duel",
    "swordplay",
    "conflict",
    "violence",
    "shields",
    "blade"
  ]

  return await createThematicChunks(
    content,
    combatKeywords,
    "[COMBAT MECHANICS]",
    8
  )
}

async function createSkillsChunks(content: string): Promise<FileItemChunk[]> {
  const skillsKeywords = [
    "skills",
    "abilities",
    "talents",
    "focus",
    "specialization",
    "expertise",
    "proficiency",
    "training",
    "discipline",
    "mastery",
    "technique",
    "method",
    "approach",
    "capability"
  ]

  return await createThematicChunks(
    content,
    skillsKeywords,
    "[SKILLS & ABILITIES]",
    6
  )
}

async function createWorldbuildingChunks(
  content: string
): Promise<FileItemChunk[]> {
  const loreKeywords = [
    "universe",
    "imperium",
    "history",
    "lore",
    "setting",
    "world",
    "houses",
    "guild",
    "bene gesserit",
    "fremen",
    "arrakis",
    "spice",
    "emperor",
    "politics",
    "culture",
    "society",
    "caladan",
    "giedi prime",
    "landsraad",
    "spacing guild",
    "mentat",
    "sardaukar"
  ]

  return await createThematicChunks(
    content,
    loreKeywords,
    "[LORE & WORLDBUILDING]",
    12
  )
}

async function createEquipmentChunks(
  content: string
): Promise<FileItemChunk[]> {
  const equipmentKeywords = [
    "weapon",
    "armor",
    "equipment",
    "gear",
    "tool",
    "device",
    "shield",
    "blade",
    "knife",
    "stillsuit",
    "thumper",
    "ornithopter",
    "lasgun",
    "maula pistol",
    "crysknife",
    "technology",
    "artifact"
  ]

  return await createThematicChunks(
    content,
    equipmentKeywords,
    "[EQUIPMENT & GEAR]",
    5
  )
}

async function createGMAdviceChunks(content: string): Promise<FileItemChunk[]> {
  const gmKeywords = [
    "gamemaster",
    "gm",
    "narrator",
    "referee",
    "running",
    "campaign",
    "adventure",
    "scenario",
    "plot",
    "story",
    "guidance",
    "advice",
    "tips",
    "managing",
    "planning",
    "designing",
    "creating"
  ]

  return await createThematicChunks(content, gmKeywords, "[GM GUIDANCE]", 4)
}

async function createThematicChunks(
  content: string,
  keywords: string[],
  prefix: string,
  maxChunks: number
): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []
  const sections = content.split(/\n\s*\n/)

  for (const section of sections) {
    if (section.trim().length < 50) continue

    const lowerSection = section.toLowerCase()
    const keywordScore = keywords.reduce((score, keyword) => {
      return score + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (keywordScore > 0) {
      // Check if section is too large and needs splitting
      if (encode(section).length > CHUNK_SIZE) {
        const subChunks = await splitLargeSection(section, prefix)
        chunks.push(...subChunks)
      } else {
        chunks.push({
          content: `${prefix} ${section}`,
          tokens: encode(section).length
        })
      }
    }
  }

  // Sort by relevance (more keywords = higher score) and take top chunks
  return chunks
    .sort((a, b) => {
      const scoreA = keywords.reduce(
        (score, keyword) =>
          score + (a.content.toLowerCase().includes(keyword) ? 1 : 0),
        0
      )
      const scoreB = keywords.reduce(
        (score, keyword) =>
          score + (b.content.toLowerCase().includes(keyword) ? 1 : 0),
        0
      )
      return scoreB - scoreA
    })
    .slice(0, maxChunks)
}

async function splitLargeSection(
  section: string,
  prefix: string
): Promise<FileItemChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ". ", "; ", ", ", " ", ""]
  })

  const docs = await splitter.createDocuments([section])
  return docs.map(doc => ({
    content: `${prefix} ${doc.pageContent}`,
    tokens: encode(doc.pageContent).length
  }))
}
