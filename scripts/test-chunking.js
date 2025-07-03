#!/usr/bin/env node
import { readFileSync } from 'fs'
import { processTxt } from '../lib/retrieval/processing/txt.js'

async function testChunking() {
  try {
    console.log('🎲 Testing TTRPG Chunking System')
    console.log('================================')
    
    // Read the Dune manual
    const duneManualPath = '/workspaces/chatbot-ui/documents/dune/dune-manual.txt'
    const duneContent = readFileSync(duneManualPath, 'utf8')
    
    // Create a blob from the content  
    const blob = new Blob([duneContent], { type: 'text/plain' })
    
    // Process the text
    const chunks = await processTxt(blob)
    
    console.log(`📄 Processed ${chunks.length} chunks from Dune manual`)
    console.log('')
    
    // Show examples of different chunk types
    const exampleChunks = chunks.filter(chunk => 
      chunk.content.includes('[') && chunk.content.includes(']')
    ).slice(0, 10)
    
    console.log('📋 Example Chunks:')
    exampleChunks.forEach((chunk, i) => {
      const lines = chunk.content.split('\n')
      const header = lines[0]
      const preview = lines.slice(1, 3).join(' ').substring(0, 100)
      console.log(`${i + 1}. ${header}`)
      console.log(`   ${preview}...`)
      console.log(`   Tokens: ${chunk.tokens}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error testing chunking:', error)
  }
}

testChunking()
