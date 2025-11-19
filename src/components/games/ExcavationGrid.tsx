"use client";

import React, { useState, useCallback } from "react";
import { GridCell, ExcavationTool, SiteArtifact } from "../../types";

interface ExcavationGridProps {
  gridWidth: number;
  gridHeight: number;
  cells: GridCell[];
  currentTool: ExcavationTool;
  siteArtifacts: SiteArtifact[];
  onCellClick: (x: number, y: number) => void;
  onCellHover?: (x: number, y: number) => void;
  disabled?: boolean;
}

export default function ExcavationGrid({
  gridWidth,
  gridHeight,
  cells,
  currentTool,
  siteArtifacts,
  onCellClick,
  onCellHover,
  disabled = false,
}: ExcavationGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (!disabled) {
        onCellClick(x, y);
      }
    },
    [onCellClick, disabled]
  );

  const handleCellHover = useCallback(
    (x: number, y: number) => {
      setHoveredCell({ x, y });
      onCellHover?.(x, y);
    },
    [onCellHover]
  );

  const getCellData = (x: number, y: number): GridCell | undefined => {
    return cells.find((cell) => cell.x === x && cell.y === y);
  };

  const isToolAppropriate = (x: number, y: number): boolean => {
    const cell = getCellData(x, y);
    const toolType = currentTool.type;

    // Documentation tools should only be used on excavated cells
    if (toolType === "camera" || toolType === "measuring_tape") {
      return cell?.excavated === true;
    }

    // Sieve is for processing excavated sediment
    if (toolType === "sieve") {
      return cell?.excavated === true && !cell?.containsArtifact;
    }

    // Excavation tools (trowel, brush, probe) can be used on any unexcavated or partially excavated cell
    if (toolType === "trowel" || toolType === "brush" || toolType === "probe") {
      return !cell?.excavated || (cell?.excavationDepth ?? 0) < 1;
    }

    return true;
  };

  const getCellClass = (x: number, y: number): string => {
    const cell = getCellData(x, y);
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
    const toolOk = isToolAppropriate(x, y);

    let baseClass =
      "relative border border-gray-300 cursor-pointer transition-all duration-200 ";

    if (disabled) {
      baseClass += "cursor-not-allowed opacity-50 ";
    }

    if (isHovered && !disabled) {
      // Show green ring if tool is appropriate, red if not
      if (toolOk) {
        baseClass += "ring-2 ring-green-400 ";
      } else {
        baseClass += "ring-2 ring-red-400 ";
      }
    }

    if (!cell) {
      return baseClass + "bg-blue-100 ";
    }

    // Color based on excavation status
    if (cell.containsArtifact && cell.excavated) {
      baseClass += "bg-yellow-200 ";
    } else if (cell.excavated) {
      const depthOpacity = Math.min(0.8, cell.excavationDepth);
      baseClass += `bg-amber-100 `;
    } else {
      baseClass += "bg-blue-200 ";
    }

    return baseClass;
  };

  const getCellContent = (x: number, y: number) => {
    const cell = getCellData(x, y);
    const artifact = siteArtifacts.find(
      (a) => a.gridPosition.x === x && a.gridPosition.y === y
    );

    return (
      <div className="w-full h-full flex items-center justify-center relative">
        {/* Grid coordinates */}
        <div className="absolute top-0 left-0 text-xs text-gray-500 p-1">
          {x},{y}
        </div>

        {/* Excavation depth indicator */}
        {cell && cell.excavationDepth > 0 && (
          <div
            className="absolute bottom-0 left-0 bg-amber-600 transition-all duration-300"
            style={{
              width: "100%",
              height: `${cell.excavationDepth * 100}%`,
              opacity: 0.3,
            }}
          />
        )}

        {/* Artifact indicator */}
        {cell?.containsArtifact && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-yellow-500 rounded-full border-2 border-yellow-700 flex items-center justify-center">
              <span className="text-xs font-bold text-yellow-900">A</span>
            </div>
          </div>
        )}

        {/* Potential artifact indicator (for discovered but not excavated) */}
        {artifact &&
          !cell?.containsArtifact &&
          (cell?.excavationDepth ?? 0) > 0.5 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-yellow-300 rounded-full border border-yellow-500 opacity-60" />
            </div>
          )}

        {/* Tool cursor indicator */}
        {hoveredCell?.x === x && hoveredCell?.y === y && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-2xl opacity-70">
              {getToolIcon(currentTool.type)}
            </div>
            {/* Tool compatibility indicator */}
            <div
              className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
                isToolAppropriate(x, y) ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
        )}
      </div>
    );
  };

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

  // Calculate cell size based on grid dimensions
  const maxGridSize = 600; // Maximum grid size in pixels
  const cellSize = Math.min(
    Math.floor(maxGridSize / Math.max(gridWidth, gridHeight)),
    60 // Maximum cell size
  );

  return (
    <div className="flex flex-col items-center space-y-3 w-full">
      {/* Grid legend */}
      <div className="flex flex-wrap gap-3 text-xs text-white">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-200 border border-white/30" />
          <span>Unexcavated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-100 border border-white/30" />
          <span>Excavated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-yellow-200 border border-white/30" />
          <span>Artifact</span>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid border-2 border-white/30 bg-white/90 shadow-lg rounded-lg overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: gridHeight }, (_, y) =>
          Array.from({ length: gridWidth }, (_, x) => (
            <div
              key={`${x}-${y}`}
              className={getCellClass(x, y)}
              style={{ width: cellSize, height: cellSize }}
              onClick={() => handleCellClick(x, y)}
              onMouseEnter={() => handleCellHover(x, y)}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {getCellContent(x, y)}
            </div>
          ))
        )}
      </div>

      {/* Current tool indicator */}
      <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg backdrop-blur-sm">
        <span className="text-base">{getToolIcon(currentTool.type)}</span>
        <div>
          <div className="font-medium text-xs text-white">
            {currentTool.name}
          </div>
          <div className="text-xs text-ocean-100">
            {currentTool.description}
          </div>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs w-full">
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <div className="font-medium text-ocean-100">Total</div>
          <div className="text-base font-bold text-white">
            {gridWidth * gridHeight}
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <div className="font-medium text-ocean-100">Excavated</div>
          <div className="text-base font-bold text-white">
            {cells.filter((c) => c.excavated).length}
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <div className="font-medium text-ocean-100">Found</div>
          <div className="text-base font-bold text-white">
            {cells.filter((c) => c.containsArtifact).length}
          </div>
        </div>
      </div>
    </div>
  );
}
