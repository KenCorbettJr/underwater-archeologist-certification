import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Site documentation game data structure
interface SiteDocumentationGameData {
  siteId: Id<"excavationSites">;
  photosTaken: PhotoEntry[];
  measurements: MeasurementEntry[];
  reportSections: ReportSection[];
  validationErrors: ValidationError[];
  completionPercentage: number;
}

interface PhotoEntry {
  id: string;
  gridPosition: { x: number; y: number };
  timestamp: number;
  angle: string;
  hasScale: boolean;
  hasNorthArrow: boolean;
  isValid: boolean;
}

interface MeasurementEntry {
  id: string;
  gridPosition: { x: number; y: number };
  measurementType: "length" | "width" | "depth" | "distance";
  value: number;
  unit: string;
  timestamp: number;
  isValid: boolean;
}

interface ReportSection {
  id: string;
  sectionType: "site_description" | "methodology" | "findings" | "conclusions";
  content: string;
  isComplete: boolean;
  validationScore: number;
}

interface ValidationError {
  id: string;
  errorType:
    | "missing_photo"
    | "missing_measurement"
    | "incomplete_report"
    | "invalid_data";
  description: string;
  severity: "minor" | "moderate" | "severe";
  gridPosition?: { x: number; y: number };
}

// Start a new site documentation game session
export const startSiteDocumentationGame = mutation({
  args: {
    userId: v.id("users"),
    siteId: v.id("excavationSites"),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
  },
  returns: v.id("gameSessions"),
  handler: async (ctx, args) => {
    // Verify site exists
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new Error("Excavation site not found");
    }

    // Initialize game data
    const gameData: SiteDocumentationGameData = {
      siteId: args.siteId,
      photosTaken: [],
      measurements: [],
      reportSections: [
        {
          id: "site_description",
          sectionType: "site_description",
          content: "",
          isComplete: false,
          validationScore: 0,
        },
        {
          id: "methodology",
          sectionType: "methodology",
          content: "",
          isComplete: false,
          validationScore: 0,
        },
        {
          id: "findings",
          sectionType: "findings",
          content: "",
          isComplete: false,
          validationScore: 0,
        },
        {
          id: "conclusions",
          sectionType: "conclusions",
          content: "",
          isComplete: false,
          validationScore: 0,
        },
      ],
      validationErrors: [],
      completionPercentage: 0,
    };

    // Create game session
    const sessionId = await ctx.db.insert("gameSessions", {
      userId: args.userId,
      gameType: "site_documentation",
      difficulty: args.difficulty,
      status: "active",
      startTime: Date.now(),
      currentScore: 0,
      maxScore: 1000,
      completionPercentage: 0,
      gameData: JSON.stringify(gameData),
      actions: [],
    });

    return sessionId;
  },
});

// Add a photo to the documentation
export const addPhoto = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    gridPosition: v.object({ x: v.number(), y: v.number() }),
    angle: v.string(),
    hasScale: v.boolean(),
    hasNorthArrow: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    score: v.number(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: SiteDocumentationGameData = JSON.parse(session.gameData);

    // Validate photo requirements
    const isValid = args.hasScale && args.hasNorthArrow;
    const photoScore = isValid ? 50 : 25;

    const photoEntry: PhotoEntry = {
      id: `photo_${Date.now()}`,
      gridPosition: args.gridPosition,
      timestamp: Date.now(),
      angle: args.angle,
      hasScale: args.hasScale,
      hasNorthArrow: args.hasNorthArrow,
      isValid,
    };

    gameData.photosTaken.push(photoEntry);

    // Update validation errors
    if (!isValid) {
      const errors: string[] = [];
      if (!args.hasScale) errors.push("scale reference");
      if (!args.hasNorthArrow) errors.push("north arrow");

      gameData.validationErrors.push({
        id: `error_${Date.now()}`,
        errorType: "invalid_data",
        description: `Photo missing: ${errors.join(", ")}`,
        severity: "moderate",
        gridPosition: args.gridPosition,
      });
    }

    // Update score and completion
    const newScore = session.currentScore + photoScore;
    gameData.completionPercentage = calculateCompletion(gameData);

    await ctx.db.patch(args.sessionId, {
      currentScore: newScore,
      completionPercentage: gameData.completionPercentage,
      gameData: JSON.stringify(gameData),
    });

    return {
      success: isValid,
      score: photoScore,
      feedback: isValid
        ? "Excellent photo documentation!"
        : `Photo needs improvement: ${!args.hasScale ? "add scale reference" : ""} ${!args.hasNorthArrow ? "add north arrow" : ""}`,
    };
  },
});

