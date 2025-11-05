"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

type CertificationLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "certified";

interface UserDetailsProps {
  userId: Id<"users">;
  onBack: () => void;
  onUpdateCertification: (
    userId: Id<"users">,
    newLevel: CertificationLevel,
    reason?: string
  ) => void;
}

export function UserDetails({
  userId,
  onBack,
  onUpdateCertification,
}: UserDetailsProps) {
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [newCertificationLevel, setNewCertificationLevel] =
    useState<CertificationLevel>("beginner");
  const [certificationReason, setCertificationReason] = useState("");

  const userDetails = useQuery(api.adminUsers.getStudentDetails, { userId });

  const getCertificationColor = (level: CertificationLevel) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      case "certified":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateCertification = async () => {
    await onUpdateCertification(
      userId,
      newCertificationLevel,
      certificationReason
    );
    setShowCertificationModal(false);
    setCertificationReason("");
  };

  if (!userDetails) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading user details...</p>
      </div>
    );
  }

  const { user, progressSummary, certificationStatus } = userDetails;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          ← Back to Students
        </button>
        <button
          onClick={() => {
            setNewCertificationLevel(user.certificationLevel);
            setShowCertificationModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Update Certification
        </button>
      </div>

      {/* User Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            {user.school && <p className="text-gray-500">{user.school}</p>}
            {user.age && <p className="text-gray-500">Age: {user.age}</p>}
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCertificationColor(
                user.certificationLevel
              )}`}
            >
              {user.certificationLevel}
            </span>
            <div className="text-sm text-gray-500 mt-1">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">
            {user.totalPoints.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Points</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-green-600">
            {user.completedChallenges.length}
          </div>
          <div className="text-sm text-gray-600">Challenges Completed</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">
            {progressSummary.completedSessions}
          </div>
          <div className="text-sm text-gray-600">Game Sessions</div>
        </div>
        <div className="bg-indigo-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-indigo-600">
            {progressSummary.averageScore}
          </div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>
      </div>

      {/* Detailed Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Game Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total sessions:</span>
              <span className="font-medium">
                {progressSummary.totalGameSessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed sessions:</span>
              <span className="font-medium">
                {progressSummary.completedSessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active sessions:</span>
              <span className="font-medium">
                {progressSummary.activeSessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time spent:</span>
              <span className="font-medium">
                {progressSummary.totalTimeSpent} minutes
              </span>
            </div>
            {progressSummary.lastActivity && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last activity:</span>
                <span className="font-medium">
                  {new Date(progressSummary.lastActivity).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Challenge Progress */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Challenge Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-green-600">
                {progressSummary.challengeProgress.completed}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In progress:</span>
              <span className="font-medium text-yellow-600">
                {progressSummary.challengeProgress.inProgress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Not started:</span>
              <span className="font-medium text-gray-600">
                {progressSummary.challengeProgress.notStarted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Certification Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Certification Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    certificationStatus.isEligible
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></span>
                <span className="font-medium">
                  {certificationStatus.isEligible
                    ? "Eligible for certification"
                    : "Not eligible yet"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    certificationStatus.isCertified
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                ></span>
                <span className="font-medium">
                  {certificationStatus.isCertified
                    ? "Certified"
                    : "Not certified"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Requirements Progress</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Points</span>
                  <span>
                    {certificationStatus.requirementsProgress.pointsEarned} /{" "}
                    {certificationStatus.requirementsProgress.pointsRequired}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (certificationStatus.requirementsProgress.pointsEarned /
                          certificationStatus.requirementsProgress
                            .pointsRequired) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Challenges</span>
                  <span>
                    {
                      certificationStatus.requirementsProgress
                        .challengesCompleted
                    }{" "}
                    /{" "}
                    {
                      certificationStatus.requirementsProgress
                        .challengesRequired
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (certificationStatus.requirementsProgress
                          .challengesCompleted /
                          certificationStatus.requirementsProgress
                            .challengesRequired) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certification Update Modal */}
      {showCertificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Update Certification Level
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Certification Level
                </label>
                <select
                  value={newCertificationLevel}
                  onChange={(e) =>
                    setNewCertificationLevel(
                      e.target.value as CertificationLevel
                    )
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="certified">Certified</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={certificationReason}
                  onChange={(e) => setCertificationReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for certification level change..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCertificationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCertification}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
