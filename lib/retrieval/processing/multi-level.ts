import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export interface MultiLevelChunk extends FileItemChunk {
  level: "sentence" | "paragraph" | "section" | "document"
  parentChunk?: string
  childChunks?: string[]
  contextWindow?: string
  semanticId: string
}

export const processWithMultiLevelEmbedding = async (
  content: string,
  documentType: string
): Promise<MultiLevelChunk[]> => {
  const chunks: MultiLevelChunk[] = []

  // Level 1: Document-level summary
  const documentSummary = await createDocumentSummary(content)
  chunks.push({
    content: documentSummary,
    tokens: encode(documentSummary).length,
    level: "document",
    semanticId: "doc-summary"
  })

  // Level 2: Section-level chunks
  const sections = splitIntoSections(content, documentType)
  for (const [index, section] of sections.entries()) {
    const sectionSummary = await createSectionSummary(section)
    const sectionId = `section-${index}`

    chunks.push({
      content: sectionSummary,
      tokens: encode(sectionSummary).length,
      level: "section",
      semanticId: sectionId,
      parentChunk: "doc-summary"
    })

    // Level 3: Paragraph-level chunks with context
    const paragraphs = await createParagraphChunks(section, sectionSummary)
    for (const [pIndex, paragraph] of paragraphs.entries()) {
      chunks.push({
        content: paragraph.content,
        tokens: paragraph.tokens,
        level: "paragraph",
        semanticId: `${sectionId}-p${pIndex}`,
        parentChunk: sectionId,
        contextWindow: paragraph.contextWindow
      })
    }
  }

  return chunks
}

async function createDocumentSummary(content: string): Promise<string> {
  // Extract key themes and main points
  const keyPhrases = extractKeyPhrases(content)
  const mainTopics = extractMainTopics(content)

  return `Document Summary: ${mainTopics.join(", ")}. Key concepts: ${keyPhrases.slice(0, 5).join(", ")}.`
}

async function createSectionSummary(section: string): Promise<string> {
  // Create a summary of the section's main points
  const sentences = section.split(/[.!?]/).filter(s => s.trim().length > 30)
  const keySentences = sentences
    .slice(0, 3)
    .map(s => s.trim())
    .join(". ")

  return `Section Summary: ${keySentences}`
}

async function createParagraphChunks(
  section: string,
  sectionSummary: string
): Promise<Array<{ content: string; tokens: number; contextWindow: string }>> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""]
  })

  const splitDocs = await splitter.createDocuments([section])

  return splitDocs.map((doc, index) => {
    // Create context window with surrounding content
    const contextWindow = createContextWindow(splitDocs, index, sectionSummary)

    return {
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length,
      contextWindow
    }
  })
}

function createContextWindow(
  docs: any[],
  currentIndex: number,
  sectionSummary: string
): string {
  const context = []

  // Add section summary
  context.push(`Context: ${sectionSummary}`)

  // Add previous chunk if exists
  if (currentIndex > 0) {
    const prevChunk = docs[currentIndex - 1].pageContent.substring(0, 100)
    context.push(`Previous: ${prevChunk}...`)
  }

  // Add next chunk if exists
  if (currentIndex < docs.length - 1) {
    const nextChunk = docs[currentIndex + 1].pageContent.substring(0, 100)
    context.push(`Next: ${nextChunk}...`)
  }

  return context.join(" | ")
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

function extractKeyPhrases(content: string): string[] {
  // Simple n-gram extraction - in production, use NLP
  const words = content.toLowerCase().match(/\b\w+\b/g) || []
  const bigrams = []

  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`)
  }

  const bigramCount = bigrams.reduce(
    (acc, bigram) => {
      acc[bigram] = (acc[bigram] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(bigramCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([phrase]) => phrase)
}

function extractMainTopics(content: string): string[] {
  // Extract likely topic words (capitalized words, repeated terms)
  const topics = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []

  const topicCount = topics.reduce(
    (acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(topicCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([topic]) => topic)
}
