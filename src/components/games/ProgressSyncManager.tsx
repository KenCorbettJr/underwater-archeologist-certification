"use client";

import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useProgressSync } from "../../hooks/useProgressSync";
import {
  formatBackupDate,
  getBackupTypeLabel,
  getTimeSinceSync,
} from "../../lib/progressSync";

interface ProgressSyncManagerProps {
  userId: Id<"users">;
}

export function ProgressSyncManager({ userId }: ProgressSyncManagerProps) {
  const {
    syncStatus,
    backups,
    createManualBackup,
    performSync,
    restoreProgress,
    isLoading,
  } = useProgressSync(userId);

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackupId, setSelectedBackupId] =
    useState<Id<"progressBackups"> | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setMessage(null);

    try {
      const result = await createManualBackup();
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `Failed to create backup: ${error}`,
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleSync = async () => {
    setMessage(null);
    try {
      const result = await performSync();
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `Sync failed: ${error}`,
      });
    }
  };

  const handleRestore = async (backupId: Id<"progressBackups">) => {
    if (
      !confirm(
        "Are you sure you want to restore from this backup? This will overwrite your current progress."
      )
    ) {
      return;
    }

    setIsRestoring(true);
    setSelectedBackupId(backupId);
    setMessage(null);

    try {
      const result = await restoreProgress(backupId);
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `Failed to restore: ${error}`,
      });
    } finally {
      setIsRestoring(false);
      setSelectedBackupId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Loading sync status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Sync Status</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Last Sync:</span>
            <span className="font-medium">
              {getTimeSinceSync(syncStatus.lastSyncTime)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span
              className={`font-medium ${
                syncStatus.isSyncing
                  ? "text-blue-600"
                  : syncStatus.syncError
                    ? "text-red-600"
                    : "text-green-600"
              }`}
            >
              {syncStatus.isSyncing
                ? "Syncing..."
                : syncStatus.syncError
                  ? "Error"
                  : "Synced"}
            </span>
          </div>

          {syncStatus.syncError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {syncStatus.syncError}
            </div>
          )}

          <button
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {syncStatus.isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {/* Manual Backup */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Manual Backup</h3>

        <p className="text-gray-600 mb-4">
          Create a manual backup of your current progress. Automatic backups are
          created periodically.
        </p>

        <button
          onClick={handleCreateBackup}
          disabled={isCreatingBackup}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isCreatingBackup ? "Creating Backup..." : "Create Backup"}
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Backup History */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Backup History</h3>

        {!backups || backups.length === 0 ? (
          <p className="text-gray-600">No backups available</p>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup._id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {getBackupTypeLabel(backup.backupType)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatBackupDate(backup.backupDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(backup._id)}
                    disabled={isRestoring && selectedBackupId === backup._id}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRestoring && selectedBackupId === backup._id
                      ? "Restoring..."
                      : "Restore"}
                  </button>
                </div>

                {backup.deviceInfo && (
                  <p className="text-xs text-gray-500 mt-2">
                    Device: {JSON.parse(backup.deviceInfo).platform}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-bold text-blue-900 mb-2">
          About Progress Synchronization
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your progress is automatically synced across all devices</li>
          <li>
            • Automatic backups are created when you make significant progress
          </li>
          <li>• You can restore from any backup if needed</li>
          <li>
            • Sync happens every 5 minutes and when you complete activities
          </li>
        </ul>
      </div>
    </div>
  );
}
