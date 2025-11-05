"use client";

import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { ChallengeCategory, ChallengeDifficulty } from "./ChallengeManagement";

interface Challenge {
  _id: Id<"challenges">;
  _creationTime: number;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  content: string;
  requiredLevel: ChallengeDifficulty;
  isActive: boolean;
  order: number;
}

interface ChallengeListProps {
  challenges: Challenge[];
  onEdit: (challengeId: Id<"challenges">) => void;
  onDelete: (challengeId: Id<"challenges">) => void;
}

export function ChallengeList({
  challenges,
  onEdit,
  onDelete,
}: ChallengeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedChallenge, setExpandedChallenge] =
    useState<Id<"challenges"> | null>(null);

  // Filter challenges
  const filteredChallenges = challenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challenge.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: ChallengeCategory) => {
    const icons = {
      artifacts: "🏺",
      techniques: "🔧",
      history: "📚",
      conservation: "🛡️",
      fieldwork: "⛏️",
    };
    return icons[category];
  };

  const toggleExpanded = (challengeId: Id<"challenges">) => {
    setExpandedChallenge(
      expandedChallenge === challengeId ? null : challengeId
    );
  };

  // Group challenges by category and difficulty
  const groupedChallenges = filteredChallenges.reduce(
    (groups, challenge) => {
      const key = `${challenge.category}-${challenge.difficulty}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(challenge);
      return groups;
    },
    {} as Record<string, Challenge[]>
  );

  // Sort challenges within each group by order
  Object.keys(groupedChallenges).forEach((key) => {
    groupedChallenges[key].sort((a, b) => a.order - b.order);
  });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search */}
      <div className="p-6 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search challenges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Challenge Groups */}
      <div className="divide-y divide-gray-200">
        {Object.keys(groupedChallenges).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {challenges.length === 0
              ? "No challenges found"
              : "No challenges match your search"}
          </div>
        ) : (
          Object.entries(groupedChallenges).map(
            ([groupKey, groupChallenges]) => {
              const [category, difficulty] = groupKey.split("-") as [
                ChallengeCategory,
                ChallengeDifficulty,
              ];

              return (
                <div key={groupKey} className="p-6">
                  {/* Group Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">
                      {getCategoryIcon(category)}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {category} - {difficulty}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({groupChallenges.length} challenges)
                    </span>
                  </div>

                  {/* Challenges in Group */}
                  <div className="space-y-4">
                    {groupChallenges.map((challenge) => (
                      <div
                        key={challenge._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-base font-medium text-gray-900">
                                {challenge.title}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                                  challenge.difficulty
                                )}`}
                              >
                                {challenge.difficulty}
                              </span>
                              {!challenge.isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {challenge.description}
                            </p>

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Order: {challenge.order}</span>
                              <span>Points: {challenge.points}</span>
                              <span>Required: {challenge.requiredLevel}</span>
                              <span>
                                Created:{" "}
                                {new Date(
                                  challenge._creationTime
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => toggleExpanded(challenge._id)}
                              className="text-gray-400 hover:text-gray-600 text-sm"
                            >
                              {expandedChallenge === challenge._id ? "▼" : "▶"}
                            </button>
                            <button
                              onClick={() => onEdit(challenge._id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(challenge._id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedChallenge === challenge._id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="font-medium text-gray-900 mb-2">
                              Challenge Content
                            </h5>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                {challenge.content}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )
        )}
      </div>

      {/* Results count */}
      {filteredChallenges.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 border-t">
          Showing {filteredChallenges.length} of {challenges.length} challenges
        </div>
      )}
    </div>
  );
}