// Add a measurement to the documentation
export const addMeasurement = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    gridPosition: v.object({ x: v.number(), y: v.number() }),
    measurementType: v.union(
      v.literal("length"),
      v.literal("width"),
      v.literal("depth"),
      v.literal("distance")
    ),
    value: v.number(),
    unit: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    score: v.number(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: SiteDocumentationGameData = JSON.parse(session.gameData);

    // Validate measurement
    const isValid = args.value > 0 && (args.unit === "cm" || args.unit === "m");
    const measurementScore = isValid ? 30 : 10;

    const measurementEntry: MeasurementEntry = {
      id: `measurement_${Date.now()}`,
      gridPosition: args.gridPosition,
      measurementType: args.measurementType,
      value: args.value,
      unit: args.unit,
      timestamp: Date.now(),
      isValid,
    };

    gameData.measurements.push(measurementEntry);

    if (!isValid) {
      gameData.validationErrors.push({
        id: `error_${Date.now()}`,
        errorType: "invalid_data",
        description:
          "Invalid measurement: use positive values and metric units (cm or m)",
        severity: "moderate",
        gridPosition: args.gridPosition,
      });
    }

    const newScore = session.currentScore + measurementScore;
    gameData.completionPercentage = calculateCompletion(gameData);

    await ctx.db.patch(args.sessionId, {
      currentScore: newScore,
      completionPercentage: gameData.completionPercentage,
      gameData: JSON.stringify(gameData),
    });

    return {
      success: isValid,
      score: measurementScore,
      feedback: isValid
        ? "Measurement recorded accurately!"
        : "Invalid measurement format. Use metric units (cm or m).",
    };
  },
});

// Update a report section
export const updateReportSection = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    sectionType: v.union(
      v.literal("site_description"),
      v.literal("methodology"),
      v.literal("findings"),
      v.literal("conclusions")
    ),
    content: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    score: v.number(),
    feedback: v.string(),
    validationScore: v.number(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: SiteDocumentationGameData = JSON.parse(session.gameData);

    // Find and update the section
    const section = gameData.reportSections.find(
      (s) => s.sectionType === args.sectionType
    );
    if (!section) {
      throw new Error("Invalid section type");
    }

    const wasComplete = section.isComplete;
    section.content = args.content;

    // Validate content (simple validation based on length and keywords)
    const validationScore = validateReportSection(
      args.sectionType,
      args.content
    );
    section.validationScore = validationScore;
    section.isComplete = validationScore >= 70;

    // Award points for completing a section
    let sectionScore = 0;
    if (section.isComplete && !wasComplete) {
      sectionScore = 100;
    }

    const newScore = session.currentScore + sectionScore;
    gameData.completionPercentage = calculateCompletion(gameData);

    await ctx.db.patch(args.sessionId, {
      currentScore: newScore,
      completionPercentage: gameData.completionPercentage,
      gameData: JSON.stringify(gameData),
    });

    return {
      success: section.isComplete,
      score: sectionScore,
      feedback: getFeedbackForSection(args.sectionType, validationScore),
      validationScore,
    };
  },
});

