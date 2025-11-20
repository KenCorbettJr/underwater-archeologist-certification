"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/button";

interface MobileGameWrapperProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MobileGameWrapper({
  children,
  sidebar,
  title,
  subtitle,
}: MobileGameWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="relative">
      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 z-20 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border-b border-white/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-fredoka">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-ocean-200">{subtitle}</p>}
            </div>
            {sidebar && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                {showSidebar ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && showSidebar && sidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[90vw] bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border-l border-white/30 z-40 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white font-fredoka">
                  Game Info
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {sidebar}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="relative">{children}</div>
    </div>
  );
}
