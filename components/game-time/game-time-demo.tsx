"use client"

import React, { useState } from "react"
import { GameTimeService } from "@/lib/game-time/game-time-service"
import { useGameTime } from "@/context/game-time-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconRocket, IconAnalyze, IconClock } from "@tabler/icons-react"
import { toast } from "sonner"

interface GameTimeDemoProps {}

export const GameTimeDemo: React.FC<GameTimeDemoProps> = () => {
  const { gameTimeData, formatDate } = useGameTime()
  const [testMessage, setTestMessage] = useState("")
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const gameTimeService = GameTimeService.getInstance()

  // Sample messages for demonstration
  const sampleMessages = [
    "We traveled to Arrakis, the journey took 3 days through the desert.",
    "The characters spent two weeks training in combat techniques.",
    "After a quick rest, we continued our mission.",
    "The expedition to the spice mining facility lasted a month.",
    "We negotiated with the Fremen for several hours.",
    "The characters meditated for a day to recover their mental strength.",
    "A long voyage across the galaxy brought us to Caladan after 14 days.",
    "The investigation into the conspiracy took weeks to complete.",
    "We rested at the sietch for a fortnight before departing.",
    "The formal ceremony with House Atreides lasted the entire evening."
  ]

  const analyzeMessage = async () => {
    if (!testMessage.trim()) {
      toast.error("Please enter a message to analyze")
      return
    }

    setIsAnalyzing(true)
    try {
      const analysis =
        await gameTimeService.analyzeMessageForTimePassage(testMessage)
      setAnalysisResult(analysis)
    } catch (error) {
      toast.error("Failed to analyze message")
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSampleMessage = (message: string) => {
    setTestMessage(message)
    setAnalysisResult(null)
  }

  const clearAnalysis = () => {
    setTestMessage("")
    setAnalysisResult(null)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <IconRocket className="size-8" />
          Game Time System Demo
        </h1>
        <p className="text-muted-foreground">
          Test the time passage analysis system for TTRPG campaigns
        </p>
      </div>

      {/* Current Game Time Display */}
      {gameTimeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconClock className="size-5" />
              Current Campaign Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Date</p>
                <p className="font-mono text-lg">
                  {formatDate(
                    gameTimeData.currentDate,
                    gameTimeData.calendarSystem
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Campaign</p>
                <p className="text-lg">
                  {gameTimeData.campaignMetadata?.campaignName ||
                    "Unknown Campaign"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Days Elapsed</p>
                <p className="text-lg font-semibold">
                  {gameTimeData.totalDaysElapsed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAnalyze className="size-5" />
            Time Passage Analysis
          </CardTitle>
          <CardDescription>
            Enter a narrative message to analyze for time passage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Message</label>
            <Textarea
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              placeholder="Enter a narrative message to analyze..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={analyzeMessage} disabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing..." : "Analyze Message"}
            </Button>
            <Button variant="outline" onClick={clearAnalysis}>
              Clear
            </Button>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Analysis Results</h3>
                <Badge
                  variant={
                    analysisResult.hasTimePassage ? "default" : "secondary"
                  }
                >
                  {analysisResult.hasTimePassage
                    ? "Time Passage Detected"
                    : "No Time Passage"}
                </Badge>
              </div>

              {analysisResult.hasTimePassage ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Days Elapsed</p>
                      <p className="font-mono text-lg">
                        {analysisResult.daysElapsed}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Confidence</p>
                      <p className="text-lg">
                        {Math.round(analysisResult.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Explanation</p>
                    <p className="text-muted-foreground text-sm">
                      {analysisResult.explanation}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No significant time passage detected in this message.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Messages</CardTitle>
          <CardDescription>
            Try these example messages to see how the analysis works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {sampleMessages.map((message, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto justify-start p-3 text-left"
                onClick={() => setTestMessage(message)}
              >
                <div className="truncate">{message}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle>System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Calendar Systems</h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Dune Imperial Calendar (360-day years)</li>
                <li>• Standard Gregorian Calendar</li>
                <li>• Custom Calendar Support (coming soon)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Time Detection</h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Travel and journey activities</li>
                <li>• Rest and recovery periods</li>
                <li>• Training and learning</li>
                <li>• Research and investigation</li>
                <li>• Explicit time mentions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Management</h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Manual time adjustments</li>
                <li>• Time passage history</li>
                <li>• Configurable settings</li>
                <li>• Data export/import</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Integration</h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Automatic chat analysis</li>
                <li>• Notification system</li>
                <li>• Campaign metadata tracking</li>
                <li>• Persistent storage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
