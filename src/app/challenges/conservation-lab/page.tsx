"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { ConservationWorkbench } from "@/components/games/ConservationWorkbench";
import { ProcessSelector } from "@/components/games/ProcessSelector";
import { TreatmentPlanner } from "@/components/games/TreatmentPlanner";
import Link from "next/link";

function ConservationLabGameContent() {
  const { user } = useUser();
  const [sessionId, setSessionId] = useState<Id<"gameSessions"> | null>(null);
  const [activeTab, setActiveTab] = useState<
    "assessment" | "processes" | "treatment"
  >("assessment");

  const startGame = useMutation(
    api.conservationLabGame.startConservationLabGame
  );
  const completeAssessment = useMutation(
    api.conservationLabGame.completeAssessment
  );
  const selectProcess = useMutation(api.conservationLabGame.selectProcess);
  const removeProcess = useMutation(api.conservationLabGame.removeProcess);
  const validateSelection = useMutation(
    api.conservationLabGame.validateProcessSelection
  );
  const createPlan = useMutation(api.conservationLabGame.createTreatmentPlan);
  const executeStep = useMutation(api.conservationLabGame.executeTreatmentStep);
  const completeGame = useMutation(
    api.conservationLabGame.completeConservationLabGame
  );
  const createUser = useMutation(api.users.createUser);

  // Fetch available artifacts
  const artifacts = useQuery(api.adminArtifacts.getAllArtifactsForAdmin, {
    includeInactive: false,
  });

  // Get Convex user from Clerk ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const gameState = useQuery(
    api.conservationLabGame.getConservationLabGame,
    sessionId ? { sessionId } : "skip"
  );

  const handleStartGame = async () => {
    if (!user || !artifacts || artifacts.length === 0) return;

    try {
      // Get or create Convex user
      let userId = convexUser?._id;
      if (!userId) {
        userId = await createUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          name: user.fullName || user.firstName || "Student",
        });
      }

      // Use the first available artifact
      const newSessionId = await startGame({
        userId: userId,
        artifactId: artifacts[0]._id,
        difficulty: "beginner",
      });
      setSessionId(newSessionId);
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  const handleAssessmentComplete = async (identifiedDamages: string[]) => {
    if (!sessionId) return;
    try {
      const result = await completeAssessment({ sessionId, identifiedDamages });
      alert(
        `Assessment Score: ${result.score}\nAccuracy: ${result.accuracy}%\n${result.feedback}`
      );
      setActiveTab("processes");
    } catch (error) {
      console.error("Failed to complete assessment:", error);
    }
  };

  const handleSelectProcess = async (processId: string) => {
    if (!sessionId) return;
    try {
      const result = await selectProcess({ sessionId, processId });

      // Show feedback for inappropriate process selection
      if (!result.isAppropriate) {
        alert(
          `❌ Incorrect Choice!\n\n${result.feedback}\n\nYou lost 5 points for selecting an inappropriate process.`
        );
      }
    } catch (error) {
      console.error("Failed to select process:", error);
    }
  };

  const handleRemoveProcess = async (processId: string) => {
    if (!sessionId) return;
    try {
      const result = await removeProcess({ sessionId, processId });

      // Show feedback
      if (result.success) {
        if (result.pointsRestored > 0) {
          alert(
            `✅ ${result.feedback}\n\nYou recovered ${result.pointsRestored} points!`
          );
        }
      }
    } catch (error) {
      console.error("Failed to remove process:", error);
    }
  };

  const handleCreatePlan = async (processOrder: string[]) => {
    if (!sessionId) return;
    try {
      const result = await createPlan({ sessionId, processOrder });
      alert(`Plan Score: ${result.score}\n${result.feedback}`);
      setActiveTab("treatment");
    } catch (error) {
      console.error("Failed to create plan:", error);
    }
  };

  const handleExecuteStep = async (stepId: string) => {
    if (!sessionId) return;
    try {
      const result = await executeStep({ sessionId, stepId });
      console.log("Step execution result:", result);
    } catch (error) {
      console.error("Failed to execute step:", error);
    }
  };

  const handleCompleteGame = async () => {
    if (!sessionId) return;
    try {
      const result = await completeGame({ sessionId });
      // 70% minimum for conservation lab (site documentation requirement)
      const passed = result.finalScore >= 70;
      alert(
        `${passed ? "🏆" : "😢"} ${result.feedback}\nFinal Score: ${result.finalScore}/100${!passed ? "\nKeep practicing to improve your score!" : ""}`
      );
    } catch (error) {
      console.error("Failed to complete game:", error);
    }
  };

  if (!sessionId) {
    if (!artifacts) {
      return (
        <div className="min-h-screen wave-bg flex items-center justify-center">
          <div className="text-white text-2xl">Loading...</div>
        </div>
      );
    }

    if (artifacts.length === 0) {
      return (
        <div className="min-h-screen wave-bg flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center max-w-2xl">
            <div className="text-8xl mb-6">⚠️</div>
            <h1 className="text-3xl font-bold text-white mb-4 font-fredoka">
              No Artifacts Available
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Please contact an administrator to seed the database with
              artifacts.
            </p>
            <Link href="/challenges">
              <Button className="bg-white/20 hover:bg-white/30 text-white text-xl px-8 py-6">
                Back to Challenges
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen wave-bg flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center max-w-2xl">
          <div className="text-8xl mb-6">🧪</div>
          <h1 className="text-5xl font-bold text-white mb-4 font-fredoka">
            Conservation Lab Simulation
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Learn proper artifact conservation techniques including damage
            assessment, process selection, and treatment planning.
          </p>
          <Button
            onClick={handleStartGame}
            className="bg-sand-400 hover:bg-sand-500 text-sand-900 text-xl px-8 py-6"
          >
            Enter Conservation Lab
          </Button>
          <Link href="/challenges">
            <Button className="ml-4 bg-white/20 hover:bg-white/30 text-white text-xl px-8 py-6">
              Back to Challenges
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen wave-bg flex items-center justify-center">
        <div className="text-white text-2xl">Loading lab...</div>
      </div>
    );
  }

  const gameData = JSON.parse(gameState.gameData);

  // Get available processes (this would come from the backend in a real implementation)
  const availableProcesses = [
    {
      id: "process_1",
      name: "Gentle Cleaning",
      category: "cleaning" as const,
      description: "Remove loose sediment and marine growth with soft brushes",
      duration: 2,
      isAppropriate: true,
    },
    {
      id: "process_2",
      name: "Chemical Bath",
      category: "cleaning" as const,
      description: "Soak in specialized cleaning solution",
      duration: 4,
      isAppropriate: true,
    },
    {
      id: "process_3",
      name: "Consolidation",
      category: "stabilization" as const,
      description: "Apply consolidant to strengthen fragile areas",
      duration: 3,
      isAppropriate: true,
    },
    {
      id: "process_5",
      name: "Protective Coating",
      category: "preservation" as const,
      description: "Apply protective coating to prevent future deterioration",
      duration: 1,
      isAppropriate: true,
    },
  ];

  return (
    <div className="min-h-screen wave-bg p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white font-fredoka">
                🧪 Conservation Lab
              </h1>
              <p className="text-white/80">{gameState.artifact.name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-sand-400">
                {gameState.session.currentScore} pts
              </div>
              <div className="text-white/60 text-sm">
                {gameState.session.completionPercentage}% Complete
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab("assessment")}
            className={
              activeTab === "assessment" ? "bg-ocean-600" : "bg-ocean-400"
            }
            disabled={
              !gameData.assessmentComplete && activeTab !== "assessment"
            }
          >
            🔍 Assessment
          </Button>
          <Button
            onClick={() => setActiveTab("processes")}
            className={
              activeTab === "processes" ? "bg-ocean-600" : "bg-ocean-400"
            }
            disabled={!gameData.assessmentComplete}
          >
            ⚙️ Processes
          </Button>
          <Button
            onClick={() => setActiveTab("treatment")}
            className={
              activeTab === "treatment" ? "bg-ocean-600" : "bg-ocean-400"
            }
            disabled={gameData.treatmentPlan.length === 0}
          >
            🔨 Treatment
          </Button>
        </div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === "assessment" && (
              <ConservationWorkbench
                artifactName={gameState.artifact.name}
                artifactImage={gameState.artifact.imageUrl}
                condition={gameData.condition}
                onAssessmentComplete={handleAssessmentComplete}
                assessmentComplete={gameData.assessmentComplete}
              />
            )}

            {activeTab === "processes" && (
              <ProcessSelector
                availableProcesses={availableProcesses}
                selectedProcesses={gameData.selectedProcesses}
                onSelectProcess={handleSelectProcess}
                onRemoveProcess={handleRemoveProcess}
                onValidateSelection={async () => {
                  if (!sessionId) return;
                  try {
                    const result = await validateSelection({ sessionId });
                    if (result.success) {
                      alert(
                        `✅ ${result.feedback}\n\n+${result.pointsEarned} points earned!`
                      );
                      setActiveTab("treatment");
                    } else {
                      alert(`❌ ${result.feedback}`);
                    }
                  } catch (error) {
                    console.error("Failed to validate selection:", error);
                  }
                }}
              />
            )}

            {activeTab === "treatment" && (
              <TreatmentPlanner
                selectedProcesses={gameData.selectedProcesses}
                treatmentPlan={gameData.treatmentPlan}
                onCreatePlan={handleCreatePlan}
                onExecuteStep={handleExecuteStep}
                planCreated={gameData.treatmentPlan.length > 0}
                artifactImage={gameState.artifact.imageUrl}
                artifactName={gameState.artifact.name}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Progress */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
              <h3 className="text-white font-bold mb-3">Lab Progress</h3>
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-2 ${
                    gameData.assessmentComplete
                      ? "text-green-400"
                      : "text-white/60"
                  }`}
                >
                  <span className="text-xl">
                    {gameData.assessmentComplete ? "✓" : "○"}
                  </span>
                  <span className="text-sm">Condition Assessment</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    gameData.selectedProcesses.length > 0
                      ? "text-green-400"
                      : "text-white/60"
                  }`}
                >
                  <span className="text-xl">
                    {gameData.selectedProcesses.length > 0 ? "✓" : "○"}
                  </span>
                  <span className="text-sm">Process Selection</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    gameData.treatmentPlan.length > 0
                      ? "text-green-400"
                      : "text-white/60"
                  }`}
                >
                  <span className="text-xl">
                    {gameData.treatmentPlan.length > 0 ? "✓" : "○"}
                  </span>
                  <span className="text-sm">Treatment Planning</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    gameData.completedSteps.length ===
                      gameData.treatmentPlan.length &&
                    gameData.treatmentPlan.length > 0
                      ? "text-green-400"
                      : "text-white/60"
                  }`}
                >
                  <span className="text-xl">
                    {gameData.completedSteps.length ===
                      gameData.treatmentPlan.length &&
                    gameData.treatmentPlan.length > 0
                      ? "✓"
                      : "○"}
                  </span>
                  <span className="text-sm">Treatment Execution</span>
                </div>
              </div>
            </div>

            {/* Complete Button */}
            {gameData.completedSteps.length === gameData.treatmentPlan.length &&
              gameData.treatmentPlan.length > 0 && (
                <Button
                  onClick={handleCompleteGame}
                  className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900 text-lg py-6"
                >
                  Complete Conservation
                </Button>
              )}

            {/* Mistakes */}
            {gameData.mistakes.length > 0 && (
              <div className="bg-red-500/20 border-2 border-red-400 rounded-lg p-4">
                <h4 className="text-red-400 font-semibold mb-2">
                  ⚠️ Mistakes ({gameData.mistakes.length})
                </h4>
                <div className="space-y-2">
                  {gameData.mistakes.map((mistake: any) => (
                    <div key={mistake.id} className="text-sm">
                      <p className="text-white/90">{mistake.description}</p>
                      <p className="text-red-300 text-xs">
                        {mistake.consequence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-ocean-900/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">
                💡 Conservation Tips:
              </h4>
              <ul className="text-white/80 text-xs space-y-1">
                <li>• Always assess damage thoroughly before treatment</li>
                <li>• Choose processes appropriate for the material type</li>
                <li>• Follow the correct sequence of conservation steps</li>
                <li>• Document all procedures and observations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConservationLabPage() {
  // Temporarily removed AuthGuard for testing
  return <ConservationLabGameContent />;
}
