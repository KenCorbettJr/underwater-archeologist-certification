"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const { isSignedIn, user } = useUser();

  return (
    <div
      className="min-h-screen wave-bg relative overflow-hidden font-poppins"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 50, 100, 0.7), rgba(0, 30, 60, 0.8)), url('/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Enhanced animated bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="bubble w-4 h-4 animate-pulse"></div>
        <div className="bubble w-6 h-6"></div>
        <div className="bubble w-3 h-3 animate-bounce"></div>
        <div className="bubble w-5 h-5"></div>
        <div className="bubble w-4 h-4"></div>
        <div className="bubble w-2 h-2"></div>
        <div className="bubble w-7 h-7"></div>
        <div className="bubble w-3 h-3"></div>
      </div>

      {/* Floating sea creatures and elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-2xl opacity-30 animate-bounce">
          🐠
        </div>
        <div className="absolute top-1/3 right-1/4 text-xl opacity-40 animate-pulse">
          🐙
        </div>
        <div className="absolute bottom-1/3 left-1/3 text-lg opacity-20 animate-bounce">
          🦑
        </div>
        <div className="absolute top-2/3 right-1/3 text-2xl opacity-35 animate-ping">
          ⭐
        </div>
        <div className="absolute top-1/2 left-1/6 text-sm opacity-25 animate-pulse">
          🪸
        </div>
        <div className="absolute bottom-1/4 right-1/6 text-lg opacity-30 animate-bounce">
          🐚
        </div>
        <div className="absolute top-3/4 left-2/3 text-xl opacity-20 animate-pulse">
          🌊
        </div>
        <div className="absolute top-1/6 right-1/2 text-sm opacity-40 animate-ping">
          ✨
        </div>

        {/* Additional sea life near the bottom for shipwreck atmosphere */}
        <div
          className="absolute bottom-1/6 left-1/5 text-lg opacity-25 animate-pulse"
          style={{ animationDelay: "4s" }}
        >
          🦀
        </div>
        <div
          className="absolute bottom-1/5 right-1/5 text-sm opacity-20 animate-bounce"
          style={{ animationDelay: "1.5s" }}
        >
          🐟
        </div>
        <div
          className="absolute bottom-1/4 left-3/4 text-base opacity-15 animate-pulse"
          style={{ animationDelay: "3.5s" }}
        >
          🌿
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/30 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white/20 rounded-full animate-bounce"></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white/35 rounded-full animate-ping"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="text-white font-bold text-xl md:text-2xl flex items-center gap-3 font-fredoka">
          <div className="relative">
            <span className="text-3xl drop-shadow-lg">🏛️</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-sand-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-sand-300 via-sand-400 to-sand-500 bg-clip-text text-transparent leading-tight">
              Tidal Explorers
            </span>
            <span className="text-xs text-ocean-200 font-normal hidden sm:block">
              🌊 Dive Deep, Discover History
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-white/80 text-sm">
            <span className="animate-pulse">🎓</span>
            <span>Learn • Explore • Certify</span>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] text-center px-6">
        <div className="max-w-5xl mx-auto">
          {/* Main heading with enhanced styling */}
          <div className="mb-12 relative">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce opacity-60">
              🌊
            </div>
            <h1 className="text-6xl md:text-9xl font-black text-white mb-2 simple-wave drop-shadow-2xl font-fredoka tracking-tight">
              Dive Into
            </h1>
            <h1 className="text-6xl md:text-9xl font-black simple-wave drop-shadow-2xl font-fredoka tracking-tight">
              <span className="bg-gradient-to-r from-sand-200 via-sand-400 to-sand-600 bg-clip-text text-transparent">
                History
              </span>
            </h1>
            <div className="flex justify-center items-center gap-4 mt-4">
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-sand-400 to-transparent rounded-full"></div>
              <span className="text-2xl animate-spin">⚓</span>
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-sand-400 to-transparent rounded-full"></div>
            </div>
          </div>

          <div className="relative mb-12">
            <p className="text-xl md:text-2xl text-ocean-50 mb-6 max-w-4xl mx-auto leading-relaxed drop-shadow-lg font-medium">
              🏺 Explore ancient underwater civilizations, master archaeological
              techniques, and become a{" "}
              <span className="text-sand-300 font-bold">
                certified junior underwater archaeologist
              </span>{" "}
              through interactive challenges! 🤿
            </p>
            <div className="flex justify-center items-center gap-6 text-ocean-200 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span>Interactive Learning</span>
              </div>
              <div className="w-1 h-1 bg-ocean-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <span>Real Certification</span>
              </div>
              <div className="w-1 h-1 bg-ocean-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🌊</span>
                <span>Ages 10-16</span>
              </div>
            </div>
          </div>

          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            {isSignedIn ? (
              // Show dashboard/challenges button for signed-in users
              <>
                <Link href="/challenges">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-sand-400 to-sand-500 hover:from-sand-500 hover:to-sand-600 text-sand-900 font-bold px-10 py-5 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    🚀 Continue Your Journey
                  </Button>
                </Link>
                <div className="text-ocean-100 text-center">
                  <p className="text-lg">
                    Welcome back, {user?.firstName || "Explorer"}! 🌊
                  </p>
                  <p className="text-sm opacity-80">
                    Ready to dive deeper into underwater archaeology?
                  </p>
                </div>
              </>
            ) : (
              // Show sign up/in buttons for non-authenticated users
              <>
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-sand-400 to-sand-500 hover:from-sand-500 hover:to-sand-600 text-sand-900 font-bold px-10 py-5 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    🚀 Start Your Journey
                  </Button>
                </SignUpButton>

                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-white text-white hover:bg-white hover:text-ocean-700 px-10 py-5 text-lg rounded-full backdrop-blur-sm bg-white/10 shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    📚 Continue Learning
                  </Button>
                </SignInButton>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="group bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 text-white border border-white/30 shadow-2xl hover:shadow-3xl hover:from-white/25 hover:to-white/15 transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1">
            <div className="relative mb-6">
              <div className="text-6xl group-hover:animate-bounce filter drop-shadow-lg">
                🏺
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-sand-400 rounded-full animate-pulse opacity-70"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-sand-200 font-fredoka">
              Discover Artifacts
            </h3>
            <p className="text-ocean-50 leading-relaxed mb-4">
              Uncover ancient pottery, tools, and treasures hidden beneath the
              waves. Learn to identify and catalog historical finds.
            </p>
            <div className="flex items-center gap-2 text-sand-300 text-sm">
              <span>🔍</span>
              <span>5 Interactive Modules</span>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 text-white border border-white/30 shadow-2xl hover:shadow-3xl hover:from-white/25 hover:to-white/15 transition-all duration-500 transform hover:-translate-y-3 hover:-rotate-1">
            <div className="relative mb-6">
              <div className="text-6xl group-hover:animate-bounce filter drop-shadow-lg">
                🤿
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-ocean-400 rounded-full animate-pulse opacity-70"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-sand-200 font-fredoka">
              Master Techniques
            </h3>
            <p className="text-ocean-50 leading-relaxed mb-4">
              Practice underwater excavation, documentation, and conservation
              methods used by professional archaeologists.
            </p>
            <div className="flex items-center gap-2 text-sand-300 text-sm">
              <span>⚒️</span>
              <span>8 Skill Challenges</span>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 text-white border border-white/30 shadow-2xl hover:shadow-3xl hover:from-white/25 hover:to-white/15 transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1">
            <div className="relative mb-6">
              <div className="text-6xl group-hover:animate-bounce filter drop-shadow-lg">
                🏆
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse opacity-70"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-sand-200 font-fredoka">
              Get Certified
            </h3>
            <p className="text-ocean-50 leading-relaxed mb-4">
              Complete interactive challenges and earn your official junior
              underwater archaeologist certification.
            </p>
            <div className="flex items-center gap-2 text-sand-300 text-sm">
              <span>🎓</span>
              <span>Official Certificate</span>
            </div>
          </div>
        </div>

        {/* Enhanced Stats section */}
        <div className="mt-24 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl"></div>
          <div className="relative backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-center text-white mb-8 font-fredoka">
              🌊 Join Our Underwater Community 🌊
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="relative mb-3">
                  <div className="text-4xl md:text-5xl font-black text-sand-300 mb-2 font-fredoka group-hover:scale-110 transition-transform">
                    500+
                  </div>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg opacity-60 animate-bounce">
                    🎓
                  </div>
                </div>
                <div className="text-ocean-100 text-sm md:text-base font-medium">
                  Students Certified
                </div>
              </div>
              <div className="text-center group">
                <div className="relative mb-3">
                  <div className="text-4xl md:text-5xl font-black text-sand-300 mb-2 font-fredoka group-hover:scale-110 transition-transform">
                    25+
                  </div>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg opacity-60 animate-bounce">
                    🎯
                  </div>
                </div>
                <div className="text-ocean-100 text-sm md:text-base font-medium">
                  Interactive Challenges
                </div>
              </div>
              <div className="text-center group">
                <div className="relative mb-3">
                  <div className="text-4xl md:text-5xl font-black text-sand-300 mb-2 font-fredoka group-hover:scale-110 transition-transform">
                    12
                  </div>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg opacity-60 animate-bounce">
                    🏛️
                  </div>
                </div>
                <div className="text-ocean-100 text-sm md:text-base font-medium">
                  Historical Sites
                </div>
              </div>
              <div className="text-center group">
                <div className="relative mb-3">
                  <div className="text-4xl md:text-5xl font-black text-sand-300 mb-2 font-fredoka group-hover:scale-110 transition-transform">
                    98%
                  </div>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg opacity-60 animate-bounce">
                    ⭐
                  </div>
                </div>
                <div className="text-ocean-100 text-sm md:text-base font-medium">
                  Success Rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Underwater scene decoration with shipwreck */}
        <div className="mt-32 relative">
          {/* Ocean floor */}
          <div className="ocean-floor"></div>

          {/* Shipwreck silhouette */}
          <div className="shipwreck"></div>

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ocean-900/50 to-transparent"></div>

          {/* Sea life and decorations */}
          <div className="flex justify-center items-end gap-8 text-4xl md:text-6xl opacity-30 relative z-10">
            <div className="animate-pulse">🌿</div>
            <div className="animate-ping">💎</div>
            <div className="animate-pulse" style={{ animationDelay: "1s" }}>
              🪸
            </div>
            <div className="animate-bounce" style={{ animationDelay: "0.5s" }}>
              🐚
            </div>
            <div className="animate-pulse" style={{ animationDelay: "2s" }}>
              🌿
            </div>
          </div>

          {/* Swimming fish */}
          <div className="absolute bottom-16 left-0 text-2xl opacity-40 animate-bounce">
            🐠🐠🐠
          </div>

          {/* Additional shipwreck details */}
          <div
            className="absolute bottom-8 left-1/3 text-lg opacity-20 animate-pulse"
            style={{ animationDelay: "3s" }}
          >
            ⚓
          </div>
          <div
            className="absolute bottom-12 right-1/3 text-sm opacity-15 animate-bounce"
            style={{ animationDelay: "2.5s" }}
          >
            🏺
          </div>

          {/* Treasure glints around shipwreck */}
          <div
            className="treasure-glint bottom-6 left-[45%]"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="treasure-glint bottom-10 left-[55%]"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="treasure-glint bottom-4 left-[48%]"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="treasure-glint bottom-8 left-[52%]"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>
      </main>

      {/* Footer decoration */}
      <footer className="relative z-10 mt-16 py-8 text-center text-ocean-200 text-sm backdrop-blur-sm bg-white/5 border-t border-white/10">
        <div className="flex justify-center items-center gap-4 mb-4">
          <span className="animate-pulse">🌊</span>
          <span className="font-fredoka">
            Dive deep, learn more, discover history
          </span>
          <span className="animate-pulse">🏛️</span>
        </div>
        <p className="opacity-70">
          © 2025 Tidal Explorers • Making history accessible to young explorers
        </p>
      </footer>
    </div>
  );
}
