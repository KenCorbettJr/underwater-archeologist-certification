"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

// Import excavation game components
import ExcavationGrid from "../../../components/games/ExcavationGrid";
import ToolSelector from "../../../components/games/ToolSelector";
import DocumentationPanel from "../../../components/games/DocumentationPanel";
import ProgressIndicator from "../../../components/games/ProgressIndicator";

// Import game logic
import {
  ExcavationGameData,
  ExcavationTool,
  DocumentationEntry,
  DifficultyLevel,
} from "../../../types";
import { EXCAVATION_TOOLS } from "../../../lib/excavationGameLogic";

export default function ExcavationSimulationPage() {
  const { user } = useUser();
  const [gameSessionId, setGameSessionId] = useState<Id<"gameSessions"> | null>(
    null
  );
  const [selectedCell, setSelectedCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedSiteId, setSelectedSiteId] =
    useState<Id<"excavationSites"> | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>("beginner");

  // Convex queries and mutations
  const gameState = useQuery(
    api.excavationGame.getExcavationGameState,
    gameSessionId ? { sessionId: gameSessionId } : "skip"
  );

  const excavationSites = useQuery(
    api.excavationSites.getExcavationSitesByDifficulty,
    {
      difficulty: selectedDifficulty,
    }
  );

  const startGame = useMutation(api.excavationGame.startExcavationGame);
  const processAction = useMutation(api.excavationGame.processExcavationAction);
  const addDocumentation = useMutation(
    api.excavationGame.addDocumentationEntry
  );
  const completeGame = useMutation(api.excavationGame.completeExcavationGame);

  // Get current user from database
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const handleStartGame = async () => {
    if (!currentUser || !selectedSiteId) return;

    try {
      const sessionId = await startGame({
        userId: currentUser._id,
        siteId: selectedSiteId,
        difficulty: selectedDifficulty,
      });
      setGameSessionId(sessionId);
      setGameStarted(true);
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  const handleCellClick = async (x: number, y: number) => {
    if (!gameSessionId || !gameState?.gameData.currentTool) return;

    try {
      const result = await processAction({
        sessionId: gameSessionId,
        gridX: x,
        gridY: y,
        toolId: gameState.gameData.currentTool.id,
      });

      if (result.discoveries.length > 0) {
        // Show discovery notification
        alert(`Discovery! ${result.discoveries.join(", ")}`);
      }

      if (result.violations.length > 0) {
        // Show violation warning
        alert(`Protocol violation: ${result.violations[0].description}`);
      }
    } catch (error) {
      console.error("Failed to process excavation action:", error);
    }
  };

  const handleToolSelect = (tool: ExcavationTool) => {
    // Tool selection would be handled by updating the game state
    // For now, we'll just update the local state
    console.log("Tool selected:", tool);
  };

  const handleAddDocumentation = async (
    entry: Omit<DocumentationEntry, "id" | "timestamp">
  ) => {
    if (!gameSessionId) return;

    try {
      await addDocumentation({
        sessionId: gameSessionId,
        entryType: entry.entryType,
        content: entry.content,
        gridX: entry.gridPosition.x,
        gridY: entry.gridPosition.y,
        artifactId: entry.artifactId,
      });
    } catch (error) {
      console.error("Failed to add documentation:", error);
    }
  };

  const handleCompleteGame = async () => {
    if (!gameSessionId) return;

    try {
      const report = await completeGame({ sessionId: gameSessionId });

      // Show completion modal with results
      alert(`Game completed! Overall score: ${report.overallScore}/100`);

      // Reset game state
      setGameStarted(false);
      setGameSessionId(null);
      setSelectedCell(null);
    } catch (error) {
      console.error("Failed to complete game:", error);
    }
  };

  // Check if game should auto-complete (time up or fully excavated)
  useEffect(() => {
    if (gameState?.gameData) {
      if (gameState.gameData.timeRemaining <= 0) {
        handleCompleteGame();
      }
    }
  }, [gameState?.gameData?.timeRemaining]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to play</h1>
          <p className="text-gray-600">
            You need to be signed in to access the excavation simulation.
          </p>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">
              🏛️ Underwater Excavation Simulation
            </h1>
            <p className="text-lg text-gray-700">
              Learn proper archaeological excavation techniques through
              interactive simulation
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">
              Select Difficulty Level
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {(
                ["beginner", "intermediate", "advanced"] as DifficultyLevel[]
              ).map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedDifficulty === difficulty
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-lg font-medium capitalize">
                    {difficulty}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {difficulty === "beginner" && "Perfect for learning basics"}
                    {difficulty === "intermediate" && "Moderate challenge"}
                    {difficulty === "advanced" && "Expert level difficulty"}
                  </div>
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-semibold mb-4">
              Choose Excavation Site
            </h2>
            {excavationSites && excavationSites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {excavationSites.map((site) => (
                  <button
                    key={site._id}
                    onClick={() => setSelectedSiteId(site._id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedSiteId === site._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-lg">{site.name}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {site.location}
                    </div>
                    <div className="text-sm text-gray-700">
                      {site.description}
                    </div>
                    <div className="mt-2 flex justify-between text-xs">
                      <span>
                        Grid: {site.gridWidth}×{site.gridHeight}
                      </span>
                      <span>Artifacts: {site.siteArtifacts.length}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading excavation sites...</div>
              </div>
            )}

            <button
              onClick={handleStartGame}
              disabled={!selectedSiteId || !currentUser}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Start Excavation Simulation
            </button>
          </div>

          {/* Game instructions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">🎯 How to Play</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Excavation</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Click on grid cells to excavate</li>
                  <li>• Use appropriate tools for different tasks</li>
                  <li>• Watch for artifacts as you dig deeper</li>
                  <li>• Follow proper archaeological protocols</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Documentation</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Record all discoveries and measurements</li>
                  <li>• Take photos of artifacts in situ</li>
                  <li>• Document your excavation methods</li>
                  <li>• Complete required documentation entries</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading excavation site...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            {gameState.site.name}
          </h1>
          <p className="text-gray-700">
            {gameState.site.location} • {gameState.site.historicalPeriod}
          </p>
        </div>

        {/* Game interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Tools and Progress */}
          <div className="space-y-6">
            <ToolSelector
              currentTool={gameState.gameData.currentTool}
              onToolSelect={handleToolSelect}
              environmentalConditions={gameState.site.environmentalConditions}
              disabled={gameState.session.status !== "active"}
            />

            <ProgressIndicator
              gameData={gameState.gameData}
              siteArtifacts={gameState.site.siteArtifacts}
              siteName={gameState.site.name}
              timeLimit={gameState.site.environmentalConditions.timeConstraints}
            />
          </div>

          {/* Center column - Excavation Grid */}
          <div className="flex flex-col items-center">
            <ExcavationGrid
              gridWidth={gameState.site.gridWidth}
              gridHeight={gameState.site.gridHeight}
              cells={gameState.gameData.excavatedCells}
              currentTool={gameState.gameData.currentTool}
              siteArtifacts={gameState.site.siteArtifacts}
              onCellClick={handleCellClick}
              onCellHover={(x, y) => setSelectedCell({ x, y })}
              disabled={gameState.session.status !== "active"}
            />

            {/* Game controls */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleCompleteGame}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Excavation
              </button>
              <button
                onClick={() => {
                  setGameStarted(false);
                  setGameSessionId(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Exit Game
              </button>
            </div>
          </div>

          {/* Right column - Documentation */}
          <div>
            <DocumentationPanel
              entries={gameState.gameData.documentationEntries}
              selectedCell={selectedCell || undefined}
              onAddEntry={handleAddDocumentation}
              disabled={gameState.session.status !== "active"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
