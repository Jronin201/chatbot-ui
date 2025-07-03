import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { generateLocalEmbedding } from "@/lib/generate-local-embedding"

export interface HybridChunk extends FileItemChunk {
  chunkType: "overview" | "detail" | "example" | "definition" | "procedure"
  abstractionLevel: "high" | "medium" | "low"
  queryRelevance: Record<string, number> // pre-computed relevance for common query types
  structuralMetadata: {
    isIntroduction: boolean
    isConclusion: boolean
    hasNumbers: boolean
    hasLists: boolean
    sectionDepth: number
  }
}

export const processWithHybridApproach = async (
  content: string,
  documentType: string,
  expectedQueryTypes: string[] = [
    "overview",
    "specific",
    "how-to",
    "definition"
  ]
): Promise<HybridChunk[]> => {
  const chunks: HybridChunk[] = []

  // 1. Create overview chunks (high-level summaries)
  const overviewChunks = await createOverviewChunks(content, documentType)
  chunks.push(...overviewChunks)

  // 2. Create detail chunks (specific information)
  const detailChunks = await createDetailChunks(content, documentType)
  chunks.push(...detailChunks)

  // 3. Create specialized chunks (definitions, procedures, examples)
  const specializedChunks = await createSpecializedChunks(content, documentType)
  chunks.push(...specializedChunks)

  // 4. Pre-compute query relevance scores
  const enrichedChunks = await enrichWithQueryRelevance(
    chunks,
    expectedQueryTypes
  )

  return enrichedChunks
}

async function createOverviewChunks(
  content: string,
  documentType: string
): Promise<HybridChunk[]> {
  const chunks: HybridChunk[] = []

  // Extract document abstract/summary
  const introduction = extractIntroduction(content, documentType)
  if (introduction) {
    chunks.push({
      content: introduction,
      tokens: encode(introduction).length,
      chunkType: "overview",
      abstractionLevel: "high",
      queryRelevance: {},
      structuralMetadata: {
        isIntroduction: true,
        isConclusion: false,
        hasNumbers: /\d+/.test(introduction),
        hasLists: /[\n\r][-\*•]/.test(introduction),
        sectionDepth: 0
      }
    })
  }

  // Extract main themes/topics
  const mainTopics = await extractMainTopics(content)
  for (const topic of mainTopics) {
    const topicOverview = await createTopicOverview(content, topic)
    chunks.push({
      content: topicOverview,
      tokens: encode(topicOverview).length,
      chunkType: "overview",
      abstractionLevel: "medium",
      queryRelevance: {},
      structuralMetadata: {
        isIntroduction: false,
        isConclusion: false,
        hasNumbers: /\d+/.test(topicOverview),
        hasLists: /[\n\r][-\*•]/.test(topicOverview),
        sectionDepth: 1
      }
    })
  }

  // Extract conclusion/summary
  const conclusion = extractConclusion(content, documentType)
  if (conclusion) {
    chunks.push({
      content: conclusion,
      tokens: encode(conclusion).length,
      chunkType: "overview",
      abstractionLevel: "high",
      queryRelevance: {},
      structuralMetadata: {
        isIntroduction: false,
        isConclusion: true,
        hasNumbers: /\d+/.test(conclusion),
        hasLists: /[\n\r][-\*•]/.test(conclusion),
        sectionDepth: 0
      }
    })
  }

  return chunks
}

async function createDetailChunks(
  content: string,
  documentType: string
): Promise<HybridChunk[]> {
  const chunks: HybridChunk[] = []

  // Split into sections first
  const sections = splitIntoSections(content, documentType)

  for (const [sectionIndex, section] of sections.entries()) {
    // Further split each section into detail chunks
    const sectionChunks = await splitSectionIntoChunks(section, sectionIndex)
    chunks.push(...sectionChunks)
  }

  return chunks
}

