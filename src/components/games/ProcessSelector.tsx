"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ConservationProcess {
  id: string;
  name: string;
  category: "cleaning" | "stabilization" | "repair" | "preservation";
  description: string;
  duration: number;
  isAppropriate: boolean;
}

interface ProcessSelectorProps {
  availableProcesses: ConservationProcess[];
  selectedProcesses: ConservationProcess[];
  onSelectProcess: (processId: string) => void;
  onRemoveProcess: (processId: string) => void;
  onValidateSelection?: () => void;
}

export function ProcessSelector({
  availableProcesses,
  selectedProcesses,
  onSelectProcess,
  onRemoveProcess,
  onValidateSelection,
}: ProcessSelectorProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">(
    "error"
  );
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cleaning":
        return "🧹";
      case "stabilization":
        return "🔧";
      case "repair":
        return "🔨";
      case "preservation":
        return "🛡️";
      default:
        return "⚙️";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "cleaning":
        return "bg-blue-500/20 border-blue-400 text-blue-300";
      case "stabilization":
        return "bg-yellow-500/20 border-yellow-400 text-yellow-300";
      case "repair":
        return "bg-orange-500/20 border-orange-400 text-orange-300";
      case "preservation":
        return "bg-green-500/20 border-green-400 text-green-300";
      default:
        return "bg-white/10 border-white/30 text-white";
    }
  };

  const unselectedProcesses = availableProcesses.filter(
    (p) => !selectedProcesses.some((sp) => sp.id === p.id)
  );

  const handleValidateSelection = () => {
    if (selectedProcesses.length === 0) {
      setFeedbackMessage("Please select at least one conservation process.");
      setFeedbackType("error");
      setShowFeedback(true);
      return;
    }

    const inappropriateProcesses = selectedProcesses.filter(
      (p) => !p.isAppropriate
    );
    const appropriateProcesses = selectedProcesses.filter(
      (p) => p.isAppropriate
    );

    // Check if all selected processes are appropriate
    if (
      inappropriateProcesses.length === 0 &&
      appropriateProcesses.length > 0
    ) {
      setFeedbackMessage(
        `Excellent! All ${appropriateProcesses.length} selected process(es) are appropriate for this artifact. You can now proceed to create your treatment plan.`
      );
      setFeedbackType("success");
      setShowFeedback(true);
      if (onValidateSelection) {
        onValidateSelection();
      }
    } else {
      setFeedbackMessage(
        `You have ${inappropriateProcesses.length} inappropriate process(es) selected. Review the warnings and remove processes that aren't suitable for this artifact before proceeding.`
      );
      setFeedbackType("error");
      setShowFeedback(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Available Processes */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <h3 className="text-white font-bold text-lg mb-3">
          Available Conservation Processes
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {unselectedProcesses.map((process) => (
            <div
              key={process.id}
              className={`p-4 rounded-lg border-2 ${getCategoryColor(process.category)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {getCategoryIcon(process.category)}
                  </span>
                  <div>
                    <h4 className="font-semibold">{process.name}</h4>
                    <p className="text-xs opacity-75 capitalize">
                      {process.category}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => onSelectProcess(process.id)}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 shrink-0"
                >
                  Select
                </Button>
              </div>
              <p className="text-sm opacity-90 mb-2">{process.description}</p>
              <div className="flex justify-between text-xs opacity-75">
                <span>Duration: {process.duration}h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Processes */}
      {selectedProcesses.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <h3 className="text-white font-bold text-lg mb-3">
            Selected Processes ({selectedProcesses.length})
          </h3>

          {/* Feedback message */}
          {showFeedback && (
            <div
              className={`mb-4 p-3 rounded-lg border-2 ${
                feedbackType === "success"
                  ? "bg-green-500/20 border-green-400"
                  : "bg-red-500/20 border-red-400"
              }`}
            >
              <p
                className={`text-sm ${
                  feedbackType === "success" ? "text-green-200" : "text-red-200"
                }`}
              >
                {feedbackMessage}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {selectedProcesses.map((process, index) => (
              <div
                key={process.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                  process.isAppropriate
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-sand-400 flex items-center justify-center text-sand-900 font-bold text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getCategoryIcon(process.category)}
                    </span>
                    <span className="text-white font-semibold">
                      {process.name}
                    </span>
                    {process.isAppropriate ? (
                      <span className="text-green-400 text-sm">✓</span>
                    ) : (
                      <span className="text-red-400 text-sm">⚠️</span>
                    )}
                  </div>
                  <p className="text-white/60 text-xs">{process.description}</p>
                  {!process.isAppropriate && (
                    <p className="text-red-400 text-xs mt-1">
                      ⚠️ This process may not be suitable for this artifact
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveProcess(process.id)}
                  className="text-red-400 hover:text-red-300 px-2 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-ocean-900/30 rounded-lg">
            <p className="text-white/80 text-sm">
              <strong>Total Time:</strong>{" "}
              {selectedProcesses.reduce((sum, p) => sum + p.duration, 0)} hours
            </p>
          </div>

          {/* Validate Selection Button */}
          <Button
            onClick={handleValidateSelection}
            className="w-full mt-4 bg-sand-400 hover:bg-sand-500 text-sand-900 font-semibold"
          >
            Check My Selection
          </Button>
        </div>
      )}

      {/* Process Categories Guide */}
      <div className="bg-ocean-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Process Categories:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧹</span>
            <span className="text-white/80">Cleaning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔧</span>
            <span className="text-white/80">Stabilization</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔨</span>
            <span className="text-white/80">Repair</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="text-white/80">Preservation</span>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-3">
          💡 Tip: Processes should generally be performed in this order:
          Cleaning → Stabilization → Repair → Preservation
        </p>
      </div>
    </div>
  );
}