// Get current game state
export const getSiteDocumentationGame = query({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    session: v.object({
      _id: v.id("gameSessions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      gameType: v.union(
        v.literal("artifact_identification"),
        v.literal("excavation_simulation"),
        v.literal("site_documentation"),
        v.literal("historical_timeline"),
        v.literal("conservation_lab")
      ),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      status: v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("abandoned")
      ),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      currentScore: v.number(),
      maxScore: v.number(),
      completionPercentage: v.number(),
      gameData: v.string(),
      actions: v.array(v.string()),
    }),
    site: v.object({
      _id: v.id("excavationSites"),
      _creationTime: v.number(),
      name: v.string(),
      location: v.string(),
      historicalPeriod: v.string(),
      description: v.string(),
      gridWidth: v.number(),
      gridHeight: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      environmentalConditions: v.string(),
      siteArtifacts: v.array(v.string()),
      isActive: v.boolean(),
    }),
    gameData: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    const gameData: SiteDocumentationGameData = JSON.parse(session.gameData);
    const site = await ctx.db.get(gameData.siteId);
    if (!site) {
      throw new Error("Excavation site not found");
    }

    return {
      session,
      site,
      gameData: session.gameData,
    };
  },
});

// Complete the documentation game
export const completeSiteDocumentationGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    success: v.boolean(),
    finalScore: v.number(),
    completionPercentage: v.number(),
    feedback: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: SiteDocumentationGameData = JSON.parse(session.gameData);

    // Final validation
    const feedback: string[] = [];
    const requiredPhotos = 4;
    const requiredMeasurements = 6;

    if (gameData.photosTaken.length < requiredPhotos) {
      feedback.push(
        `Need ${requiredPhotos - gameData.photosTaken.length} more photos`
      );
    }

    if (gameData.measurements.length < requiredMeasurements) {
      feedback.push(
        `Need ${requiredMeasurements - gameData.measurements.length} more measurements`
      );
    }

    const incompleteSections = gameData.reportSections.filter(
      (s) => !s.isComplete
    );
    if (incompleteSections.length > 0) {
      feedback.push(
        `Complete these sections: ${incompleteSections.map((s) => s.sectionType).join(", ")}`
      );
    }

    const isComplete = feedback.length === 0;

    await ctx.db.patch(args.sessionId, {
      status: isComplete ? "completed" : "active",
      endTime: isComplete ? Date.now() : undefined,
      completionPercentage: gameData.completionPercentage,
    });

    return {
      success: isComplete,
      finalScore: session.currentScore,
      completionPercentage: gameData.completionPercentage,
      feedback: isComplete ? ["Excellent documentation work!"] : feedback,
    };
  },
});

// Helper functions
function calculateCompletion(gameData: SiteDocumentationGameData): number {
  const photoWeight = 0.3;
  const measurementWeight = 0.3;
  const reportWeight = 0.4;

  const photoCompletion = Math.min(gameData.photosTaken.length / 4, 1);
  const measurementCompletion = Math.min(gameData.measurements.length / 6, 1);
  const reportCompletion =
    gameData.reportSections.filter((s) => s.isComplete).length / 4;

  return Math.round(
    (photoCompletion * photoWeight +
      measurementCompletion * measurementWeight +
      reportCompletion * reportWeight) *
      100
  );
}

function validateReportSection(sectionType: string, content: string): number {
  const wordCount = content.trim().split(/\s+/).length;
  const minWords = 50;
  const idealWords = 150;

  if (wordCount < minWords) {
    return Math.round((wordCount / minWords) * 50);
  }

  if (wordCount >= idealWords) {
    return 100;
  }

  return Math.round(
    50 + ((wordCount - minWords) / (idealWords - minWords)) * 50
  );
}

function getFeedbackForSection(
  sectionType: string,
  validationScore: number
): string {
  if (validationScore >= 90) {
    return "Excellent section! Very thorough and well-written.";
  } else if (validationScore >= 70) {
    return "Good work! Section meets requirements.";
  } else if (validationScore >= 50) {
    return "Section needs more detail. Add more observations and analysis.";
  } else {
    return "Section is too brief. Please expand with more information.";
  }
}
