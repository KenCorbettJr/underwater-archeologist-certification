"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

type CertificationLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "certified";

interface CertificationManagementProps {
  onUpdateCertification: (
    userId: Id<"users">,
    newLevel: CertificationLevel,
    reason?: string
  ) => void;
}

export function CertificationManagement({
  onUpdateCertification,
}: CertificationManagementProps) {
  const certificationCandidates = useQuery(
    api.adminUsers.getCertificationCandidates,
    {}
  );

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

  const getProgressPercentage = (earned: number, required: number) => {
    return Math.min(100, (earned / required) * 100);
  };

  if (!certificationCandidates) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading certification data...</p>
      </div>
    );
  }

  const eligibleCandidates = certificationCandidates.filter(
    (c) => c.isEligible && !c.isCertified
  );
  const certifiedStudents = certificationCandidates.filter(
    (c) => c.isCertified
  );
  const inProgressStudents = certificationCandidates.filter(
    (c) => !c.isEligible && !c.isCertified
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-green-600">
            {eligibleCandidates.length}
          </div>
          <div className="text-sm text-gray-600">Ready for Certification</div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">
            {certifiedStudents.length}
          </div>
          <div className="text-sm text-gray-600">Already Certified</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="text-3xl font-bold text-yellow-600">
            {inProgressStudents.length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
      </div>

      {/* Eligible for Certification */}
      {eligibleCandidates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-green-700">
              🎉 Ready for Certification ({eligibleCandidates.length})
            </h3>
            <p className="text-sm text-gray-600">
              Students who have met all requirements and can be certified
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {eligibleCandidates.map((candidate) => (
              <div key={candidate.user._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-base font-medium text-gray-900">
                        {candidate.user.name}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCertificationColor(
                          candidate.user.certificationLevel
                        )}`}
                      >
                        {candidate.user.certificationLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {candidate.user.email}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Points
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {candidate.requirementsProgress.pointsEarned.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Required:{" "}
                          {candidate.requirementsProgress.pointsRequired.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Challenges
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {candidate.requirementsProgress.challengesCompleted}
                        </div>
                        <div className="text-xs text-gray-500">
                          Required:{" "}
                          {candidate.requirementsProgress.challengesRequired}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() =>
                        onUpdateCertification(
                          candidate.user._id,
                          "certified",
                          "Met all certification requirements"
                        )
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Certify Student
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Already Certified */}
      {certifiedStudents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-blue-700">
              🏆 Certified Students ({certifiedStudents.length})
            </h3>
            <p className="text-sm text-gray-600">
              Students who have successfully completed certification
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {certifiedStudents.slice(0, 10).map((candidate) => (
              <div key={candidate.user._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="text-base font-medium text-gray-900">
                        {candidate.user.name}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Certified
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {candidate.user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.user.totalPoints.toLocaleString()} points
                    </div>
                    <div className="text-xs text-gray-500">
                      {candidate.user.completedChallenges.length} challenges
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {certifiedStudents.length > 10 && (
              <div className="p-4 text-center text-sm text-gray-500">
                ... and {certifiedStudents.length - 10} more certified students
              </div>
            )}
          </div>
        </div>
      )}

      {/* In Progress */}
      {inProgressStudents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-yellow-700">
              📚 Working Towards Certification ({inProgressStudents.length})
            </h3>
            <p className="text-sm text-gray-600">
              Students making progress but not yet eligible for certification
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {inProgressStudents.slice(0, 10).map((candidate) => (
              <div key={candidate.user._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-base font-medium text-gray-900">
                        {candidate.user.name}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCertificationColor(
                          candidate.user.certificationLevel
                        )}`}
                      >
                        {candidate.user.certificationLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {candidate.user.email}
                    </p>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Points Progress</span>
                          <span>
                            {candidate.requirementsProgress.pointsEarned.toLocaleString()}{" "}
                            /{" "}
                            {candidate.requirementsProgress.pointsRequired.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${getProgressPercentage(
                                candidate.requirementsProgress.pointsEarned,
                                candidate.requirementsProgress.pointsRequired
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Challenges Progress</span>
                          <span>
                            {candidate.requirementsProgress.challengesCompleted}{" "}
                            /{" "}
                            {candidate.requirementsProgress.challengesRequired}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${getProgressPercentage(
                                candidate.requirementsProgress
                                  .challengesCompleted,
                                candidate.requirementsProgress
                                  .challengesRequired
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {inProgressStudents.length > 10 && (
              <div className="p-4 text-center text-sm text-gray-500">
                ... and {inProgressStudents.length - 10} more students in
                progress
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