async function createSpecializedChunks(
  content: string,
  documentType: string
): Promise<HybridChunk[]> {
  const chunks: HybridChunk[] = []

  // Extract definitions
  const definitions = extractDefinitions(content)
  for (const definition of definitions) {
    chunks.push({
      content: definition,
      tokens: encode(definition).length,
      chunkType: "definition",
      abstractionLevel: "low",
      queryRelevance: {},
      structuralMetadata: {
        isIntroduction: false,
        isConclusion: false,
        hasNumbers: /\d+/.test(definition),
        hasLists: false,
        sectionDepth: 2
      }
    })
  }

  // Extract procedures/steps
  const procedures = extractProcedures(content)
  for (const procedure of procedures) {
    chunks.push({
      content: procedure,
      tokens: encode(procedure).length,
      chunkType: "procedure",
      abstractionLevel: "low",
      queryRelevance: {},
      structuralMetadata: {
        isIntroduction: false,
        isConclusion: false,
        hasNumbers: /\d+/.test(procedure),
        hasLists: /[\n\r][-\*•]/.test(procedure),
        sectionDepth: 2
      }
    })
  }

  // Extract examples
  const examples = extractExamples(content)
  for (const example of examples) {
    chunks.push({
      content: example,
      tokens: encode(example).length,
      chunkType: "example",
      abstractionLevel: "low",
      queryRelevance: {},
      structuralMetadata: {
        isIntroduction: false,
        isConclusion: false,
        hasNumbers: /\d+/.test(example),
        hasLists: false,
        sectionDepth: 2
      }
    })
  }

  return chunks
}

async function enrichWithQueryRelevance(
  chunks: HybridChunk[],
  expectedQueryTypes: string[]
): Promise<HybridChunk[]> {
  const queryPatterns = {
    overview: ["what is", "overview", "summary", "explain", "describe"],
    specific: ["how much", "when", "where", "which", "specific"],
    "how-to": ["how to", "steps", "procedure", "process", "method"],
    definition: ["define", "meaning", "what does", "term", "concept"],
    impact: ["impact", "effect", "consequence", "result", "outcome"],
    comparison: ["compare", "difference", "versus", "vs", "better"]
  }

  for (const chunk of chunks) {
    chunk.queryRelevance = {}

    for (const queryType of expectedQueryTypes) {
      const patterns =
        queryPatterns[queryType as keyof typeof queryPatterns] || []
      let relevanceScore = 0

      // Base score on chunk type
      if (queryType === "overview" && chunk.chunkType === "overview") {
        relevanceScore += 0.8
      } else if (queryType === "specific" && chunk.chunkType === "detail") {
        relevanceScore += 0.7
      } else if (queryType === "how-to" && chunk.chunkType === "procedure") {
        relevanceScore += 0.9
      } else if (
        queryType === "definition" &&
        chunk.chunkType === "definition"
      ) {
        relevanceScore += 0.9
      }

      // Adjust based on content patterns
      for (const pattern of patterns) {
        if (chunk.content.toLowerCase().includes(pattern)) {
          relevanceScore += 0.1
        }
      }

      // Adjust based on structural metadata
      if (queryType === "overview" && chunk.structuralMetadata.isIntroduction) {
        relevanceScore += 0.2
      }

      chunk.queryRelevance[queryType] = Math.min(relevanceScore, 1.0)
    }
  }

  return chunks
}

// Helper functions
function extractIntroduction(
  content: string,
  documentType: string
): string | null {
  const lines = content.split("\n")

  if (documentType === "legal") {
    // Legal documents often start with "An Act to..."
    const actLine = lines.find(line => line.toLowerCase().includes("an act"))
    if (actLine) {
      const startIndex = lines.indexOf(actLine)
      return lines.slice(startIndex, startIndex + 5).join("\n")
    }
  }

  // General approach: first substantial paragraph
  const paragraphs = content.split("\n\n")
  const firstParagraph = paragraphs.find(p => p.trim().length > 100)

  return firstParagraph || null
}

