// Validation functions for game data integrity

import { z } from "zod";

// Zod schemas for validation
const GameTypeSchema = z.enum([
  "artifact_identification",
  "excavation_simulation",
  "site_documentation",
  "historical_timeline",
  "conservation_lab",
]);

const DifficultyLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

const GameSessionStatusSchema = z.enum(["active", "completed", "abandoned"]);

const CertificationStatusSchema = z.enum([
  "not_eligible",
  "eligible",
  "certified",
]);

// Game Action Validation
const GameActionSchema = z.object({
  id: z.string().min(1),
  timestamp: z.coerce.date(),
  actionType: z.string().min(1),
  data: z.record(z.string(), z.any()),
  result: z
    .object({
      success: z.boolean(),
      score: z.number().min(0),
      feedback: z.string().optional(),
      data: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
});

// Game Session Validation
const GameSessionSchema = z.object({
  userId: z.string().min(1),
  gameType: GameTypeSchema,
  difficulty: DifficultyLevelSchema,
  status: GameSessionStatusSchema,
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  currentScore: z.number().min(0),
  maxScore: z.number().min(0),
  completionPercentage: z.number().min(0).max(100),
  gameData: z.record(z.string(), z.any()),
  actions: z.array(GameActionSchema),
});

// Artifact Validation
const ArtifactSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  historicalPeriod: z.string().min(1).max(100),
  culture: z.string().min(1).max(100),
  dateRange: z.string().min(1).max(100),
  significance: z.string().min(10).max(1000),
  imageUrl: z.string().url(),
  modelUrl: z.string().url().optional(),
  discoveryLocation: z.string().min(1).max(200),
  conservationNotes: z.string().min(1).max(1000),
  difficulty: DifficultyLevelSchema,
  category: z.string().min(1).max(50),
  isActive: z.boolean(),
});

// Environmental Conditions Validation
const EnvironmentalConditionsSchema = z.object({
  visibility: z.number().min(0).max(100),
  currentStrength: z.number().min(0).max(10),
  temperature: z.number().min(-5).max(35), // Reasonable underwater temperatures
  depth: z.number().min(1).max(200), // Reasonable archaeological depths
  sedimentType: z.string().min(1).max(50),
  timeConstraints: z.number().min(5).max(120), // 5 minutes to 2 hours
});

// Site Artifact Validation
const SiteArtifactSchema = z.object({
  artifactId: z.string().min(1),
  gridPosition: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
  }),
  depth: z.number().min(0).max(10), // Depth within grid cell
  isDiscovered: z.boolean(),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
});

// Excavation Site Validation
const ExcavationSiteSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  historicalPeriod: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  gridSize: z.object({
    width: z.number().min(5).max(20), // Reasonable grid sizes
    height: z.number().min(5).max(20),
  }),
  difficulty: DifficultyLevelSchema,
  environmentalConditions: EnvironmentalConditionsSchema,
  siteArtifacts: z.array(SiteArtifactSchema),
  isActive: z.boolean(),
});

// Progress Validation
const GameProgressSchema = z.object({
  completedLevels: z.number().min(0),
  totalLevels: z.number().min(1),
  bestScore: z.number().min(0),
  averageScore: z.number().min(0),
  timeSpent: z.number().min(0),
  lastPlayed: z.coerce.date(),
});

const StudentProgressSchema = z.object({
  userId: z.string().min(1),
  overallCompletion: z.number().min(0).max(100),
  certificationStatus: CertificationStatusSchema,
  lastActivity: z.coerce.date(),
  totalGameTime: z.number().min(0),
  totalScore: z.number().min(0),
});

// Certificate Validation
const DigitalCertificateSchema = z.object({
  userId: z.string().min(1),
  studentName: z.string().min(1).max(100),
  certificateType: z.literal("junior_underwater_archaeologist"),
  issueDate: z.coerce.date(),
  scores: z.record(z.string(), z.number().min(0).max(100)),
  verificationCode: z.string().min(8).max(32),
  digitalSignature: z.string().min(1),
  isValid: z.boolean(),
});

