"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRequireAdmin } from "@/hooks/useAdminAuth";
import { Id } from "../../../convex/_generated/dataModel";

interface ContentVersioningProps {
  resourceType: "gameArtifacts" | "excavationSites" | "challenges";
  resourceId: string;
}

export function ContentVersioning({
  resourceType,
  resourceId,
}: ContentVersioningProps) {
  const adminAuth = useRequireAdmin();
  const [showVersions, setShowVersions] = useState(false);

  const versions = useQuery(api.contentVersioning.getContentVersions, {
    resourceType,
    resourceId,
  });

  const revertToVersion = useMutation(api.contentVersioning.revertToVersion);

  const handleRevert = async (versionId: Id<"contentVersions">) => {
    if (!adminAuth.user) return;

    if (confirm("Are you sure you want to revert to this version?")) {
      try {
        await revertToVersion({
          adminClerkId: adminAuth.user.id,
          versionId,
        });
        alert("Successfully reverted to previous version");
      } catch (error: any) {
        alert(`Failed to revert: ${error.message}`);
      }
    }
  };

  if (!versions) {
    return <div className="text-sm text-gray-500">Loading versions...</div>;
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <button
        onClick={() => setShowVersions(!showVersions)}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {showVersions ? "Hide" : "Show"} Version History ({versions.length})
      </button>

      {showVersions && (
        <div className="mt-4 space-y-3">
          {versions.map((version) => (
            <div
              key={version._id}
              className={`p-4 rounded-lg border ${
                version.isCurrentVersion
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      Version {version.version}
                    </span>
                    {version.isCurrentVersion && (
                      <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                        Current
                      </span>
                    )}
                  </div>
                  {version.changeDescription && (
                    <p className="text-sm text-gray-600 mt-1">
                      {version.changeDescription}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(version.timestamp).toLocaleString()} by{" "}
                    {version.changedBy}
                  </p>
                </div>

                {!version.isCurrentVersion && (
                  <button
                    onClick={() => handleRevert(version._id)}
                    className="ml-4 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
