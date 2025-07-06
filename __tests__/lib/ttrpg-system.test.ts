/**
 * Unit Tests for TTRPG Campaign Management System
 * 
 * Simplified tests for relevance engine and AI context assembly
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  RelevanceEngine,
  AIContextAssembler,
  createRelevanceEngine,
  createAIContextAssembler,
  assembleAIContext,
  generateQuickPrompt,
  optimizeContextForAI,
  getHighPriorityEntities,
  filterBackgroundEntities
} from '@/lib/relevance/relevance-engine'

// =====================================================
// SIMPLIFIED MOCK DATA
// =====================================================

const mockSessionState = {
  sessionInfo: {
    sessionId: 'test-session-123',
    sessionDate: '2024-01-15',
    gameDate: '3rd day of Winter, 1024',
    sessionNumber: 5,
    isActive: true,
    duration: 180,
    notes: 'Test session'
  },
  activeEntities: {
    characters: [
      {
        id: 'char-1',
        name: 'Aragorn',
        currentLocation: 'Minas Tirith'
      }
    ],
    npcs: [
      {
        id: 'npc-1',
        name: 'Gandalf',
        currentLocation: 'Minas Tirith'
      }
    ],
    minorNPCs: [],
    factions: []
  },
  currentContext: {
    primaryLocation: 'Minas Tirith',
    secondaryLocations: ['Osgiliath'],
    timeOfDay: 'evening',
    weather: 'clear',
    mood: 'tense'
  },
  activePlots: {
    mainPlotline: {
      id: 'main-plot',
      name: 'The War of the Ring',
      description: 'The final battle',
      status: 'active'
    },
    activeSubplots: [
      {
        id: 'subplot-1',
        name: 'Defense of the City',
        description: 'Prepare Minas Tirith',
        status: 'active'
      }
    ],
    recentEvents: [
      {
        id: 'event-1',
        name: 'Beacons Lit',
        description: 'The beacons of Gondor have been lit'
      }
    ]
  },
  recentHistory: {
    lastActions: [
      'Aragorn spoke with the city guards',
      'Gandalf lit the beacon',
      'The party discussed strategies'
    ],
    importantDialogue: [
      'Gandalf: "The beacons are lit!"',
      'Aragorn: "We must hold the city"'
    ],
    keyDecisions: [
      'Decided to defend the city',
      'Chose to send messengers'
    ],
    combatEvents: []
  },
  contextMemory: {
    shortTerm: [],
    longTerm: [],
    crossSession: []
  },
  aiContext: {
    memoryDepth: 10,
    relevanceThreshold: 5,
    maxContextSize: 2000,
    preferredDetails: ['personality', 'relationships', 'motivations']
  },
  additionalContext: {}
}

const mockCampaignData = {
  characterProfiles: [
    {
      id: 'char-1',
      name: 'Aragorn',
      role: 'Ranger',
      level: 10,
      currentLocation: 'Minas Tirith'
    }
  ],
  npcDatabase: {
    id: 'npc-db-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    version: 1,
    keyNPCs: [
      {
        id: 'npc-1',
        name: 'Gandalf',
        importanceLevel: 'critical',
        currentLocation: 'Minas Tirith'
      }
    ],
    minorNPCs: [],
    factions: []
  },
  worldState: {
    id: 'world-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    version: 1,
    locations: [
      {
        id: 'loc-1',
        name: 'Minas Tirith',
        type: 'city',
        description: 'The great white city',
        size: 'large'
      }
    ]
  },
  campaignProgression: {
    mainPlotline: {
      id: 'main-plot',
      name: 'The War of the Ring',
      description: 'The final battle',
      status: 'active'
    },
    subplots: [
      {
        id: 'subplot-1',
        name: 'Defense of the City',
        description: 'Prepare Minas Tirith',
        status: 'active'
      }
    ],
    timeline: []
  },
  sessionLogs: [],
  mechanicsAndRules: {
    houseRules: [],
    challengeRatings: {}
  }
}

// =====================================================
// TESTS
// =====================================================

describe('RelevanceEngine', () => {
  let engine: RelevanceEngine

  beforeEach(() => {
    engine = new RelevanceEngine()
  })

  describe('calculateScore', () => {
    it('should calculate relevance scores correctly', () => {
      const entity = { id: 'test', name: 'Test Entity', currentLocation: 'Minas Tirith' }
      const score = engine.calculateScore(
        entity,
        mockSessionState as any,
        mockCampaignData as any,
        'combat'
      )

      expect(score).toBeDefined()
      expect(score.score).toBeGreaterThan(0)
      expect(score.score).toBeLessThanOrEqual(10)
      expect(score.reasons).toBeInstanceOf(Array)
    })

    it('should assign higher scores to present entities', () => {
      const presentEntity = { id: 'present', name: 'Present', currentLocation: 'Minas Tirith' }
      const absentEntity = { id: 'absent', name: 'Absent', currentLocation: 'Far Away' }

      const presentScore = engine.calculateScore(presentEntity, mockSessionState as any, mockCampaignData as any, 'combat')
      const absentScore = engine.calculateScore(absentEntity, mockSessionState as any, mockCampaignData as any, 'combat')

      expect(presentScore.score).toBeGreaterThan(absentScore.score)
    })

    it('should consider context type in scoring', () => {
      const entity = { id: 'npc', name: 'Test NPC', personality: ['wise'], motivations: ['help'] }
      
      const combatScore = engine.calculateScore(entity, mockSessionState as any, mockCampaignData as any, 'combat')
      const dialogueScore = engine.calculateScore(entity, mockSessionState as any, mockCampaignData as any, 'dialogue')

      expect(dialogueScore.score).toBeGreaterThanOrEqual(combatScore.score)
    })
  })

  describe('filterByRelevance', () => {
    it('should filter entities by minimum score', () => {
      const entities = [
        { id: '1', name: 'Entity 1', currentLocation: 'Minas Tirith' },
        { id: '2', name: 'Entity 2', currentLocation: 'Far Away' }
      ]

      const filtered = engine.filterByRelevance(
        entities,
        mockSessionState as any,
        mockCampaignData as any,
        'combat',
        { minScore: 5 }
      )

      expect(filtered).toBeInstanceOf(Array)
      filtered.forEach(entity => {
        expect(entity.relevanceScore.score).toBeGreaterThanOrEqual(5)
      })
    })

    it('should limit results to maxItems', () => {
      const entities = [
        { id: '1', name: 'Entity 1' },
        { id: '2', name: 'Entity 2' }
      ]

      const filtered = engine.filterByRelevance(
        entities,
        mockSessionState as any,
        mockCampaignData as any,
        'combat',
        { maxItems: 1 }
      )

      expect(filtered.length).toBeLessThanOrEqual(1)
    })
  })

  describe('generatePrioritizedContext', () => {
    it('should generate prioritized context buckets', () => {
      const context = engine.generatePrioritizedContext(
        mockSessionState as any,
        mockCampaignData as any,
        'combat'
      )

      expect(context).toHaveProperty('critical')
      expect(context).toHaveProperty('high')
      expect(context).toHaveProperty('medium')
      expect(context).toHaveProperty('low')
      expect(context).toHaveProperty('excluded')
    })
  })
})

describe('AIContextAssembler', () => {
  let assembler: AIContextAssembler

  beforeEach(() => {
    assembler = new AIContextAssembler()
  })

  describe('assembleContext', () => {
    it('should assemble a complete AI context packet', () => {
      const packet = assembler.assembleContext(
        mockSessionState as any,
        mockCampaignData as any,
        'combat'
      )

      expect(packet).toHaveProperty('sessionInfo')
      expect(packet).toHaveProperty('criticalEntities')
      expect(packet).toHaveProperty('contextSummary')
      expect(packet).toHaveProperty('tokenEstimate')
      expect(packet.sessionInfo.sessionId).toBe('test-session-123')
    })

    it('should compress context when over token limit', () => {
      const packet = assembler.assembleContext(
        mockSessionState as any,
        mockCampaignData as any,
        'combat',
        { maxTokens: 100 }
      )

      expect(packet.warnings.some(warning => 
        warning.includes('Context exceeds token limit')
      )).toBe(true)
    })
  })

  describe('generateAIPrompt', () => {
    it('should generate a complete AI prompt template', () => {
      const packet = assembler.assembleContext(mockSessionState as any, mockCampaignData as any, 'combat')
      const prompt = assembler.generateAIPrompt(packet, 'What should happen next?')

      expect(prompt).toHaveProperty('systemPrompt')
      expect(prompt).toHaveProperty('contextPrompt')
      expect(prompt).toHaveProperty('userPrompt')
      expect(prompt.userPrompt).toBe('What should happen next?')
    })
  })

  describe('assembleQuickContext', () => {
    it('should generate quick context string', () => {
      const context = assembler.assembleQuickContext(mockSessionState as any, mockCampaignData as any, 'combat')
      expect(typeof context).toBe('string')
      expect(context.length).toBeGreaterThan(0)
    })
  })
})

describe('Convenience Functions', () => {
  describe('createRelevanceEngine', () => {
    it('should create a RelevanceEngine instance', () => {
      const engine = createRelevanceEngine()
      expect(engine).toBeInstanceOf(RelevanceEngine)
    })
  })

  describe('createAIContextAssembler', () => {
    it('should create an AIContextAssembler instance', () => {
      const assembler = createAIContextAssembler()
      expect(assembler).toBeInstanceOf(AIContextAssembler)
    })
  })

  describe('assembleAIContext', () => {
    it('should assemble AI context using convenience function', () => {
      const packet = assembleAIContext(mockSessionState as any, mockCampaignData as any, 'combat')
      expect(packet).toHaveProperty('sessionInfo')
    })
  })

  describe('generateQuickPrompt', () => {
    it('should generate a quick prompt string', () => {
      const prompt = generateQuickPrompt(mockSessionState as any, mockCampaignData as any, 'What happens next?', 'combat')
      expect(typeof prompt).toBe('string')
      expect(prompt).toContain('What happens next?')
    })
  })

  describe('optimizeContextForAI', () => {
    it('should optimize context for AI with token limits', () => {
      const result = optimizeContextForAI([], mockSessionState as any, mockCampaignData as any, 2000)
      expect(result).toHaveProperty('context')
      expect(result).toHaveProperty('tokenEstimate')
      expect(result).toHaveProperty('entitiesIncluded')
    })
  })

  describe('getHighPriorityEntities', () => {
    it('should return only high priority entities', () => {
      const entities = [{ id: '1', name: 'Entity 1' }]
      const highPriority = getHighPriorityEntities(entities, mockSessionState as any, mockCampaignData as any, 'combat')
      expect(highPriority).toBeInstanceOf(Array)
    })
  })

  describe('filterBackgroundEntities', () => {
    it('should separate foreground and background entities', () => {
      const entities = [{ id: '1', name: 'Entity 1' }]
      const result = filterBackgroundEntities(entities, mockSessionState as any, mockCampaignData as any, 'combat')
      expect(result).toHaveProperty('foreground')
      expect(result).toHaveProperty('background')
    })
  })
})

describe('Integration Tests', () => {
  describe('Full AI Context Pipeline', () => {
    it('should process complete context assembly workflow', () => {
      const engine = createRelevanceEngine()
      const prioritized = engine.generatePrioritizedContext(mockSessionState as any, mockCampaignData as any, 'combat')
      
      const assembler = createAIContextAssembler()
      const packet = assembler.assembleContext(mockSessionState as any, mockCampaignData as any, 'combat')
      
      const prompt = assembler.generateAIPrompt(packet, 'What tactical advice can you give?')

      expect(prioritized).toBeDefined()
      expect(packet).toBeDefined()
      expect(prompt).toBeDefined()
      expect(prompt.userPrompt).toBe('What tactical advice can you give?')
    })

    it('should handle empty campaign data gracefully', () => {
      const emptyCampaign = {
        characterProfiles: [],
        npcDatabase: { id: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01', version: 1, keyNPCs: [], minorNPCs: [], factions: [] },
        worldState: { id: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01', version: 1, locations: [] },
        campaignProgression: { 
          mainPlotline: { id: 'empty', name: 'Empty Plot', description: 'No description', status: 'active' },
          subplots: [],
          timeline: []
        },
        sessionLogs: [],
        mechanicsAndRules: { houseRules: [], challengeRatings: {} }
      }

      const packet = assembleAIContext(mockSessionState as any, emptyCampaign as any, 'general-query')
      expect(packet).toBeDefined()
      expect(packet.criticalEntities).toHaveLength(0)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now()
      
      const largeEntities = Array.from({ length: 100 }, (_, i) => ({
        id: `entity-${i}`,
        name: `Entity ${i}`,
        currentLocation: i % 2 === 0 ? 'Minas Tirith' : 'Other Location'
      }))

      const engine = createRelevanceEngine()
      const filtered = engine.filterByRelevance(largeEntities, mockSessionState as any, mockCampaignData as any, 'general-query')

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(filtered).toBeInstanceOf(Array)
      expect(duration).toBeLessThan(1000)
    })
  })
})
