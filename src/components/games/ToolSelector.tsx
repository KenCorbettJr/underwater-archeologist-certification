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
    <div className="h-full flex flex-col">
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-white">
        🧰 Archaeological Tools
      </h3>

      {/* Environmental conditions summary */}
      <div className="mb-3 p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
        <h4 className="font-medium text-xs mb-1.5 text-white">
          Current Conditions
        </h4>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-ocean-50">
          <div>Visibility: {environmentalConditions.visibility}%</div>
          <div>Current: {environmentalConditions.currentStrength}/10</div>
          <div>Depth: {environmentalConditions.depth}m</div>
          <div>Sediment: {environmentalConditions.sedimentType}</div>
        </div>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
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
                relative p-2 rounded-lg border-2 transition-all duration-200 text-left
                ${
                  isSelected
                    ? "border-sand-400 bg-sand-400/20 shadow-md"
                    : "border-white/20 bg-white/10 hover:border-white/30 hover:shadow-sm"
                }
                ${!isRecommended ? "opacity-75" : ""}
                ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              `}
            >
              {/* Tool icon and name */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">{getToolIcon(tool.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-white truncate">
                    {tool.name}
                  </div>
                  <div
                    className={`text-xs ${getToolEffectivenessColor(tool.effectiveness)}`}
                  >
                    {Math.round(tool.effectiveness * 100)}%
                  </div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 bg-sand-400 rounded-full flex-shrink-0" />
                )}
              </div>

              {/* Warning indicator */}
              {warning && (
                <div className="absolute top-1 right-1">
                  <div
                    className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center text-xs"
                    title={warning}
                  >
                    ⚠️
                  </div>
                </div>
              )}

              {/* Not recommended overlay */}
              {!isRecommended && (
                <div className="absolute inset-0 bg-red-500/50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-xs font-medium text-center px-1">
                    Not recommended
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected tool details */}
      {currentTool && (
        <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
          <h4 className="font-medium text-xs mb-1.5 text-white">
            Selected Tool
          </h4>
          <div className="text-xs space-y-0.5 text-ocean-50">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{getToolIcon(currentTool.type)}</span>
              <span className="font-medium text-white">{currentTool.name}</span>
            </div>
            <div className="text-xs opacity-90">{currentTool.description}</div>
            {getToolWarning(currentTool) && (
              <div className="text-yellow-300 bg-yellow-900/30 p-1.5 rounded text-xs mt-1">
                ⚠️ {getToolWarning(currentTool)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
