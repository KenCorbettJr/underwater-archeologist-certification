import { Id } from "../../convex/_generated/dataModel";

/**
 * Progress synchronization utilities for client-side operations
 */

export interface ProgressBackupData {
  overallProgress: {
    overallCompletion: number;
    certificationStatus: "not_eligible" | "eligible" | "certified";
    lastActivity: number;
    totalGameTime: number;
    totalScore: number;
  } | null;
  gameProgress: Array<{
    gameType:
      | "artifact_identification"
      | "excavation_simulation"
      | "site_documentation"
      | "historical_timeline"
      | "conservation_lab";
    completedLevels: number;
    totalLevels: number;
    bestScore: number;
    averageScore: number;
    timeSpent: number;
    lastPlayed: number;
    achievements: string[];
  }>;
  syncTime: number;
}

export interface SyncStatus {
  lastSyncTime: number | null;
  isSyncing: boolean;
  syncError: string | null;
}

/**
 * Get device information for backup tracking
 */
export function getDeviceInfo(): string {
  const info = {
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
    language: typeof navigator !== "undefined" ? navigator.language : "unknown",
    timestamp: Date.now(),
  };
  return JSON.stringify(info);
}

/**
 * Format progress data for backup
 */
export function formatProgressForBackup(
  overallProgress: any,
  gameProgress: any[]
): string {
  const backupData: ProgressBackupData = {
    overallProgress: overallProgress || null,
    gameProgress: gameProgress || [],
    syncTime: Date.now(),
  };
  return JSON.stringify(backupData);
}

/**
 * Parse backup data
 */
export function parseBackupData(backupDataString: string): ProgressBackupData {
  try {
    return JSON.parse(backupDataString);
  } catch (error) {
    throw new Error(`Failed to parse backup data: ${error}`);
  }
}

/**
 * Calculate progress difference between two states
 */
export function calculateProgressDiff(
  oldProgress: ProgressBackupData,
  newProgress: ProgressBackupData
): {
  overallCompletionChange: number;
  scoreChange: number;
  timeChange: number;
  newAchievements: string[];
} {
  const overallCompletionChange =
    (newProgress.overallProgress?.overallCompletion || 0) -
    (oldProgress.overallProgress?.overallCompletion || 0);

  const scoreChange =
    (newProgress.overallProgress?.totalScore || 0) -
    (oldProgress.overallProgress?.totalScore || 0);

  const timeChange =
    (newProgress.overallProgress?.totalGameTime || 0) -
    (oldProgress.overallProgress?.totalGameTime || 0);

  // Find new achievements
  const oldAchievements = new Set(
    oldProgress.gameProgress.flatMap((g) => g.achievements)
  );
  const newAchievements = newProgress.gameProgress
    .flatMap((g) => g.achievements)
    .filter((a) => !oldAchievements.has(a));

  return {
    overallCompletionChange,
    scoreChange,
    timeChange,
    newAchievements,
  };
}

/**
 * Format date for display
 */
export function formatBackupDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get backup type label
 */
export function getBackupTypeLabel(
  backupType: "automatic" | "manual" | "pre_sync"
): string {
  switch (backupType) {
    case "automatic":
      return "Automatic Backup";
    case "manual":
      return "Manual Backup";
    case "pre_sync":
      return "Pre-Sync Backup";
    default:
      return "Unknown";
  }
}

/**
 * Validate progress data structure
 */
export function validateProgressData(data: any): boolean {
  try {
    if (!data || typeof data !== "object") return false;

    // Check required fields
    if (!("syncTime" in data)) return false;
    if (!("gameProgress" in data) || !Array.isArray(data.gameProgress))
      return false;

    // Validate game progress entries
    for (const game of data.gameProgress) {
      if (!game.gameType || !game.completedLevels === undefined) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Create a snapshot of current progress for history tracking
 */
export function createProgressSnapshot(
  gameType:
    | "artifact_identification"
    | "excavation_simulation"
    | "site_documentation"
    | "historical_timeline"
    | "conservation_lab",
  gameProgress: any,
  overallProgress: any
): {
  completedLevels: number;
  totalLevels: number;
  score: number;
  timeSpent: number;
  overallCompletion: number;
  snapshotData: string;
} {
  const snapshot = {
    gameProgress,
    overallProgress,
    timestamp: Date.now(),
  };

  return {
    completedLevels: gameProgress.completedLevels || 0,
    totalLevels: gameProgress.totalLevels || 0,
    score: gameProgress.bestScore || 0,
    timeSpent: gameProgress.timeSpent || 0,
    overallCompletion: overallProgress?.overallCompletion || 0,
    snapshotData: JSON.stringify(snapshot),
  };
}

/**
 * Calculate time since last sync
 */
export function getTimeSinceSync(lastSyncTime: number | null): string {
  if (!lastSyncTime) return "Never synced";

  const now = Date.now();
  const diff = now - lastSyncTime;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}
