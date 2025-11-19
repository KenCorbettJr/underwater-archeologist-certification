"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SiteMapperProps {
  gridWidth: number;
  gridHeight: number;
  onPhotoTaken: (
    position: { x: number; y: number },
    angle: string,
    hasScale: boolean,
    hasNorthArrow: boolean
  ) => void;
  onMeasurementTaken: (
    position: { x: number; y: number },
    type: string,
    value: number,
    unit: string
  ) => void;
  photosTaken: Array<{
    gridPosition: { x: number; y: number };
    isValid: boolean;
  }>;
  measurements: Array<{
    gridPosition: { x: number; y: number };
    isValid: boolean;
  }>;
}

export function SiteMapper({
  gridWidth,
  gridHeight,
  onPhotoTaken,
  onMeasurementTaken,
  photosTaken,
  measurements,
}: SiteMapperProps) {
  const [selectedCell, setSelectedCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [mode, setMode] = useState<"photo" | "measurement">("photo");
  const [photoAngle, setPhotoAngle] = useState("overhead");
  const [hasScale, setHasScale] = useState(false);
  const [hasNorthArrow, setHasNorthArrow] = useState(false);
  const [measurementType, setMeasurementType] = useState("length");
  const [measurementValue, setMeasurementValue] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState("cm");

  const handleCellClick = (x: number, y: number) => {
    setSelectedCell({ x, y });
  };

  const handleTakePhoto = () => {
    if (!selectedCell) return;
    onPhotoTaken(selectedCell, photoAngle, hasScale, hasNorthArrow);
    setHasScale(false);
    setHasNorthArrow(false);
  };

  const handleRecordMeasurement = () => {
    if (!selectedCell || !measurementValue) return;
    const value = parseFloat(measurementValue);
    if (isNaN(value)) return;
    onMeasurementTaken(selectedCell, measurementType, value, measurementUnit);
    setMeasurementValue("");
  };

  const getCellContent = (x: number, y: number) => {
    const hasPhoto = photosTaken.some(
      (p) => p.gridPosition.x === x && p.gridPosition.y === y
    );
    const hasMeasurement = measurements.some(
      (m) => m.gridPosition.x === x && m.gridPosition.y === y
    );

    if (hasPhoto && hasMeasurement) return "📷📏";
    if (hasPhoto) return "📷";
    if (hasMeasurement) return "📏";
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <Button
          onClick={() => setMode("photo")}
          className={mode === "photo" ? "bg-ocean-600" : "bg-ocean-400"}
        >
          📷 Photo Mode
        </Button>
        <Button
          onClick={() => setMode("measurement")}
          className={mode === "measurement" ? "bg-ocean-600" : "bg-ocean-400"}
        >
          📏 Measurement Mode
        </Button>
      </div>

      {/* Grid */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: gridHeight }).map((_, y) =>
            Array.from({ length: gridWidth }).map((_, x) => (
              <button
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                className={`
                  aspect-square border-2 rounded flex items-center justify-center text-2xl
                  transition-all hover:scale-105
                  ${
                    selectedCell?.x === x && selectedCell?.y === y
                      ? "border-sand-400 bg-sand-400/30"
                      : "border-white/30 bg-white/5"
                  }
                `}
              >
                {getCellContent(x, y)}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      {selectedCell && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 space-y-4">
          <p className="text-white font-semibold">
            Selected: Grid [{selectedCell.x}, {selectedCell.y}]
          </p>

          {mode === "photo" && (
            <div className="space-y-3">
              <div>
                <label className="text-white text-sm block mb-2">
                  Photo Angle:
                </label>
                <select
                  value={photoAngle}
                  onChange={(e) => setPhotoAngle(e.target.value)}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                >
                  <option value="overhead">Overhead</option>
                  <option value="45-degree">45 Degree</option>
                  <option value="side">Side View</option>
                  <option value="detail">Detail Close-up</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="scale"
                  checked={hasScale}
                  onChange={(e) => setHasScale(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="scale" className="text-white text-sm">
                  Include scale reference
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="north"
                  checked={hasNorthArrow}
                  onChange={(e) => setHasNorthArrow(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="north" className="text-white text-sm">
                  Include north arrow
                </label>
              </div>

              <Button
                onClick={handleTakePhoto}
                className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900"
              >
                📷 Take Photo
              </Button>
            </div>
          )}

          {mode === "measurement" && (
            <div className="space-y-3">
              <div>
                <label className="text-white text-sm block mb-2">
                  Measurement Type:
                </label>
                <select
                  value={measurementType}
                  onChange={(e) => setMeasurementType(e.target.value)}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                >
                  <option value="length">Length</option>
                  <option value="width">Width</option>
                  <option value="depth">Depth</option>
                  <option value="distance">Distance</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={measurementValue}
                  onChange={(e) => setMeasurementValue(e.target.value)}
                  placeholder="Value"
                  className="flex-1 p-2 rounded bg-white/20 text-white border border-white/30"
                  step="0.1"
                  min="0"
                />
                <select
                  value={measurementUnit}
                  onChange={(e) => setMeasurementUnit(e.target.value)}
                  className="p-2 rounded bg-white/20 text-white border border-white/30"
                >
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                </select>
              </div>

              <Button
                onClick={handleRecordMeasurement}
                className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900"
              >
                📏 Record Measurement
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <p className="text-white font-semibold mb-2">Legend:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
          <div>📷 = Photo taken</div>
          <div>📏 = Measurement recorded</div>
          <div>📷📏 = Both completed</div>
        </div>
      </div>
    </div>
  );
}
