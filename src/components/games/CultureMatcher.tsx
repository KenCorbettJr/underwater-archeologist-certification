"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";

interface Artifact {
  _id: Id<"gameArtifacts">;
  name: string;
  description: string;
  culture: string;
  historicalPeriod: string;
  imageUrl: string;
}

interface CultureMatch {
  artifactId: Id<"gameArtifacts">;
  selectedCulture: string;
  correctCulture: string;
  isCorrect: boolean;
}

interface CultureMatcherProps {
  artifacts: Artifact[];
  matches: CultureMatch[];
  onSubmitMatch: (artifactId: Id<"gameArtifacts">, culture: string) => void;
}

export function CultureMatcher({
  artifacts,
  matches,
  onSubmitMatch,
}: CultureMatcherProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  );
  const [selectedCulture, setSelectedCulture] = useState<string>("");

  const cultures = [
    "Ancient Greek",
    "Roman",
    "Viking",
    "Spanish Colonial",
    "Industrial",
    "Egyptian",
    "Phoenician",
    "Byzantine",
  ];

  const handleSubmit = () => {
    if (!selectedArtifact || !selectedCulture) return;
    onSubmitMatch(selectedArtifact._id, selectedCulture);
    setSelectedArtifact(null);
    setSelectedCulture("");
  };

  const getMatchStatus = (artifactId: Id<"gameArtifacts">) => {
    return matches.find((m) => m.artifactId === artifactId);
  };

  const unmatchedArtifacts = artifacts.filter(
    (a) => !matches.some((m) => m.artifactId === a._id)
  );

  const correctMatches = matches.filter((m) => m.isCorrect).length;
  const totalMatches = matches.length;

  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">🎯 Culture Matching</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-sand-400">
              {correctMatches} / {artifacts.length}
            </div>
            <div className="text-white/60 text-sm">Correct Matches</div>
          </div>
        </div>
      </div>

      {/* Artifact Selection */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3">
          Select an Artifact to Match:
        </h4>
        <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {unmatchedArtifacts.map((artifact) => (
            <button
              key={artifact._id}
              onClick={() => setSelectedArtifact(artifact)}
              className={`
                p-4 rounded-lg text-left transition-all border-2
                ${
                  selectedArtifact?._id === artifact._id
                    ? "bg-sand-400/30 border-sand-400"
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                }
              `}
            >
              <h5 className="text-white font-semibold mb-1">{artifact.name}</h5>
              <p className="text-white/70 text-sm mb-2">
                {artifact.description}
              </p>
              <span className="text-ocean-300 text-xs">
                {artifact.historicalPeriod}
              </span>
            </button>
          ))}

          {unmatchedArtifacts.length === 0 && (
            <div className="col-span-2 text-center py-8 text-white/60">
              All artifacts matched! Check your results below.
            </div>
          )}
        </div>
      </div>

      {/* Culture Selection */}
      {selectedArtifact && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">
            Match "{selectedArtifact.name}" to a Culture:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {cultures.map((culture) => (
              <button
                key={culture}
                onClick={() => setSelectedCulture(culture)}
                className={`
                  p-3 rounded-lg text-sm font-medium transition-all
                  ${
                    selectedCulture === culture
                      ? "bg-sand-400 text-sand-900"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }
                `}
              >
                {culture}
              </button>
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCulture}
            className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900 disabled:opacity-50"
          >
            Submit Match
          </Button>
        </div>
      )}

      {/* Results */}
      {matches.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">Your Matches:</h4>
          <div className="space-y-2">
            {matches.map((match) => {
              const artifact = artifacts.find(
                (a) => a._id === match.artifactId
              );
              if (!artifact) return null;

              return (
                <div
                  key={match.artifactId}
                  className={`
                    p-3 rounded-lg border-2
                    ${
                      match.isCorrect
                        ? "bg-green-500/20 border-green-400"
                        : "bg-red-500/20 border-red-400"
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-white font-semibold mb-1">
                        {artifact.name}
                      </h5>
                      <div className="text-sm">
                        <span className="text-white/70">Your answer: </span>
                        <span
                          className={
                            match.isCorrect ? "text-green-400" : "text-red-400"
                          }
                        >
                          {match.selectedCulture}
                        </span>
                      </div>
                      {!match.isCorrect && (
                        <div className="text-sm mt-1">
                          <span className="text-white/70">
                            Correct answer:{" "}
                          </span>
                          <span className="text-green-400">
                            {match.correctCulture}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-2xl">
                      {match.isCorrect ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-ocean-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">💡 Tips:</h4>
        <ul className="text-white/80 text-sm space-y-1">
          <li>• Read the artifact description carefully</li>
          <li>• Consider the historical period mentioned</li>
          <li>• Think about the cultural context and trade routes</li>
          <li>• Use the historical context cards for reference</li>
        </ul>
      </div>
    </div>
  );
}
