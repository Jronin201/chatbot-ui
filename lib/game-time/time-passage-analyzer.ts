/**
 * Time Passage Analysis Utilities
 * Analyzes chat messages to detect narrative time passage
 */

export interface TimePassageKeywords {
  // Travel-related keywords
  travel: {
    patterns: RegExp[]
    defaultDays: number
    modifiers: { pattern: RegExp; multiplier: number }[]
  }
  // Rest and recovery
  rest: {
    patterns: RegExp[]
    defaultDays: number
    modifiers: { pattern: RegExp; multiplier: number }[]
  }
  // Training and learning
  training: {
    patterns: RegExp[]
    defaultDays: number
    modifiers: { pattern: RegExp; multiplier: number }[]
  }
  // Research and investigation
  research: {
    patterns: RegExp[]
    defaultDays: number
    modifiers: { pattern: RegExp; multiplier: number }[]
  }
  // Social activities
  social: {
    patterns: RegExp[]
    defaultDays: number
    modifiers: { pattern: RegExp; multiplier: number }[]
  }
  // Explicit time mentions
  explicit: {
    patterns: RegExp[]
    extractor: (match: RegExpMatchArray) => number
  }[]
}

export const DEFAULT_TIME_KEYWORDS: TimePassageKeywords = {
  travel: {
    patterns: [
      /travel(?:ed|ing|s)?\s+to/i,
      /journey(?:ed|ing|s)?\s+to/i,
      /flew?\s+to/i,
      /sailed?\s+to/i,
      /rode?\s+to/i,
      /walked?\s+to/i,
      /moved?\s+to/i,
      /went\s+to/i,
      /arrive(?:d|s)?\s+(?:at|in)/i,
      /depart(?:ed|s|ing)?\s+(?:for|to)/i,
      /left\s+for/i,
      /headed?\s+(?:to|for)/i,
      /voyage\s+to/i,
      /expedition\s+to/i
    ],
    defaultDays: 3,
    modifiers: [
      {
        pattern: /quick(?:ly)?|fast|rapid(?:ly)?|hurr(?:ied|y)/i,
        multiplier: 0.5
      },
      { pattern: /slow(?:ly)?|careful(?:ly)?|stealth(?:ily)?/i, multiplier: 2 },
      {
        pattern:
          /long\s+journey|far|distant|across\s+(?:the\s+)?(?:desert|galaxy|system)/i,
        multiplier: 3
      },
      { pattern: /nearby|close|short\s+(?:distance|trip)/i, multiplier: 0.3 },
      {
        pattern: /interplanetary|between\s+worlds|to\s+another\s+planet/i,
        multiplier: 7
      },
      { pattern: /across\s+(?:the\s+)?(?:empire|imperium)/i, multiplier: 14 }
    ]
  },
  rest: {
    patterns: [
      /rest(?:ed|ing|s)?\s+for/i,
      /sleep(?:ing|s)?\s+for/i,
      /recover(?:ed|ing|s)?\s+for/i,
      /heal(?:ed|ing|s)?\s+for/i,
      /convalesce(?:d|ing|s)?/i,
      /took?\s+a\s+break/i,
      /camp(?:ed|ing|s)?\s+for/i,
      /stayed?\s+(?:at|in)\s+.+\s+for/i,
      /remain(?:ed|ing|s)?\s+.+\s+for/i
    ],
    defaultDays: 1,
    modifiers: [
      { pattern: /serious(?:ly)?\s+(?:injur|wound|hurt)/i, multiplier: 7 },
      { pattern: /minor\s+(?:injur|wound|hurt)/i, multiplier: 2 },
      { pattern: /exhaust(?:ed|ion)/i, multiplier: 3 },
      { pattern: /quick\s+(?:nap|rest)/i, multiplier: 0.1 },
      { pattern: /full\s+(?:recovery|rest)/i, multiplier: 5 }
    ]
  },
  training: {
    patterns: [
      /train(?:ed|ing|s)?\s+(?:for|in|with)/i,
      /practic(?:ed|ing|es)?\s+(?:with|for)/i,
      /learn(?:ed|ing|s)?\s+(?:about|from|with)/i,
      /stud(?:ied|ying|ies)?\s+(?:under|with|for)/i,
      /meditat(?:ed|ing|es)?\s+for/i,
      /(?:sword|combat|martial|weapon)\s+training/i,
      /apprentice(?:d|ship)\s+(?:under|with)/i,
      /mentor(?:ed|ing|ship)\s+(?:by|under)/i
    ],
    defaultDays: 7,
    modifiers: [
      { pattern: /intensive|rigorous|demanding/i, multiplier: 2 },
      { pattern: /basic|introduction|beginner/i, multiplier: 0.5 },
      { pattern: /master(?:y|ing)|advanced|expert/i, multiplier: 5 },
      { pattern: /quick\s+lesson|crash\s+course/i, multiplier: 0.2 }
    ]
  },
  research: {
    patterns: [
      /research(?:ed|ing|es)?\s+(?:about|into|for)/i,
      /investigat(?:ed|ing|es)?\s+(?:into|for)/i,
      /stud(?:ied|ying|ies)?\s+(?:the|for|about)/i,
      /analyz(?:ed|ing|es)?\s+(?:the|for)/i,
      /examin(?:ed|ing|es)?\s+(?:the|for)/i,
      /explor(?:ed|ing|es)?\s+(?:the|for)/i,
      /search(?:ed|ing|es)?\s+(?:for|through)/i,
      /gather(?:ed|ing|s)?\s+information/i,
      /consult(?:ed|ing|s)?\s+(?:records|archives|library)/i
    ],
    defaultDays: 3,
    modifiers: [
      { pattern: /extensive|thorough|deep|comprehensive/i, multiplier: 3 },
      { pattern: /quick|brief|surface|cursory/i, multiplier: 0.3 },
      { pattern: /archives|ancient\s+records|historical/i, multiplier: 2 },
      { pattern: /library|database|computer/i, multiplier: 0.5 }
    ]
  },
  social: {
    patterns: [
      /(?:attend(?:ed|ing|s)?|went\s+to)\s+(?:a\s+)?(?:party|celebration|feast|banquet|ceremony)/i,
      /(?:meet(?:ing|s)?|met)\s+with\s+(?:nobles|officials|leaders)/i,
      /(?:negotiat(?:ed|ing|es|ions)?|diplomacy)\s+(?:with|for)/i,
      /court\s+(?:proceedings|session|appearance)/i,
      /audience\s+with/i,
      /political\s+(?:meeting|gathering|summit)/i,
      /social\s+(?:gathering|event|function)/i
    ],
    defaultDays: 1,
    modifiers: [
      { pattern: /formal|official|imperial/i, multiplier: 1.5 },
      { pattern: /brief|short|quick/i, multiplier: 0.5 },
      { pattern: /extended|lengthy|multi-day/i, multiplier: 3 },
      { pattern: /festival|celebration/i, multiplier: 2 }
    ]
  },
  explicit: [
    {
      patterns: [
        /(?:after|over|during|for)\s+(\d+)\s+(day|days)/i,
        /(\d+)\s+(day|days)\s+(?:later|passed|elapsed)/i,
        /(?:the\s+next|following)\s+(\d+)\s+(day|days)/i
      ],
      extractor: match => parseInt(match[1])
    },
    {
      patterns: [
        /(?:after|over|during|for)\s+(\d+)\s+(week|weeks)/i,
        /(\d+)\s+(week|weeks)\s+(?:later|passed|elapsed)/i
      ],
      extractor: match => parseInt(match[1]) * 7
    },
    {
      patterns: [
        /(?:after|over|during|for)\s+(\d+)\s+(month|months)/i,
        /(\d+)\s+(month|months)\s+(?:later|passed|elapsed)/i
      ],
      extractor: match => parseInt(match[1]) * 30
    },
    {
      patterns: [
        /(?:after|over|during|for)\s+(\d+)\s+(year|years)/i,
        /(\d+)\s+(year|years)\s+(?:later|passed|elapsed)/i
      ],
      extractor: match => parseInt(match[1]) * 365
    },
    {
      patterns: [
        /(?:after|over|during|for)\s+(?:a|an)\s+(hour|hours)/i,
        /(?:a\s+few|several)\s+(hour|hours)\s+(?:later|passed)/i
      ],
      extractor: () => 0.1 // Fractional day
    }
  ]
}

