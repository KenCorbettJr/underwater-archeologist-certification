import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  getDeviceInfo,
  formatProgressForBackup,
  SyncStatus,
} from "../lib/progressSync";

/**
 * Hook for managing progress synchronization and backups
 */
export function useProgressSync(userId: Id<"users"> | undefined) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    isSyncing: false,
    syncError: null,
  });

  // Queries
  const overallProgress = useQuery(
    api.progressTracking.getOverallProgress,
    userId ? { userId } : "skip"
  );
  const gameProgress = useQuery(
    api.progressTracking.getGameProgress,
    userId ? { userId } : "skip"
  );
  const backups = useQuery(
    api.progressTracking.getUserBackups,
    userId ? { userId, limit: 10 } : "skip"
  );

  // Mutations
  const createBackup = useMutation(api.progressTracking.createProgressBackup);
  const syncProgress = useMutation(api.progressTracking.syncProgress);
  const restoreFromBackup = useMutation(
    api.progressTracking.restoreProgressFromBackup
  );

  /**
   * Create a manual backup
   */
  const createManualBackup = useCallback(async () => {
    if (!userId || !overallProgress || !gameProgress) {
      throw new Error("Cannot create backup: missing data");
    }

    try {
      const backupData = formatProgressForBackup(overallProgress, gameProgress);
      const deviceInfo = getDeviceInfo();

      await createBackup({
        userId,
        backupData,
        backupType: "manual",
        deviceInfo,
      });

      return { success: true, message: "Backup created successfully" };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create backup: ${error}`,
      };
    }
  }, [userId, overallProgress, gameProgress, createBackup]);

  /**
   * Sync progress across devices
   */
  const performSync = useCallback(async () => {
    if (!userId) {
      throw new Error("Cannot sync: no user ID");
    }

    setSyncStatus((prev) => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      const deviceInfo = getDeviceInfo();
      const result = await syncProgress({ userId, deviceInfo });

      setSyncStatus({
        lastSyncTime: result.lastSyncTime,
        isSyncing: false,
        syncError: result.success ? null : result.message,
      });

      return result;
    } catch (error) {
      const errorMessage = `Sync failed: ${error}`;
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));
      return {
        success: false,
        message: errorMessage,
        lastSyncTime: Date.now(),
      };
    }
  }, [userId, syncProgress]);

  /**
   * Restore progress from a backup
   */
  const restoreProgress = useCallback(
    async (backupId: Id<"progressBackups">) => {
      try {
        const result = await restoreFromBackup({ backupId });
        return result;
      } catch (error) {
        return {
          success: false,
          message: `Failed to restore: ${error}`,
        };
      }
    },
    [restoreFromBackup]
  );

  /**
   * Auto-sync on mount and periodically
   */
  useEffect(() => {
    if (!userId) return;

    // Initial sync
    performSync();

    // Auto-sync every 5 minutes
    const interval = setInterval(
      () => {
        performSync();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [userId, performSync]);

  /**
   * Auto-backup on significant progress changes
   */
  useEffect(() => {
    if (!userId || !overallProgress || !gameProgress) return;

    // Create automatic backup when overall completion increases by 5% or more
    const lastBackup = backups?.[0];
    if (lastBackup && lastBackup.backupType === "automatic") {
      try {
        const lastBackupData = JSON.parse(lastBackup.backupData);
        const lastCompletion =
          lastBackupData.overallProgress?.overallCompletion || 0;
        const currentCompletion = overallProgress.overallCompletion || 0;

        if (currentCompletion - lastCompletion >= 5) {
          const backupData = formatProgressForBackup(
            overallProgress,
            gameProgress
          );
          const deviceInfo = getDeviceInfo();

          createBackup({
            userId,
            backupData,
            backupType: "automatic",
            deviceInfo,
          });
        }
      } catch (error) {
        console.error("Failed to create automatic backup:", error);
      }
    }
  }, [userId, overallProgress, gameProgress, backups, createBackup]);

  return {
    syncStatus,
    backups,
    createManualBackup,
    performSync,
    restoreProgress,
    isLoading: overallProgress === undefined || gameProgress === undefined,
  };
}
