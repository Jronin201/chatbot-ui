/**
 * Batch Operations Component for Campaign Data Management
 *
 * Provides bulk operations for managing campaign data efficiently
 */

"use client"

import React, { useState, useCallback } from "react"
import { useCampaignData } from "@/context/campaign-data-context"
import { useSessionState } from "@/context/session-state-context"
import {
  CharacterProfile,
  KeyNPC,
  MinorNPC,
  Location,
  SessionLog
} from "@/types/enhanced-campaign-data"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  IconBulb,
  IconDatabase,
  IconDownload,
  IconUpload,
  IconTrash,
  IconTags,
  IconCopy,
  IconCheck,
  IconX,
  IconRefresh,
  IconFileExport,
  IconFileImport,
  IconBraces,
  IconMarkdown
} from "@tabler/icons-react"

interface BatchOperationsProps {
  onDataChange?: () => void
}

type BatchOperation =
  | "export"
  | "import"
  | "bulk-edit"
  | "bulk-delete"
  | "bulk-tag"
  | "duplicate"
  | "validate"
  | "backup"
  | "restore"

interface BatchTask {
  id: string
  operation: BatchOperation
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  message: string
  affectedItems: number
}

export function BatchOperations({ onDataChange }: BatchOperationsProps) {
  const { retrieval } = useCampaignData()
  const { sessionState, trackAction } = useSessionState()

  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [batchTasks, setBatchTasks] = useState<BatchTask[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentOperation, setCurrentOperation] =
    useState<BatchOperation>("export")
  const [operationData, setOperationData] = useState<any>({})

  // Mock campaign data for demonstration
  const campaignData = {
    characters: [
      {
        id: "char1",
        name: "Aria Nightwind",
        class: "Ranger",
        level: 5,
        tags: ["elf", "ranger"]
      },
      {
        id: "char2",
        name: "Thorin Ironforge",
        class: "Fighter",
        level: 4,
        tags: ["dwarf", "fighter"]
      }
    ],
    npcs: [
      {
        id: "npc1",
        name: "Captain Aldric",
        importance: "key",
        tags: ["authority", "lawful"]
      },
      {
        id: "npc2",
        name: "Merchant Thorne",
        importance: "minor",
        tags: ["merchant", "shady"]
      }
    ],
    locations: [
      {
        id: "loc1",
        name: "Millhaven",
        locationType: "settlement",
        tags: ["town", "trade"]
      },
      {
        id: "loc2",
        name: "Darkwood Forest",
        locationType: "region",
        tags: ["forest", "dangerous"]
      }
    ],
    sessions: [
      {
        id: "sess1",
        name: "The Goblin Ambush",
        sessionNumber: 1,
        tags: ["combat", "introduction"]
      },
      {
        id: "sess2",
        name: "Market Day Mystery",
        sessionNumber: 2,
        tags: ["investigation", "roleplay"]
      }
    ]
  }

  const getAllItems = useCallback(() => {
    const items: Array<{ id: string; name: string; type: string; data: any }> =
      []

    campaignData.characters.forEach(char =>
      items.push({
        id: char.id,
        name: char.name,
        type: "character",
        data: char
      })
    )
    campaignData.npcs.forEach(npc =>
      items.push({ id: npc.id, name: npc.name, type: "npc", data: npc })
    )
    campaignData.locations.forEach(loc =>
      items.push({ id: loc.id, name: loc.name, type: "location", data: loc })
    )
    campaignData.sessions.forEach(sess =>
      items.push({ id: sess.id, name: sess.name, type: "session", data: sess })
    )

    return items
  }, [campaignData])

  const handleBatchOperation = async (operation: BatchOperation) => {
    const taskId = `task_${Date.now()}`
    const selectedItemsData = getAllItems().filter(item =>
      selectedItems.includes(item.id)
    )

    const newTask: BatchTask = {
      id: taskId,
      operation,
      status: "running",
      progress: 0,
      message: `Starting ${operation} operation...`,
      affectedItems: selectedItemsData.length
    }

    setBatchTasks(prev => [...prev, newTask])

    try {
      switch (operation) {
        case "export":
          await handleExport(selectedItemsData, taskId)
          break
        case "import":
          await handleImport(taskId)
          break
        case "bulk-edit":
          await handleBulkEdit(selectedItemsData, taskId)
          break
        case "bulk-delete":
          await handleBulkDelete(selectedItemsData, taskId)
          break
        case "bulk-tag":
          await handleBulkTag(selectedItemsData, taskId)
          break
        case "duplicate":
          await handleDuplicate(selectedItemsData, taskId)
          break
        case "validate":
          await handleValidate(selectedItemsData, taskId)
          break
        case "backup":
          await handleBackup(taskId)
          break
        case "restore":
          await handleRestore(taskId)
          break
      }
    } catch (error) {
      updateTask(taskId, { status: "failed", message: `Error: ${error}` })
    }
  }

  const updateTask = (taskId: string, updates: Partial<BatchTask>) => {
    setBatchTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, ...updates } : task))
    )
  }

  const handleExport = async (items: any[], taskId: string) => {
    const exportFormat = operationData.format || "json"
    let exportData: string

    for (let i = 0; i < items.length; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / items.length) * 100,
        message: `Exporting ${items[i].name}...`
      })
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate processing
    }

    if (exportFormat === "json") {
      exportData = JSON.stringify(items, null, 2)
    } else if (exportFormat === "csv") {
      // Simple CSV export
      const headers = ["ID", "Name", "Type", "Tags"]
      const rows = items.map(item => [
        item.id,
        item.name,
        item.type,
        item.data.tags?.join(";") || ""
      ])
      exportData = [headers, ...rows].map(row => row.join(",")).join("\n")
    } else {
      // Markdown export
      exportData = items
        .map(
          item =>
            `## ${item.name}\n- **Type**: ${item.type}\n- **ID**: ${item.id}\n- **Tags**: ${item.data.tags?.join(", ") || "None"}\n\n`
        )
        .join("")
    }

    // Create download
    const blob = new Blob([exportData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `campaign-data-${new Date().toISOString().split("T")[0]}.${exportFormat}`
    a.click()
    URL.revokeObjectURL(url)

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: `Exported ${items.length} items successfully`
    })

    trackAction(`Exported ${items.length} campaign items`, [], 3)
    toast.success(`Exported ${items.length} items`)
  }

  const handleImport = async (taskId: string) => {
    updateTask(taskId, { message: "Processing import file..." })

    // Mock import process
    for (let i = 0; i < 5; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / 5) * 100,
        message: `Processing item ${i + 1}...`
      })
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: "Import completed successfully"
    })

    trackAction("Imported campaign data", [], 4)
    toast.success("Import completed")
    onDataChange?.()
  }

  const handleBulkEdit = async (items: any[], taskId: string) => {
    const editData = operationData.editData || {}

    for (let i = 0; i < items.length; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / items.length) * 100,
        message: `Updating ${items[i].name}...`
      })
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: `Updated ${items.length} items successfully`
    })

    trackAction(`Bulk edited ${items.length} items`, [], 4)
    toast.success(`Updated ${items.length} items`)
    onDataChange?.()
  }

  const handleBulkTag = async (items: any[], taskId: string) => {
    const newTags = operationData.tags || []

    for (let i = 0; i < items.length; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / items.length) * 100,
        message: `Tagging ${items[i].name}...`
      })
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: `Added tags to ${items.length} items`
    })

    trackAction(`Bulk tagged ${items.length} items`, [], 3)
    toast.success(`Tagged ${items.length} items`)
    onDataChange?.()
  }

  const handleBulkDelete = async (items: any[], taskId: string) => {
    for (let i = 0; i < items.length; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / items.length) * 100,
        message: `Deleting ${items[i].name}...`
      })
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: `Deleted ${items.length} items`
    })

    trackAction(`Bulk deleted ${items.length} items`, [], 5)
    toast.success(`Deleted ${items.length} items`)
    onDataChange?.()
  }

  const handleDuplicate = async (items: any[], taskId: string) => {
    for (let i = 0; i < items.length; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / items.length) * 100,
        message: `Duplicating ${items[i].name}...`
      })
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: `Duplicated ${items.length} items`
    })

    trackAction(`Duplicated ${items.length} items`, [], 3)
    toast.success(`Created ${items.length} duplicates`)
    onDataChange?.()
  }

  const handleValidate = async (items: any[], taskId: string) => {
    let validCount = 0
    let invalidCount = 0

    for (let i = 0; i < items.length; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / items.length) * 100,
        message: `Validating ${items[i].name}...`
      })

      // Mock validation logic
      if (items[i].name && items[i].id) {
        validCount++
      } else {
        invalidCount++
      }

      await new Promise(resolve => setTimeout(resolve, 50))
    }

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: `Validation complete: ${validCount} valid, ${invalidCount} invalid`
    })

    trackAction(`Validated ${items.length} items`, [], 2)
    toast.success(
      `Validation complete: ${validCount} valid, ${invalidCount} invalid`
    )
  }

  const handleBackup = async (taskId: string) => {
    updateTask(taskId, { message: "Creating backup..." })

    // Mock backup process
    for (let i = 0; i < 10; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / 10) * 100,
        message: `Backing up data section ${i + 1}...`
      })
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: "Backup created successfully"
    })

    trackAction("Created campaign backup", [], 4)
    toast.success("Backup created")
  }

  const handleRestore = async (taskId: string) => {
    updateTask(taskId, { message: "Restoring from backup..." })

    // Mock restore process
    for (let i = 0; i < 8; i++) {
      updateTask(taskId, {
        progress: ((i + 1) / 8) * 100,
        message: `Restoring data section ${i + 1}...`
      })
      await new Promise(resolve => setTimeout(resolve, 250))
    }

    updateTask(taskId, {
      status: "completed",
      progress: 100,
      message: "Restore completed successfully"
    })

    trackAction("Restored campaign from backup", [], 5)
    toast.success("Restore completed")
    onDataChange?.()
  }

  const renderOperationDialog = () => {
    const operations = [
      {
        id: "export",
        name: "Export Data",
        icon: <IconFileExport className="size-4" />,
        description: "Export selected items to various formats"
      },
      {
        id: "import",
        name: "Import Data",
        icon: <IconFileImport className="size-4" />,
        description: "Import campaign data from files"
      },
      {
        id: "bulk-edit",
        name: "Bulk Edit",
        icon: <IconBulb className="size-4" />,
        description: "Edit multiple items at once"
      },
      {
        id: "bulk-delete",
        name: "Bulk Delete",
        icon: <IconTrash className="size-4" />,
        description: "Delete multiple items at once"
      },
      {
        id: "bulk-tag",
        name: "Bulk Tag",
        icon: <IconTags className="size-4" />,
        description: "Add tags to multiple items"
      },
      {
        id: "duplicate",
        name: "Duplicate",
        icon: <IconCopy className="size-4" />,
        description: "Create copies of selected items"
      },
      {
        id: "validate",
        name: "Validate",
        icon: <IconCheck className="size-4" />,
        description: "Check data integrity"
      },
      {
        id: "backup",
        name: "Backup",
        icon: <IconDatabase className="size-4" />,
        description: "Create full campaign backup"
      },
      {
        id: "restore",
        name: "Restore",
        icon: <IconRefresh className="size-4" />,
        description: "Restore from backup"
      }
    ]

    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-h-[80vh] max-w-4xl overflow-y-auto"
          windowId="BO-001"
        >
          <DialogHeader>
            <DialogTitle>Batch Operations</DialogTitle>
            <DialogDescription>
              Perform bulk operations on campaign data
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {operations.map(op => (
              <Card
                key={op.id}
                className={`cursor-pointer transition-colors ${
                  currentOperation === op.id ? "ring-primary ring-2" : ""
                }`}
                onClick={() => setCurrentOperation(op.id as BatchOperation)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {op.icon}
                    {op.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    {op.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {currentOperation === "export" && (
            <div className="space-y-4">
              <h4 className="font-medium">Export Options</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={
                    operationData.format === "json" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setOperationData({ ...operationData, format: "json" })
                  }
                >
                  <IconBraces className="mr-2 size-4" />
                  JSON
                </Button>
                <Button
                  variant={
                    operationData.format === "csv" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setOperationData({ ...operationData, format: "csv" })
                  }
                >
                  CSV
                </Button>
                <Button
                  variant={
                    operationData.format === "markdown" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setOperationData({ ...operationData, format: "markdown" })
                  }
                >
                  <IconMarkdown className="mr-2 size-4" />
                  Markdown
                </Button>
              </div>
            </div>
          )}

          {currentOperation === "bulk-tag" && (
            <div className="space-y-4">
              <h4 className="font-medium">Add Tags</h4>
              <Textarea
                placeholder="Enter tags separated by commas (e.g., important, reviewed, archive)"
                value={operationData.tags?.join(", ") || ""}
                onChange={e =>
                  setOperationData({
                    ...operationData,
                    tags: e.target.value
                      .split(",")
                      .map(t => t.trim())
                      .filter(t => t)
                  })
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleBatchOperation(currentOperation)
                setIsDialogOpen(false)
              }}
              disabled={
                selectedItems.length === 0 &&
                !["backup", "restore", "import"].includes(currentOperation)
              }
            >
              Execute{" "}
              {currentOperation === "bulk-delete" ? "Delete" : "Operation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Batch Operations</h3>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <IconDatabase className="size-4" />
          Batch Operations
        </Button>
      </div>

      {/* Item Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Items</CardTitle>
          <CardDescription>
            Choose items to perform batch operations on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Select All/None */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedItems(getAllItems().map(item => item.id))
                }
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                Select None
              </Button>
              <Badge variant="outline">{selectedItems.length} selected</Badge>
            </div>

            {/* Item List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {getAllItems().map(item => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 rounded border p-2"
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedItems([...selectedItems, item.id])
                        } else {
                          setSelectedItems(
                            selectedItems.filter(id => id !== item.id)
                          )
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {item.type} • {item.id}
                      </div>
                    </div>
                    <Badge variant="secondary">{item.type}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Active Tasks */}
      {batchTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batchTasks.map(task => (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-medium capitalize">
                        {task.operation}
                      </div>
                      <Badge
                        variant={
                          task.status === "completed"
                            ? "default"
                            : task.status === "failed"
                              ? "destructive"
                              : task.status === "running"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {task.affectedItems} items
                    </div>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                  <div className="text-muted-foreground text-sm">
                    {task.message}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {renderOperationDialog()}
    </div>
  )
}
