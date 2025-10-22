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

  const getCellClass = (x: number, y: number): string => {
    const cell = getCellData(x, y);
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

    let baseClass =
      "relative border border-gray-300 cursor-pointer transition-all duration-200 ";

    if (disabled) {
      baseClass += "cursor-not-allowed opacity-50 ";
    }

    if (isHovered && !disabled) {
      baseClass += "ring-2 ring-blue-400 ";
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
        {artifact && !cell?.containsArtifact && cell?.excavationDepth > 0.5 && (
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
    <div className="flex flex-col items-center space-y-4">
      {/* Grid legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-gray-300" />
          <span>Unexcavated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-100 border border-gray-300" />
          <span>Partially excavated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border border-gray-300" />
          <span>Artifact found</span>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid border-2 border-gray-400 bg-white shadow-lg"
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
      <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
        <span className="text-lg">{getToolIcon(currentTool.type)}</span>
        <div>
          <div className="font-medium">{currentTool.name}</div>
          <div className="text-sm text-gray-600">{currentTool.description}</div>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-medium">Total Cells</div>
          <div className="text-lg">{gridWidth * gridHeight}</div>
        </div>
        <div>
          <div className="font-medium">Excavated</div>
          <div className="text-lg">
            {cells.filter((c) => c.excavated).length}
          </div>
        </div>
        <div>
          <div className="font-medium">Artifacts Found</div>
          <div className="text-lg">
            {cells.filter((c) => c.containsArtifact).length}
          </div>
        </div>
      </div>
    </div>
  );
}
