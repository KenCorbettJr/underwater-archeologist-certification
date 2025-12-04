// Core game types and interfaces for underwater archaeology games

import { Id } from "../../convex/_generated/dataModel";

// Game Types
export type GameType =
  | "artifact_identification"
  | "excavation_simulation"
  | "site_documentation"
  | "historical_timeline"
  | "conservation_lab";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type GameSessionStatus = "active" | "completed" | "abandoned";

export type CertificationStatus = "not_eligible" | "eligible" | "certified";

// Game Session Interface
export interface GameSession {
  id: Id<"gameSessions">;
  userId: Id<"users">;
  gameType: GameType;
  difficulty: DifficultyLevel;
  status: GameSessionStatus;
  startTime: Date;
  endTime?: Date;
  currentScore: number;
  maxScore: number;
  completionPercentage: number;
  gameData: Record<string, any>;
  actions: GameAction[];
}

// Game Action Interface
export interface GameAction {
  id: string;
  timestamp: Date;
  actionType: string;
  data: Record<string, any>;
  result?: ActionResult;
}

export interface ActionResult {
  success: boolean;
  score: number;
  feedback?: string;
  data?: Record<string, any>;
}

// Artifact Interface
export interface Artifact {
  id: Id<"gameArtifacts">;
  name: string;
  description: string;
  historicalPeriod: string;
  culture: string;
  dateRange: string;
  significance: string;
  imageUrl: string;
  modelUrl?: string;
  discoveryLocation: string;
  conservationNotes: string;
  difficulty: DifficultyLevel;
  category: string;
  isActive: boolean;
}

// Excavation Site Interface
export interface ExcavationSite {
  id: Id<"excavationSites">;
  name: string;
  location: string;
  historicalPeriod: string;
  description: string;
  gridSize: {
    width: number;
    height: number;
  };
  difficulty: DifficultyLevel;
  environmentalConditions: EnvironmentalConditions;
  siteArtifacts: SiteArtifact[];
  isActive: boolean;
}

// Excavation Game Specific Types
export interface ExcavationGameData {
  siteId: Id<"excavationSites">;
  currentTool: ExcavationTool;
  discoveredArtifacts: Id<"gameArtifacts">[];
  excavatedCells: GridCell[];
  documentationEntries: DocumentationEntry[];
  documentationQuests?: DocumentationQuest[];
  protocolViolations: ProtocolViolation[];
}

export interface GridCell {
  x: number;
  y: number;
  excavated: boolean;
  excavationDepth: number; // 0-1, where 1 is fully excavated
  containsArtifact: boolean;
  artifactId?: Id<"gameArtifacts">;
  notes?: string;
}

export interface ExcavationTool {
  id: string;
  name: string;
  type: "brush" | "trowel" | "measuring_tape" | "camera" | "sieve" | "probe";
  description: string;
  effectiveness: number; // 0-1 scale
  appropriateFor: string[]; // conditions where this tool is most effective
}

export interface DocumentationEntry {
  id: string;
  timestamp: Date;
  gridPosition: { x: number; y: number };
  entryType: "discovery" | "measurement" | "photo" | "note" | "sample";
  content: string;
  artifactId?: Id<"gameArtifacts">;
  isRequired: boolean;
  isComplete: boolean;
}

export interface DocumentationQuest {
  id: string;
  title: string;
  description: string;
  questType:
    | "take_photos"
    | "record_measurements"
    | "document_artifacts"
    | "complete_grid_survey"
    | "write_field_notes";
  targetCount: number;
  currentCount: number;
  isComplete: boolean;
  reward: number;
}

export interface ProtocolViolation {
  id: string;
  timestamp: Date;
  violationType:
    | "improper_tool"
    | "missing_documentation"
    | "rushed_excavation"
    | "contamination"
    | "damage";
  description: string;
  severity: "minor" | "moderate" | "severe";
  pointsPenalty: number;
}

export interface EnvironmentalConditions {
  visibility: number; // 0-100 percentage
  currentStrength: number; // 0-10 scale
  temperature: number; // in Celsius
  depth: number; // in meters
  sedimentType: string;
  timeConstraints: number; // in minutes
}

export interface SiteArtifact {
  artifactId: Id<"gameArtifacts">;
  gridPosition: {
    x: number;
    y: number;
  };
  depth: number; // depth in grid cell
  isDiscovered: boolean;
  condition: "excellent" | "good" | "fair" | "poor";
}

// Progress Tracking Interfaces
export interface GameProgress {
  completedLevels: number;
  totalLevels: number;
  bestScore: number;
  averageScore: number;
  timeSpent: number; // in minutes
  lastPlayed: Date;
  achievements: Achievement[];
}

export interface StudentProgress {
  userId: Id<"users">;
  gameProgress: Record<GameType, GameProgress>;
  overallCompletion: number; // percentage 0-100
  certificationStatus: CertificationStatus;
  lastActivity: Date;
  totalGameTime: number; // in minutes
  totalScore: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedDate: Date;
  gameType?: GameType;
}

// Certification Interface
export interface DigitalCertificate {
  id: Id<"certificates">;
  userId: Id<"users">;
  studentName: string;
  certificateType: "junior_underwater_archaeologist";
  issueDate: Date;
  scores: Record<GameType, number>;
  verificationCode: string;
  digitalSignature: string;
  isValid: boolean;
}

// Score and Assessment Interfaces
export interface ScoreResult {
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  breakdown: Record<string, number>;
  feedback: string[];
}

export interface CompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  nextObjective?: string;
  remainingTasks: string[];
}

// Certification Assessment Interfaces
export interface CertificationResult {
  isEligible: boolean;
  overallScore: number;
  gameScores: Record<GameType, number>;
  requirements: CertificationRequirement[];
  feedback: string[];
}

export interface CertificationRequirement {
  gameType: GameType;
  requiredScore: number;
  actualScore: number;
  met: boolean;
  description: string;
}

export interface EligibilityStatus {
  isEligible: boolean;
  completionPercentage: number;
  missingRequirements: string[];
  estimatedTimeToCompletion?: number; // in minutes
}

export interface RemediationPlan {
  userId: Id<"users">;
  weakAreas: GameType[];
  recommendedActivities: RecommendedActivity[];
  estimatedCompletionTime: number; // in minutes
  retestEligibleDate: Date;
}

export interface RecommendedActivity {
  gameType: GameType;
  difficulty: DifficultyLevel;
  description: string;
  estimatedTime: number; // in minutes
  priority: "high" | "medium" | "low";
}

// Progress Report Interface
export interface ProgressReport {
  userId: Id<"users">;
  generatedDate: Date;
  overallProgress: number; // percentage
  gameBreakdown: Record<GameType, GameProgress>;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  certificationReadiness: EligibilityStatus;
}

// Verification Interface
export interface VerificationResult {
  isValid: boolean;
  certificate?: DigitalCertificate;
  errorMessage?: string;
  verifiedDate: Date;
}
