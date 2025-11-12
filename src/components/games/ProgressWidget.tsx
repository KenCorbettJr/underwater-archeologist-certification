"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export function ProgressWidget() {
  const { user } = useUser();

  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Real-time subscription to overall progress
  const overallProgress = useQuery(
    api.progressTracking.getOverallProgress,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  if (!convexUser || !overallProgress) {
    return (
      <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 max-w-2xl mx-auto border border-white/30">
        <h2 className="text-3xl font-bold text-white mb-4 font-fredoka">
          Your Progress
        </h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-4xl">🌊</span>
          <div className="flex-1 bg-ocean-800 rounded-full h-4">
            <div className="bg-gradient-to-r from-sand-400 to-sand-500 h-4 rounded-full w-0"></div>
          </div>
          <span className="text-sand-300 font-bold">0%</span>
        </div>
        <p className="text-ocean-100 mb-6">
          Complete challenges to unlock your certification and join the ranks of
          junior underwater archaeologists!
        </p>
        <Link href="/challenges/progress">
          <Button className="bg-sand-400 hover:bg-sand-500 text-sand-900">
            View Detailed Progress
          </Button>
        </Link>
      </div>
    );
  }

  const completion = overallProgress.overallCompletion || 0;
  const getCertificationBadge = () => {
    switch (overallProgress.certificationStatus) {
      case "certified":
        return (
          <div className="flex items-center gap-2 text-green-300">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Certified!</span>
          </div>
        );
      case "eligible":
        return (
          <div className="flex items-center gap-2 text-blue-300">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">Ready for Certification</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 max-w-2xl mx-auto border border-white/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-white font-fredoka">
          Your Progress
        </h2>
        {getCertificationBadge()}
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-4xl">🌊</span>
        <div className="flex-1 bg-ocean-800 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sand-400 to-sand-500 h-4 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${completion}%` }}
          ></div>
        </div>
        <span className="text-sand-300 font-bold text-xl">
          {Math.round(completion)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-sand-300">
            {overallProgress.totalScore.toLocaleString()}
          </div>
          <div className="text-sm text-ocean-100">Total Points</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-sand-300">
            {Math.floor(overallProgress.totalGameTime / 60)}h{" "}
            {Math.round(overallProgress.totalGameTime % 60)}m
          </div>
          <div className="text-sm text-ocean-100">Time Spent</div>
        </div>
      </div>

      <p className="text-ocean-100 mb-6 text-center">
        {completion >= 85
          ? "You're ready for certification! 🎓"
          : completion >= 50
            ? "Great progress! Keep going! 💪"
            : "Complete challenges to unlock your certification! 🏆"}
      </p>

      <Link href="/challenges/progress">
        <Button className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900">
          View Detailed Progress
        </Button>
      </Link>
    </div>
  );
}
