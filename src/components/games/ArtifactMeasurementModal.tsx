"use client";

import { X, Ruler, Info } from "lucide-react";
import Image from "next/image";

interface ArtifactData {
  _id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
}

interface ArtifactMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: ArtifactData | null;
  gridPosition: { x: number; y: number };
  onSaveMeasurements: () => void;
}

export function ArtifactMeasurementModal({
  isOpen,
  onClose,
  artifact,
  gridPosition,
  onSaveMeasurements,
}: ArtifactMeasurementModalProps) {
  if (!isOpen || !artifact) return null;

  // Generate realistic measurements based on artifact category
  const getMeasurements = () => {
    const category = artifact.category.toLowerCase();

    // Base measurements with some randomization for realism
    const variance = () => (Math.random() * 2 - 1).toFixed(1);

    if (
      category.includes("amphora") ||
      category.includes("jar") ||
      category.includes("vase")
    ) {
      return {
        height: (45 + parseFloat(variance())).toFixed(1),
        width: (28 + parseFloat(variance())).toFixed(1),
        depth: (28 + parseFloat(variance())).toFixed(1),
        weight: (3.2 + parseFloat(variance()) * 0.5).toFixed(2),
        volume: "12.5",
        opening: "15.2",
      };
    } else if (category.includes("coin")) {
      return {
        diameter: (2.4 + parseFloat(variance()) * 0.2).toFixed(2),
        thickness: (0.3 + parseFloat(variance()) * 0.05).toFixed(2),
        weight: (8.5 + parseFloat(variance()) * 0.5).toFixed(2),
        circumference: (7.5 + parseFloat(variance()) * 0.2).toFixed(2),
      };
    } else if (category.includes("statue") || category.includes("sculpture")) {
      return {
        height: (85 + parseFloat(variance()) * 5).toFixed(1),
        width: (42 + parseFloat(variance()) * 3).toFixed(1),
        depth: (35 + parseFloat(variance()) * 3).toFixed(1),
        weight: (45 + parseFloat(variance()) * 5).toFixed(1),
        baseWidth: (38 + parseFloat(variance()) * 2).toFixed(1),
      };
    } else if (category.includes("jewelry") || category.includes("ornament")) {
      return {
        length: (12.5 + parseFloat(variance())).toFixed(1),
        width: (8.2 + parseFloat(variance()) * 0.5).toFixed(1),
        thickness: (2.1 + parseFloat(variance()) * 0.3).toFixed(1),
        weight: (15.3 + parseFloat(variance()) * 2).toFixed(1),
      };
    } else if (category.includes("tool") || category.includes("weapon")) {
      return {
        length: (32 + parseFloat(variance()) * 3).toFixed(1),
        width: (8.5 + parseFloat(variance())).toFixed(1),
        thickness: (1.8 + parseFloat(variance()) * 0.3).toFixed(1),
        weight: (0.85 + parseFloat(variance()) * 0.1).toFixed(2),
        bladeLength: (22 + parseFloat(variance()) * 2).toFixed(1),
      };
    } else {
      // Default measurements
      return {
        length: (25 + parseFloat(variance()) * 2).toFixed(1),
        width: (18 + parseFloat(variance())).toFixed(1),
        height: (12 + parseFloat(variance())).toFixed(1),
        weight: (1.2 + parseFloat(variance()) * 0.3).toFixed(2),
      };
    }
  };

  const measurements = getMeasurements();
  const measurementEntries = Object.entries(measurements);

  const handleSave = () => {
    onSaveMeasurements();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-ocean-900 to-ocean-800 rounded-3xl border-2 border-white/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-ocean-900/95 backdrop-blur-sm border-b border-white/20 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Ruler className="w-6 h-6 text-sand-400" />
            <div>
              <h2 className="text-xl font-bold text-white font-fredoka">
                Artifact Measurements
              </h2>
              <p className="text-xs text-ocean-200">
                Precise Documentation - Grid Position ({gridPosition.x},{" "}
                {gridPosition.y})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Close measurements"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Artifact Preview */}
          <div className="flex gap-4 items-start">
            <div className="relative w-32 h-32 bg-black rounded-xl overflow-hidden border-2 border-sand-400 flex-shrink-0">
              <Image
                src={artifact.imageUrl}
                alt={artifact.name}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white font-fredoka mb-1">
                {artifact.name}
              </h3>
              <p className="text-sm text-ocean-100 mb-2">
                {artifact.description}
              </p>
              <div className="inline-block px-3 py-1 bg-sand-400/20 border border-sand-400 rounded-full text-xs text-sand-300 font-medium">
                {artifact.category}
              </div>
            </div>
          </div>

          {/* Measurement Grid */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-sand-400" />
              Recorded Measurements
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {measurementEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="bg-ocean-950/50 rounded-xl p-4 border border-white/10"
                >
                  <div className="text-xs text-ocean-200 uppercase tracking-wide mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-sand-400 font-mono">
                      {value}
                    </span>
                    <span className="text-sm text-ocean-300">
                      {key.includes("weight") ? "g" : "cm"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Measurement Diagram */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h4 className="font-bold text-white mb-4">Measurement Diagram</h4>
            <div className="relative bg-ocean-950/50 rounded-xl p-8 border border-white/10">
              {/* Simple measurement diagram */}
              <div className="relative w-full aspect-[3/2] flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <Image
                    src={artifact.imageUrl}
                    alt={artifact.name}
                    fill
                    className="object-contain opacity-60"
                  />
                  {/* Measurement lines */}
                  <div className="absolute inset-0">
                    {/* Horizontal line */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-sand-400" />
                    <div className="absolute top-1/2 left-0 w-2 h-2 bg-sand-400 rounded-full -translate-y-1/2" />
                    <div className="absolute top-1/2 right-0 w-2 h-2 bg-sand-400 rounded-full -translate-y-1/2" />

                    {/* Vertical line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sand-400" />
                    <div className="absolute left-1/2 top-0 w-2 h-2 bg-sand-400 rounded-full -translate-x-1/2" />
                    <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-sand-400 rounded-full -translate-x-1/2" />
                  </div>
                  {/* Labels */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-sand-400 font-mono">
                    {measurementEntries[0]?.[1]} cm
                  </div>
                  <div className="absolute top-1/2 -right-12 -translate-y-1/2 text-xs text-sand-400 font-mono">
                    {measurementEntries[1]?.[1]} cm
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Measurement Notes */}
          <div className="bg-purple-500/20 border-2 border-purple-400 rounded-xl p-4">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Measurement Protocol
            </h4>
            <ul className="text-sm text-ocean-100 space-y-1">
              <li>✓ All measurements taken with calibrated instruments</li>
              <li>✓ Artifact measured in situ before removal</li>
              <li>
                ✓ Grid coordinates: ({gridPosition.x}, {gridPosition.y})
              </li>
              <li>✓ Measurements recorded in centimeters and grams</li>
              <li>✓ Multiple readings taken for accuracy</li>
            </ul>
          </div>

          {/* Condition Assessment */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <h4 className="font-bold text-white mb-3 text-sm">
              Condition Assessment
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-500/20 border border-green-400 rounded-lg p-2">
                <div className="text-xs text-green-300 mb-1">Integrity</div>
                <div className="text-lg font-bold text-white">Good</div>
              </div>
              <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-2">
                <div className="text-xs text-blue-300 mb-1">Preservation</div>
                <div className="text-lg font-bold text-white">Stable</div>
              </div>
              <div className="bg-amber-500/20 border border-amber-400 rounded-lg p-2">
                <div className="text-xs text-amber-300 mb-1">Completeness</div>
                <div className="text-lg font-bold text-white">95%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ocean-900/95 backdrop-blur-sm border-t border-white/20 p-4 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 rounded-xl font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-sand-400 hover:bg-sand-500 text-sand-900 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            <Ruler className="w-5 h-5" />
            Save Measurements to Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
