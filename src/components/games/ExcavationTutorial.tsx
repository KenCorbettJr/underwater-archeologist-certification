"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ExcavationTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ExcavationTutorial({
  isOpen,
  onClose,
  onComplete,
}: ExcavationTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to Underwater Excavation!",
      icon: "🤿",
      content: (
        <div className="space-y-4">
          <p className="text-ocean-100">
            Learn the proper workflow for archaeological excavation. Follow
            these steps to successfully excavate a site and discover artifacts.
          </p>
          <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-4">
            <h4 className="font-bold text-white mb-2">The Golden Rule</h4>
            <p className="text-sm text-ocean-100">
              Always use the right tool for the right task. Excavation tools
              dig, documentation tools record.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 1: Initial Excavation",
      icon: "⛏️",
      content: (
        <div className="space-y-4">
          <p className="text-ocean-100">
            Start by excavating unexcavated cells (blue) using excavation tools.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-green-500/20 border-2 border-green-400 rounded-xl p-3">
              <div className="text-2xl mb-2">⛏️</div>
              <h4 className="font-bold text-white text-sm mb-1">
                Archaeological Trowel
              </h4>
              <p className="text-xs text-ocean-100">
                Best for precision excavation. Use this for most digging.
              </p>
            </div>
            <div className="bg-green-500/20 border-2 border-green-400 rounded-xl p-3">
              <div className="text-2xl mb-2">🖌️</div>
              <h4 className="font-bold text-white text-sm mb-1">Soft Brush</h4>
              <p className="text-xs text-ocean-100">
                Gentle cleaning. Good for delicate areas.
              </p>
            </div>
            <div className="bg-green-500/20 border-2 border-green-400 rounded-xl p-3">
              <div className="text-2xl mb-2">🔬</div>
              <h4 className="font-bold text-white text-sm mb-1">Probe</h4>
              <p className="text-xs text-ocean-100">
                Safe exploration. Detects artifacts without damage.
              </p>
            </div>
          </div>
          <div className="bg-amber-500/20 border-2 border-amber-400 rounded-xl p-3">
            <p className="text-sm text-white">
              <strong>Visual Hint:</strong> When you hover over a cell, you'll
              see a <span className="text-green-400">green ring</span> if your
              tool is appropriate, or a{" "}
              <span className="text-red-400">red ring</span> if it's not.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 2: Discover Artifacts",
      icon: "💎",
      content: (
        <div className="space-y-4">
          <p className="text-ocean-100">
            As you excavate, you may discover artifacts. They'll appear as
            yellow circles with an "A" marker.
          </p>
          <div className="flex justify-center my-4">
            <div className="relative w-20 h-20 bg-yellow-200 border-2 border-gray-300 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full border-2 border-yellow-700 flex items-center justify-center">
                <span className="text-sm font-bold text-yellow-900">A</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-4">
            <h4 className="font-bold text-white mb-2">Important!</h4>
            <p className="text-sm text-ocean-100">
              Once you discover an artifact, STOP excavating that cell. It's
              time to document!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 3: Document Your Findings",
      icon: "📸",
      content: (
        <div className="space-y-4">
          <p className="text-ocean-100">
            Before moving artifacts, you must document them. Switch to
            documentation tools.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-purple-500/20 border-2 border-purple-400 rounded-xl p-3">
              <div className="text-2xl mb-2">📷</div>
              <h4 className="font-bold text-white text-sm mb-1">
                Underwater Camera
              </h4>
              <p className="text-xs text-ocean-100">
                Click on excavated cells to photograph artifacts in their
                original position (in situ).
              </p>
              <div className="mt-2 text-xs text-green-300">
                ✓ Works on tan/yellow excavated cells
              </div>
            </div>
            <div className="bg-purple-500/20 border-2 border-purple-400 rounded-xl p-3">
              <div className="text-2xl mb-2">📏</div>
              <h4 className="font-bold text-white text-sm mb-1">
                Measuring Tape
              </h4>
              <p className="text-xs text-ocean-100">
                Click on excavated cells to record precise measurements and
                positions.
              </p>
              <div className="mt-2 text-xs text-green-300">
                ✓ Works on tan/yellow excavated cells
              </div>
            </div>
          </div>
          <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-3">
            <p className="text-sm text-white">
              <strong>Don't use documentation tools for excavation!</strong>{" "}
              They won't work on unexcavated (blue) cells.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 4: The Complete Workflow",
      icon: "🔄",
      content: (
        <div className="space-y-4">
          <p className="text-ocean-100">
            Here's the complete archaeological workflow:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Excavate with Trowel/Brush
                </h4>
                <p className="text-xs text-ocean-100">
                  Use excavation tools on blue (unexcavated) cells
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Discover Artifacts
                </h4>
                <p className="text-xs text-ocean-100">
                  Yellow cells with "A" markers indicate discoveries
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Document with Camera/Tape
                </h4>
                <p className="text-xs text-ocean-100">
                  Switch to documentation tools for excavated cells
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Add Documentation Notes
                </h4>
                <p className="text-xs text-ocean-100">
                  Use the Documentation Panel to record your findings
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Visual Hints Guide",
      icon: "👀",
      content: (
        <div className="space-y-4">
          <p className="text-ocean-100">
            The game provides visual feedback to help you choose the right tool:
          </p>
          <div className="space-y-3">
            <div className="bg-green-500/20 border-2 border-green-400 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <h4 className="font-bold text-white text-sm">Green Ring</h4>
              </div>
              <p className="text-xs text-ocean-100">
                Your current tool is appropriate for this cell. Go ahead and
                click!
              </p>
            </div>
            <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <h4 className="font-bold text-white text-sm">Red Ring</h4>
              </div>
              <p className="text-xs text-ocean-100">
                Your current tool won't work here. Switch to a different tool.
              </p>
            </div>
            <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-200 border border-gray-300" />
                <h4 className="font-bold text-white text-sm">Blue Cell</h4>
              </div>
              <p className="text-xs text-ocean-100">
                Unexcavated. Use Trowel, Brush, or Probe.
              </p>
            </div>
            <div className="bg-amber-500/20 border-2 border-amber-400 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-amber-100 border border-gray-300" />
                <h4 className="font-bold text-white text-sm">Tan Cell</h4>
              </div>
              <p className="text-xs text-ocean-100">
                Excavated. Can use documentation tools here.
              </p>
            </div>
            <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-yellow-200 border border-gray-300" />
                <h4 className="font-bold text-white text-sm">Yellow Cell</h4>
              </div>
              <p className="text-xs text-ocean-100">
                Artifact found! Document before proceeding.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Ready to Excavate!",
      icon: "🎯",
      content: (
        <div className="space-y-4">
          <p className="text-ocean-100 text-lg">
            You're ready to start your excavation! Remember:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <p className="text-sm text-ocean-100">
                Watch for green/red rings when hovering over cells
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <p className="text-sm text-ocean-100">
                Use excavation tools (Trowel/Brush) on blue cells
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <p className="text-sm text-ocean-100">
                Use documentation tools (Camera/Tape) on excavated cells
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <p className="text-sm text-ocean-100">
                Document all artifacts you discover
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <p className="text-sm text-ocean-100">
                Click "Tool Guide" anytime for reference
              </p>
            </div>
          </div>
          <div className="bg-sand-500/20 border-2 border-sand-400 rounded-xl p-4 mt-4">
            <p className="text-white font-bold text-center">
              Good luck, Junior Archaeologist! 🏛️
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-ocean-900 to-ocean-800 rounded-3xl border-2 border-white/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-ocean-900/95 backdrop-blur-sm border-b border-white/20 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{currentStepData.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-white font-fredoka">
                {currentStepData.title}
              </h2>
              <p className="text-xs text-ocean-200">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Close tutorial"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{currentStepData.content}</div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 px-6 pb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-sand-400 w-6"
                  : index < currentStep
                    ? "bg-sand-400/50"
                    : "bg-white/30"
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ocean-900/95 backdrop-blur-sm border-t border-white/20 p-4 flex justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 border-2 border-white/30 text-white hover:bg-white/10 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-sand-400 hover:bg-sand-500 text-sand-900 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? (
              "Start Excavating!"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
