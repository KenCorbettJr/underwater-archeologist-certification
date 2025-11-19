"use client";

import { X } from "lucide-react";

interface ToolGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToolGuideModal({ isOpen, onClose }: ToolGuideModalProps) {
  if (!isOpen) return null;

  const tools = [
    {
      name: "Soft Brush",
      icon: "🖌️",
      bestFor: ["Delicate artifacts", "Fragile items", "Detailed cleaning"],
      avoid: ["Heavy sediment", "Initial excavation"],
      color: "bg-blue-500/20 border-blue-400",
    },
    {
      name: "Hard Brush",
      icon: "🧹",
      bestFor: ["Heavy sediment", "Initial cleaning", "Robust artifacts"],
      avoid: ["Fragile artifacts", "Delicate items", "Final cleaning"],
      color: "bg-orange-500/20 border-orange-400",
    },
    {
      name: "Archaeological Trowel",
      icon: "⛏️",
      bestFor: ["Precision excavation", "Artifact extraction", "Grid work"],
      avoid: ["Final cleaning", "Photography"],
      color: "bg-green-500/20 border-green-400",
    },
    {
      name: "Measuring Tape",
      icon: "📏",
      bestFor: ["Documentation", "Mapping", "Measurements"],
      avoid: ["Excavation", "Cleaning"],
      color: "bg-purple-500/20 border-purple-400",
    },
    {
      name: "Underwater Camera",
      icon: "📷",
      bestFor: ["Photography", "Documentation", "Evidence"],
      avoid: ["Low visibility", "Excavation"],
      color: "bg-pink-500/20 border-pink-400",
    },
    {
      name: "Archaeological Sieve",
      icon: "🔍",
      bestFor: ["Small artifacts", "Sediment processing", "Thorough search"],
      avoid: ["Large artifacts", "Initial excavation"],
      color: "bg-yellow-500/20 border-yellow-400",
    },
    {
      name: "Archaeological Probe",
      icon: "🔬",
      bestFor: ["Detection", "Preliminary survey", "Safe exploration"],
      avoid: ["Artifact extraction", "Cleaning"],
      color: "bg-cyan-500/20 border-cyan-400",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-ocean-900 to-ocean-800 rounded-3xl border-2 border-white/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-ocean-900/95 backdrop-blur-sm border-b border-white/20 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white font-fredoka">
              🛠️ Tool Selection Guide
            </h2>
            <p className="text-ocean-200 text-sm mt-1">
              Choose the right tool for each archaeological task
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Close guide"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className={`${tool.color} border-2 rounded-2xl p-4 backdrop-blur-sm`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{tool.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {tool.name}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-green-300 font-medium mb-1">
                        ✓ Best for:
                      </div>
                      <ul className="text-ocean-100 space-y-1">
                        {tool.bestFor.map((use) => (
                          <li key={use}>• {use}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-red-300 font-medium mb-1">
                        ✗ Avoid for:
                      </div>
                      <ul className="text-ocean-100 space-y-1">
                        {tool.avoid.map((use) => (
                          <li key={use}>• {use}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Tips section */}
          <div className="bg-sand-500/20 border-2 border-sand-400 rounded-2xl p-4 mt-6">
            <h3 className="text-lg font-bold text-white mb-3 font-fredoka">
              💡 Pro Tips
            </h3>
            <ul className="text-ocean-100 space-y-2 text-sm">
              <li>
                • <strong>Start gentle:</strong> Begin with softer tools and
                switch to harder ones only if needed
              </li>
              <li>
                • <strong>Document first:</strong> Always photograph and measure
                before moving artifacts
              </li>
              <li>
                • <strong>Check conditions:</strong> Environmental factors
                affect tool effectiveness
              </li>
              <li>
                • <strong>Match the task:</strong> Use excavation tools for
                digging, documentation tools for recording
              </li>
              <li>
                • <strong>Protect artifacts:</strong> Fragile items need gentle
                handling with soft brushes or trowels
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ocean-900/95 backdrop-blur-sm border-t border-white/20 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-sand-400 hover:bg-sand-500 text-sand-900 rounded-xl font-bold transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
