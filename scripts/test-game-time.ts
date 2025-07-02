import { GameTimeService } from "@/lib/game-time/game-time-service"
import { GameTimeManager } from "@/lib/game-time/calendar-utils"
import { TimePassageAnalyzer } from "@/lib/game-time/time-passage-analyzer"

/**
 * Simple tests for the Game Time system
 */
async function runGameTimeTests() {
  console.log("🎮 Running Game Time System Tests...")

  try {
    // Test 1: Calendar utilities
    console.log("\n📅 Testing Calendar Utilities...")
    
    // Test Dune date parsing
    const duneDate = "15 Ignis 10191 A.G."
    const isValidDune = GameTimeManager.isValidDate(duneDate, "dune")
    console.log(`Dune date "${duneDate}" is valid: ${isValidDune}`)
    
    // Test date formatting
    const formattedDune = GameTimeManager.formatDate(duneDate, "dune")
    console.log(`Formatted Dune date: ${formattedDune}`)
    
    // Test adding days
    const newDuneDate = GameTimeManager.addDays(duneDate, 45, "dune")
    console.log(`${duneDate} + 45 days = ${newDuneDate}`)

    // Test 2: Time passage analysis
    console.log("\n🔍 Testing Time Passage Analysis...")
    
    const analyzer = new TimePassageAnalyzer()
    
    const testMessages = [
      "We traveled to Arrakis, the journey took 3 days.",
      "The characters rested for a week to recover from their injuries.",
      "After intensive training with the sword masters, we felt ready.",
      "No significant events occurred during this conversation.",
      "The expedition to the spice mining facility lasted a month."
    ]
    
    for (const message of testMessages) {
      const analysis = analyzer.analyzeMessage(message)
      console.log(`Message: "${message.slice(0, 50)}..."`)
      console.log(`  Days: ${analysis.daysElapsed}, Confidence: ${(analysis.confidence * 100).toFixed(1)}%`)
      if (analysis.matches.length > 0) {
        console.log(`  Matches: ${analysis.matches.map(m => m.type).join(", ")}`)
      }
    }

    // Test 3: Game Time Service
    console.log("\n⚙️ Testing Game Time Service...")
    
    const service = GameTimeService.getInstance()
    
    // Check if game time data exists
    const hasData = await service.hasGameTimeData()
    console.log(`Has existing game time data: ${hasData}`)
    
    if (!hasData) {
      console.log("Initializing new game time...")
      await service.initializeGameTime(
        "1 Ignis 10191 A.G.",
        "dune",
        {
          campaignName: "Test Campaign",
          gameSystem: "Dune: Adventures in the Imperium"
        }
      )
      console.log("✅ Game time initialized")
    }
    
    // Test message processing
    const testMessage = "We traveled to the capital city, the journey took 5 days through the desert."
    const processResult = await service.processMessage(testMessage)
    
    if (processResult.timeUpdated) {
      console.log(`✅ Time updated: ${processResult.timePassageInfo?.daysElapsed} days`)
      console.log(`Description: ${processResult.timePassageInfo?.description}`)
    } else {
      console.log("ℹ️ No time update from message")
    }
    
    // Get campaign stats
    const stats = await service.getCampaignStats()
    console.log(`\n📊 Campaign Stats:`)
    console.log(`  Current Date: ${stats.formattedCurrentDate}`)
    console.log(`  Days Elapsed: ${stats.totalDaysElapsed}`)
    console.log(`  Events: ${stats.timePassageEvents}`)
    console.log(`  System: ${stats.calendarSystem}`)

    console.log("\n✅ All tests completed successfully!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    throw error
  }
}

export { runGameTimeTests }
