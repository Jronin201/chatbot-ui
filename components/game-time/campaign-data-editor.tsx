/**
 * Campaign Data Editor Component
 *
 * Provides in-place editing capabilities for all campaign data modules
 * Integrates with the Campaign Information Window for seamless data management
 */

"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useCampaignData } from "@/context/campaign-data-context"
import { useSessionState } from "@/context/session-state-context"
import {
  CharacterProfile,
  KeyNPC,
  MinorNPC,
  Faction,
  Location,
  PlotLine,
  SessionLog,
  TimelineEvent,
  HouseRule
} from "@/types/enhanced-campaign-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconDeviceFloppy,
  IconX,
  IconUser,
  IconUsers,
  IconMap,
  IconBook,
  IconClock,
  IconSettings,
  IconStar,
  IconFlag,
  IconShield,
  IconSword,
  IconHome,
  IconBuildingCastle,
  IconWorld,
  IconQuestionMark
} from "@tabler/icons-react"

interface CampaignDataEditorProps {
  onDataChange?: () => void
}

type EditMode = "create" | "edit" | "view"
type EntityType =
  | "character"
  | "npc"
  | "location"
  | "session"
  | "plotline"
  | "faction"

interface EditState {
  mode: EditMode
  type: EntityType
  id?: string
  entity?: any
  isOpen: boolean
}