function extractConclusion(
  content: string,
  documentType: string
): string | null {
  const paragraphs = content.split("\n\n")
  const lastParagraphs = paragraphs.slice(-3)

  // Look for conclusion indicators
  const conclusionParagraph = lastParagraphs.find(
    p =>
      p.toLowerCase().includes("conclusion") ||
      p.toLowerCase().includes("summary") ||
      p.toLowerCase().includes("in conclusion")
  )

  return conclusionParagraph || null
}

function extractDefinitions(content: string): string[] {
  const definitions: string[] = []
  const sentences = content.split(/[.!?]/)

  for (const sentence of sentences) {
    if (
      sentence.includes(" means ") ||
      sentence.includes(" is defined as ") ||
      sentence.includes(" refers to ") ||
      /"\w+" means/.test(sentence)
    ) {
      definitions.push(sentence.trim())
    }
  }

  return definitions
}

function extractProcedures(content: string): string[] {
  const procedures: string[] = []
  const sections = content.split("\n\n")

  for (const section of sections) {
    if (
      section.includes("step") ||
      section.includes("procedure") ||
      /\d+\.\s/.test(section) ||
      section.includes("shall:")
    ) {
      procedures.push(section.trim())
    }
  }

  return procedures
}

function extractExamples(content: string): string[] {
  const examples: string[] = []
  const sentences = content.split(/[.!?]/)

  for (const sentence of sentences) {
    if (
      sentence.toLowerCase().includes("for example") ||
      sentence.toLowerCase().includes("such as") ||
      sentence.toLowerCase().includes("including") ||
      sentence.toLowerCase().includes("e.g.")
    ) {
      examples.push(sentence.trim())
    }
  }

  return examples
}

async function extractMainTopics(content: string): Promise<string[]> {
  // Extract likely main topics from headings and key phrases
  const topics: string[] = []

  // Look for headings
  const headings = content.match(/^#{1,6}\s+(.+)$/gm) || []
  topics.push(...headings.map(h => h.replace(/^#+\s+/, "")))

  // Look for capitalized important terms
  const capitalizedTerms =
    content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
  const termCount = capitalizedTerms.reduce(
    (acc, term) => {
      acc[term] = (acc[term] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const frequentTerms = Object.entries(termCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([term]) => term)

  topics.push(...frequentTerms)

  return [...new Set(topics)].slice(0, 10)
}

async function createTopicOverview(
  content: string,
  topic: string
): Promise<string> {
  // Find all mentions of the topic and create a summary
  const sentences = content.split(/[.!?]/)
  const relevantSentences = sentences.filter(sentence =>
    sentence.toLowerCase().includes(topic.toLowerCase())
  )

  return `Topic: ${topic}\n\n${relevantSentences.slice(0, 3).join(". ")}`
}

function splitIntoSections(content: string, documentType: string): string[] {
  switch (documentType) {
    case "legal":
      return content.split(/(?=SEC\.|SECTION|§)/i).filter(s => s.trim())
    case "technical":
      return content
        .split(/(?=^#{1,6}|\d+\.|Chapter|Part)/m)
        .filter(s => s.trim())
    default:
      return content.split(/\n\s*\n/).filter(s => s.trim().length > 100)
  }
}

async function splitSectionIntoChunks(
  section: string,
  sectionIndex: number
): Promise<HybridChunk[]> {
  const chunks: HybridChunk[] = []
  const paragraphs = section.split("\n\n")

  for (const [paragraphIndex, paragraph] of paragraphs.entries()) {
    if (paragraph.trim().length > 100) {
      chunks.push({
        content: paragraph,
        tokens: encode(paragraph).length,
        chunkType: "detail",
        abstractionLevel: "medium",
        queryRelevance: {},
        structuralMetadata: {
          isIntroduction: false,
          isConclusion: false,
          hasNumbers: /\d+/.test(paragraph),
          hasLists: /[\n\r][-\*•]/.test(paragraph),
          sectionDepth: sectionIndex + 1
        }
      })
    }
  }

  return chunks
}
