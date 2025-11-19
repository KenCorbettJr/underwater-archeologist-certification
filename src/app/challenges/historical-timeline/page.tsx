"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { TimelineInterface } from "@/components/games/TimelineInterface";
import { ContextCards } from "@/components/games/ContextCards";
import { CultureMatcher } from "@/components/games/CultureMatcher";
import Link from "next/link";

function HistoricalTimelineGameContent() {
  const { user } = useUser();
  const [sessionId, setSessionId] = useState<Id<"gameSessions"> | null>(null);
  const [activeTab, setActiveTab] = useState<
    "timeline" | "context" | "matching"
  >("timeline");
  const [feedback, setFeedback] = useState<string[]>([]);

  const startGame = useMutation(
    api.historicalTimelineGame.startHistoricalTimelineGame
  );
  const placeEvent = useMutation(api.historicalTimelineGame.placeEvent);
  const reorderEvents = useMutation(api.historicalTimelineGame.reorderEvents);
  const checkOrder = useMutation(api.historicalTimelineGame.checkTimelineOrder);
  const submitMatch = useMutation(
    api.historicalTimelineGame.submitCultureMatch
  );
  const completeGame = useMutation(
    api.historicalTimelineGame.completeHistoricalTimelineGame
  );

  const gameState = useQuery(
    api.historicalTimelineGame.getHistoricalTimelineGame,
    sessionId ? { sessionId } : "skip"
  );

  const handleStartGame = async () => {
    if (!user) return;

    try {
      const newSessionId = await startGame({
        userId: user.id as Id<"users">,
        difficulty: "beginner",
      });
      setSessionId(newSessionId);
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  const handlePlaceEvent = async (eventId: string, position: number) => {
    if (!sessionId) return;
    try {
      await placeEvent({ sessionId, eventId, position });
    } catch (error) {
      console.error("Failed to place event:", error);
    }
  };

  const handleReorder = async (newOrder: string[]) => {
    if (!sessionId) return;
    try {
      await reorderEvents({ sessionId, newOrder });
    } catch (error) {
      console.error("Failed to reorder events:", error);
    }
  };

  const handleCheckOrder = async () => {
    if (!sessionId) return;
    try {
      const result = await checkOrder({ sessionId });
      setFeedback([
        `Correct: ${result.correctCount} / ${result.totalCount}`,
        `Score: +${result.score} points`,
        ...result.feedback,
      ]);
    } catch (error) {
      console.error("Failed to check order:", error);
    }
  };

  const handleSubmitMatch = async (
    artifactId: Id<"gameArtifacts">,
    culture: string
  ) => {
    if (!sessionId) return;
    try {
      const result = await submitMatch({
        sessionId,
        artifactId,
        selectedCulture: culture,
      });
      console.log("Match result:", result);
    } catch (error) {
      console.error("Failed to submit match:", error);
    }
  };

  const handleCompleteGame = async () => {
    if (!sessionId) return;
    try {
      const result = await completeGame({ sessionId });
      alert(
        `Game completed!\nFinal Score: ${result.finalScore}\nAccuracy: ${result.accuracy}%`
      );
    } catch (error) {
      console.error("Failed to complete game:", error);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen wave-bg flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center max-w-2xl">
          <div className="text-8xl mb-6">⏳</div>
          <h1 className="text-5xl font-bold text-white mb-4 font-fredoka">
            Historical Timeline Challenge
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Arrange historical events in chronological order and match artifacts
            to their cultures to test your knowledge of underwater archaeology
            history.
          </p>
          <Button
            onClick={handleStartGame}
            className="bg-sand-400 hover:bg-sand-500 text-sand-900 text-xl px-8 py-6"
          >
            Start Timeline Challenge
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
                ⏳ Historical Timeline Challenge
              </h1>
              <p className="text-white/80">
                Arrange events chronologically and match artifacts to cultures
              </p>
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

        {/* Feedback Display */}
        {feedback.length > 0 && (
          <div className="bg-ocean-600/30 backdrop-blur-md rounded-lg p-4 mb-6">
            <h3 className="text-white font-bold mb-2">Results:</h3>
            <div className="space-y-1">
              {feedback.map((msg, index) => (
                <p key={index} className="text-white/80 text-sm">
                  {msg}
                </p>
              ))}
            </div>
            <Button
              onClick={() => setFeedback([])}
              className="mt-3 bg-white/20 hover:bg-white/30 text-white text-sm"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab("timeline")}
            className={
              activeTab === "timeline" ? "bg-ocean-600" : "bg-ocean-400"
            }
          >
            ⏳ Timeline
          </Button>
          <Button
            onClick={() => setActiveTab("context")}
            className={
              activeTab === "context" ? "bg-ocean-600" : "bg-ocean-400"
            }
          >
            📖 Context
          </Button>
          <Button
            onClick={() => setActiveTab("matching")}
            className={
              activeTab === "matching" ? "bg-ocean-600" : "bg-ocean-400"
            }
          >
            🎯 Culture Matching
          </Button>
        </div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === "timeline" && (
              <TimelineInterface
                events={gameData.events}
                userOrder={gameData.userOrder}
                onPlaceEvent={handlePlaceEvent}
                onReorder={handleReorder}
                onCheckOrder={handleCheckOrder}
              />
            )}

            {activeTab === "context" && <ContextCards />}

            {activeTab === "matching" && (
              <CultureMatcher
                artifacts={[]}
                matches={gameData.matches}
                onSubmitMatch={handleSubmitMatch}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Progress */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
              <h3 className="text-white font-bold mb-3">Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Events Placed:</span>
                  <span className="text-white font-semibold">
                    {gameData.userOrder.length} / {gameData.events.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Culture Matches:</span>
                  <span className="text-white font-semibold">
                    {gameData.matches.filter((m: any) => m.isCorrect).length} /{" "}
                    {gameData.matches.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Complete Button */}
            <Button
              onClick={handleCompleteGame}
              className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900 text-lg py-6"
            >
              Complete Challenge
            </Button>

            {/* Tips */}
            <div className="bg-ocean-900/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">💡 Tips:</h4>
              <ul className="text-white/80 text-xs space-y-1">
                <li>• Use BCE (Before Common Era) and CE (Common Era) dates</li>
                <li>• Earlier dates (larger BCE numbers) come first</li>
                <li>• Read the context cards for historical background</li>
                <li>• Consider trade routes and cultural connections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoricalTimelinePage() {
  return (
    <AuthGuard>
      <HistoricalTimelineGameContent />
    </AuthGuard>
  );
}
