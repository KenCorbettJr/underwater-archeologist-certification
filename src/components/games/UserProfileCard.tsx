"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Trophy, Star, Clock, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export function UserProfileCard() {
  const { user } = useUser();
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const overallProgress = useQuery(
    api.progressTracking.getOverallProgress,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  if (!user || !convexUser) {
    return null;
  }

  const certificationStatusLabels = {
    not_eligible: "Beginner",
    eligible: "Ready for Certification",
    certified: "Certified Junior Archaeologist",
  };

  const certificationStatusColors = {
    not_eligible: "text-blue-300",
    eligible: "text-yellow-300",
    certified: "text-green-300",
  };

  const certificationStatus =
    overallProgress?.certificationStatus || "not_eligible";

  return (
    <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-xl">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sand-400 to-sand-600 flex items-center justify-center text-2xl font-bold text-white">
          {user.firstName?.[0] ||
            user.emailAddresses[0]?.emailAddress[0] ||
            "U"}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white font-fredoka">
            {user.firstName || "Student"} {user.lastName || ""}
          </h3>
          <p className="text-sm text-ocean-200">
            {user.emailAddresses[0]?.emailAddress}
          </p>
          <div
            className={`text-sm font-medium mt-1 ${certificationStatusColors[certificationStatus]}`}
          >
            {certificationStatusLabels[certificationStatus]}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sand-300 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xs">Progress</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(overallProgress?.overallCompletion || 0)}%
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sand-300 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-xs">Points</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {overallProgress?.totalScore || 0}
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sand-300 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Time</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round((overallProgress?.totalGameTime || 0) / 60)}m
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sand-300 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs">Level</span>
          </div>
          <div className="text-2xl font-bold text-white capitalize">
            {convexUser.certificationLevel}
          </div>
        </div>
      </div>

      <Link href="/challenges/progress" className="block">
        <Button className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900">
          View Full Progress
        </Button>
      </Link>
    </div>
  );
}
