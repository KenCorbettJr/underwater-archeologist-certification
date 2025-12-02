"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useRequireAdmin } from "@/hooks/useAdminAuth";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ApprovalsPage() {
  const adminAuth = useRequireAdmin();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const pendingApprovals = useQuery(
    api.contentVersioning.getPendingApprovals,
    {}
  );
  const reviewContent = useMutation(api.contentVersioning.reviewContent);

  const handleReview = async (
    approvalId: Id<"contentApprovals">,
    status: "approved" | "rejected"
  ) => {
    if (!adminAuth.user) return;

    try {
      await reviewContent({
        adminClerkId: adminAuth.user.id,
        approvalId,
        status,
        reviewNotes: reviewNotes[approvalId] || undefined,
      });
      setReviewNotes((prev) => {
        const updated = { ...prev };
        delete updated[approvalId];
        return updated;
      });
    } catch (error: any) {
      alert(`Failed to ${status} content: ${error.message}`);
    }
  };

  const formatResourceType = (type: string) => {
    return type
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!pendingApprovals) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading approvals...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Content Approvals
          </h1>
          <p className="text-gray-600 mt-2">
            Review and approve content changes before they go live
          </p>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All Caught Up!
            </h3>
            <p className="text-gray-600">
              There are no pending content approvals at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <div
                key={approval._id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatResourceType(approval.resourceType)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Resource ID: {approval.resourceId}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted by {approval.submittedBy} on{" "}
                      {new Date(approval.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    Pending Review
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNotes[approval._id] || ""}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({
                          ...prev,
                          [approval._id]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Add notes about your review decision..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleReview(approval._id, "rejected")}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReview(approval._id, "approved")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
