import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export interface OptimizedChunk extends FileItemChunk {
  chunkType: "summary" | "section" | "detail" | "impact" | "definition"
  relevanceScore: number
  sectionTitle?: string
  impactLevel?: "high" | "medium" | "low"
  economicTerms: string[]
}

export const processForLegalAnalysis = async (
  content: string,
  documentType: "legal" | "policy" | "bill" = "legal"
): Promise<OptimizedChunk[]> => {
  const chunks: OptimizedChunk[] = []

  // 1. Create document summary chunk for overview questions
  const summary = createDocumentSummary(content)
  chunks.push({
    content: summary,
    tokens: encode(summary).length,
    chunkType: "summary",
    relevanceScore: 1.0,
    economicTerms: extractEconomicTerms(summary),
    impactLevel: "high"
  })

  // 2. Create impact-focused chunks for "biggest impact" type questions
  const impactChunks = await createImpactChunks(content)
  chunks.push(...impactChunks)

  // 3. Create section-based chunks with better context
  const sectionChunks = await createSectionChunks(content, documentType)
  chunks.push(...sectionChunks)

  // 4. Create definition chunks for technical terms
  const definitionChunks = await createDefinitionChunks(content)
  chunks.push(...definitionChunks)

  return chunks
}

function createDocumentSummary(content: string): string {
  // Extract title and key provisions
  const lines = content.split("\n").filter(line => line.trim())
  const title = lines[0] || "Untitled Document"

  // Find key sections that mention economic impact
  const economicSections = lines.filter(
    line =>
      line.toLowerCase().includes("economic") ||
      line.toLowerCase().includes("financial") ||
      line.toLowerCase().includes("budget") ||
      line.toLowerCase().includes("cost") ||
      line.toLowerCase().includes("revenue") ||
      line.toLowerCase().includes("tax") ||
      line.toLowerCase().includes("spending")
  )

  const summary = `${title}\n\nKey Economic Provisions:\n${economicSections.slice(0, 5).join("\n")}`

  return summary
}

async function createImpactChunks(content: string): Promise<OptimizedChunk[]> {
  const chunks: OptimizedChunk[] = []

  // Find sections that discuss impacts, effects, or consequences
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
    "job creation",
    "gdp",
    "inflation",
    "unemployment",
    "growth"
  ]

  const sections = content.split(/\n\s*\n/)

  for (const section of sections) {
    const lowerSection = section.toLowerCase()
    const impactScore = impactKeywords.reduce((score, keyword) => {
      return score + (lowerSection.includes(keyword) ? 1 : 0)
    }, 0)

    if (impactScore > 0) {
      const economicTerms = extractEconomicTerms(section)
      const impactLevel =
        impactScore > 3 ? "high" : impactScore > 1 ? "medium" : "low"

      chunks.push({
        content: section,
        tokens: encode(section).length,
        chunkType: "impact",
        relevanceScore: impactScore / impactKeywords.length,
        economicTerms,
        impactLevel: impactLevel as "high" | "medium" | "low"
      })
    }
  }

  return chunks.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

async function createSectionChunks(
  content: string,
  documentType: string
): Promise<OptimizedChunk[]> {
  const chunks: OptimizedChunk[] = []

  // Split by legal sections
  const sectionPattern =
    documentType === "legal" ? /(?=SEC\.|SECTION|§|\n\s*\(\w+\))/i : /\n\s*\n/

  const sections = content.split(sectionPattern)

  for (const section of sections) {
    if (section.trim().length < 100) continue

    const sectionTitle = extractSectionTitle(section)
    const economicTerms = extractEconomicTerms(section)

    // Further split large sections
    if (encode(section).length > CHUNK_SIZE) {
      const subsections = await splitLargeSection(section)

      for (const subsection of subsections) {
        chunks.push({
          content: subsection,
          tokens: encode(subsection).length,
          chunkType: "section",
          relevanceScore: calculateRelevanceScore(subsection),
          sectionTitle,
          economicTerms: extractEconomicTerms(subsection)
        })
      }
    } else {
      chunks.push({
        content: section,
        tokens: encode(section).length,
        chunkType: "section",
        relevanceScore: calculateRelevanceScore(section),
        sectionTitle,
        economicTerms
      })
    }
  }

  return chunks
}

