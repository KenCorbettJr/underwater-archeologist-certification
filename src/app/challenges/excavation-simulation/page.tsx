"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  AuthGuard,
  useAuthenticatedUser,
} from "../../../components/auth/AuthGuard";

// Import excavation game components
import ExcavationGrid from "../../../components/games/ExcavationGrid";
import ToolSelector from "../../../components/games/ToolSelector";
import DocumentationPanel from "../../../components/games/DocumentationPanel";
import ProgressIndicator from "../../../components/games/ProgressIndicator";
import { ToolGuideModal } from "../../../components/games/ToolGuideModal";
import { ExcavationTutorial } from "../../../components/games/ExcavationTutorial";
import { ToastProvider, useToast } from "../../../components/ui/ToastContainer";

// Import game logic
import {
  ExcavationTool,
  DocumentationEntry,
  DifficultyLevel,
} from "../../../types";
import {
  getToolSuggestion,
  formatToolViolationMessage,
} from "../../../lib/toolSuggestions";

function ExcavationSimulationContent() {
  const user = useAuthenticatedUser();
  const { showToast } = useToast();
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
  const [isInitializing, setIsInitializing] = useState(false);
  const [showToolGuide, setShowToolGuide] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenViolation, setHasSeenViolation] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

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

  const databaseStatus = useQuery(api.seedDatabase.checkDatabaseStatus, {});
  const initializeDatabase = useMutation(api.seedDatabase.initializeDatabase);

  const startGame = useMutation(api.excavationGame.startExcavationGame);
  const processAction = useMutation(api.excavationGame.processExcavationAction);
  const changeTool = useMutation(api.excavationGame.changeExcavationTool);
  const addDocumentation = useMutation(
    api.excavationGame.addDocumentationEntry
  );
  const completeGame = useMutation(api.excavationGame.completeExcavationGame);
  const createUser = useMutation(api.users.createUser);

  // Get current user from database
  const currentUser = useQuery(api.users.getUserByClerkId, {
    clerkId: user.id,
  });

  // Auto-create user if they don't exist in the database
  useEffect(() => {
    if (user && currentUser === null) {
      // User is authenticated but not in database, create them
      createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "Student",
      }).catch((error) => {
        console.error("Failed to create user:", error);
      });
    }
  }, [user, currentUser, createUser]);

  const handleInitializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const result = await initializeDatabase({});
      if (result.success) {
        showToast(result.message, "success", {
          title: "Database Initialized",
          duration: 4000,
        });
      } else {
        showToast(result.message, "error", {
          title: "Initialization Failed",
          duration: 6000,
        });
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
      showToast("Failed to initialize database. Please try again.", "error", {
        title: "Error",
        duration: 6000,
      });
    } finally {
      setIsInitializing(false);
    }
  };

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

      // Show tutorial on first game
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
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
        // Check if it's a documentation action or artifact discovery
        const isDocumentation = result.discoveries[0].includes("Documented");
        const isArtifact = result.discoveries[0].includes(
          "Artifact discovered"
        );

        if (isDocumentation) {
          showToast(
            `${result.discoveries.join(", ")}\n\n💡 Tip: Add detailed notes in the Documentation Panel to the right!`,
            "info",
            {
              title: "📝 Documented",
              duration: 5000,
            }
          );
        } else if (isArtifact) {
          showToast(result.discoveries.join(", "), "success", {
            title: "🎉 Artifact Discovery!",
            duration: 5000,
          });
        } else {
          showToast(result.discoveries.join(", "), "success", {
            title: "✓ Success",
            duration: 3000,
          });
        }
      }

      if (result.violations.length > 0) {
        const violation = result.violations[0];

        // Get tool suggestion based on violation
        const suggestion = getToolSuggestion(
          violation.violationType,
          gameState.gameData.currentTool.name,
          {
            artifactCondition: undefined, // Could be enhanced with actual artifact data
            visibility: gameState.site.environmentalConditions.visibility,
            currentStrength:
              gameState.site.environmentalConditions.currentStrength,
          }
        );

        const formatted = formatToolViolationMessage(
          gameState.gameData.currentTool.name,
          violation.violationType,
          suggestion
        );

        // Show helpful violation warning with suggestions
        showToast(
          `${formatted.message}\n\n💡 Tips:\n${formatted.tips.map((tip) => `• ${tip}`).join("\n")}`,
          "warning",
          {
            title: formatted.title,
            duration: 8000,
            actionLabel: !hasSeenViolation ? "View Tool Guide" : undefined,
            onAction: !hasSeenViolation
              ? () => setShowToolGuide(true)
              : undefined,
          }
        );

        // Mark that user has seen a violation
        if (!hasSeenViolation) {
          setHasSeenViolation(true);
        }
      }
    } catch (error) {
      console.error("Failed to process excavation action:", error);
      showToast("Failed to process action. Please try again.", "error", {
        title: "Error",
        duration: 4000,
      });
    }
  };

  const handleToolSelect = async (tool: ExcavationTool) => {
    if (!gameSessionId) return;

    try {
      await changeTool({
        sessionId: gameSessionId,
        toolId: tool.id,
      });
    } catch (error) {
      console.error("Failed to change tool:", error);
    }
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

      // Show completion notification with results
      showToast(
        `Artifacts Found: ${report.artifactsFound}/${report.totalArtifacts}\nDocumentation: ${report.documentationQuality}%\nProtocol Compliance: ${report.protocolCompliance}%`,
        "success",
        {
          title: `🏆 Excavation Complete! Score: ${report.overallScore}/100`,
          duration: 10000,
        }
      );

      // Reset game state
      setGameStarted(false);
      setGameSessionId(null);
      setSelectedCell(null);
    } catch (error) {
      console.error("Failed to complete game:", error);
      showToast("Failed to complete game. Please try again.", "error", {
        title: "Error",
        duration: 4000,
      });
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

  // User is guaranteed to be authenticated by AuthGuard

  // Check if database needs initialization
  if (databaseStatus && !databaseStatus.isInitialized) {
    return (
      <div className="min-h-screen wave-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl border border-white/30">
          <h1 className="text-2xl font-bold mb-4 text-white font-fredoka">
            🏛️ Database Setup Required
          </h1>
          <p className="text-ocean-50 mb-6">
            The excavation simulation needs to be initialized with sample data.
            This will create artifacts and excavation sites for you to explore.
          </p>
          <div className="mb-4 text-sm text-ocean-100">
            <p>Current status:</p>
            <p>• Artifacts: {databaseStatus.artifactsCount}</p>
            <p>• Excavation Sites: {databaseStatus.sitesCount}</p>
          </div>
          <button
            onClick={handleInitializeDatabase}
            disabled={isInitializing}
            className="w-full py-3 px-6 bg-sand-400 hover:bg-sand-500 text-sand-900 rounded-2xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isInitializing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sand-900 mr-2"></div>
                Initializing Database...
              </div>
            ) : (
              "Initialize Database"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen wave-bg relative overflow-hidden font-poppins">
        {/* Header */}
        <header className="relative z-10 p-6 flex justify-between items-center backdrop-blur-sm bg-white/5 border-b border-white/10">
          <Link
            href="/challenges"
            className="text-white font-bold text-xl md:text-2xl flex items-center gap-3 font-fredoka hover:text-sand-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤿</span>
              <span className="hidden sm:inline">Excavation Simulation</span>
              <span className="sm:hidden">Excavation</span>
            </div>
          </Link>
        </header>

        {/* Main Content */}
        <main className="relative z-10 container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 font-fredoka">
                Underwater{" "}
                <span className="bg-gradient-to-r from-sand-200 via-sand-400 to-sand-600 bg-clip-text text-transparent">
                  Excavation
                </span>
              </h1>
              <p className="text-xl text-ocean-50 max-w-2xl mx-auto">
                🤿 Learn proper archaeological excavation techniques through
                interactive simulation
              </p>
            </div>

            {/* Difficulty Selection */}
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/30">
              <h2 className="text-2xl font-bold text-white mb-6 text-center font-fredoka">
                Choose Your Difficulty
              </h2>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {(
                  ["beginner", "intermediate", "advanced"] as DifficultyLevel[]
                ).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(level)}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      selectedDifficulty === level
                        ? "border-sand-400 bg-sand-400/20 text-white"
                        : "border-white/30 bg-white/10 text-ocean-100 hover:border-sand-300 hover:bg-white/20"
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {level === "beginner"
                        ? "🌊"
                        : level === "intermediate"
                          ? "🏊"
                          : "🤿"}
                    </div>
                    <h3 className="text-lg font-bold capitalize mb-2">
                      {level}
                    </h3>
                    <p className="text-sm opacity-80">
                      {level === "beginner" && "Perfect for learning basics"}
                      {level === "intermediate" && "Moderate challenge"}
                      {level === "advanced" && "Expert level difficulty"}
                    </p>
                  </button>
                ))}
              </div>
              <h2 className="text-2xl font-bold text-white mb-6 text-center font-fredoka">
                Choose Excavation Site
              </h2>
              {!excavationSites ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sand-400 mx-auto mb-4"></div>
                  <div className="text-ocean-100">
                    Loading excavation sites...
                  </div>
                </div>
              ) : excavationSites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {excavationSites.map((site: any) => (
                    <button
                      key={site._id}
                      onClick={() => setSelectedSiteId(site._id)}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        selectedSiteId === site._id
                          ? "border-sand-400 bg-sand-400/20 text-white"
                          : "border-white/30 bg-white/10 text-ocean-100 hover:border-sand-300 hover:bg-white/20"
                      }`}
                    >
                      <div className="font-medium text-lg mb-2">
                        {site.name}
                      </div>
                      <div className="text-sm opacity-80 mb-2">
                        {site.location}
                      </div>
                      <div className="text-sm opacity-90 mb-3">
                        {site.description}
                      </div>
                      <div className="flex justify-between text-xs opacity-70">
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
                  <div className="text-ocean-100 mb-4">
                    No excavation sites available for this difficulty level.
                  </div>
                  <p className="text-sm text-ocean-200">
                    The database may need to be initialized. Visit the{" "}
                    <a href="/admin" className="text-sand-300 hover:underline">
                      admin page
                    </a>{" "}
                    to set up the initial data.
                  </p>
                </div>
              )}
              <button
                onClick={handleStartGame}
                disabled={!selectedSiteId || !currentUser}
                className="w-full py-3 px-6 bg-sand-400 hover:bg-sand-500 text-sand-900 rounded-2xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {!currentUser
                  ? "Loading user data..."
                  : !selectedSiteId
                    ? "Select a site to start"
                    : "Start Excavation Simulation"}
              </button>
              {!currentUser && (
                <p className="text-ocean-100 text-sm mt-2 text-center">
                  Setting up your account...
                </p>
              )}
              {!selectedSiteId && currentUser && (
                <p className="text-sand-300 text-sm mt-2 text-center">
                  👆 Please select an excavation site above
                </p>
              )}
            </div>

            {/* Game instructions */}
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/30">
              <h2 className="text-2xl font-bold text-white mb-6 text-center font-fredoka">
                🎯 How to Play
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3 text-sand-300 text-lg">
                    Excavation
                  </h3>
                  <ul className="text-sm space-y-2 text-ocean-100">
                    <li>• Click on grid cells to excavate</li>
                    <li>• Use appropriate tools for different tasks</li>
                    <li>• Watch for artifacts as you dig deeper</li>
                    <li>• Follow proper archaeological protocols</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-3 text-sand-300 text-lg">
                    Documentation
                  </h3>
                  <ul className="text-sm space-y-2 text-ocean-100">
                    <li>• Record all discoveries and measurements</li>
                    <li>• Take photos of artifacts in situ</li>
                    <li>• Document your excavation methods</li>
                    <li>• Complete required documentation entries</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen wave-bg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sand-400 mx-auto mb-4"></div>
          <div>Loading excavation site...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen wave-bg relative overflow-hidden font-poppins">
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center backdrop-blur-sm bg-white/5 border-b border-white/10">
        <Link
          href="/challenges"
          className="text-white font-bold text-xl md:text-2xl flex items-center gap-3 font-fredoka hover:text-sand-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤿</span>
            <span className="hidden sm:inline">Excavation Simulation</span>
            <span className="sm:hidden">Excavation</span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 max-w-[1800px]">
        {/* Site Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1 font-fredoka">
            {gameState.site.name}
          </h1>
          <p className="text-sm text-ocean-100">
            {gameState.site.location} • {gameState.site.historicalPeriod}
          </p>
        </div>

        {/* Game interface - Two row layout */}
        <div className="space-y-4">
          {/* Top row - Progress and Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[350px_1fr] gap-4">
            {/* Progress Panel */}
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/30">
              <ProgressIndicator
                gameData={gameState.gameData}
                siteArtifacts={gameState.site.siteArtifacts}
                siteName={gameState.site.name}
                timeLimit={
                  gameState.site.environmentalConditions.timeConstraints
                }
              />
            </div>

            {/* Excavation Grid */}
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/30 flex flex-col items-center justify-center">
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
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <button
                  onClick={handleCompleteGame}
                  className="px-4 py-2 bg-sand-400 hover:bg-sand-500 text-sand-900 rounded-xl font-bold transition-colors text-sm"
                >
                  Complete Excavation
                </button>
                <button
                  onClick={() => setShowTutorial(true)}
                  className="px-4 py-2 border-2 border-blue-400 text-blue-300 hover:bg-blue-400/20 rounded-xl font-bold transition-colors text-sm"
                >
                  �️ Tutorial
                </button>
                <button
                  onClick={() => setShowToolGuide(true)}
                  className="px-4 py-2 border-2 border-sand-400 text-sand-300 hover:bg-sand-400/20 rounded-xl font-bold transition-colors text-sm"
                >
                  🛠️ Tool Guide
                </button>
                <button
                  onClick={() => {
                    setGameStarted(false);
                    setGameSessionId(null);
                  }}
                  className="px-4 py-2 border-2 border-white/30 text-white hover:bg-white/10 rounded-xl font-bold transition-colors text-sm"
                >
                  Exit Game
                </button>
              </div>
            </div>
          </div>

          {/* Bottom row - Tools and Documentation */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Tools Panel */}
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/30">
              <ToolSelector
                currentTool={gameState.gameData.currentTool}
                onToolSelect={handleToolSelect}
                environmentalConditions={gameState.site.environmentalConditions}
                disabled={gameState.session.status !== "active"}
              />
            </div>

            {/* Documentation Panel */}
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/30">
              <DocumentationPanel
                entries={gameState.gameData.documentationEntries}
                selectedCell={selectedCell || undefined}
                onAddEntry={handleAddDocumentation}
                disabled={gameState.session.status !== "active"}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Tutorial Modal */}
      <ExcavationTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => setHasSeenTutorial(true)}
      />

      {/* Tool Guide Modal */}
      <ToolGuideModal
        isOpen={showToolGuide}
        onClose={() => setShowToolGuide(false)}
      />
    </div>
  );
}

export default function ExcavationSimulationPage() {
  return (
    <AuthGuard>
      <ToastProvider>
        <ExcavationSimulationContent />
      </ToastProvider>
    </AuthGuard>
  );
}
