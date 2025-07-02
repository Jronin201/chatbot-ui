"use client"

import React, { useState, useEffect } from "react"
import { useGameTime } from "@/context/game-time-context"
import { GameTimeSettings } from "@/types/game-time"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { IconSettings, IconPlus, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

interface GameTimeSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const GameTimeSettingsDialog: React.FC<GameTimeSettingsDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateSettings } = useGameTime()

  const [localSettings, setLocalSettings] = useState<GameTimeSettings>(settings)
  const [newKeyword, setNewKeyword] = useState("")
  const [newKeywordDays, setNewKeywordDays] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update local settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings)
    }
  }, [isOpen, settings])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateSettings(localSettings)
      toast.success("Settings saved successfully")
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDefaultIntervalChange = (
    interval: keyof GameTimeSettings["defaultTimeIntervals"],
    value: string
  ) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setLocalSettings(prev => ({
        ...prev,
        defaultTimeIntervals: {
          ...prev.defaultTimeIntervals,
          [interval]: numValue
        }
      }))
    }
  }

  const handleAddCustomKeyword = () => {
    if (!newKeyword.trim() || !newKeywordDays) {
      toast.error("Please enter both keyword and days")
      return
    }

    const days = parseFloat(newKeywordDays)
    if (isNaN(days) || days < 0) {
      toast.error("Please enter a valid number of days")
      return
    }

    setLocalSettings(prev => ({
      ...prev,
      customKeywords: {
        ...prev.customKeywords,
        [newKeyword.trim()]: days
      }
    }))

    setNewKeyword("")
    setNewKeywordDays("")
  }

  const handleRemoveCustomKeyword = (keyword: string) => {
    setLocalSettings(prev => {
      const newCustomKeywords = { ...prev.customKeywords }
      delete newCustomKeywords[keyword]
      return {
        ...prev,
        customKeywords: newCustomKeywords
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSettings className="size-5" />
            Game Time Settings
          </DialogTitle>
          <DialogDescription>
            Configure how game time tracking behaves
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">General Settings</CardTitle>
              <CardDescription>Basic time tracking behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-detect time passage</Label>
                  <p className="text-muted-foreground text-sm">
                    Automatically analyze chat messages for time passage
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoDetectTimePassage}
                  onCheckedChange={checked =>
                    setLocalSettings(prev => ({
                      ...prev,
                      autoDetectTimePassage: checked
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show time passage notifications</Label>
                  <p className="text-muted-foreground text-sm">
                    Display notifications when time passes
                  </p>
                </div>
                <Switch
                  checked={localSettings.showTimePassageNotifications}
                  onCheckedChange={checked =>
                    setLocalSettings(prev => ({
                      ...prev,
                      showTimePassageNotifications: checked
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Default Time Intervals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Time Intervals</CardTitle>
              <CardDescription>
                Default number of days for common activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="travel">Travel (days)</Label>
                  <Input
                    id="travel"
                    type="number"
                    step="0.1"
                    min="0"
                    value={localSettings.defaultTimeIntervals.travel}
                    onChange={e =>
                      handleDefaultIntervalChange("travel", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rest">Rest (days)</Label>
                  <Input
                    id="rest"
                    type="number"
                    step="0.1"
                    min="0"
                    value={localSettings.defaultTimeIntervals.rest}
                    onChange={e =>
                      handleDefaultIntervalChange("rest", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training">Training (days)</Label>
                  <Input
                    id="training"
                    type="number"
                    step="0.1"
                    min="0"
                    value={localSettings.defaultTimeIntervals.training}
                    onChange={e =>
                      handleDefaultIntervalChange("training", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="research">Research (days)</Label>
                  <Input
                    id="research"
                    type="number"
                    step="0.1"
                    min="0"
                    value={localSettings.defaultTimeIntervals.research}
                    onChange={e =>
                      handleDefaultIntervalChange("research", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopping">Shopping (days)</Label>
                  <Input
                    id="shopping"
                    type="number"
                    step="0.1"
                    min="0"
                    value={localSettings.defaultTimeIntervals.shopping}
                    onChange={e =>
                      handleDefaultIntervalChange("shopping", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Time Keywords</CardTitle>
              <CardDescription>
                Add custom keywords that trigger specific time amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new keyword */}
              <div className="flex gap-2">
                <Input
                  placeholder="Keyword (e.g., 'meditation')"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Days"
                  type="number"
                  step="0.1"
                  min="0"
                  value={newKeywordDays}
                  onChange={e => setNewKeywordDays(e.target.value)}
                  className="w-24"
                />
                <Button onClick={handleAddCustomKeyword} size="icon">
                  <IconPlus className="size-4" />
                </Button>
              </div>

              {/* Existing keywords */}
              {Object.keys(localSettings.customKeywords).length > 0 && (
                <div className="space-y-2">
                  <Label>Custom Keywords</Label>
                  <div className="space-y-2">
                    {Object.entries(localSettings.customKeywords).map(
                      ([keyword, days]) => (
                        <div
                          key={keyword}
                          className="flex items-center justify-between rounded border p-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{keyword}</span>
                            <span className="text-muted-foreground text-sm">
                              → {days} days
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCustomKeyword(keyword)}
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {Object.keys(localSettings.customKeywords).length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No custom keywords defined
                </p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
