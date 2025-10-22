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
    <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📋 Site Documentation
        </h3>
        <div className="text-sm text-gray-600">{entries.length} entries</div>
      </div>

      {/* Documentation progress */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Required Documentation</span>
          <span className="text-sm">
            {completedRequired}/{requiredEntries.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "add"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Add Entry
        </button>
        <button
          onClick={() => setActiveTab("view")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "view"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          View Entries ({entries.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "add" && (
          <div className="space-y-4">
            {/* Selected position indicator */}
            {selectedCell && (
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <div className="text-sm font-medium text-green-800">
                  Selected Position: ({selectedCell.x}, {selectedCell.y})
                </div>
              </div>
            )}

            {/* Entry type selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    X Position
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
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Y Position
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
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Content input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
                disabled={disabled}
                placeholder={getPlaceholderText(newEntry.entryType)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Add button */}
            <button
              onClick={handleAddEntry}
              disabled={disabled || !newEntry.content.trim()}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Documentation Entry
            </button>
          </div>
        )}

        {activeTab === "view" && (
          <div className="space-y-3 overflow-y-auto max-h-96">
            {entries.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📋</div>
                <div>No documentation entries yet</div>
                <div className="text-sm">Start by adding your first entry</div>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getEntryIcon(entry.entryType)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEntryTypeColor(entry.entryType)}`}
                      >
                        {entry.entryType}
                      </span>
                      {entry.isRequired && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    Position: ({entry.gridPosition.x}, {entry.gridPosition.y})
                  </div>

                  <div className="text-sm">{entry.content}</div>

                  {entry.artifactId && (
                    <div className="mt-2 text-xs text-blue-600">
                      Related to artifact: {entry.artifactId}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Documentation guidelines */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-t">
        <h4 className="font-medium text-sm mb-2">
          📖 Documentation Guidelines
        </h4>
        <ul className="text-xs space-y-1 text-yellow-800">
          <li>• Record all artifact discoveries with precise locations</li>
          <li>• Take measurements before moving any artifacts</li>
          <li>• Document excavation methods and conditions</li>
          <li>• Note any unusual findings or observations</li>
          <li>• Photograph artifacts in situ before removal</li>
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
