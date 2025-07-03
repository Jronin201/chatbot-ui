import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."
import { processDuneTTRPG } from "./dune-ttrpg"

export const processPdf = async (pdf: Blob): Promise<FileItemChunk[]> => {
  const loader = new PDFLoader(pdf)
  const docs = await loader.load()

  // Preserve better context by joining pages with paragraph breaks
  let completeText = docs.map(doc => doc.pageContent).join("\n\n")

  // Check for Dune TTRPG content first (most specific)
  const isDuneDocument = detectDuneContent(completeText)
  if (isDuneDocument) {
    return await processDuneTTRPG(completeText)
  }

  // Detect document type for specialized processing
  const documentType = detectDocumentType(completeText)

  switch (documentType) {
    case "ttrpg":
      return await processTTRPGDocument(completeText)
    case "legal":
      return await processLegalDocument(completeText)
    default:
      return await processStandardDocument(completeText)
  }
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

function detectDocumentType(content: string): "ttrpg" | "legal" | "standard" {
  const lowerContent = content.toLowerCase()

  // TTRPG indicators
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
    "initiative"
  ]

  const ttrpgScore = ttrpgKeywords.reduce((score, keyword) => {
    return score + (lowerContent.includes(keyword) ? 1 : 0)
  }, 0)

  // Legal indicators
  const legalKeywords = [
    "sec.",
    "section",
    "§",
    "an act",
    "bill",
    "law",
    "statute"
  ]
  const legalScore = legalKeywords.reduce((score, keyword) => {
    return score + (lowerContent.includes(keyword) ? 1 : 0)
  }, 0)

  if (ttrpgScore >= 3) return "ttrpg"
  if (legalScore >= 2) return "legal"
  return "standard"
}

async function processTTRPGDocument(content: string): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []

  // 1. Create game overview chunk
  const overview = createGameOverview(content)
  chunks.push({
    content: `[GAME OVERVIEW] ${overview}`,
    tokens: encode(overview).length
  })

  // 2. Create rules and mechanics chunks
  const rulesChunks = await createRulesChunks(content)
  chunks.push(...rulesChunks)

  // 3. Create character creation chunks
  const characterChunks = await createCharacterCreationChunks(content)
  chunks.push(...characterChunks)

  // 4. Create combat system chunks
  const combatChunks = await createCombatSystemChunks(content)
  chunks.push(...combatChunks)

  // 5. Create lore and setting chunks
  const loreChunks = await createLoreChunks(content)
  chunks.push(...loreChunks)

  // 6. Create GM guidance chunks
  const gmChunks = await createGMGuidanceChunks(content)
  chunks.push(...gmChunks)

  return chunks
}

function createGameOverview(content: string): string {
  const lines = content.split("\n").filter(line => line.trim())

  // Extract title and game system
  const title =
    lines.find(
      line =>
        line.toLowerCase().includes("roleplaying") ||
        line.toLowerCase().includes("adventures")
    ) ||
    lines[0] ||
    "TTRPG Manual"

  // Find key system information
  const systemInfo = lines
    .filter(line => {
      const lower = line.toLowerCase()
      return (
        lower.includes("system") ||
        lower.includes("rules") ||
        lower.includes("dice") ||
        lower.includes("setting") ||
        lower.includes("universe") ||
        lower.includes("imperium")
      )
    })
    .slice(0, 5)

  return `${title}\n\nGame System Overview:\n${systemInfo.join("\n")}\n\nThis is a comprehensive TTRPG manual with rules for character creation, combat, and campaign management.`
}

