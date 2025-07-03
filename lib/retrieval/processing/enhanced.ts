import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export interface EnhancedFileItemChunk extends FileItemChunk {
  metadata?: {
    section?: string
    subsection?: string
    pageNumber?: number
    chunkIndex: number
    totalChunks: number
    documentSummary?: string
    keywords?: string[]
  }
}

export const processDocumentWithHierarchy = async (
  content: string,
  documentType: "pdf" | "txt" | "md" | "legal" | "technical"
): Promise<EnhancedFileItemChunk[]> => {
  // 1. Extract document structure
  const sections = extractSections(content, documentType)

  // 2. Generate document summary
  const documentSummary = generateDocumentSummary(content)

  // 3. Create chunks with context
  const chunks: EnhancedFileItemChunk[] = []

  for (const section of sections) {
    const sectionChunks = await createSectionChunks(section, documentSummary)
    chunks.push(...sectionChunks)
  }

  return chunks
}

function extractSections(content: string, documentType: string) {
  const sections: Array<{
    title: string
    content: string
    pageNumber?: number
    level: number
  }> = []

  switch (documentType) {
    case "legal":
      // Legal documents often have numbered sections
      const legalSections = content.split(/(?=SEC\.|SECTION|§)/i)
      legalSections.forEach((section, index) => {
        if (section.trim()) {
          sections.push({
            title: extractSectionTitle(section),
            content: section,
            level: 1
          })
        }
      })
      break

    case "md":
      // Markdown has clear header structure
      const mdSections = content.split(/(?=^#{1,6}\s)/m)
      mdSections.forEach((section, index) => {
        if (section.trim()) {
          const headerMatch = section.match(/^(#{1,6})\s(.+)$/m)
          sections.push({
            title: headerMatch?.[2] || `Section ${index + 1}`,
            content: section,
            level: headerMatch?.[1].length || 1
          })
        }
      })
      break

    default:
      // For other documents, use paragraph breaks
      const paragraphSections = content.split(/\n\s*\n/)
      paragraphSections.forEach((section, index) => {
        if (section.trim().length > 100) {
          // Only meaningful sections
          sections.push({
            title: `Section ${index + 1}`,
            content: section,
            level: 1
          })
        }
      })
  }

  return sections
}

function extractSectionTitle(content: string): string {
  const lines = content.split("\n")
  const firstLine = lines[0]?.trim()

  // Look for section headers, titles, or use first few words
  if (firstLine && firstLine.length < 100) {
    return firstLine
  }

  // Extract first meaningful sentence
  const sentences = content.split(/[.!?]/)
  const firstSentence = sentences[0]?.trim()

  if (firstSentence && firstSentence.length < 150) {
    return firstSentence
  }

  // Fallback to first few words
  return content.split(/\s+/).slice(0, 10).join(" ") + "..."
}

function generateDocumentSummary(content: string): string {
  // Simple extractive summary - in production, use AI summarization
  const sentences = content.split(/[.!?]/)
  const importantSentences = sentences
    .filter(s => s.trim().length > 50)
    .slice(0, 3)
    .map(s => s.trim())

  return importantSentences.join(". ")
}

async function createSectionChunks(
  section: { title: string; content: string; level: number },
  documentSummary: string
): Promise<EnhancedFileItemChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""]
  })

  const splitDocs = await splitter.createDocuments([section.content])

  return splitDocs.map((doc, index) => ({
    content: doc.pageContent,
    tokens: encode(doc.pageContent).length,
    metadata: {
      section: section.title,
      chunkIndex: index,
      totalChunks: splitDocs.length,
      documentSummary: documentSummary,
      keywords: extractKeywords(doc.pageContent)
    }
  }))
}

function extractKeywords(content: string): string[] {
  // Simple keyword extraction - in production, use NLP libraries
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3)

  const wordCount = words.reduce(
    (acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}