export class TimePassageAnalyzer {
  private keywords: TimePassageKeywords

  constructor(customKeywords?: Partial<TimePassageKeywords>) {
    this.keywords = { ...DEFAULT_TIME_KEYWORDS, ...customKeywords }
  }

  /**
   * Analyze a message for time passage and return estimated days
   */
  analyzeMessage(message: string): {
    daysElapsed: number
    confidence: number
    matches: Array<{
      type: string
      match: string
      days: number
      confidence: number
    }>
  } {
    const matches: Array<{
      type: string
      match: string
      days: number
      confidence: number
    }> = []

    let totalDays = 0
    let maxConfidence = 0

    // Check for explicit time mentions first (highest priority)
    for (const explicitPattern of this.keywords.explicit) {
      for (const pattern of explicitPattern.patterns) {
        const match = message.match(pattern)
        if (match) {
          const days = explicitPattern.extractor(match)
          matches.push({
            type: "explicit",
            match: match[0],
            days,
            confidence: 0.95
          })
          totalDays = Math.max(totalDays, days)
          maxConfidence = Math.max(maxConfidence, 0.95)
        }
      }
    }

    // If no explicit time found, check activity patterns
    if (matches.length === 0) {
      for (const [activityType, config] of Object.entries(this.keywords)) {
        if (activityType === "explicit") continue

        const activityConfig = config as typeof this.keywords.travel

        for (const pattern of activityConfig.patterns) {
          const match = message.match(pattern)
          if (match) {
            let days = activityConfig.defaultDays
            let confidence = 0.7

            // Apply modifiers
            for (const modifier of activityConfig.modifiers) {
              if (message.match(modifier.pattern)) {
                days *= modifier.multiplier
                confidence += 0.1 // Increase confidence when modifiers match
                break
              }
            }

            matches.push({
              type: activityType,
              match: match[0],
              days: Math.round(days * 10) / 10, // Round to 1 decimal place
              confidence: Math.min(confidence, 0.9)
            })

            totalDays = Math.max(totalDays, days)
            maxConfidence = Math.max(maxConfidence, confidence)
          }
        }
      }
    }

    return {
      daysElapsed: Math.round(totalDays * 10) / 10,
      confidence: maxConfidence,
      matches
    }
  }

