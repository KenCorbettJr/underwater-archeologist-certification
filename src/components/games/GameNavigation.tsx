"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Home, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameNavigationProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function GameNavigation({
  showBackButton = true,
  backHref = "/challenges",
  backLabel = "Back to Challenges",
}: GameNavigationProps) {
  const pathname = usePathname();

  const gameLinks = [
    {
      href: "/challenges/artifact-game",
      label: "Artifacts",
      icon: "🏺",
      active: pathname?.startsWith("/challenges/artifact-game"),
    },
    {
      href: "/challenges/site-documentation",
      label: "Documentation",
      icon: "📏",
      active: pathname?.startsWith("/challenges/site-documentation"),
    },
    {
      href: "/challenges/excavation-simulation",
      label: "Excavation",
      icon: "🤿",
      active: pathname?.startsWith("/challenges/excavation-simulation"),
    },
    {
      href: "/challenges/conservation-lab",
      label: "Conservation",
      icon: "🧪",
      active: pathname?.startsWith("/challenges/conservation-lab"),
    },
    {
      href: "/challenges/historical-timeline",
      label: "Timeline",
      icon: "📚",
      active: pathname?.startsWith("/challenges/historical-timeline"),
    },
  ];

  return (
    <header className="relative z-10 backdrop-blur-sm bg-white/5 border-b border-white/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
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
            <Link href="/challenges/progress">
              <Button
                variant="outline"
                size="sm"
                className="border-sand-400 text-sand-300 hover:bg-sand-400/20"
              >
                <Trophy className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Progress</span>
              </Button>
            </Link>
            <Link
              href="/admin"
              className="text-white/70 hover:text-white text-sm transition-colors hidden md:block"
            >
              Admin
            </Link>
            <UserButton />
          </div>
        </div>

        {/* Game Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide touch-pan-x">
          {showBackButton && (
            <Link href={backHref}>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 whitespace-nowrap touch-manipulation min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{backLabel}</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          )}
          <div className="h-6 w-px bg-white/20 mx-2 hidden sm:block"></div>
          {gameLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={link.active ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "whitespace-nowrap touch-manipulation min-h-[44px]",
                  link.active
                    ? "bg-sand-400 text-sand-900 hover:bg-sand-500"
                    : "text-white hover:bg-white/10"
                )}
              >
                <span className="mr-1 sm:mr-2">{link.icon}</span>
                <span className="hidden lg:inline">{link.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
