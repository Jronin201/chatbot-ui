/**
 * Enhanced error handling and logging utilities for debugging embeddings and tool integrations
 */

export interface EmbeddingsDebugInfo {
  embeddingsProvider: "openai" | "local"
  workspaceId: string
  chatId?: string
  fileCount: number
  retrievalActive: boolean
}

export interface ToolsDebugInfo {
  selectedToolsCount: number
  toolNames: string[]
  schemaErrors: string[]
  apiCalls: {
    url: string
    method: string
    success: boolean
    error?: string
  }[]
}

export class ChatbotDiagnostics {
  static logEmbeddingsConfig(info: EmbeddingsDebugInfo) {
    console.log("🔍 EMBEDDINGS CONFIG:", {
      provider: info.embeddingsProvider,
      workspace: info.workspaceId,
      chat: info.chatId || "new",
      files: info.fileCount,
      retrieval: info.retrievalActive ? "ACTIVE" : "INACTIVE"
    })
  }

  static logToolsConfig(info: ToolsDebugInfo) {
    console.log("🛠️ TOOLS CONFIG:", {
      count: info.selectedToolsCount,
      tools: info.toolNames,
      schemaErrors: info.schemaErrors.length,
      apiCalls: info.apiCalls.length
    })

    if (info.schemaErrors.length > 0) {
      console.warn("⚠️ SCHEMA ERRORS:", info.schemaErrors)
    }

    info.apiCalls.forEach((call, index) => {
      const status = call.success ? "✅" : "❌"
      console.log(`${status} API Call ${index + 1}: ${call.method} ${call.url}`)
      if (call.error) {
        console.error(`   Error: ${call.error}`)
      }
    })
  }

  static async testDatabaseConnection() {
    try {
      const response = await fetch("/api/retrieval/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: "test connection",
          fileIds: [],
          embeddingsProvider: "openai",
          sourceCount: 1
        })
      })

      const result = await response.json()

      if (response.ok) {
        console.log("✅ Database connection: OK")
        return { success: true, data: result }
      } else {
        console.error("❌ Database connection failed:", result.message)
        return { success: false, error: result.message }
      }
    } catch (error: any) {
      console.error("💥 Database connection error:", error.message)
      return { success: false, error: error.message }
    }
  }

  static validateChatSettings(chatSettings: any) {
    const issues: string[] = []

    if (!chatSettings) {
      issues.push("Chat settings is null/undefined")
      return { valid: false, issues }
    }

    if (!chatSettings.embeddingsProvider) {
      issues.push("Missing embeddingsProvider")
    } else if (!["openai", "local"].includes(chatSettings.embeddingsProvider)) {
      issues.push(
        `Invalid embeddingsProvider: ${chatSettings.embeddingsProvider}`
      )
    }

    if (!chatSettings.model) {
      issues.push("Missing model")
    }

    if (typeof chatSettings.temperature !== "number") {
      issues.push("Invalid temperature")
    }

    if (typeof chatSettings.contextLength !== "number") {
      issues.push("Invalid contextLength")
    }

    const valid = issues.length === 0

    if (valid) {
      console.log("✅ Chat settings validation: PASSED")
    } else {
      console.warn("⚠️ Chat settings validation: FAILED")
      issues.forEach(issue => console.warn(`   - ${issue}`))
    }

    return { valid, issues }
  }
}

// Export for use in route handlers
export const diagnostics = ChatbotDiagnostics