// Validation Functions
export class GameDataValidator {
  static validateGameSession(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      GameSessionSchema.parse(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateArtifact(data: any): { isValid: boolean; errors: string[] } {
    try {
      ArtifactSchema.parse(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateExcavationSite(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      ExcavationSiteSchema.parse(data);

      // Additional business logic validation
      const errors: string[] = [];

      // Check grid size vs artifacts
      const totalGridCells = data.gridSize.width * data.gridSize.height;
      if (data.siteArtifacts.length > totalGridCells * 0.3) {
        errors.push("Too many artifacts for grid size (max 30% occupancy)");
      }

      // Check artifact positions are within grid
      for (const artifact of data.siteArtifacts) {
        if (
          artifact.gridPosition.x >= data.gridSize.width ||
          artifact.gridPosition.y >= data.gridSize.height
        ) {
          errors.push(
            `Artifact position (${artifact.gridPosition.x}, ${artifact.gridPosition.y}) is outside grid bounds`
          );
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateStudentProgress(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      StudentProgressSchema.parse(data);

      // Additional validation
      const errors: string[] = [];

      // Check completion percentage logic
      if (data.overallCompletion > 100 || data.overallCompletion < 0) {
        errors.push("Overall completion must be between 0 and 100");
      }

      // Check certification status logic
      if (
        data.certificationStatus === "certified" &&
        data.overallCompletion < 85
      ) {
        errors.push("Cannot be certified with less than 85% completion");
      }

      if (
        data.certificationStatus === "eligible" &&
        data.overallCompletion < 80
      ) {
        errors.push(
          "Cannot be eligible for certification with less than 80% completion"
        );
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateCertificate(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      DigitalCertificateSchema.parse(data);

      // Additional validation
      const errors: string[] = [];

      // Check minimum scores for certification
      const requiredScores = {
        artifact_identification: 80,
        excavation_simulation: 75,
        site_documentation: 70,
        historical_timeline: 70,
        conservation_lab: 70,
      };

      for (const [gameType, requiredScore] of Object.entries(requiredScores)) {
        const actualScore = data.scores[gameType];
        if (actualScore === undefined || actualScore < requiredScore) {
          errors.push(
            `${gameType} score (${actualScore || 0}) below required ${requiredScore}`
          );
        }
      }

      // Check verification code format (should be alphanumeric)
      if (!/^[A-Z0-9]{8,32}$/.test(data.verificationCode)) {
        errors.push("Verification code must be 8-32 alphanumeric characters");
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateGameAction(data: any): { isValid: boolean; errors: string[] } {
    try {
      GameActionSchema.parse(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        };
      }
      return { isValid: false, errors: ["Unknown validation error"] };
    }
  }

  // Utility function to validate score ranges
  static validateScoreRange(score: number, maxScore: number): boolean {
    return score >= 0 && score <= maxScore && maxScore > 0;
  }

  // Utility function to validate time ranges
  static validateTimeRange(startTime: Date, endTime?: Date): boolean {
    if (!endTime) return true; // Active session
    return endTime.getTime() > startTime.getTime();
  }

  // Utility function to validate completion percentage
  static validateCompletionPercentage(
    completed: number,
    total: number
  ): boolean {
    if (total <= 0) return false;
    const percentage = (completed / total) * 100;
    return percentage >= 0 && percentage <= 100;
  }
}

// Export validation schemas for use in Convex functions
export {
  GameTypeSchema,
  DifficultyLevelSchema,
  GameSessionStatusSchema,
  CertificationStatusSchema,
  GameActionSchema,
  GameSessionSchema,
  ArtifactSchema,
  ExcavationSiteSchema,
  StudentProgressSchema,
  DigitalCertificateSchema,
};