async function createDefinitionChunks(
  content: string
): Promise<OptimizedChunk[]> {
  const chunks: OptimizedChunk[] = []

  // Find definition patterns
  const definitionPatterns = [
    /["']([^"']+)["']\s+means\s+([^.]+)/gi,
    /the term\s+["']([^"']+)["']\s+means\s+([^.]+)/gi,
    /["']([^"']+)["']\s+is defined as\s+([^.]+)/gi,
    /["']([^"']+)["']\s+refers to\s+([^.]+)/gi
  ]

  for (const pattern of definitionPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const term = match[1]
      const definition = match[2]

      chunks.push({
        content: `${term}: ${definition}`,
        tokens: encode(`${term}: ${definition}`).length,
        chunkType: "definition",
        relevanceScore: 0.8,
        economicTerms: extractEconomicTerms(`${term} ${definition}`)
      })
    }
  }

  return chunks
}

function extractSectionTitle(section: string): string {
  const lines = section.split("\n").filter(line => line.trim())
  const firstLine = lines[0]?.trim()

  if (firstLine && firstLine.length < 100) {
    return firstLine
  }

  // Look for section number or title
  const sectionMatch = section.match(
    /^(SEC\.|SECTION|§)\s*(\d+[A-Z]?)\s*\.?\s*([^.\n]+)/i
  )
  if (sectionMatch) {
    return `${sectionMatch[1]} ${sectionMatch[2]}: ${sectionMatch[3]}`
  }

  return "Untitled Section"
}

function extractEconomicTerms(text: string): string[] {
  const economicTerms = [
    "budget",
    "cost",
    "revenue",
    "tax",
    "spending",
    "investment",
    "gdp",
    "inflation",
    "unemployment",
    "growth",
    "deficit",
    "surplus",
    "fiscal",
    "monetary",
    "economic",
    "financial",
    "market",
    "trade",
    "billion",
    "million",
    "trillion",
    "dollar",
    "funding",
    "appropriation",
    "subsidy",
    "grant",
    "loan",
    "credit",
    "debt",
    "liability",
    "job",
    "employment",
    "wage",
    "salary",
    "income",
    "profit"
  ]

  const foundTerms = economicTerms.filter(term =>
    text.toLowerCase().includes(term)
  )

  return foundTerms
}

function calculateRelevanceScore(text: string): number {
  const economicTerms = extractEconomicTerms(text)
  const impactKeywords = ["impact", "effect", "consequence", "result"]
  const impactCount = impactKeywords.reduce(
    (count, keyword) => count + (text.toLowerCase().includes(keyword) ? 1 : 0),
    0
  )

  return Math.min(economicTerms.length * 0.1 + impactCount * 0.2, 1.0)
}

async function splitLargeSection(section: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: [
      "\n\n", // Paragraph breaks
      "\n", // Line breaks
      ". ", // Sentence ends
      "; ", // Clause separators
      ", ", // Comma separators
      " ", // Word breaks
      "" // Character breaks
    ]
  })

  const docs = await splitter.createDocuments([section])
  return docs.map(doc => doc.pageContent)
}

// Export the improved function for immediate use
export const processPdfOptimized = async (
  pdf: Blob
): Promise<OptimizedChunk[]> => {
  const PDFLoader = (await import("langchain/document_loaders/fs/pdf"))
    .PDFLoader
  const loader = new PDFLoader(pdf)
  const docs = await loader.load()

  // Better context preservation
  const completeText = docs.map(doc => doc.pageContent).join("\n\n")

  // Use the optimized processing
  return await processForLegalAnalysis(completeText, "legal")
}
