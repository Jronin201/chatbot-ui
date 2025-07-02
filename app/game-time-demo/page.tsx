"use client"

import React from "react"
import { GameTimeProvider } from "@/context/game-time-context"
import { GameTimeDemo } from "@/components/game-time/game-time-demo"

export default function GameTimeDemoPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Game Time System Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test and explore the game time tracking system for TTRPGs. This demo
          allows you to experiment with the system before integrating it into
          your campaigns.
        </p>
      </div>

      <GameTimeProvider>
        <GameTimeDemo />
      </GameTimeProvider>
    </div>
  )
}
