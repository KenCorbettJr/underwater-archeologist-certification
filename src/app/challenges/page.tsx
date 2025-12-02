"use client";

import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ProgressWidget } from "@/components/games/ProgressWidget";
import { UserProfileCard } from "@/components/games/UserProfileCard";

function ChallengesPageContent() {
  return (
    <div className="min-h-screen wave-bg relative overflow-hidden font-poppins">
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center backdrop-blur-sm bg-white/5 border-b border-white/10">
        <Link
          href="/"
          className="text-white font-bold text-xl md:text-2xl flex items-center gap-3 font-fredoka"
        >
          <div className="relative">
            <span className="text-3xl drop-shadow-lg">🏛️</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-sand-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-sand-300 via-sand-400 to-sand-500 bg-clip-text text-transparent leading-tight">
              Tidal Explorers
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-white/70 hover:text-white text-sm transition-colors"
          >
            Admin
          </Link>
          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 font-fredoka">
            Your{" "}
            <span className="bg-gradient-to-r from-sand-200 via-sand-400 to-sand-600 bg-clip-text text-transparent">
              Challenges
            </span>
          </h1>
          <p className="text-xl text-ocean-50 max-w-3xl mx-auto">
            🤿 Complete these interactive challenges to become a certified
            junior underwater archaeologist! 🏆
          </p>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {/* Challenge 1 */}
          <Link href="/challenges/artifact-game" className="group">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 text-white border border-white/30 shadow-2xl hover:shadow-3xl hover:from-white/25 hover:to-white/15 transition-all duration-300 transform hover:-translate-y-2 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="text-6xl group-hover:scale-110 transition-transform">
                  🏺
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-400/30">
                    ⭐ Beginner
                  </span>
                  <span className="text-xs text-sand-300">5 Levels</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-sand-200 font-fredoka">
                Artifact Identification
              </h3>
              <p className="text-ocean-50 mb-6">
                Learn to identify and catalog ancient pottery, tools, and
                treasures found underwater.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sand-300 text-sm">🎯 5 Modules</span>
                <Button className="bg-sand-400 hover:bg-sand-500 text-sand-900 group-hover:scale-105 transition-transform">
                  Start Challenge
                </Button>
              </div>
            </div>
          </Link>

          {/* Challenge 2 */}
          <Link href="/challenges/site-documentation" className="group">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 text-white border border-white/30 shadow-2xl hover:shadow-3xl hover:from-white/25 hover:to-white/15 transition-all duration-300 transform hover:-translate-y-2 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="text-6xl group-hover:scale-110 transition-transform">
                  📏
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full border border-yellow-400/30">
                    ⭐⭐ Intermediate
                  </span>
                  <span className="text-xs text-sand-300">3 Levels</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-sand-200 font-fredoka">
                Site Documentation
              </h3>
              <p className="text-ocean-50 mb-6">
                Master the techniques for measuring, photographing, and
                documenting archaeological sites.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sand-300 text-sm">🎯 3 Modules</span>
                <Button className="bg-sand-400 hover:bg-sand-500 text-sand-900 group-hover:scale-105 transition-transform">
                  Start Challenge
                </Button>
              </div>
            </div>
          </Link>

          {/* Challenge 3 */}
          <Link href="/challenges/excavation-simulation" className="group">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 text-white border border-white/30 shadow-2xl hover:shadow-3xl hover:from-white/25 hover:to-white/15 transition-all duration-300 transform hover:-translate-y-2 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="text-6xl group-hover:scale-110 transition-transform">
                  🤿
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full border border-yellow-400/30">
                    ⭐⭐ Intermediate
                  </span>
                  <span className="text-xs text-sand-300">4 Levels</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-sand-200 font-fredoka">
                Underwater Excavation
              </h3>
              <p className="text-ocean-50 mb-6">
                Practice safe underwater excavation techniques used by
                professional archaeologists.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sand-300 text-sm">
                  🎯 Interactive Simulation
                </span>
                <Button className="bg-sand-400 hover:bg-sand-500 text-sand-900 group-hover:scale-105 transition-transform">
                  Start Challenge
                </Button>
              </div>
            </div>
          </Link>

          {/* Challenge 4 */}
          <Link href="/challenges/conservation-lab" className="group">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 text-white border border-white/30 shadow-2xl hover:shadow-3xl hover:from-white/25 hover:to-white/15 transition-all duration-300 transform hover:-translate-y-2 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="text-6xl group-hover:scale-110 transition-transform">
                  🧪
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full border border-orange-400/30">
                    ⭐⭐⭐ Advanced
                  </span>
                  <span className="text-xs text-sand-300">2 Levels</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-sand-200 font-fredoka">
                Artifact Conservation
              </h3>
              <p className="text-ocean-50 mb-6">
                Learn how to properly clean, preserve, and store underwater
                archaeological finds.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sand-300 text-sm">🎯 2 Modules</span>
                <Button className="bg-sand-400 hover:bg-sand-500 text-sand-900 group-hover:scale-105 transition-transform">
                  Start Challenge
                </Button>
              </div>
            </div>
          </Link>

          {/* Challenge 5 */}
          <Link href="/challenges/historical-timeline" className="group">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 text-white border border-white/30 shadow-2xl hover:shadow-3xl hover:from-white/25 hover:to-white/15 transition-all duration-300 transform hover:-translate-y-2 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="text-6xl group-hover:scale-110 transition-transform">
                  📚
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-400/30">
                    ⭐ Beginner
                  </span>
                  <span className="text-xs text-sand-300">3 Levels</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-sand-200 font-fredoka">
                Historical Timeline
              </h3>
              <p className="text-ocean-50 mb-6">
                Discover how to research historical contexts and interpret
                archaeological findings.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sand-300 text-sm">🎯 3 Modules</span>
                <Button className="bg-sand-400 hover:bg-sand-500 text-sand-900 group-hover:scale-105 transition-transform">
                  Start Challenge
                </Button>
              </div>
            </div>
          </Link>

          {/* Final Challenge */}
          <Link href="/challenges/progress" className="group">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-md rounded-3xl p-8 text-white border border-yellow-400/30 shadow-2xl hover:shadow-3xl hover:from-yellow-500/25 hover:to-yellow-600/15 transition-all duration-300 transform hover:-translate-y-2 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="text-6xl group-hover:scale-110 transition-transform">
                  🏆
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-400/30">
                    🎓 Certification
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-200 font-fredoka">
                View Progress & Certify
              </h3>
              <p className="text-ocean-50 mb-6">
                Track your progress and take the final assessment to earn your
                junior underwater archaeologist certificate!
              </p>
              <div className="flex items-center justify-between">
                <span className="text-yellow-300 text-sm">
                  🎯 Track & Certify
                </span>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 group-hover:scale-105 transition-transform">
                  View Progress
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Progress Section */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-7xl mx-auto">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 font-fredoka text-center">
              Your Profile
            </h2>
            <UserProfileCard />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 font-fredoka text-center">
              Overall Progress
            </h2>
            <ProgressWidget />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChallengesPage() {
  return (
    <AuthGuard>
      <ChallengesPageContent />
    </AuthGuard>
  );
}
