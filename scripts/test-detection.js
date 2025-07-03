#!/usr/bin/env node

const fs = require('fs')
const { encode } = require('gpt-tokenizer')

// Simple test to verify the Dune content detection
function testDuneDetection() {
  console.log('🎲 Testing Dune Content Detection')
  console.log('==================================')
  
  // Read the Dune manual
  const duneManualPath = '/workspaces/chatbot-ui/documents/dune/dune-manual.txt'
  const duneContent = fs.readFileSync(duneManualPath, 'utf8')
  
  console.log(`📄 Loaded Dune manual (${duneContent.length} characters)`)
  
  // Test Dune-specific keyword detection
  const duneKeywords = [
    'arrakis', 'dune', 'imperium', 'atreides', 'harkonnen', 'corrino',
    'bene gesserit', 'fremen', 'spice', 'melange', 'sandworm', 'guild',
    'spacing guild', 'mentat', 'swordmaster', 'sardaukar', 'landsraad',
    'padishah emperor', 'great houses', 'muad\'dib', 'kwisatz haderach',
    'giedi prime', 'caladan', 'kaitain', 'ornithopter', 'stillsuit'
  ]
  
  const lowerContent = duneContent.toLowerCase()
  const foundKeywords = duneKeywords.filter(keyword => lowerContent.includes(keyword))
  
  console.log(`🔍 Found ${foundKeywords.length} Dune keywords:`)
  foundKeywords.forEach(keyword => {
    const count = (lowerContent.match(new RegExp(keyword, 'g')) || []).length
    console.log(`   ${keyword}: ${count} occurrences`)
  })
  
  // Test TTRPG keyword detection
  const ttrpgKeywords = [
    'roleplaying', 'gamemaster', 'character', 'dice', 'skills', 'attributes',
    'combat', 'weapon', 'armor', 'adventure', 'campaign', 'player character',
    'gm', 'dm', 'stats', 'experience', 'level', 'hit points', 'damage', 'initiative'
  ]
  
  const foundTTRPGKeywords = ttrpgKeywords.filter(keyword => lowerContent.includes(keyword))
  
  console.log(`\n🎯 Found ${foundTTRPGKeywords.length} TTRPG keywords:`)
  foundTTRPGKeywords.forEach(keyword => {
    const count = (lowerContent.match(new RegExp(keyword, 'g')) || []).length
    console.log(`   ${keyword}: ${count} occurrences`)
  })
  
  // Test sectioning
  console.log('\n📋 Content Analysis:')
  const sections = duneContent.split(/\n\s*\n/)
  console.log(`   Total sections: ${sections.length}`)
  
  const longSections = sections.filter(s => s.length > 200)
  console.log(`   Long sections (>200 chars): ${longSections.length}`)
  
  const tokens = encode(duneContent).length
  console.log(`   Total tokens: ${tokens}`)
  
  // Find sections with specific TTRPG content
  const characterSections = sections.filter(s => {
    const lower = s.toLowerCase()
    return lower.includes('character') && (
      lower.includes('creation') || lower.includes('stats') || lower.includes('attributes')
    )
  })
  
  console.log(`   Character creation sections: ${characterSections.length}`)
  
  const combatSections = sections.filter(s => {
    const lower = s.toLowerCase()
    return lower.includes('combat') || lower.includes('battle') || lower.includes('fight')
  })
  
  console.log(`   Combat sections: ${combatSections.length}`)
  
  const loreSections = sections.filter(s => {
    const lower = s.toLowerCase()
    return lower.includes('imperium') || lower.includes('universe') || lower.includes('history')
  })
  
  console.log(`   Lore sections: ${loreSections.length}`)
  
  console.log('\n✅ Content detection test complete!')
}

testDuneDetection()
