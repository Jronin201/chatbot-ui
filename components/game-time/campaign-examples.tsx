"use client"

import React from "react"
import { GameTimeProvider } from "@/context/game-time-context"
import { CampaignManager } from "@/components/game-time/campaign-manager"
import { CampaignSelector } from "@/components/game-time/campaign-selector"
import { GameTimeWidget } from "@/components/game-time/game-time-widget"

/**
 * Example usage of the multi-campaign Game Time system
 * This demonstrates how to integrate campaign management with the game time widget
 */
export const MultiCampaignExample: React.FC = () => {
  const workspaceId = "example-workspace-id" // In real usage, this would come from context
  const userId = "example-user-id" // In real usage, this would come from authentication

  const handleCampaignChange = (campaignId: string | null) => {
    console.log("Campaign changed:", campaignId)
    // This is where you might want to update other parts of your app
    // when the campaign changes, such as clearing chat history,
    // updating character sheets, etc.
  }

  return (
    <GameTimeProvider>
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Campaign Management */}
          <div>
            <h2 className="mb-4 text-2xl font-bold">Campaign Management</h2>
            <CampaignManager
              workspaceId={workspaceId}
              userId={userId}
              onCampaignChange={handleCampaignChange}
            />
          </div>

          {/* Game Time Widget */}
          <div>
            <h2 className="mb-4 text-2xl font-bold">Game Time Tracking</h2>
            <GameTimeWidget workspaceId={workspaceId} userId={userId} />
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-muted mt-8 rounded-lg p-4">
          <h3 className="mb-2 font-semibold">How to use:</h3>
          <ul className="space-y-2 text-sm">
            <li>
              • Use the Campaign Manager to create, select, and delete campaigns
            </li>
            <li>
              • Each campaign maintains its own game time data, NPCs, notes, and
              settings
            </li>
            <li>
              • Switch between campaigns using the dropdown in either component
            </li>
            <li>
              • All data is automatically saved to localStorage and persists
              across sessions
            </li>
            <li>
              • Campaign data is categorized by workspace ID for multi-tenant
              support
            </li>
          </ul>
        </div>
      </div>
    </GameTimeProvider>
  )
}

/**
 * Minimal example showing just the campaign selector
 */
export const CampaignSelectorExample: React.FC = () => {
  const workspaceId = "example-workspace-id"

  return (
    <GameTimeProvider>
      <div className="p-6">
        <h2 className="mb-4 text-xl font-bold">Campaign Selector Only</h2>
        <div className="max-w-md">
          <CampaignSelector
            workspaceId={workspaceId}
            onCampaignChange={(campaignId: string | null) => {
              console.log("Selected campaign:", campaignId)
            }}
          />
        </div>
      </div>
    </GameTimeProvider>
  )
}

export default MultiCampaignExample