export function CampaignDataEditor({ onDataChange }: CampaignDataEditorProps) {
  const { retrieval } = useCampaignData()
  const { sessionState, trackAction } = useSessionState()

  const [editState, setEditState] = useState<EditState>({
    mode: "view",
    type: "character",
    isOpen: false
  })

  const [formData, setFormData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})

  // Mock campaign data for display (this would come from your actual data source)
  const campaignData = {
    characters: [
      {
        id: "char1",
        name: "Aria Nightwind",
        player: "Player 1",
        class: "Ranger",
        level: 5,
        description: "A skilled elven ranger with a mysterious past",
        tags: ["elf", "ranger", "archer"],
        currentHealth: 45,
        maxHealth: 55,
        attributes: {
          strength: 14,
          dexterity: 18,
          constitution: 13,
          intelligence: 12,
          wisdom: 16,
          charisma: 10
        },
        isActive: true
      }
    ],
    npcs: {
      key: [
        {
          id: "npc1",
          name: "Captain Aldric",
          importance: "key" as const,
          role: "Guard Captain",
          faction: "City Watch",
          location: "Millhaven",
          description: "The stern but fair captain of the city guard",
          tags: ["authority", "lawful", "human"],
          status: "alive" as const
        }
      ],
      minor: [
        {
          id: "npc2",
          name: "Merchant Thorne",
          importance: "minor" as const,
          role: "Trader",
          location: "Market Square",
          description: "A greedy merchant who sells questionable goods",
          tags: ["merchant", "shady"],
          status: "alive" as const
        }
      ]
    },
    worldState: {
      locations: [
        {
          id: "loc1",
          name: "Millhaven",
          locationType: "settlement" as const,
          parentLocation: "Kingdom of Alderia",
          description: "A bustling trade town at the crossroads",
          tags: ["town", "trade", "crossroads"],
          population: 5000,
          government: "Mayor-Council",
          economy: "Trade-based",
          isActive: true
        }
      ]
    },
    sessions: [
      {
        id: "sess1",
        name: "The Goblin Ambush",
        sessionNumber: 1,
        date: new Date("2024-01-15"),
        gameDate: "15th of Springmoon, 1247",
        duration: 240,
        description: "The party encounters goblins on the road to Millhaven",
        tags: ["combat", "travel", "introduction"],
        attendees: ["Player 1", "Player 2", "Player 3"],
        experienceGained: 300
      }
    ]
  }

  // Initialize form data when edit state changes
  useEffect(() => {
    if (editState.entity) {
      setFormData({ ...editState.entity })
    } else {
      setFormData(getEmptyEntity(editState.type))
    }
    setValidationErrors({})
  }, [editState])

  const getEmptyEntity = (type: EntityType): any => {
    const baseEntity = {
      id: "",
      name: "",
      description: "",
      tags: [],
      metadata: {},
      lastModified: new Date(),
      createdBy: "user",
      version: 1
    }

    switch (type) {
      case "character":
        return {
          ...baseEntity,
          type: "character" as const,
          player: "",
          class: "",
          level: 1,
          attributes: {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
          },
          currentHealth: 100,
          maxHealth: 100,
          inventory: [],
          relationships: [],
          questLog: [],
          backstory: "",
          goals: [],
          fears: [],
          personality: "",
          isActive: true
        }
      case "npc":
        return {
          ...baseEntity,
          type: "npc" as const,
          importance: "minor" as const,
          faction: "",
          location: "",
          role: "",
          personality: "",
          motivations: [],
          relationships: [],
          status: "alive" as const,
          lastInteraction: null,
          notes: ""
        }
      case "location":
        return {
          ...baseEntity,
          type: "location" as const,
          parentLocation: "",
          locationType: "settlement" as const,
          population: 0,
          government: "",
          economy: "",
          culture: "",
          geography: "",
          climate: "",
          resources: [],
          threats: [],
          points_of_interest: [],
          accessibility: [],
          isActive: true
        }
      case "session":
        return {
          ...baseEntity,
          type: "session" as const,
          sessionNumber: 1,
          date: new Date(),
          gameDate: "",
          duration: 0,
          attendees: [],
          summary: "",
          keyEvents: [],
          decisions: [],
          npcsIntroduced: [],
          locationsVisited: [],
          plotAdvancement: [],
          lootGained: [],
          experienceGained: 0,
          notes: ""
        }
      default:
        return baseEntity
    }
  }

  const validateForm = (
    data: any,
    type: EntityType
  ): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!data.name?.trim()) {
      errors.name = "Name is required"
    }

    if (!data.description?.trim()) {
      errors.description = "Description is required"
    }

    switch (type) {
      case "character":
        if (!data.player?.trim()) {
          errors.player = "Player name is required"
        }
        if (!data.class?.trim()) {
          errors.class = "Character class is required"
        }
        if (data.level < 1 || data.level > 20) {
          errors.level = "Level must be between 1 and 20"
        }
        break
      case "npc":
        if (!data.importance) {
          errors.importance = "Importance level is required"
        }
        if (!data.role?.trim()) {
          errors.role = "Role is required"
        }
        break
      case "location":
        if (!data.locationType) {
          errors.locationType = "Location type is required"
        }
        break
      case "session":
        if (!data.sessionNumber || data.sessionNumber < 1) {
          errors.sessionNumber = "Valid session number is required"
        }
        if (!data.date) {
          errors.date = "Session date is required"
        }
        break
    }

    return errors
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const errors = validateForm(formData, editState.type)
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        return
      }

      // Generate ID if creating new entity
      if (editState.mode === "create" && !formData.id) {
        formData.id = `${editState.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Update timestamps
      formData.lastModified = new Date()
      if (editState.mode === "create") {
        formData.createdBy = "user"
        formData.version = 1
      } else {
        formData.version = (formData.version || 1) + 1
      }

      // Mock save operation - in a real implementation, this would call your storage layer
      const result = { success: true }

      if (result.success) {
        // Track the action
        trackAction(
          `${editState.mode === "create" ? "Created" : "Updated"} ${editState.type}: ${formData.name}`,
          [formData.id],
          5
        )

        toast.success(
          `${editState.type.charAt(0).toUpperCase() + editState.type.slice(1)} ${editState.mode === "create" ? "created" : "updated"} successfully`
        )

        // Close dialog and refresh data
        setEditState({ mode: "view", type: "character", isOpen: false })
        onDataChange?.()
      } else {
        toast.error("Failed to save data")
      }
    } catch (error) {
      console.error("Error saving data:", error)
      toast.error("Failed to save data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (type: EntityType, id: string, name: string) => {
    setIsLoading(true)

    try {
      // Mock delete operation - in a real implementation, this would call your storage layer
      const result = { success: true }

      if (result.success) {
        trackAction(`Deleted ${type}: ${name}`, [id], 5)

        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
        )
        onDataChange?.()
      } else {
        toast.error("Failed to delete data")
      }
    } catch (error) {
      console.error("Error deleting data:", error)
      toast.error("Failed to delete data")
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = (type: EntityType) => {
    setEditState({
      mode: "create",
      type,
      entity: null,
      isOpen: true
    })
  }

  const openEditDialog = (type: EntityType, entity: any) => {
    setEditState({
      mode: "edit",
      type,
      id: entity.id,
      entity,
      isOpen: true
    })
  }

  const closeDialog = () => {
    setEditState({ mode: "view", type: "character", isOpen: false })
    setFormData({})
    setValidationErrors({})
  }

  const renderCreateButtons = () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => openCreateDialog("character")}
        className="flex items-center gap-2"
      >
        <IconUser className="size-4" />
        Add Character
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => openCreateDialog("npc")}
        className="flex items-center gap-2"
      >
        <IconUsers className="size-4" />
        Add NPC
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => openCreateDialog("location")}
        className="flex items-center gap-2"
      >
        <IconMap className="size-4" />
        Add Location
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => openCreateDialog("session")}
        className="flex items-center gap-2"
      >
        <IconClock className="size-4" />
        Add Session
      </Button>
    </div>
  )

  const renderEntityList = (
    entities: any[],
    type: EntityType,
    icon: React.ReactNode
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {type.charAt(0).toUpperCase() + type.slice(1)}s
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entities.map(entity => (
            <div
              key={entity.id}
              className="hover:bg-accent flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex-1">
                <div className="font-medium">{entity.name}</div>
                <div className="text-muted-foreground text-sm">
                  {entity.description?.slice(0, 100)}...
                </div>
                <div className="mt-1 flex gap-1">
                  {entity.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(type, entity)}
                  className="flex items-center gap-1"
                >
                  <IconEdit className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {type}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{entity.name}
                        &quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleDelete(type, entity.id, entity.name)
                        }
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {entities.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              No {type}s found. Create your first {type} to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderFormField = (
    key: string,
    label: string,
    type: "text" | "textarea" | "number" | "select" | "switch" | "date",
    options?: { value: string; label: string }[]
  ) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      {type === "text" && (
        <Input
          id={key}
          value={formData[key] || ""}
          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          className={validationErrors[key] ? "border-destructive" : ""}
        />
      )}
      {type === "textarea" && (
        <Textarea
          id={key}
          value={formData[key] || ""}
          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          className={validationErrors[key] ? "border-destructive" : ""}
          rows={4}
        />
      )}
      {type === "number" && (
        <Input
          id={key}
          type="number"
          value={formData[key] || ""}
          onChange={e =>
            setFormData({ ...formData, [key]: parseInt(e.target.value) || 0 })
          }
          className={validationErrors[key] ? "border-destructive" : ""}
        />
      )}
      {type === "select" && options && (
        <Select
          value={formData[key] || ""}
          onValueChange={value => setFormData({ ...formData, [key]: value })}
        >
          <SelectTrigger
            className={validationErrors[key] ? "border-destructive" : ""}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {type === "switch" && (
        <Switch
          id={key}
          checked={formData[key] || false}
          onCheckedChange={checked =>
            setFormData({ ...formData, [key]: checked })
          }
        />
      )}
      {type === "date" && (
        <Input
          id={key}
          type="datetime-local"
          value={
            formData[key]
              ? new Date(formData[key]).toISOString().slice(0, 16)
              : ""
          }
          onChange={e =>
            setFormData({ ...formData, [key]: new Date(e.target.value) })
          }
          className={validationErrors[key] ? "border-destructive" : ""}
        />
      )}
      {validationErrors[key] && (
        <div className="text-destructive text-sm">{validationErrors[key]}</div>
      )}
    </div>
  )

  const renderCharacterForm = () => (
    <div className="space-y-4">
      {renderFormField("name", "Character Name", "text")}
      {renderFormField("player", "Player Name", "text")}
      {renderFormField("class", "Character Class", "text")}
      {renderFormField("level", "Level", "number")}
      {renderFormField("description", "Description", "textarea")}
      {renderFormField("backstory", "Backstory", "textarea")}
      {renderFormField("personality", "Personality", "textarea")}
      {renderFormField("isActive", "Is Active", "switch")}

      <div className="grid grid-cols-2 gap-4">
        {renderFormField("currentHealth", "Current Health", "number")}
        {renderFormField("maxHealth", "Max Health", "number")}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {renderFormField("attributes.strength", "Strength", "number")}
        {renderFormField("attributes.dexterity", "Dexterity", "number")}
        {renderFormField("attributes.constitution", "Constitution", "number")}
        {renderFormField("attributes.intelligence", "Intelligence", "number")}
        {renderFormField("attributes.wisdom", "Wisdom", "number")}
        {renderFormField("attributes.charisma", "Charisma", "number")}
      </div>
    </div>
  )

  const renderNPCForm = () => (
    <div className="space-y-4">
      {renderFormField("name", "NPC Name", "text")}
      {renderFormField("role", "Role", "text")}
      {renderFormField("importance", "Importance", "select", [
        { value: "key", label: "Key NPC" },
        { value: "minor", label: "Minor NPC" }
      ])}
      {renderFormField("faction", "Faction", "text")}
      {renderFormField("location", "Location", "text")}
      {renderFormField("description", "Description", "textarea")}
      {renderFormField("personality", "Personality", "textarea")}
      {renderFormField("notes", "Notes", "textarea")}
      {renderFormField("status", "Status", "select", [
        { value: "alive", label: "Alive" },
        { value: "dead", label: "Dead" },
        { value: "missing", label: "Missing" },
        { value: "unknown", label: "Unknown" }
      ])}
    </div>
  )

  const renderLocationForm = () => (
    <div className="space-y-4">
      {renderFormField("name", "Location Name", "text")}
      {renderFormField("parentLocation", "Parent Location", "text")}
      {renderFormField("locationType", "Type", "select", [
        { value: "settlement", label: "Settlement" },
        { value: "structure", label: "Structure" },
        { value: "region", label: "Region" },
        { value: "dungeon", label: "Dungeon" },
        { value: "landmark", label: "Landmark" }
      ])}
      {renderFormField("description", "Description", "textarea")}
      {renderFormField("geography", "Geography", "textarea")}
      {renderFormField("culture", "Culture", "textarea")}
      {renderFormField("government", "Government", "text")}
      {renderFormField("economy", "Economy", "text")}
      {renderFormField("climate", "Climate", "text")}
      {renderFormField("population", "Population", "number")}
      {renderFormField("isActive", "Is Active", "switch")}
    </div>
  )

  const renderSessionForm = () => (
    <div className="space-y-4">
      {renderFormField("name", "Session Title", "text")}
      {renderFormField("sessionNumber", "Session Number", "number")}
      {renderFormField("date", "Date", "date")}
      {renderFormField("gameDate", "Game Date", "text")}
      {renderFormField("duration", "Duration (minutes)", "number")}
      {renderFormField("description", "Session Summary", "textarea")}
      {renderFormField("summary", "Detailed Summary", "textarea")}
      {renderFormField("notes", "GM Notes", "textarea")}
      {renderFormField("experienceGained", "Experience Gained", "number")}
    </div>
  )

  const renderEditDialog = () => (
    <Dialog open={editState.isOpen} onOpenChange={closeDialog}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editState.mode === "create" ? "Create" : "Edit"}{" "}
            {editState.type.charAt(0).toUpperCase() + editState.type.slice(1)}
          </DialogTitle>
          <DialogDescription>
            {editState.mode === "create"
              ? `Create a new ${editState.type} for your campaign`
              : `Edit the ${editState.type} details`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="pr-4">
            {editState.type === "character" && renderCharacterForm()}
            {editState.type === "npc" && renderNPCForm()}
            {editState.type === "location" && renderLocationForm()}
            {editState.type === "session" && renderSessionForm()}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            <IconX className="mr-2 size-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <IconDeviceFloppy className="mr-2 size-4" />
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Campaign Data Management</h3>
        <div className="flex items-center gap-2">{renderCreateButtons()}</div>
      </div>

      <div className="grid gap-4">
        {campaignData?.characters &&
          renderEntityList(
            campaignData.characters,
            "character",
            <IconUser className="size-5" />
          )}

        {campaignData?.npcs &&
          renderEntityList(
            [
              ...(campaignData.npcs.key || []),
              ...(campaignData.npcs.minor || [])
            ],
            "npc",
            <IconUsers className="size-5" />
          )}

        {campaignData?.worldState?.locations &&
          renderEntityList(
            campaignData.worldState.locations,
            "location",
            <IconMap className="size-5" />
          )}

        {campaignData?.sessions &&
          renderEntityList(
            campaignData.sessions,
            "session",
            <IconClock className="size-5" />
          )}
      </div>

      {renderEditDialog()}
    </div>
  )
}
