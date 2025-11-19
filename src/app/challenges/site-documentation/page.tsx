"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { SiteMapper } from "@/components/games/SiteMapper";
import { ReportBuilder } from "@/components/games/ReportBuilder";
import { ValidationChecker } from "@/components/games/ValidationChecker";
import Link from "next/link";

function SiteDocumentationGameContent() {
  const { user } = useUser();
  const [sessionId, setSessionId] = useState<Id<"gameSessions"> | null>(null);
  const [activeTab, setActiveTab] = useState<
    "mapping" | "report" | "validation"
  >("mapping");

  const startGame = useMutation(
    api.siteDocumentationGame.startSiteDocumentationGame
  );
  const addPhoto = useMutation(api.siteDocumentationGame.addPhoto);
  const addMeasurement = useMutation(api.siteDocumentationGame.addMeasurement);
  const updateSection = useMutation(
    api.siteDocumentationGame.updateReportSection
  );
  const completeGame = useMutation(
    api.siteDocumentationGame.completeSiteDocumentationGame
  );

  const gameState = useQuery(
    api.siteDocumentationGame.getSiteDocumentationGame,
    sessionId ? { sessionId } : "skip"
  );

  const handleStartGame = async () => {
    if (!user) return;

    try {
      // For demo, we'll need to get or create a site first
      // In production, you'd have a site selection UI
      const newSessionId = await startGame({
        userId: user.id as Id<"users">,
        siteId: "demo_site" as Id<"excavationSites">, // This would come from site selection
        difficulty: "beginner",
      });
      setSessionId(newSessionId);
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  const handlePhotoTaken = async (
    position: { x: number; y: number },
    angle: string,
    hasScale: boolean,
    hasNorthArrow: boolean
  ) => {
    if (!sessionId) return;
    try {
      const result = await addPhoto({
        sessionId,
        gridPosition: position,
        angle,
        hasScale,
        hasNorthArrow,
      });
      console.log("Photo result:", result);
    } catch (error) {
      console.error("Failed to add photo:", error);
    }
  };

  const handleMeasurementTaken = async (
    position: { x: number; y: number },
    type: string,
    value: number,
    unit: string
  ) => {
    if (!sessionId) return;
    try {
      const result = await addMeasurement({
        sessionId,
        gridPosition: position,
        measurementType: type as any,
        value,
        unit,
      });
      console.log("Measurement result:", result);
    } catch (error) {
      console.error("Failed to add measurement:", error);
    }
  };

  const handleSectionUpdate = async (sectionType: string, content: string) => {
    if (!sessionId) return;
    try {
      const result = await updateSection({
        sessionId,
        sectionType: sectionType as any,
        content,
      });
      console.log("Section update result:", result);
    } catch (error) {
      console.error("Failed to update section:", error);
    }
  };

  const handleCompleteGame = async () => {
    if (!sessionId) return;
    try {
      const result = await completeGame({ sessionId });
      if (result.success) {
        alert(`Game completed! Final score: ${result.finalScore}`);
      } else {
        alert(`Not ready to complete:\n${result.feedback.join("\n")}`);
      }
    } catch (error) {
      console.error("Failed to complete game:", error);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen wave-bg flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center max-w-2xl">
          <div className="text-8xl mb-6">📏</div>
          <h1 className="text-5xl font-bold text-white mb-4 font-fredoka">
            Site Documentation Game
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Learn proper archaeological site documentation techniques including
            photography, measurements, and report writing.
          </p>
          <Button
            onClick={handleStartGame}
            className="bg-sand-400 hover:bg-sand-500 text-sand-900 text-xl px-8 py-6"
          >
            Start Documentation Challenge
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
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    );
  }

  const gameData = JSON.parse(gameState.gameData);

  return (
    <div className="min-h-screen wave-bg p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white font-fredoka">
                📏 Site Documentation
              </h1>
              <p className="text-white/80">{gameState.site.name}</p>
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
            onClick={() => setActiveTab("mapping")}
            className={
              activeTab === "mapping" ? "bg-ocean-600" : "bg-ocean-400"
            }
          >
            🗺️ Site Mapping
          </Button>
          <Button
            onClick={() => setActiveTab("report")}
            className={activeTab === "report" ? "bg-ocean-600" : "bg-ocean-400"}
          >
            📝 Report Writing
          </Button>
          <Button
            onClick={() => setActiveTab("validation")}
            className={
              activeTab === "validation" ? "bg-ocean-600" : "bg-ocean-400"
            }
          >
            ✅ Validation
          </Button>
        </div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === "mapping" && (
              <SiteMapper
                gridWidth={gameState.site.gridWidth}
                gridHeight={gameState.site.gridHeight}
                onPhotoTaken={handlePhotoTaken}
                onMeasurementTaken={handleMeasurementTaken}
                photosTaken={gameData.photosTaken}
                measurements={gameData.measurements}
              />
            )}

            {activeTab === "report" && (
              <ReportBuilder
                sections={gameData.reportSections}
                onSectionUpdate={handleSectionUpdate}
              />
            )}

            {activeTab === "validation" && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Final Validation
                </h2>
                <p className="text-white/80 mb-6">
                  Review your documentation and ensure all requirements are met
                  before submitting your site report.
                </p>
                <Button
                  onClick={handleCompleteGame}
                  className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900 text-xl py-6"
                >
                  Submit Site Report
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <ValidationChecker
              errors={gameData.validationErrors}
              photoCount={gameData.photosTaken.length}
              measurementCount={gameData.measurements.length}
              completedSections={
                gameData.reportSections.filter((s: any) => s.isComplete).length
              }
              totalSections={gameData.reportSections.length}
              completionPercentage={gameData.completionPercentage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SiteDocumentationPage() {
  return (
    <AuthGuard>
      <SiteDocumentationGameContent />
    </AuthGuard>
  );
}
