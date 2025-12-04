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
  const createUser = useMutation(api.users.createUser);

  // Fetch available sites
  const sites = useQuery(
    api.adminExcavationSites.getAllExcavationSitesForAdmin,
    {
      includeInactive: false,
    }
  );

  // Get Convex user from Clerk ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const gameState = useQuery(
    api.siteDocumentationGame.getSiteDocumentationGame,
    sessionId ? { sessionId } : "skip"
  );

  const handleStartGame = async () => {
    if (!user || !sites || sites.length === 0) return;

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

      // Use the first available site
      const newSessionId = await startGame({
        userId: userId,
        siteId: sites[0]._id,
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
        // 70% minimum for site documentation
        const passed = result.finalScore >= 70;
        alert(
          `${passed ? "🏆" : "😢"} Game completed! Final score: ${result.finalScore}${!passed ? "\nKeep practicing to improve your score!" : ""}`
        );
      } else {
        alert(`Not ready to complete:\n${result.feedback.join("\n")}`);
      }
    } catch (error) {
      console.error("Failed to complete game:", error);
    }
  };

  if (!sessionId) {
    if (!sites) {
      return (
        <div className="min-h-screen wave-bg flex items-center justify-center">
          <div className="text-white text-2xl">Loading...</div>
        </div>
      );
    }

    if (sites.length === 0) {
      return (
        <div className="min-h-screen wave-bg flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center max-w-2xl">
            <div className="text-8xl mb-6">⚠️</div>
            <h1 className="text-3xl font-bold text-white mb-4 font-fredoka">
              No Sites Available
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Please contact an administrator to seed the database with
              excavation sites.
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
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 max-w-3xl">
          <div className="text-8xl mb-6 text-center">📏</div>
          <h1 className="text-5xl font-bold text-white mb-4 font-fredoka text-center">
            Site Documentation Game
          </h1>
          <p className="text-xl text-white/80 mb-8 text-center">
            Learn proper archaeological site documentation techniques including
            photography, measurements, and report writing.
          </p>

          {/* Game Instructions */}
          <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-2xl font-bold text-white mb-4 font-fredoka">
              📋 What You'll Do:
            </h2>
            <div className="space-y-4 text-white/90">
              <div className="flex gap-3">
                <span className="text-2xl">🗺️</span>
                <div>
                  <strong className="text-white">Site Mapping:</strong> Take
                  photos of the excavation site from different angles. Remember
                  to include scale bars and north arrows for accurate
                  documentation.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">📐</span>
                <div>
                  <strong className="text-white">Measurements:</strong> Record
                  precise measurements of artifacts and features using the
                  proper tools and units.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <strong className="text-white">Report Writing:</strong>{" "}
                  Complete all sections of the site report including site
                  description, methodology, findings, and conclusions.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <strong className="text-white">Validation:</strong> Review
                  your work to ensure all documentation requirements are met
                  before submitting your final report.
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleStartGame}
              className="bg-sand-400 hover:bg-sand-500 text-sand-900 text-xl px-8 py-6"
            >
              Start Documentation Challenge
            </Button>
            <Link href="/challenges">
              <Button className="bg-white/20 hover:bg-white/30 text-white text-xl px-8 py-6">
                Back to Challenges
              </Button>
            </Link>
          </div>
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
                sessionId={sessionId}
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
  // Temporarily removed AuthGuard for testing
  return <SiteDocumentationGameContent />;
}
