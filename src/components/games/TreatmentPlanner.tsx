"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TreatmentStep {
  id: string;
  stepNumber: number;
  processId: string;
  description: string;
  estimatedTime: number;
  isComplete: boolean;
  isCorrect: boolean;
}

interface ConservationProcess {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
}

interface TreatmentPlannerProps {
  selectedProcesses: ConservationProcess[];
  treatmentPlan: TreatmentStep[];
  onCreatePlan: (processOrder: string[]) => void;
  onExecuteStep: (stepId: string) => void;
  planCreated: boolean;
}

export function TreatmentPlanner({
  selectedProcesses,
  treatmentPlan,
  onCreatePlan,
  onExecuteStep,
  planCreated,
}: TreatmentPlannerProps) {
  const [processOrder, setProcessOrder] = useState<string[]>([]);
  const [draggedProcessId, setDraggedProcessId] = useState<string | null>(null);

  const handleDragStart = (processId: string) => {
    setDraggedProcessId(processId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    if (!draggedProcessId) return;

    const existingIndex = processOrder.indexOf(draggedProcessId);
    if (existingIndex >= 0) {
      // Reorder
      const newOrder = [...processOrder];
      newOrder.splice(existingIndex, 1);
      newOrder.splice(position, 0, draggedProcessId);
      setProcessOrder(newOrder);
    } else {
      // Add new
      const newOrder = [...processOrder];
      newOrder.splice(position, 0, draggedProcessId);
      setProcessOrder(newOrder);
    }

    setDraggedProcessId(null);
  };

  const handleRemoveFromPlan = (processId: string) => {
    setProcessOrder(processOrder.filter((id) => id !== processId));
  };

  const handleCreatePlan = () => {
    onCreatePlan(processOrder);
  };

  const unorderedProcesses = selectedProcesses.filter(
    (p) => !processOrder.includes(p.id)
  );

  const orderedProcesses = processOrder
    .map((id) => selectedProcesses.find((p) => p.id === id))
    .filter((p): p is ConservationProcess => p !== undefined);

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

  if (planCreated && treatmentPlan.length > 0) {
    // Show execution view
    return (
      <div className="space-y-4">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <h3 className="text-white font-bold text-lg mb-3">
            Treatment Execution
          </h3>
          <div className="space-y-3">
            {treatmentPlan.map((step) => {
              const process = selectedProcesses.find(
                (p) => p.id === step.processId
              );
              if (!process) return null;

              return (
                <div
                  key={step.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${
                      step.isComplete
                        ? "bg-green-500/20 border-green-400"
                        : "bg-white/10 border-white/30"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      ${
                        step.isComplete
                          ? "bg-green-400 text-green-900"
                          : "bg-sand-400 text-sand-900"
                      }
                    `}
                    >
                      {step.isComplete ? "✓" : step.stepNumber}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">
                          {getCategoryIcon(process.category)}
                        </span>
                        <h4 className="text-white font-semibold">
                          {process.name}
                        </h4>
                      </div>
                      <p className="text-white/70 text-sm mb-2">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-white/60">
                        <span>⏱️ {step.estimatedTime}h</span>
                        <span className="capitalize">
                          📂 {process.category}
                        </span>
                      </div>
                    </div>
                    {!step.isComplete && (
                      <Button
                        onClick={() => onExecuteStep(step.id)}
                        className="bg-sand-400 hover:bg-sand-500 text-sand-900"
                      >
                        Execute
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Summary */}
          <div className="mt-4 p-4 bg-ocean-900/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold">Progress:</span>
              <span className="text-sand-400 font-bold">
                {treatmentPlan.filter((s) => s.isComplete).length} /{" "}
                {treatmentPlan.length} steps
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div
                className="bg-sand-400 h-full rounded-full transition-all"
                style={{
                  width: `${
                    (treatmentPlan.filter((s) => s.isComplete).length /
                      treatmentPlan.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show planning view
  return (
    <div className="space-y-4">
      {/* Unordered Processes */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <h3 className="text-white font-bold text-lg mb-3">
          Drag processes to create treatment plan:
        </h3>
        <div className="grid md:grid-cols-2 gap-2">
          {unorderedProcesses.map((process) => (
            <div
              key={process.id}
              draggable
              onDragStart={() => handleDragStart(process.id)}
              className="p-3 bg-white/20 rounded-lg cursor-move hover:bg-white/30 transition-all border-2 border-white/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {getCategoryIcon(process.category)}
                </span>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm">
                    {process.name}
                  </h4>
                  <p className="text-white/60 text-xs capitalize">
                    {process.category}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Treatment Plan */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <h3 className="text-white font-bold text-lg mb-3">
          Treatment Plan (Drag here in order)
        </h3>

        {orderedProcesses.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 0)}
            className="border-4 border-dashed border-white/30 rounded-lg p-8 text-center"
          >
            <p className="text-white/60">
              Drag processes here to build your treatment plan
            </p>
            <p className="text-white/40 text-sm mt-2">
              Remember: Cleaning → Stabilization → Repair → Preservation
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orderedProcesses.map((process, index) => (
              <div key={process.id}>
                {/* Drop Zone Above */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="h-8 border-2 border-transparent hover:border-sand-400 hover:bg-sand-400/20 transition-all"
                />

                {/* Process Card */}
                <div
                  draggable
                  onDragStart={() => handleDragStart(process.id)}
                  className="flex items-center gap-3 p-3 bg-white/20 rounded-lg cursor-move hover:bg-white/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-sand-400 flex items-center justify-center text-sand-900 font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="text-xl">
                    {getCategoryIcon(process.category)}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm">
                      {process.name}
                    </h4>
                    <p className="text-white/60 text-xs capitalize">
                      {process.category}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromPlan(process.id)}
                    className="text-red-400 hover:text-red-300 px-2"
                  >
                    ✕
                  </button>
                </div>

                {/* Drop Zone Below (for last item) */}
                {index === orderedProcesses.length - 1 && (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index + 1)}
                    className="h-8 border-2 border-transparent hover:border-sand-400 hover:bg-sand-400/20 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {orderedProcesses.length > 0 && (
          <Button
            onClick={handleCreatePlan}
            className="w-full mt-4 bg-sand-400 hover:bg-sand-500 text-sand-900 font-semibold"
          >
            Create Treatment Plan
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-ocean-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">💡 Planning Tips:</h4>
        <ul className="text-white/80 text-sm space-y-1">
          <li>
            • Follow the correct sequence: Cleaning first, Preservation last
          </li>
          <li>• Consider the artifact's condition and material type</li>
          <li>• Each process should address specific damage types</li>
          <li>• Plan for adequate time between steps if needed</li>
        </ul>
      </div>
    </div>
  );
}
