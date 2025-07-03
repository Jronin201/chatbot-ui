# TTRPG-Optimized Retrieval System

## Overview
The embedded file search and chunking strategy has been optimized for AI assistants running TTRPG (tabletop roleplaying game) sessions with strict rules-as-written understanding. The system is specifically designed to handle game mechanics, lore, character creation, and campaign management content.

## Key Features

### 1. Document Type Detection
- **Dune-Specific Detection**: 26 keywords including `arrakis`, `bene gesserit`, `spice`, `melange`, `fremen`, etc.
- **TTRPG-General Detection**: 19 keywords including `character`, `combat`, `gamemaster`, `skills`, `dice`, etc.
- **Cascading Detection**: Checks for Dune content first, then general TTRPG, then standard document processing

### 2. Specialized Chunking Strategies

#### Dune TTRPG Chunking (`dune-ttrpg.ts`)
- **Chunk Types**: `rules`, `character`, `combat`, `lore`, `house-creation`, `gm-advice`, `equipment`, `overview`
- **Metadata**: `duneSpecific`, `mechanicsLevel`, `playerRelevance`, `gamePhase`
- **Thematic Organization**: Extracts content by game mechanics, character archetypes, and setting elements

#### General TTRPG Chunking (`txt.ts`, `pdf.ts`)
- **Labeled Chunks**: `[CHARACTER CREATION]`, `[COMBAT MECHANICS]`, `[LORE & WORLDBUILDING]`, etc.
- **Context-Aware**: Maintains rule context across chunk boundaries
- **Relevance Scoring**: Prioritizes chunks by keyword density and content relevance

### 3. Query Enhancement
Enhanced query expansion for better retrieval accuracy:

```typescript
// Examples of query enhancement
"How do I create a character?" 
→ "How do I create a character? skills attributes traits talents background class house noble archetype creation"

"What are the combat rules?"
→ "What are the combat rules? attack damage weapon armor initiative action round conflict duel swordplay violence"

"How does spice work?"
→ "How does spice work? arrakis dune sandworm fremen guild navigator prescience addiction withdrawal"
```

### 4. Supported Query Types
- **Character Creation**: Stats, attributes, backgrounds, archetypes, house creation
- **Combat Mechanics**: Initiative, actions, damage, weapons, armor, duels
- **Lore & Worldbuilding**: Universe history, factions, politics, setting details
- **Game Mechanics**: Dice rolls, tests, difficulty, momentum, threat
- **Equipment & Gear**: Weapons, technology, artifacts, specialized equipment
- **GM Guidance**: Campaign management, scenarios, plot hooks
- **Faction-Specific**: Bene Gesserit, Fremen, Mentats, Swordmasters, etc.

## Implementation Files

### Core Processing
- `/lib/retrieval/processing/txt.ts` - Text file processing with TTRPG detection
- `/lib/retrieval/processing/pdf.ts` - PDF processing with TTRPG detection  
- `/lib/retrieval/processing/dune-ttrpg.ts` - Specialized Dune TTRPG chunking

### API Enhancement
- `/app/api/retrieval/retrieve/route.ts` - Enhanced query expansion for TTRPG content

### Test Coverage
- `/scripts/test-ttrpg-retrieval.sh` - Comprehensive retrieval tests
- `/scripts/test-detection.js` - Content detection validation
- `/scripts/test-ttrpg-complete.sh` - Full system test suite

## Content Analysis Results
From the Dune manual analysis:
- **Size**: 1.09M characters, 233K tokens
- **Dune Keywords**: 26 found (arrakis: 262, imperium: 303, spice: 275, etc.)
- **TTRPG Keywords**: 19 found (character: 1430, gamemaster: 278, combat: 105, etc.)
- **Sections**: Properly identified character creation, combat, and lore sections

## Benefits for AI Assistants

### Rules-as-Written Accuracy
- Chunks preserve rule context and mechanical details
- Labeled chunks help AI identify content type
- Enhanced queries improve retrieval precision

### Campaign Management
- GM guidance chunks provide scenario and plot assistance
- House creation rules for political intrigue
- Equipment and technology details for world consistency

### Player Support
- Character creation guidance with archetype-specific details
- Combat mechanics with proper action economy
- Skill system explanations with difficulty guidelines

## Usage Example
When a user asks "How do I create a Bene Gesserit character?", the system:
1. Detects TTRPG content type
2. Enhances query with relevant keywords
3. Retrieves labeled `[CHARACTER CREATION]` chunks
4. Provides Bene Gesserit-specific abilities and training
5. Maintains strict rules-as-written accuracy

## Future Enhancements
- Additional TTRPG system support (D&D, Pathfinder, etc.)
- Dynamic chunk relevance scoring
- Cross-reference detection between rules and lore
- Campaign-specific content organization

## Status
✅ **OPTIMIZED FOR TTRPG CONTENT**
- Ready for AI assistant to run strict rules-as-written TTRPG sessions
- Comprehensive test coverage validates functionality
- Enhanced retrieval accuracy for game mechanics and lore
