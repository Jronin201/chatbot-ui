import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { generateLocalEmbedding } from "@/lib/generate-local-embedding"

export interface SemanticChunk extends FileItemChunk {
  semanticBoundary: number // 0-1 score of how distinct this chunk is
  topicSimilarity: number // similarity to main document topics
  embeddingQuality: number // quality score of the embedding
}

export const processWithSemanticChunking = async (
  content: string
): Promise<SemanticChunk[]> => {
  // 1. Split into candidate chunks
  const candidateChunks = await createCandidateChunks(content)

  // 2. Calculate semantic boundaries
  const chunksWithBoundaries =
    await calculateSemanticBoundaries(candidateChunks)

  // 3. Merge or split based on semantic coherence
  const optimizedChunks = await optimizeChunkBoundaries(chunksWithBoundaries)

  // 4. Add quality scores
  const finalChunks = await addQualityScores(optimizedChunks, content)

  return finalChunks
}

async function createCandidateChunks(content: string): Promise<string[]> {
  // Create overlapping windows of different sizes
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 20)
  const chunks: string[] = []

  // Strategy 1: Sentence-based chunks
  for (let i = 0; i < sentences.length; i += 3) {
    const chunk = sentences.slice(i, i + 5).join(". ")
    if (chunk.trim()) chunks.push(chunk)
  }

  // Strategy 2: Paragraph-based chunks
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100)
  chunks.push(...paragraphs)

  // Strategy 3: Topic-based chunks (group by similar topics)
  const topicChunks = await groupByTopics(sentences)
  chunks.push(...topicChunks)

  return chunks
}

async function calculateSemanticBoundaries(chunks: string[]): Promise<
  Array<{
    content: string
    boundaryScore: number
  }>
> {
  const chunksWithScores = []

  for (let i = 0; i < chunks.length; i++) {
    const currentChunk = chunks[i]
    let boundaryScore = 0

    if (i > 0) {
      // Calculate semantic similarity with previous chunk
      const prevEmbedding = await generateLocalEmbedding(chunks[i - 1])
      const currentEmbedding = await generateLocalEmbedding(currentChunk)

      const similarity = cosineSimilarity(prevEmbedding, currentEmbedding)
      boundaryScore = 1 - similarity // Higher score = more distinct
    }

    chunksWithScores.push({
      content: currentChunk,
      boundaryScore
    })
  }

  return chunksWithScores
}

async function optimizeChunkBoundaries(
  chunks: Array<{ content: string; boundaryScore: number }>
): Promise<string[]> {
  const optimized: string[] = []
  let currentChunk = ""

  for (const chunk of chunks) {
    // If boundary score is high, start new chunk
    if (chunk.boundaryScore > 0.7 && currentChunk.length > 0) {
      optimized.push(currentChunk.trim())
      currentChunk = chunk.content
    } else {
      // Merge with current chunk
      currentChunk += (currentChunk ? " " : "") + chunk.content
    }

    // Prevent chunks from getting too large
    if (encode(currentChunk).length > 6000) {
      optimized.push(currentChunk.trim())
      currentChunk = ""
    }
  }

  if (currentChunk.trim()) {
    optimized.push(currentChunk.trim())
  }

  return optimized
}

async function addQualityScores(
  chunks: string[],
  originalContent: string
): Promise<SemanticChunk[]> {
  const documentTopics = await extractDocumentTopics(originalContent)

  const scoredChunks: SemanticChunk[] = []

  for (const chunk of chunks) {
    const chunkTopics = await extractChunkTopics(chunk)
    const topicSimilarity = calculateTopicSimilarity(
      documentTopics,
      chunkTopics
    )

    // Calculate embedding quality (coherence, completeness, etc.)
    const embeddingQuality = await calculateEmbeddingQuality(chunk)

    scoredChunks.push({
      content: chunk,
      tokens: encode(chunk).length,
      semanticBoundary: 0.8, // Placeholder - would be calculated properly
      topicSimilarity,
      embeddingQuality
    })
  }

  return scoredChunks
}

async function groupByTopics(sentences: string[]): Promise<string[]> {
  const topicGroups: Record<string, string[]> = {}

  for (const sentence of sentences) {
    const topics = await extractSentenceTopics(sentence)
    const primaryTopic = topics[0] || "general"

    if (!topicGroups[primaryTopic]) {
      topicGroups[primaryTopic] = []
    }
    topicGroups[primaryTopic].push(sentence)
  }

  return Object.values(topicGroups).map(group => group.join(". "))
}

async function extractDocumentTopics(content: string): Promise<string[]> {
  // Extract main topics from document
  const words = content.toLowerCase().match(/\b\w+\b/g) || []
  const wordCount = words.reduce(
    (acc, word) => {
      if (word.length > 3) acc[word] = (acc[word] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word)
}

async function extractChunkTopics(chunk: string): Promise<string[]> {
  // Similar to extractDocumentTopics but for individual chunks
  const words = chunk.toLowerCase().match(/\b\w+\b/g) || []
  const wordCount = words.reduce(
    (acc, word) => {
      if (word.length > 3) acc[word] = (acc[word] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

async function extractSentenceTopics(sentence: string): Promise<string[]> {
  // Extract key topics from a single sentence
  const words = sentence.toLowerCase().match(/\b\w+\b/g) || []
  return words.filter(word => word.length > 4).slice(0, 3)
}

function calculateTopicSimilarity(
  docTopics: string[],
  chunkTopics: string[]
): number {
  const intersection = chunkTopics.filter(topic => docTopics.includes(topic))
  return intersection.length / Math.max(chunkTopics.length, 1)
}

async function calculateEmbeddingQuality(chunk: string): Promise<number> {
  // Calculate various quality metrics
  let score = 0

  // 1. Completeness (has complete sentences)
  const sentences = chunk.split(/[.!?]/).filter(s => s.trim().length > 10)
  score += sentences.length > 0 ? 0.3 : 0

  // 2. Coherence (topics are related)
  const topics = await extractChunkTopics(chunk)
  const uniqueTopics = new Set(topics)
  score += uniqueTopics.size < topics.length ? 0.3 : 0.1

  // 3. Information density
  const infoWords = chunk.match(/\b[A-Z][a-z]+\b/g) || []
  score += Math.min(infoWords.length / 20, 0.4)

  return Math.min(score, 1.0)
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  return dotProduct / (magnitudeA * magnitudeB)
}