async function createRulesChunks(content: string): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []
  const ruleKeywords = [
    "rules",
    "mechanics",
    "system",
    "dice",
    "roll",
    "test",
    "check",
    "difficulty",
    "modifier",
    "bonus",
    "penalty",
    "skill",
    "attribute"
  ]

  const sections = content.split(/\n\s*\n/)

  for (const section of sections) {
    const lowerSection = section.toLowerCase()
    const ruleScore = ruleKeywords.reduce((score, keyword) => {
      return score + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (ruleScore > 2 && section.trim().length > 100) {
      chunks.push({
        content: `[RULES & MECHANICS] ${section}`,
        tokens: encode(section).length
      })
    }
  }

  return chunks.sort((a, b) => b.tokens - a.tokens).slice(0, 8)
}

async function createCharacterCreationChunks(
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
    "talents"
  ]

  const sections = content.split(/\n\s*\n/)

  for (const section of sections) {
    const lowerSection = section.toLowerCase()
    const charScore = characterKeywords.reduce((score, keyword) => {
      return score + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (charScore > 1 && section.trim().length > 100) {
      chunks.push({
        content: `[CHARACTER CREATION] ${section}`,
        tokens: encode(section).length
      })
    }
  }

  return chunks.sort((a, b) => b.tokens - a.tokens).slice(0, 6)
}

async function createCombatSystemChunks(
  content: string
): Promise<FileItemChunk[]> {
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
    "injury"
  ]

  const sections = content.split(/\n\s*\n/)

  for (const section of sections) {
    const lowerSection = section.toLowerCase()
    const combatScore = combatKeywords.reduce((score, keyword) => {
      return score + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (combatScore > 2 && section.trim().length > 100) {
      chunks.push({
        content: `[COMBAT SYSTEM] ${section}`,
        tokens: encode(section).length
      })
    }
  }

  return chunks.sort((a, b) => b.tokens - a.tokens).slice(0, 6)
}

async function createLoreChunks(content: string): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []
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
    "society"
  ]

  const sections = content.split(/\n\s*\n/)

  for (const section of sections) {
    const lowerSection = section.toLowerCase()
    const loreScore = loreKeywords.reduce((score, keyword) => {
      return score + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (loreScore > 2 && section.trim().length > 100) {
      chunks.push({
        content: `[LORE & SETTING] ${section}`,
        tokens: encode(section).length
      })
    }
  }

  return chunks.sort((a, b) => b.tokens - a.tokens).slice(0, 10)
}

async function createGMGuidanceChunks(
  content: string
): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []
  const gmKeywords = [
    "gamemaster",
    "gm",
    "dm",
    "dungeon master",
    "referee",
    "narrator",
    "campaign",
    "adventure",
    "scenario",
    "plot",
    "story",
    "guidance",
    "running",
    "managing",
    "tips"
  ]

  const sections = content.split(/\n\s*\n/)

  for (const section of sections) {
    const lowerSection = section.toLowerCase()
    const gmScore = gmKeywords.reduce((score, keyword) => {
      return score + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (gmScore > 1 && section.trim().length > 100) {
      chunks.push({
        content: `[GM GUIDANCE] ${section}`,
        tokens: encode(section).length
      })
    }
  }

  return chunks.sort((a, b) => b.tokens - a.tokens).slice(0, 5)
}

// Keep existing legal and standard processing functions
async function processLegalDocument(content: string): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []

  // 1. Create document summary chunk
  const summary = createDocumentSummary(content)
  chunks.push({
    content: summary,
    tokens: encode(summary).length
  })

  // 2. Create impact-focused chunks
  const impactChunks = await createImpactChunks(content)
  chunks.push(...impactChunks)

  // 3. Create section-based chunks
  const sectionChunks = await createSectionChunks(content)
  chunks.push(...sectionChunks)

  return chunks
}

async function processStandardDocument(
  content: string
): Promise<FileItemChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""]
  })
  const splitDocs = await splitter.createDocuments([content])

  return splitDocs.map(doc => ({
    content: doc.pageContent,
    tokens: encode(doc.pageContent).length
  }))
}

// Existing helper functions for legal processing
function createDocumentSummary(content: string): string {
  const lines = content.split("\n").filter(line => line.trim())
  const title = lines[0] || "Legal Document"

  // Find key economic sections
  const economicSections = lines.filter(line => {
    const lower = line.toLowerCase()
    return (
      lower.includes("economic") ||
      lower.includes("financial") ||
      lower.includes("budget") ||
      lower.includes("cost") ||
      lower.includes("revenue") ||
      lower.includes("tax") ||
      lower.includes("impact") ||
      lower.includes("effect")
    )
  })

  return `${title}\n\nKey Economic Provisions:\n${economicSections.slice(0, 5).join("\n")}`
}

async function createImpactChunks(content: string): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []
  const impactKeywords = [
    "impact",
    "effect",
    "consequence",
    "result",
    "outcome",
    "economic impact",
    "financial impact",
    "budget impact",
    "cost savings",
    "revenue generation",
    "job creation"
  ]

  const sections = content.split(/\n\s*\n/)

  for (const section of sections) {
    const lowerSection = section.toLowerCase()
    const impactScore = impactKeywords.reduce((score, keyword) => {
      return score + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (impactScore > 0 && section.trim().length > 100) {
      chunks.push({
        content: `[IMPACT ANALYSIS] ${section}`,
        tokens: encode(section).length
      })
    }
  }

  return chunks.sort((a, b) => b.tokens - a.tokens).slice(0, 5)
}

async function createSectionChunks(content: string): Promise<FileItemChunk[]> {
  const chunks: FileItemChunk[] = []

  // Split by legal sections
  const sections = content.split(/(?=SEC\.|SECTION|§|\n\s*\(\w+\))/i)

  for (const section of sections) {
    if (section.trim().length < 100) continue

    if (encode(section).length > CHUNK_SIZE) {
      // Split large sections
      const subsections = await splitLargeSection(section)
      chunks.push(...subsections)
    } else {
      chunks.push({
        content: section,
        tokens: encode(section).length
      })
    }
  }

  return chunks
}

async function splitLargeSection(section: string): Promise<FileItemChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ". ", "; ", ", ", " ", ""]
  })

  const docs = await splitter.createDocuments([section])
  return docs.map(doc => ({
    content: doc.pageContent,
    tokens: encode(doc.pageContent).length
  }))
}
