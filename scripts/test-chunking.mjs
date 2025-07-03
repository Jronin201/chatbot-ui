import { readFileSync } from 'fs'
import { processTxt } from '../lib/retrieval/processing/txt.js'
import { processDuneTTRPG } from '../lib/retrieval/processing/dune-ttrpg.js'

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
    const chunksByType = duneChunks.reduce((acc, chunk) => {
      if (!acc[chunk.chunkType]) acc[chunk.chunkType] = []
      acc[chunk.chunkType].push(chunk)
      return acc
    }, {})
    
    console.log('📋 Chunks by Type:')
    Object.entries(chunksByType).forEach(([type, chunks]) => {
      console.log(`${type}: ${chunks.length} chunks`)
      if (chunks.length > 0) {
        const example = chunks[0]
        const preview = example.content.substring(0, 150).replace(/\n/g, ' ')
        console.log(`   Example: ${preview}...`)
      }
      console.log('')
    })
    
  } catch (error) {
    console.error('Error testing chunking:', error)
  }
}

testChunking()
