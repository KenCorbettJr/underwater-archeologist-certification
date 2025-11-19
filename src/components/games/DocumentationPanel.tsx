"use client";

import React, { useState } from "react";
import { DocumentationEntry, GridCell } from "../../types";
import { Id } from "../../../convex/_generated/dataModel";

interface DocumentationPanelProps {
  entries: DocumentationEntry[];
  selectedCell?: { x: number; y: number };
  onAddEntry: (entry: Omit<DocumentationEntry, "id" | "timestamp">) => void;
  disabled?: boolean;
}

export default function DocumentationPanel({
  entries,
  selectedCell,
  onAddEntry,
  disabled = false,
}: DocumentationPanelProps) {
  const [activeTab, setActiveTab] = useState<"add" | "view">("add");
  const [newEntry, setNewEntry] = useState({
    entryType: "note" as DocumentationEntry["entryType"],
    content: "",
    gridPosition: { x: 0, y: 0 },
    isRequired: false,
    isComplete: false,
  });

  const handleAddEntry = () => {
    if (!newEntry.content.trim()) return;

    const position = selectedCell || newEntry.gridPosition;

    onAddEntry({
      ...newEntry,
      gridPosition: position,
      isComplete: true,
    });

    // Reset form
    setNewEntry({
      entryType: "note",
      content: "",
      gridPosition: position,
      isRequired: false,
      isComplete: false,
    });
  };

  const getEntryIcon = (type: DocumentationEntry["entryType"]): string => {
    const icons = {
      discovery: "🔍",
      measurement: "📏",
      photo: "📷",
      note: "📝",
      sample: "🧪",
    };
    return icons[type] || "📝";
  };

  const getEntryTypeColor = (type: DocumentationEntry["entryType"]): string => {
    const colors = {
      discovery: "bg-yellow-100 text-yellow-800",
      measurement: "bg-blue-100 text-blue-800",
      photo: "bg-purple-100 text-purple-800",
      note: "bg-gray-100 text-gray-800",
      sample: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const requiredEntries = entries.filter((e) => e.isRequired);
  const completedRequired = requiredEntries.filter((e) => e.isComplete).length;
  const completionPercentage =
    requiredEntries.length > 0
      ? (completedRequired / requiredEntries.length) * 100
      : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2 text-white">
          📋 Documentation
        </h3>
        <div className="text-xs text-ocean-100">{entries.length} entries</div>
      </div>

      {/* Documentation progress */}
      <div className="mb-3 p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-white">Required</span>
          <span className="text-xs text-ocean-100">
            {completedRequired}/{requiredEntries.length}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-1.5">
          <div
            className="bg-sand-400 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-white/20 mb-3">
        <button
          onClick={() => setActiveTab("add")}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "add"
              ? "border-sand-400 text-white"
              : "border-transparent text-ocean-100 hover:text-white"
          }`}
        >
          Add Entry
        </button>
        <button
          onClick={() => setActiveTab("view")}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "view"
              ? "border-sand-400 text-white"
              : "border-transparent text-ocean-100 hover:text-white"
          }`}
        >
          View ({entries.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "add" && (
          <div className="space-y-2.5">
            {/* Selected position indicator */}
            {selectedCell && (
              <div className="p-2 bg-green-500/20 rounded border border-green-400/30">
                <div className="text-xs font-medium text-green-300">
                  Position: ({selectedCell.x}, {selectedCell.y})
                </div>
              </div>
            )}

            {/* Entry type selection */}
            <div>
              <label className="block text-xs font-medium text-white mb-1">
                Entry Type
              </label>
              <select
                value={newEntry.entryType}
                onChange={(e) =>
                  setNewEntry({
                    ...newEntry,
                    entryType: e.target
                      .value as DocumentationEntry["entryType"],
                  })
                }
                disabled={disabled}
                className="w-full p-1.5 text-xs border border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-sand-400 focus:border-sand-400"
              >
                <option value="discovery">🔍 Discovery</option>
                <option value="measurement">📏 Measurement</option>
                <option value="photo">📷 Photo</option>
                <option value="note">📝 Note</option>
                <option value="sample">🧪 Sample</option>
              </select>
            </div>

            {/* Position input (if no cell selected) */}
            {!selectedCell && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-white mb-1">
                    X
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newEntry.gridPosition.x}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        gridPosition: {
                          ...newEntry.gridPosition,
                          x: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    disabled={disabled}
                    className="w-full p-1.5 text-xs border border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-sand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white mb-1">
                    Y
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newEntry.gridPosition.y}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        gridPosition: {
                          ...newEntry.gridPosition,
                          y: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    disabled={disabled}
                    className="w-full p-1.5 text-xs border border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-sand-400"
                  />
                </div>
              </div>
            )}

            {/* Content input */}
            <div>
              <label className="block text-xs font-medium text-white mb-1">
                Content
              </label>
              <textarea
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
                disabled={disabled}
                placeholder={getPlaceholderText(newEntry.entryType)}
                rows={3}
                className="w-full p-1.5 text-xs border border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-sand-400 placeholder-ocean-200"
              />
            </div>

            {/* Add button */}
            <button
              onClick={handleAddEntry}
              disabled={disabled || !newEntry.content.trim()}
              className="w-full py-1.5 px-3 text-xs bg-sand-400 text-sand-900 rounded-md hover:bg-sand-500 disabled:bg-white/20 disabled:text-ocean-200 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add Entry
            </button>
          </div>
        )}

        {activeTab === "view" && (
          <div className="space-y-2 overflow-y-auto max-h-80">
            {entries.length === 0 ? (
              <div className="text-center text-ocean-100 py-6">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-xs">No entries yet</div>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2 border border-white/20 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">
                        {getEntryIcon(entry.entryType)}
                      </span>
                      <span className="text-xs text-white font-medium">
                        {entry.entryType}
                      </span>
                      {entry.isRequired && (
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ocean-200">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>

                  <div className="text-xs text-ocean-100 mb-1">
                    ({entry.gridPosition.x}, {entry.gridPosition.y})
                  </div>

                  <div className="text-xs text-white">{entry.content}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Documentation guidelines */}
      <div className="mt-3 p-2 bg-white/10 rounded-lg backdrop-blur-sm border-t border-white/20">
        <h4 className="font-medium text-xs mb-1 text-white">📖 Guidelines</h4>
        <ul className="text-xs space-y-0.5 text-ocean-100">
          <li>• Record discoveries with locations</li>
          <li>• Measure before moving artifacts</li>
          <li>• Document methods & conditions</li>
        </ul>
      </div>
    </div>
  );
}

function getPlaceholderText(
  entryType: DocumentationEntry["entryType"]
): string {
  const placeholders = {
    discovery: "Describe the artifact found, its condition, and context...",
    measurement:
      "Record dimensions, depth, orientation, and other measurements...",
    photo: "Describe the photo taken, angle, lighting conditions...",
    note: "General observations, methods used, environmental conditions...",
    sample: "Describe sample taken, location, purpose, and storage method...",
  };
  return placeholders[entryType] || "Enter your documentation here...";
}