  /**
   * Check if a message suggests time passage
   */
  hasTimePassage(message: string, minimumConfidence: number = 0.5): boolean {
    const analysis = this.analyzeMessage(message)
    return analysis.confidence >= minimumConfidence && analysis.daysElapsed > 0
  }

  /**
   * Get suggested time passage with explanation
   */
  getSuggestedTimePassage(message: string): {
    suggested: boolean
    days: number
    explanation: string
    confidence: number
  } {
    const analysis = this.analyzeMessage(message)

    if (analysis.confidence < 0.5 || analysis.daysElapsed === 0) {
      return {
        suggested: false,
        days: 0,
        explanation: "No significant time passage detected in message.",
        confidence: analysis.confidence
      }
    }

    const primaryMatch = analysis.matches[0]
    let explanation = `Detected ${primaryMatch.type} activity: "${primaryMatch.match}"`

    if (analysis.matches.length > 1) {
      explanation += ` and ${analysis.matches.length - 1} other time indicator(s)`
    }

    explanation += `. Estimated ${analysis.daysElapsed} day(s) elapsed.`

    return {
      suggested: true,
      days: analysis.daysElapsed,
      explanation,
      confidence: analysis.confidence
    }
  }

  /**
   * Update keywords with custom patterns
   */
  updateKeywords(customKeywords: Partial<TimePassageKeywords>): void {
    this.keywords = { ...this.keywords, ...customKeywords }
  }

  /**
   * Add a custom activity pattern
   */
  addCustomActivity(
    activityType: string,
    patterns: string[],
    defaultDays: number,
    modifiers: Array<{ pattern: string; multiplier: number }> = []
  ): void {
    const regexPatterns = patterns.map(p => new RegExp(p, "i"))
    const regexModifiers = modifiers.map(m => ({
      pattern: new RegExp(m.pattern, "i"),
      multiplier: m.multiplier
    }))

    ;(this.keywords as any)[activityType] = {
      patterns: regexPatterns,
      defaultDays,
      modifiers: regexModifiers
    }
  }
}
