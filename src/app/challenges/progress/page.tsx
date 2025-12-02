"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ProgressDashboard } from "@/components/games/ProgressDashboard";
import {
  AchievementGrid,
  NewAchievementNotification,
} from "@/components/games/AchievementBadge";
import { PerformanceAnalytics } from "@/components/games/PerformanceAnalytics";
import { ProgressSyncManager } from "@/components/games/ProgressSyncManager";
import { ProgressTrends } from "@/components/games/ProgressTrends";
import { ProgressTracker } from "@/lib/progressTracker";
import { GameType, GameProgress, Achievement } from "@/types";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function ProgressPageContent() {
  const { user } = useUser();
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [progressTracker] = useState(() => new ProgressTracker());

  const createUser = useMutation(api.users.createUser);

  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Auto-create user if they don't exist in the database
  useEffect(() => {
    if (user && convexUser === null) {
      createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "Student",
      }).catch((error) => {
        console.error("Failed to create user:", error);
      });
    }
  }, [user, convexUser, createUser]);

  // Real-time subscriptions to progress data
  const overallProgress = useQuery(
    api.progressTracking.getOverallProgress,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const gameProgressData = useQuery(
    api.progressTracking.getGameProgress,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const gameSessions = useQuery(
    api.progressTracking.getUserGameSessions,
    convexUser?._id ? { userId: convexUser._id, status: "completed" } : "skip"
  );

  // Calculate real-time progress using the progress tracker
  const calculatedProgress = React.useMemo(() => {
    if (!convexUser || !gameSessions) return null;

    return progressTracker.calculateProgress(
      convexUser._id,
      gameSessions,
      undefined
    );
  }, [convexUser, gameSessions, progressTracker]);

  // Check for new achievements
  useEffect(() => {
    if (calculatedProgress && calculatedProgress.newAchievements.length > 0) {
      setNewAchievements((prev) => [
        ...prev,
        ...calculatedProgress.newAchievements,
      ]);
    }
  }, [calculatedProgress]);

  const handleCloseAchievement = (achievementId: string) => {
    setNewAchievements((prev) => prev.filter((a) => a.id !== achievementId));
  };

  // Build game progress object from database
  const gameProgress: Record<GameType, GameProgress> = React.useMemo(() => {
    const defaultProgress: Record<GameType, GameProgress> = {
      artifact_identification: {
        completedLevels: 0,
        totalLevels: 5,
        bestScore: 0,
        averageScore: 0,
        timeSpent: 0,
        lastPlayed: new Date(0),
        achievements: [],
      },
      excavation_simulation: {
        completedLevels: 0,
        totalLevels: 4,
        bestScore: 0,
        averageScore: 0,
        timeSpent: 0,
        lastPlayed: new Date(0),
        achievements: [],
      },
      site_documentation: {
        completedLevels: 0,
        totalLevels: 3,
        bestScore: 0,
        averageScore: 0,
        timeSpent: 0,
        lastPlayed: new Date(0),
        achievements: [],
      },
      historical_timeline: {
        completedLevels: 0,
        totalLevels: 3,
        bestScore: 0,
        averageScore: 0,
        timeSpent: 0,
        lastPlayed: new Date(0),
        achievements: [],
      },
      conservation_lab: {
        completedLevels: 0,
        totalLevels: 2,
        bestScore: 0,
        averageScore: 0,
        timeSpent: 0,
        lastPlayed: new Date(0),
        achievements: [],
      },
    };

    if (!gameProgressData) return defaultProgress;

    gameProgressData.forEach((progress) => {
      defaultProgress[progress.gameType] = {
        completedLevels: progress.completedLevels,
        totalLevels: progress.totalLevels,
        bestScore: progress.bestScore,
        averageScore: progress.averageScore,
        timeSpent: progress.timeSpent,
        lastPlayed: new Date(progress.lastPlayed),
        achievements: progress.achievements.map((a) => JSON.parse(a)),
      };
    });

    return defaultProgress;
  }, [gameProgressData]);

  // Collect all achievements
  const allAchievements = React.useMemo(() => {
    const achievements: Achievement[] = [];
    Object.values(gameProgress).forEach((progress) => {
      achievements.push(...progress.achievements);
    });
    return achievements.sort(
      (a, b) => b.earnedDate.getTime() - a.earnedDate.getTime()
    );
  }, [gameProgress]);

  if (!user || !convexUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen wave-bg relative overflow-hidden font-poppins">
      {/* Achievement Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {newAchievements.map((achievement) => (
          <NewAchievementNotification
            key={achievement.id}
            achievement={achievement}
            onClose={() => handleCloseAchievement(achievement.id)}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center backdrop-blur-sm bg-white/5 border-b border-white/10">
        <Link
          href="/challenges"
          className="text-white font-bold text-xl md:text-2xl flex items-center gap-3 font-fredoka"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>Back to Challenges</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Progress Dashboard */}
          <ProgressDashboard
            overallCompletion={
              calculatedProgress?.overallCompletion ||
              overallProgress?.overallCompletion ||
              0
            }
            gameProgress={gameProgress}
            certificationStatus={
              calculatedProgress?.certificationStatus ||
              overallProgress?.certificationStatus ||
              "not_eligible"
            }
            totalGameTime={overallProgress?.totalGameTime || 0}
            totalScore={overallProgress?.totalScore || 0}
            recommendations={calculatedProgress?.recommendations || []}
          />

          {/* Performance Analytics */}
          <PerformanceAnalytics gameProgress={gameProgress} />

          {/* Progress Trends */}
          <ProgressTrends userId={convexUser._id} days={30} />

          {/* Progress Sync Manager */}
          <ProgressSyncManager userId={convexUser._id} />

          {/* Achievements */}
          <AchievementGrid achievements={allAchievements} />

          {/* Call to Action */}
          {calculatedProgress?.certificationStatus === "eligible" && (
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-8 border-2 border-green-400 text-center">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                You're Ready for Certification!
              </h3>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Congratulations! You've met all the requirements to become a
                certified junior underwater archaeologist. Take the final
                assessment to earn your certificate.
              </p>
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
                Take Certification Exam
              </Button>
            </div>
          )}

          {/* Back to Challenges */}
          <div className="text-center">
            <Link href="/challenges">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                Continue Learning
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProgressPage() {
  // Temporarily removed AuthGuard for testing
  return <ProgressPageContent />;
}
