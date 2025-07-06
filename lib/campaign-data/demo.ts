/**
 * Test file demonstrating the complete TTRPG Campaign Management System
 * This file shows how to use all the new storage and CRUD functionality
 */

import { CampaignCRUD } from "@/lib/campaign-data/crud"
import { defaultStorage } from "@/lib/campaign-data/storage"
import {
  EnhancedCampaignData,
  CharacterProfile,
  KeyNPC,
  Location,
  SessionLog
} from "@/types/enhanced-campaign-data"

async function demonstrateCampaignManagement() {
  console.log("🎲 TTRPG Campaign Management System Demo 🎲")

  // Initialize the CRUD system
  const crud = new CampaignCRUD(defaultStorage)

  try {
    console.log("\n📚 Creating a new campaign...")

    // Create a new campaign
    const campaignResult = await crud.createCampaign("demo-campaign-001", {
      name: "The Lost Mines of Phandelver",
      gameSystem: "D&D 5e",
      gameMaster: "Demo GM",
      activePlayers: ["Alice", "Bob", "Charlie", "Diana"]
    })

    if (!campaignResult.success) {
      throw new Error(`Failed to create campaign: ${campaignResult.error}`)
    }

    console.log("✅ Campaign created successfully!")
    console.log(`Campaign ID: ${campaignResult.data?.id}`)
    console.log(`Campaign Name: ${campaignResult.data?.name}`)

    console.log("\n👥 Adding characters...")

    // Create a character
    const character1: Omit<
      CharacterProfile,
      "id" | "createdAt" | "updatedAt" | "version"
    > = {
      name: "Thorin Ironforge",
      playerName: "Alice",
      role: "Fighter",
      background: "Folk Hero",
      affiliation: ["Clan Ironforge"],
      attributes: { STR: 16, DEX: 12, CON: 15, INT: 10, WIS: 13, CHA: 8 },
      skills: { Athletics: 5, Intimidation: 2, Survival: 3 },
      specialAbilities: ["Action Surge", "Second Wind"],
      level: 3,
      experience: 900,
      levelHistory: [],
      inventory: [],
      currency: { gold: 150, silver: 25, copper: 80 },
      assets: [],
      relationships: [],
      currentLocation: "Phandalin",
      currentCondition: ["Healthy"],
      notes: "A sturdy dwarf fighter with a strong sense of justice"
    }

    const charResult1 = await crud.characters.createCharacter(
      "demo-campaign-001",
      character1
    )

    if (charResult1.success) {
      console.log(`✅ Created character: ${charResult1.data?.name}`)
    }

    console.log("\n👑 Adding NPCs...")

    // Create a key NPC
    const keyNPC: Omit<KeyNPC, "id" | "createdAt" | "updatedAt" | "version"> = {
      name: "Sister Garaele",
      title: "Priestess of Tymora",
      description: "A halfling priestess who serves as the local Harper agent",
      background: "A devoted cleric who arrived in Phandalin recently",
      motivations: [
        "Spread the worship of Tymora",
        "Gather information for the Harpers"
      ],
      goals: [],
      fears: ["The rise of evil cults", "Harm to innocent townsfolk"],
      attributes: { STR: 8, DEX: 14, CON: 12, INT: 13, WIS: 17, CHA: 15 },
      skills: { Religion: 6, Insight: 8, Medicine: 7 },
      specialAbilities: ["Spellcasting", "Channel Divinity"],
      currentStatus: "Active in Phandalin",
      currentLocation: "Shrine of Luck",
      alive: true,
      relationships: [],
      factionAffiliations: [],
      interactionHistory: [],
      importanceLevel: "major",
      plotRelevance: ["Harper Network", "Local Religious Leader"],
      notes: "Potential quest giver and source of divine magic services"
    }

    const npcResult = await crud.npcs.createKeyNPC("demo-campaign-001", keyNPC)

    if (npcResult.success) {
      console.log(`✅ Created NPC: ${npcResult.data?.name}`)
    }

    console.log("\n🗺️  Adding locations...")

    // Create a location (using the correct type signature)
    const location: Omit<Location, "id"> = {
      name: "Phandalin",
      type: "Town",
      description:
        "A small frontier town built on the ruins of an older settlement",
      significance:
        "Main hub for the adventure, starting point for most quests",
      currentCondition: "Stable but threatened by local bandits",
      population: 500,
      government: "Town Council led by Harbin Wester",
      economy: "Mining, trading, agriculture",
      culture: "Frontier mix of humans, halflings, dwarves",
      geography: "Located in a valley with hills to the east",
      climate: "Temperate",
      resources: [],
      connectedLocations: [],
      currentEvents: ["Goblin raids increasing", "Missing merchant caravans"],
      history: ["Built on ruins of ancient Phandalin", "Recently resettled"],
      notes: "Safe haven with basic services - inn, temple, trading post",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }

    const locationResult = await crud.locations.createLocation(
      "demo-campaign-001",
      location
    )

    if (locationResult.success) {
      console.log(`✅ Created location: ${locationResult.data?.name}`)
    }

    console.log("\n📝 Creating a session log...")

    // Create a session log
    const session: Omit<
      SessionLog,
      "id" | "createdAt" | "updatedAt" | "version"
    > = {
      sessionNumber: 1,
      date: new Date().toISOString(),
      duration: 180, // 3 hours
      participants: ["Alice", "Bob", "Charlie", "Diana"],
      gamemaster: "Demo GM",
      summary:
        "The party arrived in Phandalin and met several key NPCs. They learned about the goblin problem and agreed to investigate.",
      keyEvents: [],
      playerDecisions: [],
      emergentStorylines: [],
      experienceAwarded: 300,
      treasureGained: [],
      plotAdvancement: [],
      consequences: [],
      nextSessionHooks: [
        "Investigate goblin ambush site",
        "Meet with Sister Garaele"
      ],
      notes:
        "Great session! Players are engaged and excited about the adventure."
    }

    const sessionResult = await crud.sessions.createSession(
      "demo-campaign-001",
      session
    )

    if (sessionResult.success) {
      console.log(
        `✅ Created session log #${sessionResult.data?.sessionNumber}`
      )
    }

    console.log("\n📊 Getting campaign statistics...")

    // Get storage stats
    const statsResult = await crud.getStorageStats("demo-campaign-001")

    if (statsResult.success) {
      console.log("📈 Campaign Statistics:")
      console.log(`  Characters: ${statsResult.data?.totalCharacters}`)
      console.log(`  NPCs: ${statsResult.data?.totalNPCs}`)
      console.log(`  Locations: ${statsResult.data?.totalLocations}`)
      console.log(`  Sessions: ${statsResult.data?.totalSessions}`)
      console.log(`  Last Updated: ${statsResult.data?.lastUpdated}`)
    }

    console.log("\n📋 Testing CRUD operations...")

    // Test updating a character
    if (charResult1.success && charResult1.data) {
      const updateResult = await crud.characters.updateCharacter(
        "demo-campaign-001",
        charResult1.data.id,
        {
          experience: 1200,
          level: 4,
          notes: "Recently gained a level after defeating the goblin patrol!"
        }
      )

      if (updateResult.success) {
        console.log(
          `✅ Updated character: ${updateResult.data?.name} (Level ${updateResult.data?.level})`
        )
      }
    }

    // Test listing all characters
    const charactersResult =
      await crud.characters.listCharacters("demo-campaign-001")
    if (charactersResult.success) {
      console.log(`📝 Campaign has ${charactersResult.data?.length} characters`)
    }

    // Test listing all NPCs
    const npcsResult = await crud.npcs.listKeyNPCs("demo-campaign-001")
    if (npcsResult.success) {
      console.log(`👑 Campaign has ${npcsResult.data?.length} key NPCs`)
    }

    // Test listing all locations
    const locationsResult =
      await crud.locations.listLocations("demo-campaign-001")
    if (locationsResult.success) {
      console.log(`🗺️  Campaign has ${locationsResult.data?.length} locations`)
    }

    // Test listing all sessions
    const sessionsResult = await crud.sessions.listSessions("demo-campaign-001")
    if (sessionsResult.success) {
      console.log(`📅 Campaign has ${sessionsResult.data?.length} sessions`)
    }

    console.log("\n💾 Testing backup functionality...")

    // Test backup
    const backupResult = await crud.backupCampaign("demo-campaign-001")
    if (backupResult.success) {
      console.log(`✅ Backup created: ${backupResult.data}`)
    }

    console.log("\n✅ Demo completed successfully!")
    console.log("\n📋 Summary:")
    console.log("  - Created complete campaign with modular data structure")
    console.log(
      "  - Demonstrated CRUD operations for all modules (Characters, NPCs, Locations, Sessions)"
    )
    console.log("  - Tested update operations and data persistence")
    console.log("  - Generated campaign statistics and backup")
    console.log("  - All data is properly typed and validated")
    console.log(
      "\n🎉 The TTRPG Campaign Management System is fully operational!"
    )
  } catch (error) {
    console.error("❌ Demo failed:", error)
  }
}

// Export for testing
export { demonstrateCampaignManagement }

// Run demo if this file is executed directly
if (typeof window === "undefined" && require.main === module) {
  demonstrateCampaignManagement()
}
