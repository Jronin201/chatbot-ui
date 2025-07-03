"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {
  IconSword,
  IconCalendar,
  IconClock,
  IconTrash,
  IconPlus,
  IconWand
} from "@tabler/icons-react"
import { toast } from "sonner"
import { GameTimeStorage, CampaignSummary } from "@/lib/game-time/storage"
import { CampaignSelector } from "./campaign-selector"

interface CampaignManagerProps {
  workspaceId: string
  userId?: string
  onCampaignChange?: (campaignId: string | null) => void
  showCreateActions?: boolean
  className?: string
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  workspaceId,
  userId,
  onCampaignChange,
  showCreateActions = true,
  className
}) => {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)

  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoading(true)
      const campaignList = await GameTimeStorage.getCampaigns(workspaceId)
      setCampaigns(campaignList)
    } catch (error) {
      console.error("Error loading campaigns:", error)
      toast.error("Failed to load campaigns")
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadCampaigns()
    setCurrentCampaignId(GameTimeStorage.getCurrentCampaignId())
  }, [workspaceId, loadCampaigns])

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await GameTimeStorage.deleteCampaign(campaignId)
      await loadCampaigns()

      // If we deleted the current campaign, clear it
      if (currentCampaignId === campaignId) {
        setCurrentCampaignId(null)
        GameTimeStorage.setCurrentCampaignId(null)
        onCampaignChange?.(null)
      }

      toast.success("Campaign deleted")
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast.error("Failed to delete campaign")
    }
  }

  const handleSwitchCampaign = async (campaignId: string) => {
    try {
      const success = await GameTimeStorage.switchToCampaign(campaignId)
      if (success) {
        setCurrentCampaignId(campaignId)
        onCampaignChange?.(campaignId)
        toast.success("Switched to campaign")
      } else {
        toast.error("Failed to switch campaign")
      }
    } catch (error) {
      console.error("Error switching campaign:", error)
      toast.error("Failed to switch campaign")
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="border-primary size-6 animate-spin rounded-full border-b-2"></div>
            <span className="ml-2">Loading campaigns...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSword className="size-5" />
          Campaign Manager
        </CardTitle>
        <CardDescription>
          Manage your TTRPG campaigns and switch between them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campaign Selector */}
        <CampaignSelector
          workspaceId={workspaceId}
          userId={userId}
          onCampaignChange={onCampaignChange}
        />

        {/* Campaign List */}
        {campaigns.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">All Campaigns</h4>
            <div className="space-y-2">
              {campaigns.map(campaign => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{campaign.name}</span>
                      {campaign.id === currentCampaignId && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4 text-xs">
                      <span>{campaign.gameSystem}</span>
                      <span className="flex items-center gap-1">
                        <IconCalendar className="size-3" />
                        {campaign.currentDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconClock className="size-3" />
                        {campaign.totalDaysElapsed} days
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.id !== currentCampaignId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchCampaign(campaign.id)}
                      >
                        Switch
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <IconTrash className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;
                            {campaign.name}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {campaigns.length === 0 && (
          <div className="text-muted-foreground py-6 text-center">
            <IconSword className="mx-auto mb-4 size-12 opacity-50" />
            <p>No campaigns found</p>
            <p className="text-sm">Create a new campaign to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
