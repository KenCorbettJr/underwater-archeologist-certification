"use client";

import React from "react";
import { ExcavationTool, EnvironmentalConditions } from "../../types";
import { EXCAVATION_TOOLS } from "../../lib/excavationGameLogic";

interface ToolSelectorProps {
  currentTool: ExcavationTool;
  onToolSelect: (tool: ExcavationTool) => void;
  environmentalConditions: EnvironmentalConditions;
  disabled?: boolean;
}

export default function ToolSelector({
  currentTool,
  onToolSelect,
  environmentalConditions,
  disabled = false,
}: ToolSelectorProps) {
  const getToolIcon = (toolType: string): string => {
    const icons = {
      brush: "🖌️",
      trowel: "🔧",
      measuring_tape: "📏",
      camera: "📷",
      sieve: "🕳️",
      probe: "🔍",
    };
    return icons[toolType as keyof typeof icons] || "🔧";
  };

  const getToolEffectivenessColor = (effectiveness: number): string => {
    if (effectiveness >= 0.8) return "text-green-600";
    if (effectiveness >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const isToolRecommended = (tool: ExcavationTool): boolean => {
    // Check if tool is suitable for current environmental conditions
    if (environmentalConditions.visibility < 30 && tool.type === "camera") {
      return false;
    }
    if (environmentalConditions.currentStrength > 6 && tool.type === "brush") {
      return false;
    }
    return true;
  };

  const getToolWarning = (tool: ExcavationTool): string | null => {
    if (environmentalConditions.visibility < 30 && tool.type === "camera") {
      return "Low visibility - photography may be difficult";
    }
    if (environmentalConditions.currentStrength > 6 && tool.type === "brush") {
      return "Strong current - brush work may be unstable";
    }
    if (
      environmentalConditions.sedimentType === "rocky" &&
      tool.type === "brush"
    ) {
      return "Rocky sediment - consider using trowel instead";
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🧰 Archaeological Tools
      </h3>

      {/* Environmental conditions summary */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Current Conditions</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Visibility: {environmentalConditions.visibility}%</div>
          <div>Current: {environmentalConditions.currentStrength}/10</div>
          <div>Depth: {environmentalConditions.depth}m</div>
          <div>Sediment: {environmentalConditions.sedimentType}</div>
        </div>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EXCAVATION_TOOLS.map((tool) => {
          const isSelected = currentTool.id === tool.id;
          const isRecommended = isToolRecommended(tool);
          const warning = getToolWarning(tool);

          return (
            <button
              key={tool.id}
              onClick={() => !disabled && onToolSelect(tool)}
              disabled={disabled}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }
                ${!isRecommended ? "opacity-75" : ""}
                ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              `}
            >
              {/* Tool icon and name */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{getToolIcon(tool.type)}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{tool.name}</div>
                  <div
                    className={`text-xs ${getToolEffectivenessColor(tool.effectiveness)}`}
                  >
                    Effectiveness: {Math.round(tool.effectiveness * 100)}%
                  </div>
                </div>
                {isSelected && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                )}
              </div>

              {/* Tool description */}
              <div className="text-xs text-gray-600 mb-2">
                {tool.description}
              </div>

              {/* Appropriate uses */}
              <div className="text-xs">
                <div className="font-medium text-gray-700 mb-1">Best for:</div>
                <div className="flex flex-wrap gap-1">
                  {tool.appropriateFor.slice(0, 2).map((use, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded text-xs"
                    >
                      {use.replace(/_/g, " ")}
                    </span>
                  ))}
                  {tool.appropriateFor.length > 2 && (
                    <span className="text-gray-500">
                      +{tool.appropriateFor.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Warning indicator */}
              {warning && (
                <div className="absolute top-2 right-2">
                  <div
                    className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs"
                    title={warning}
                  >
                    ⚠️
                  </div>
                </div>
              )}

              {/* Not recommended overlay */}
              {!isRecommended && (
                <div className="absolute inset-0 bg-red-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-red-600 text-xs font-medium text-center p-2">
                    Not recommended for current conditions
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected tool details */}
      {currentTool && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Selected Tool Details</h4>
          <div className="text-sm space-y-1">
            <div>
              <strong>Name:</strong> {currentTool.name}
            </div>
            <div>
              <strong>Type:</strong> {currentTool.type.replace(/_/g, " ")}
            </div>
            <div>
              <strong>Effectiveness:</strong>{" "}
              {Math.round(currentTool.effectiveness * 100)}%
            </div>
            <div>
              <strong>Description:</strong> {currentTool.description}
            </div>
            {getToolWarning(currentTool) && (
              <div className="text-yellow-700 bg-yellow-100 p-2 rounded text-xs mt-2">
                ⚠️ {getToolWarning(currentTool)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool usage tips */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <h4 className="font-medium text-sm mb-2">💡 Tool Tips</h4>
        <ul className="text-xs space-y-1 text-green-800">
          <li>• Use measuring tape and camera for proper documentation</li>
          <li>• Soft brushes are best for delicate artifacts</li>
          <li>• Trowels provide precision for careful excavation</li>
          <li>• Probes help detect artifacts without damage</li>
          <li>• Sieves catch small artifacts in sediment</li>
        </ul>
      </div>
    </div>
  );
}
