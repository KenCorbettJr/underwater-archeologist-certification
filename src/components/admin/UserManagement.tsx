"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRequireAdmin } from "@/hooks/useAdminAuth";
import { UserList } from "./UserList";
import { UserDetails } from "./UserDetails";
import { CertificationManagement } from "./CertificationManagement";
import { Id } from "../../../convex/_generated/dataModel";

type CertificationLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "certified";

export function UserManagement() {
  const adminAuth = useRequireAdmin();
  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "certifications"
  >("overview");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  const progressSummary = useQuery(
    api.adminUsers.getStudentProgressSummary,
    {}
  );
  const searchResults = useQuery(
    api.adminUsers.searchStudents,
    searchTerm.length >= 2 ? { searchTerm, limit: 10 } : "skip"
  );

  const updateCertificationLevel = useMutation(
    api.adminUsers.updateStudentCertificationLevel
  );

  const handleUpdateCertification = async (
    userId: Id<"users">,
    newLevel: CertificationLevel,
    reason?: string
  ) => {
    if (!adminAuth.user) return;

    try {
      await updateCertificationLevel({
        adminClerkId: adminAuth.user.id,
        userId,
        newLevel,
        reason,
      });
    } catch (error) {
      console.error("Failed to update certification level:", error);
      alert("Failed to update certification level");
    }
  };

  if (!progressSummary) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading user data...</p>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "students", name: "Students", icon: "👥" },
    { id: "certifications", name: "Certifications", icon: "🏆" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {searchResults && searchResults.length > 0 && (
            <div className="absolute z-10 mt-12 w-full bg-white border border-gray-200 rounded-md shadow-lg">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    setSelectedUserId(user._id);
                    setSearchTerm("");
                    setActiveTab("students");
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">
                    {user.email} • {user.totalPoints} points •{" "}
                    {user.certificationLevel}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {progressSummary.totalStudents}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {progressSummary.engagementStats.activeLastWeek}
                  </div>
                  <div className="text-sm text-gray-600">Active This Week</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {progressSummary.certificationStats.certified}
                  </div>
                  <div className="text-sm text-gray-600">
                    Certified Students
                  </div>
                </div>
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600">
                    {progressSummary.engagementStats.averageSessionsPerStudent}
                  </div>
                  <div className="text-sm text-gray-600">
                    Avg Sessions/Student
                  </div>
                </div>
              </div>

              {/* Certification Levels */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">
                  Students by Certification Level
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {progressSummary.byCertificationLevel.beginner}
                    </div>
                    <div className="text-sm text-gray-600">Beginner</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {progressSummary.byCertificationLevel.intermediate}
                    </div>
                    <div className="text-sm text-gray-600">Intermediate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {progressSummary.byCertificationLevel.advanced}
                    </div>
                    <div className="text-sm text-gray-600">Advanced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {progressSummary.byCertificationLevel.certified}
                    </div>
                    <div className="text-sm text-gray-600">Certified</div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
                <div className="space-y-3">
                  {progressSummary.topPerformers
                    .slice(0, 5)
                    .map((performer, index) => (
                      <div
                        key={performer.userId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{performer.name}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {performer.certificationLevel}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {performer.totalPoints}
                          </div>
                          <div className="text-sm text-gray-500">points</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Engagement</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active last week:</span>
                      <span className="font-medium">
                        {progressSummary.engagementStats.activeLastWeek}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active last month:</span>
                      <span className="font-medium">
                        {progressSummary.engagementStats.activeLastMonth}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Total game sessions:
                      </span>
                      <span className="font-medium">
                        {progressSummary.engagementStats.totalGameSessions}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Certification</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Eligible for certification:
                      </span>
                      <span className="font-medium">
                        {progressSummary.certificationStats.eligible}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Already certified:</span>
                      <span className="font-medium">
                        {progressSummary.certificationStats.certified}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certification rate:</span>
                      <span className="font-medium">
                        {progressSummary.certificationStats.certificationRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === "students" && (
            <div>
              {selectedUserId ? (
                <UserDetails
                  userId={selectedUserId}
                  onBack={() => setSelectedUserId(null)}
                  onUpdateCertification={handleUpdateCertification}
                />
              ) : (
                <UserList
                  onSelectUser={setSelectedUserId}
                  onUpdateCertification={handleUpdateCertification}
                />
              )}
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === "certifications" && (
            <CertificationManagement
              onUpdateCertification={handleUpdateCertification}
            />
          )}
        </div>
      </div>
    </div>
  );
}
