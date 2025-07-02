// Simple test to verify the deduplication fix works
const { GameTimeService } = require('./lib/game-time/game-time-service.ts')

async function testDeduplication() {
  console.log('Testing deduplication fix...')
  
  try {
    const service = GameTimeService.getInstance()
    
    // Test the same message multiple times
    const testMessage = "I follow the messenger and we travel to the capital together."
    
    console.log('Processing message first time...')
    const result1 = await service.processMessage(testMessage)
    console.log('First result:', result1)
    
    console.log('Processing same message second time...')
    const result2 = await service.processMessage(testMessage)
    console.log('Second result:', result2)
    
    console.log('Processing same message third time...')
    const result3 = await service.processMessage(testMessage)
    console.log('Third result:', result3)
    
    if (result1.timeUpdated && !result2.timeUpdated && !result3.timeUpdated) {
      console.log('✅ Deduplication working correctly!')
    } else {
      console.log('❌ Deduplication not working as expected')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testDeduplication()
