import { readFileSync } from 'fs'
import { processDuneTTRPG } from '../lib/retrieval/processing/dune-ttrpg'

async function testChunking() {
  try {
    console.log('🎲 Testing TTRPG Chunking System')
    console.log('================================')
    
    // Read the Dune manual
    const duneManualPath = '/workspaces/chatbot-ui/documents/dune/dune-manual.txt'
    const duneContent = readFileSync(duneManualPath, 'utf8')
    
    console.log(`📄 Loaded Dune manual (${duneContent.length} characters)`)
    
    // Test Dune-specific processing directly
    const duneChunks = await processDuneTTRPG(duneContent)
    
    console.log(`📄 Processed ${duneChunks.length} chunks from Dune manual`)
    console.log('')
    
    // Show examples of different chunk types
    const chunksByType: Record<string, any[]> = duneChunks.reduce((acc, chunk) => {
      if (!acc[chunk.chunkType]) acc[chunk.chunkType] = []
      acc[chunk.chunkType].push(chunk)
      return acc
    }, {} as Record<string, any[]>)
    
    console.log('📋 Chunks by Type:')
    Object.entries(chunksByType).forEach(([type, chunks]) => {
      console.log(`${type}: ${chunks.length} chunks`)
      if (chunks.length > 0) {
        const example = chunks[0]
        const preview = example.content.substring(0, 150).replace(/\n/g, ' ')
        console.log(`   Example: ${preview}...`)
        console.log(`   Dune-specific: ${example.duneSpecific}`)
        console.log(`   Mechanics level: ${example.mechanicsLevel}`)
        console.log(`   Player relevance: ${example.playerRelevance}`)
      }
      console.log('')
    })
    
    // Test some specific queries
    console.log('🔍 Testing Query-Relevant Chunks:')
    console.log('================================')
    
    const testQueries = [
      'character creation',
      'combat mechanics', 
      'house rules',
      'bene gesserit abilities',
      'spice melange'
    ]
    
    testQueries.forEach(query => {
      const relevantChunks = duneChunks.filter(chunk => 
        chunk.content.toLowerCase().includes(query.toLowerCase())
      )
      console.log(`Query: "${query}" - ${relevantChunks.length} relevant chunks`)
    })
    
  } catch (error) {
    console.error('Error testing chunking:', error)
    if (error instanceof Error) {
      console.error(error.stack)
    }
  }
}

testChunking()
