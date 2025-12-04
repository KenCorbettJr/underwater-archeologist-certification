"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCellRef = useRef<{ x: number; y: number } | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  const startHolding = useCallback(
    (x: number, y: number) => {
      if (disabled) return;

      currentCellRef.current = { x, y };
      setIsHolding(true);

      // Immediate first click
      onCellClick(x, y);

      // Start interval for continuous clicks
      holdIntervalRef.current = setInterval(() => {
        if (currentCellRef.current) {
          onCellClick(currentCellRef.current.x, currentCellRef.current.y);
        }
      }, 150); // Fire every 150ms while holding
    },
    [onCellClick, disabled]
  );

  const stopHolding = useCallback(() => {
    setIsHolding(false);
    currentCellRef.current = null;
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const handleCellEnter = useCallback(
    (x: number, y: number) => {
      setHoveredCell({ x, y });
      onCellHover?.(x, y);

      // If holding and entering a new cell, update the current cell
      if (isHolding && currentCellRef.current) {
        currentCellRef.current = { x, y };
      }
    },
    [onCellHover, isHolding]
  );

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (!disabled) {
        onCellClick(x, y);
      }
    },
    [onCellClick, disabled]
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

    // Highlight cell being held
    if (
      isHolding &&
      currentCellRef.current?.x === x &&
      currentCellRef.current?.y === y
    ) {
      baseClass += "ring-4 ring-blue-500 animate-pulse ";
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
              height: `${Math.min(cell.excavationDepth, 1) * 100}%`,
              opacity: 0.3,
            }}
          />
        )}

        {/* Artifact indicator */}
        {cell?.containsArtifact && artifact && (
          <div className="absolute inset-0 flex items-center justify-center">
            {getArtifactVisual(artifact)}
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

  const getArtifactVisual = (siteArtifact: SiteArtifact) => {
    // Use position-based seed to create variety in artifact visuals
    const seed =
      (siteArtifact.gridPosition.x * 7 + siteArtifact.gridPosition.y * 13) % 7;

    // Pottery/Ceramic artifacts
    if (seed === 0) {
      return (
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          className="drop-shadow-md"
        >
          <path
            d="M14 4 L18 8 L18 20 C18 22 16 24 14 24 C12 24 10 22 10 20 L10 8 Z"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="1.5"
          />
          <ellipse cx="14" cy="8" rx="4" ry="2" fill="#A0522D" />
          <path
            d="M10 12 Q14 13 18 12"
            stroke="#654321"
            strokeWidth="0.8"
            fill="none"
          />
          <path
            d="M10 16 Q14 17 18 16"
            stroke="#654321"
            strokeWidth="0.8"
            fill="none"
          />
        </svg>
      );
    }

    // Coins
    if (seed === 1) {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="drop-shadow-md"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="#DAA520"
            stroke="#B8860B"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="7"
            fill="none"
            stroke="#B8860B"
            strokeWidth="1"
          />
          <text
            x="12"
            y="15"
            fontSize="8"
            fill="#8B6914"
            textAnchor="middle"
            fontWeight="bold"
          >
            $
          </text>
        </svg>
      );
    }

    // Tools (axe, knife, blade)
    if (seed === 2) {
      return (
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          className="drop-shadow-md"
        >
          <path
            d="M8 20 L12 8 L16 8 L20 20 L18 22 L10 22 Z"
            fill="#696969"
            stroke="#2F4F4F"
            strokeWidth="1.5"
          />
          <rect
            x="11"
            y="6"
            width="6"
            height="3"
            fill="#8B7355"
            stroke="#654321"
            strokeWidth="1"
          />
          <path d="M10 12 L18 12" stroke="#2F4F4F" strokeWidth="0.8" />
        </svg>
      );
    }

    // Jewelry/ornaments
    if (seed === 3) {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="drop-shadow-md"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke="#FFD700"
            strokeWidth="2.5"
          />
          <circle
            cx="12"
            cy="8"
            r="2.5"
            fill="#FF6347"
            stroke="#DC143C"
            strokeWidth="1"
          />
          <circle cx="8" cy="14" r="1.5" fill="#4169E1" />
          <circle cx="16" cy="14" r="1.5" fill="#32CD32" />
        </svg>
      );
    }

    // Statue/figurine
    if (seed === 4) {
      return (
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          className="drop-shadow-md"
        >
          <ellipse
            cx="13"
            cy="8"
            rx="3"
            ry="4"
            fill="#D2B48C"
            stroke="#8B7355"
            strokeWidth="1.5"
          />
          <rect
            x="11"
            y="11"
            width="4"
            height="8"
            fill="#D2B48C"
            stroke="#8B7355"
            strokeWidth="1.5"
          />
          <path
            d="M11 14 L8 18"
            stroke="#8B7355"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M15 14 L18 18"
            stroke="#8B7355"
            strokeWidth="1.5"
            fill="none"
          />
          <rect
            x="10"
            y="19"
            width="6"
            height="3"
            fill="#D2B48C"
            stroke="#8B7355"
            strokeWidth="1.5"
          />
        </svg>
      );
    }

    // Anchor or metal object
    if (seed === 5) {
      return (
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          className="drop-shadow-md"
        >
          <circle
            cx="13"
            cy="8"
            rx="2"
            ry="2"
            fill="#708090"
            stroke="#2F4F4F"
            strokeWidth="1.5"
          />
          <rect
            x="12"
            y="8"
            width="2"
            height="10"
            fill="#708090"
            stroke="#2F4F4F"
            strokeWidth="1.5"
          />
          <path
            d="M8 18 L13 18 L18 18"
            stroke="#708090"
            strokeWidth="2"
            fill="none"
          />
          <path d="M8 18 L8 22" stroke="#708090" strokeWidth="2" />
          <path d="M18 18 L18 22" stroke="#708090" strokeWidth="2" />
        </svg>
      );
    }

    // Default artifact (generic shard/fragment)
    return (
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        className="drop-shadow-md"
      >
        <path
          d="M8 10 L12 6 L18 8 L20 14 L16 20 L10 18 Z"
          fill="#CD853F"
          stroke="#8B4513"
          strokeWidth="1.5"
        />
        <path d="M10 12 L16 14" stroke="#8B4513" strokeWidth="0.8" />
        <path d="M12 16 L14 10" stroke="#8B4513" strokeWidth="0.8" />
      </svg>
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
        className="grid border-2 border-white/30 bg-white/90 shadow-lg rounded-lg overflow-hidden select-none"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`,
        }}
        onMouseUp={stopHolding}
        onMouseLeave={stopHolding}
        onTouchEnd={stopHolding}
        onTouchCancel={stopHolding}
      >
        {Array.from({ length: gridHeight }, (_, y) =>
          Array.from({ length: gridWidth }, (_, x) => (
            <div
              key={`${x}-${y}`}
              className={getCellClass(x, y)}
              style={{ width: cellSize, height: cellSize }}
              onClick={() => handleCellClick(x, y)}
              onMouseDown={() => startHolding(x, y)}
              onMouseEnter={() => handleCellEnter(x, y)}
              onMouseLeave={() => setHoveredCell(null)}
              onTouchStart={(e) => {
                e.preventDefault();
                startHolding(x, y);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const element = document.elementFromPoint(
                  touch.clientX,
                  touch.clientY
                );
                if (element) {
                  const cellKey = element.getAttribute("data-cell");
                  if (cellKey) {
                    const [newX, newY] = cellKey.split("-").map(Number);
                    handleCellEnter(newX, newY);
                  }
                }
              }}
              data-cell={`${x}-${y}`}
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
