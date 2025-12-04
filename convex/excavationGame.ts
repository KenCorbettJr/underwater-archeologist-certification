import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Validators for excavation game data structures
const gridCellValidator = v.object({
  x: v.number(),
  y: v.number(),
  excavated: v.boolean(),
  excavationDepth: v.number(),
  containsArtifact: v.boolean(),
  artifactId: v.optional(v.id("gameArtifacts")),
  notes: v.optional(v.string()),
});

const excavationToolValidator = v.object({
  id: v.string(),
  name: v.string(),
  type: v.union(
    v.literal("brush"),
    v.literal("trowel"),
    v.literal("measuring_tape"),
    v.literal("camera"),
    v.literal("sieve"),
    v.literal("probe")
  ),
  description: v.string(),
  effectiveness: v.number(),
  appropriateFor: v.array(v.string()),
});

const documentationEntryValidator = v.object({
  id: v.string(),
  timestamp: v.number(),
  gridPosition: v.object({
    x: v.number(),
    y: v.number(),
  }),
  entryType: v.union(
    v.literal("discovery"),
    v.literal("measurement"),
    v.literal("photo"),
    v.literal("note"),
    v.literal("sample")
  ),
  content: v.string(),
  artifactId: v.optional(v.id("gameArtifacts")),
  isRequired: v.boolean(),
  isComplete: v.boolean(),
});

const protocolViolationValidator = v.object({
  id: v.string(),
  timestamp: v.number(),
  violationType: v.union(
    v.literal("improper_tool"),
    v.literal("missing_documentation"),
    v.literal("rushed_excavation"),
    v.literal("contamination"),
    v.literal("damage")
  ),
  description: v.string(),
  severity: v.union(
    v.literal("minor"),
    v.literal("moderate"),
    v.literal("severe")
  ),
  pointsPenalty: v.number(),
});

/**
 * Start a new excavation game session
 */
export const startExcavationGame = mutation({
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
    // Get the excavation site
    const site = await ctx.db.get(args.siteId);
    if (!site || !site.isActive) {
      throw new Error("Excavation site not found or inactive");
    }

    // Parse environmental conditions
    const environmentalConditions = JSON.parse(site.environmentalConditions);

    // Initialize game data
    const excavatedCells = [];
    for (let x = 0; x < site.gridWidth; x++) {
      for (let y = 0; y < site.gridHeight; y++) {
        excavatedCells.push({
          x,
          y,
          excavated: false,
          excavationDepth: 0,
          containsArtifact: false,
          artifactId: undefined,
          notes: undefined,
        });
      }
    }

    const gameData = {
      siteId: args.siteId,
      currentTool: {
        id: "soft_brush",
        name: "Soft Brush",
        type: "brush",
        description: "Gentle cleaning tool for delicate artifacts",
        effectiveness: 0.8,
        appropriateFor: ["delicate", "fragile", "detailed_cleaning"],
      },
      discoveredArtifacts: [],
      excavatedCells,
      documentationEntries: [],
      timeRemaining: environmentalConditions.timeConstraints * 60, // convert to seconds
      protocolViolations: [],
    };

    // Create game session
    const sessionId = await ctx.db.insert("gameSessions", {
      userId: args.userId,
      gameType: "excavation_simulation",
      difficulty: args.difficulty,
      status: "active",
      startTime: Date.now(),
      currentScore: 0,
      maxScore: 1000, // Base score, will be calculated based on site complexity
      completionPercentage: 0,
      gameData: JSON.stringify(gameData),
      actions: [],
    });

    return sessionId;
  },
});

/**
 * Process an excavation action (tool use on grid cell)
 */
export const processExcavationAction = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    gridX: v.number(),
    gridY: v.number(),
    toolId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    discoveries: v.array(v.string()),
    violations: v.array(protocolViolationValidator),
    score: v.number(),
    timeUsed: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get game session
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Game session not found or not active");
    }

    // Parse game data
    const gameData = JSON.parse(session.gameData);

    // Get excavation site and artifacts
    const site = await ctx.db.get(gameData.siteId as Id<"excavationSites">);
    if (!site) {
      throw new Error("Excavation site not found");
    }

    const siteArtifacts = site.siteArtifacts.map((artifactStr: string) =>
      JSON.parse(artifactStr)
    );
    const environmentalConditions = JSON.parse(site.environmentalConditions);

    // Find the tool being used
    const availableTools = [
      {
        id: "soft_brush",
        name: "Soft Brush",
        type: "brush",
        description: "Gentle cleaning tool for delicate artifacts",
        effectiveness: 0.8,
        appropriateFor: ["delicate", "fragile", "detailed_cleaning"],
      },
      {
        id: "hard_brush",
        name: "Hard Brush",
        type: "brush",
        description: "Sturdy brush for removing sediment",
        effectiveness: 0.6,
        appropriateFor: [
          "heavy_sediment",
          "initial_cleaning",
          "robust_artifacts",
        ],
      },
      {
        id: "trowel",
        name: "Archaeological Trowel",
        type: "trowel",
        description: "Precision tool for careful excavation",
        effectiveness: 0.9,
        appropriateFor: [
          "precision_work",
          "artifact_extraction",
          "grid_excavation",
        ],
      },
      {
        id: "measuring_tape",
        name: "Measuring Tape",
        type: "measuring_tape",
        description: "For accurate measurements and grid mapping",
        effectiveness: 1.0,
        appropriateFor: ["documentation", "mapping", "measurements"],
      },
      {
        id: "underwater_camera",
        name: "Underwater Camera",
        type: "camera",
        description: "Waterproof camera for site documentation",
        effectiveness: 1.0,
        appropriateFor: ["photography", "documentation", "evidence"],
      },
      {
        id: "sieve",
        name: "Archaeological Sieve",
        type: "sieve",
        description: "For separating small artifacts from sediment",
        effectiveness: 0.7,
        appropriateFor: [
          "small_artifacts",
          "sediment_processing",
          "thorough_search",
        ],
      },
      {
        id: "probe",
        name: "Archaeological Probe",
        type: "probe",
        description: "For detecting buried objects without damage",
        effectiveness: 0.5,
        appropriateFor: ["detection", "preliminary_survey", "safe_exploration"],
      },
    ];

    const tool = availableTools.find((t) => t.id === args.toolId);
    if (!tool) {
      throw new Error("Invalid tool selected");
    }

    // Process the excavation action
    const result = processExcavationLogic(
      gameData,
      args.gridX,
      args.gridY,
      tool,
      siteArtifacts,
      environmentalConditions
    );

    // Update game session
    const newScore = session.currentScore + result.score;
    const newGameData = result.newGameData;

    // Calculate completion percentage
    const totalCells = site.gridWidth * site.gridHeight;
    const excavatedCells = newGameData.excavatedCells.filter(
      (cell: any) => cell.excavated
    ).length;
    const completionPercentage = (excavatedCells / totalCells) * 100;

    // Create action record
    const action = {
      timestamp: Date.now(),
      type: "excavation",
      data: {
        gridX: args.gridX,
        gridY: args.gridY,
        toolId: args.toolId,
        discoveries: result.discoveries,
        violations: result.violations,
        score: result.score,
      },
    };

    // Update session
    await ctx.db.patch(args.sessionId, {
      currentScore: newScore,
      completionPercentage,
      gameData: JSON.stringify(newGameData),
      actions: [...session.actions, JSON.stringify(action)],
    });

    return {
      success: result.success,
      discoveries: result.discoveries,
      violations: result.violations,
      score: result.score,
      timeUsed: result.timeUsed,
    };
  },
});

/**
 * Change the current tool in an excavation game
 */
export const changeExcavationTool = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    toolId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Game session not found or not active");
    }

    const gameData = JSON.parse(session.gameData);

    // Available tools
    const availableTools = [
      {
        id: "soft_brush",
        name: "Soft Brush",
        type: "brush",
        description: "Gentle cleaning tool for delicate artifacts",
        effectiveness: 0.8,
        appropriateFor: ["delicate", "fragile", "detailed_cleaning"],
      },
      {
        id: "hard_brush",
        name: "Hard Brush",
        type: "brush",
        description: "Sturdy brush for removing sediment",
        effectiveness: 0.6,
        appropriateFor: [
          "heavy_sediment",
          "initial_cleaning",
          "robust_artifacts",
        ],
      },
      {
        id: "trowel",
        name: "Archaeological Trowel",
        type: "trowel",
        description: "Precision tool for careful excavation",
        effectiveness: 0.9,
        appropriateFor: [
          "precision_work",
          "artifact_extraction",
          "grid_excavation",
        ],
      },
      {
        id: "measuring_tape",
        name: "Measuring Tape",
        type: "measuring_tape",
        description: "For accurate measurements and grid mapping",
        effectiveness: 1.0,
        appropriateFor: ["documentation", "mapping", "measurements"],
      },
      {
        id: "underwater_camera",
        name: "Underwater Camera",
        type: "camera",
        description: "Waterproof camera for site documentation",
        effectiveness: 1.0,
        appropriateFor: ["photography", "documentation", "evidence"],
      },
      {
        id: "sieve",
        name: "Archaeological Sieve",
        type: "sieve",
        description: "For separating small artifacts from sediment",
        effectiveness: 0.7,
        appropriateFor: [
          "small_artifacts",
          "sediment_processing",
          "thorough_search",
        ],
      },
      {
        id: "probe",
        name: "Archaeological Probe",
        type: "probe",
        description: "For detecting buried objects without damage",
        effectiveness: 0.5,
        appropriateFor: ["detection", "preliminary_survey", "safe_exploration"],
      },
    ];

    const newTool = availableTools.find((t) => t.id === args.toolId);
    if (!newTool) {
      throw new Error("Invalid tool ID");
    }

    gameData.currentTool = newTool;

    await ctx.db.patch(args.sessionId, {
      gameData: JSON.stringify(gameData),
    });

    return null;
  },
});

/**
 * Add documentation entry to excavation game
 */
export const addDocumentationEntry = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    entryType: v.union(
      v.literal("discovery"),
      v.literal("measurement"),
      v.literal("photo"),
      v.literal("note"),
      v.literal("sample")
    ),
    content: v.string(),
    gridX: v.number(),
    gridY: v.number(),
    artifactId: v.optional(v.id("gameArtifacts")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Game session not found or not active");
    }

    const gameData = JSON.parse(session.gameData);

    const newEntry = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      gridPosition: { x: args.gridX, y: args.gridY },
      entryType: args.entryType,
      content: args.content,
      artifactId: args.artifactId,
      isRequired: ["discovery", "measurement", "photo"].includes(
        args.entryType
      ),
      isComplete: true,
    };

    gameData.documentationEntries.push(newEntry);

    await ctx.db.patch(args.sessionId, {
      gameData: JSON.stringify(gameData),
    });

    return null;
  },
});

/**
 * Complete excavation game and generate site report
 */
export const completeExcavationGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    completionPercentage: v.number(),
    artifactsFound: v.number(),
    totalArtifacts: v.number(),
    documentationQuality: v.number(),
    protocolCompliance: v.number(),
    overallScore: v.number(),
    recommendations: v.array(v.string()),
    digitalReport: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    const gameData = JSON.parse(session.gameData);
    const site = await ctx.db.get(gameData.siteId as Id<"excavationSites">);
    if (!site) {
      throw new Error("Excavation site not found");
    }

    const siteArtifacts = site.siteArtifacts.map((artifactStr: string) =>
      JSON.parse(artifactStr)
    );

    // Generate site report
    const report = generateSiteReport(gameData, site.name, siteArtifacts);

    // Update session status
    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endTime: Date.now(),
      currentScore: report.overallScore,
      completionPercentage: report.completionPercentage,
    });

    // Update user progress
    await updateUserProgress(
      ctx,
      session.userId,
      "excavation_simulation",
      report.overallScore
    );

    return {
      ...report,
      digitalReport: generateDigitalReport(
        gameData,
        site,
        siteArtifacts,
        report
      ),
    };
  },
});

/**
 * Get current excavation game state
 */
export const getExcavationGameState = query({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.union(
    v.object({
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
        environmentalConditions: v.object({
          visibility: v.number(),
          currentStrength: v.number(),
          temperature: v.number(),
          depth: v.number(),
          sedimentType: v.string(),
          timeConstraints: v.number(),
        }),
        siteArtifacts: v.array(
          v.object({
            artifactId: v.id("gameArtifacts"),
            gridPosition: v.object({
              x: v.number(),
              y: v.number(),
            }),
            depth: v.number(),
            isDiscovered: v.boolean(),
            condition: v.union(
              v.literal("excellent"),
              v.literal("good"),
              v.literal("fair"),
              v.literal("poor")
            ),
          })
        ),
      }),
      gameData: v.object({
        siteId: v.id("excavationSites"),
        currentTool: excavationToolValidator,
        discoveredArtifacts: v.array(v.id("gameArtifacts")),
        excavatedCells: v.array(
          v.object({
            x: v.number(),
            y: v.number(),
            excavated: v.boolean(),
            excavationDepth: v.number(),
            containsArtifact: v.boolean(),
            artifactId: v.optional(v.id("gameArtifacts")),
            notes: v.optional(v.string()),
          })
        ),
        documentationEntries: v.array(documentationEntryValidator),
        timeRemaining: v.number(),
        protocolViolations: v.array(protocolViolationValidator),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    const gameData = JSON.parse(session.gameData);
    const site = await ctx.db.get(gameData.siteId as Id<"excavationSites">);
    if (!site) {
      return null;
    }

    return {
      session: {
        _id: session._id,
        _creationTime: session._creationTime,
        userId: session.userId,
        gameType: session.gameType,
        difficulty: session.difficulty,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        currentScore: session.currentScore,
        maxScore: session.maxScore,
        completionPercentage: session.completionPercentage,
      },
      site: {
        _id: site._id,
        _creationTime: site._creationTime,
        name: site.name,
        location: site.location,
        historicalPeriod: site.historicalPeriod,
        description: site.description,
        gridWidth: site.gridWidth,
        gridHeight: site.gridHeight,
        difficulty: site.difficulty,
        environmentalConditions: JSON.parse(site.environmentalConditions),
        siteArtifacts: site.siteArtifacts.map((artifactStr: string) =>
          JSON.parse(artifactStr)
        ),
      },
      gameData: {
        ...gameData,
        // Ensure all cells have the required fields for backward compatibility
        excavatedCells: gameData.excavatedCells.map((cell: any) => ({
          x: cell.x,
          y: cell.y,
          excavated: cell.excavated,
          excavationDepth: cell.excavationDepth,
          containsArtifact: cell.containsArtifact,
          artifactId: cell.artifactId || undefined,
          notes: cell.notes || undefined,
        })),
        documentationEntries: gameData.documentationEntries || [],
        protocolViolations: gameData.protocolViolations || [],
      },
    };
  },
});

// Helper functions
function processExcavationLogic(
  gameData: any,
  gridX: number,
  gridY: number,
  tool: any,
  siteArtifacts: any[],
  conditions: any
) {
  const cellIndex = gameData.excavatedCells.findIndex(
    (cell: any) => cell.x === gridX && cell.y === gridY
  );

  if (cellIndex === -1) {
    return {
      success: false,
      newGameData: gameData,
      discoveries: [],
      violations: [],
      score: 0,
      timeUsed: 0,
    };
  }

  const cell = { ...gameData.excavatedCells[cellIndex] };
  const newGameData = { ...gameData };
  const discoveries: string[] = [];
  const violations: any[] = [];
  let score = 0;

  // Check if there's an artifact at this position
  const artifactAtPosition = siteArtifacts.find(
    (artifact: any) =>
      artifact.gridPosition.x === gridX && artifact.gridPosition.y === gridY
  );

  // Determine action type based on tool and cell state
  const documentationTools = ["camera", "measuring_tape"];
  const isDocumentationTool = documentationTools.includes(tool.type);
  const actionType = isDocumentationTool ? "documentation" : "excavation";

  // Validate tool usage
  const toolValidation = validateToolUsage(
    tool,
    actionType,
    conditions,
    artifactAtPosition?.condition,
    cell.excavated
  );

  if (!toolValidation.isValid) {
    violations.push({
      id: `violation_${Date.now()}`,
      timestamp: Date.now(),
      violationType: "improper_tool",
      description: toolValidation.reason || "Improper tool usage",
      severity: "moderate",
      pointsPenalty: 10,
    });
  }

  // Handle documentation tools differently
  if (isDocumentationTool) {
    // Documentation tools don't excavate, they just record
    if (cell.excavated) {
      // Successfully used documentation tool
      score += 10; // Small bonus for proper documentation
      const timeUsed = 15; // Documentation is quick
      // Infinite time mode - don't decrease time
      // newGameData.timeRemaining = Math.max(
      //   0,
      //   newGameData.timeRemaining - timeUsed
      // );

      return {
        success: true,
        newGameData,
        discoveries: [`Documented cell at position (${gridX}, ${gridY})`],
        violations,
        score,
        timeUsed,
      };
    }
    // If not excavated, validation above will have caught it
  }

  // Process excavation based on tool effectiveness and conditions
  const excavationProgress = calculateExcavationProgress(tool, conditions);
  cell.excavationDepth = Math.min(1, cell.excavationDepth + excavationProgress);

  if (cell.excavationDepth > 0.3) {
    cell.excavated = true;
  }

  // Check for artifact discovery
  if (artifactAtPosition && cell.excavationDepth >= artifactAtPosition.depth) {
    if (!cell.containsArtifact) {
      cell.containsArtifact = true;
      cell.artifactId = artifactAtPosition.artifactId;

      if (
        !newGameData.discoveredArtifacts.includes(artifactAtPosition.artifactId)
      ) {
        newGameData.discoveredArtifacts.push(artifactAtPosition.artifactId);
        discoveries.push(
          `Artifact discovered at position (${gridX}, ${gridY})`
        );
        score += calculateDiscoveryScore(artifactAtPosition, tool, conditions);
      }
    }
  }

  // Update game data
  newGameData.excavatedCells[cellIndex] = cell;
  newGameData.protocolViolations.push(...violations);

  // Deduct time based on action complexity
  const timeUsed = calculateTimeUsage(tool, conditions, cell.excavationDepth);
  // Infinite time mode - don't decrease time
  // newGameData.timeRemaining = Math.max(0, newGameData.timeRemaining - timeUsed);

  return {
    success: true,
    newGameData,
    discoveries,
    violations,
    score,
    timeUsed,
  };
}

function validateToolUsage(
  tool: any,
  actionType: string,
  conditions: any,
  artifactCondition?: string,
  cellExcavated?: boolean
) {
  // Define which tools are valid for excavation
  const excavationTools = ["trowel", "brush", "probe"];
  const documentationTools = ["camera", "measuring_tape"];

  // For documentation actions, check if cell is excavated
  if (actionType === "documentation") {
    if (!cellExcavated) {
      return {
        isValid: false,
        reason: `${tool.name} can only be used on excavated cells. Excavate this cell first with a Trowel or Brush.`,
      };
    }
    // Documentation tools are valid on excavated cells
    // (environmental conditions checked below)
  }

  // For basic excavation, allow excavation tools
  if (actionType === "excavation") {
    // Documentation tools should not be used for excavation
    if (documentationTools.includes(tool.type)) {
      return {
        isValid: false,
        reason: `${tool.name} is for documentation, not excavation. Use Archaeological Trowel or Soft Brush to excavate this cell.`,
      };
    }

    // Sieve is for processing sediment, not initial excavation
    if (tool.type === "sieve") {
      return {
        isValid: false,
        reason: `${tool.name} is for processing excavated sediment. Use Archaeological Trowel or Soft Brush to excavate first.`,
      };
    }

    // All other excavation tools are valid for basic excavation
    // (specific conditions checked below)
  }

  // Check environmental conditions
  if (conditions.visibility < 30 && tool.type === "camera") {
    return {
      isValid: false,
      reason:
        "Visibility is too low for photography (${conditions.visibility}%). Improve lighting or wait for better conditions before taking photos.",
    };
  }

  if (conditions.currentStrength > 6 && tool.type === "brush") {
    return {
      isValid: false,
      reason: `Water current is too strong for brush work (${conditions.currentStrength}/10). Switch to Archaeological Trowel or wait for calmer conditions.`,
    };
  }

  // Check artifact condition compatibility
  if (artifactCondition === "poor" && tool.id === "hard_brush") {
    return {
      isValid: false,
      reason:
        "This artifact is too fragile for a Hard Brush. Switch to Soft Brush or Archaeological Trowel to avoid damage.",
    };
  }

  if (artifactCondition === "fair" && tool.id === "hard_brush") {
    return {
      isValid: false,
      reason:
        "This artifact is delicate. Use a Soft Brush or Archaeological Trowel for safer excavation.",
    };
  }

  return { isValid: true };
}

function calculateExcavationProgress(tool: any, conditions: any): number {
  let baseProgress = tool.effectiveness * 0.1; // Base 10% progress per action

  // Adjust for environmental conditions
  const visibilityFactor = conditions.visibility / 100;
  const currentFactor = Math.max(0.3, 1 - conditions.currentStrength / 10);

  baseProgress *= visibilityFactor * currentFactor;

  // Tool-specific adjustments
  if (tool.type === "trowel") {
    baseProgress *= 1.2; // Trowels are more effective for excavation
  } else if (tool.type === "brush") {
    baseProgress *= 0.8; // Brushes are slower but more careful
  }

  return Math.max(0.01, baseProgress); // Minimum progress to avoid getting stuck
}

function calculateDiscoveryScore(
  artifact: any,
  tool: any,
  conditions: any
): number {
  let baseScore = 100;

  // Bonus for using appropriate tools
  const toolValidation = validateToolUsage(
    tool,
    "discovery",
    conditions,
    artifact.condition
  );
  if (toolValidation.isValid) {
    baseScore += 25;
  }

  // Bonus based on artifact condition preservation
  const conditionBonus = {
    excellent: 50,
    good: 30,
    fair: 15,
    poor: 5,
  };
  baseScore +=
    conditionBonus[artifact.condition as keyof typeof conditionBonus];

  // Bonus for difficult conditions
  if (conditions.visibility < 50) baseScore += 20;
  if (conditions.currentStrength > 5) baseScore += 15;
  if (conditions.depth > 20) baseScore += 10;

  return baseScore;
}

function calculateTimeUsage(
  tool: any,
  conditions: any,
  excavationDepth: number
): number {
  let baseTime = 30; // 30 seconds base time

  // Adjust for tool efficiency
  baseTime *= 2 - tool.effectiveness; // More effective tools are faster

  // Adjust for conditions
  if (conditions.visibility < 50) baseTime *= 1.5;
  if (conditions.currentStrength > 5) baseTime *= 1.3;

  // Deeper excavation takes more time
  baseTime *= 1 + excavationDepth;

  return Math.round(baseTime);
}

function generateSiteReport(
  gameData: any,
  siteName: string,
  siteArtifacts: any[]
) {
  const totalCells = gameData.excavatedCells.length;
  const excavatedCells = gameData.excavatedCells.filter(
    (cell: any) => cell.excavated
  ).length;
  const completionPercentage = (excavatedCells / totalCells) * 100;

  const artifactsFound = gameData.discoveredArtifacts.length;
  const totalArtifacts = siteArtifacts.length;

  // Calculate documentation quality (0-100)
  const requiredDocTypes = ["discovery", "measurement", "photo"];
  const providedDocTypes = [
    ...new Set(gameData.documentationEntries.map((e: any) => e.entryType)),
  ];
  const documentationQuality =
    (providedDocTypes.length / requiredDocTypes.length) * 100;

  // Calculate protocol compliance (0-100)
  const totalViolations = gameData.protocolViolations.length;
  const severePenalty =
    gameData.protocolViolations.filter((v: any) => v.severity === "severe")
      .length * 30;
  const moderatePenalty =
    gameData.protocolViolations.filter((v: any) => v.severity === "moderate")
      .length * 15;
  const minorPenalty =
    gameData.protocolViolations.filter((v: any) => v.severity === "minor")
      .length * 5;
  const protocolCompliance = Math.max(
    0,
    100 - severePenalty - moderatePenalty - minorPenalty
  );

  // Calculate overall score
  const overallScore = Math.round(
    completionPercentage * 0.3 +
      (artifactsFound / totalArtifacts) * 100 * 0.4 +
      documentationQuality * 0.2 +
      protocolCompliance * 0.1
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (completionPercentage < 70) {
    recommendations.push(
      "Consider more systematic excavation to improve site coverage"
    );
  }
  if (documentationQuality < 80) {
    recommendations.push(
      "Improve documentation by taking more photos and measurements"
    );
  }
  if (protocolCompliance < 90) {
    recommendations.push("Review archaeological protocols to avoid violations");
  }
  if (artifactsFound < totalArtifacts) {
    recommendations.push(
      "Use probes and careful excavation to locate remaining artifacts"
    );
  }

  return {
    completionPercentage: Math.round(completionPercentage),
    artifactsFound,
    totalArtifacts,
    documentationQuality: Math.round(documentationQuality),
    protocolCompliance: Math.round(protocolCompliance),
    overallScore,
    recommendations,
  };
}

function generateDigitalReport(
  gameData: any,
  site: any,
  siteArtifacts: any[],
  report: any
): string {
  const reportDate = new Date().toLocaleDateString();

  return `
UNDERWATER ARCHAEOLOGICAL EXCAVATION REPORT

Site: ${site.name}
Location: ${site.location}
Historical Period: ${site.historicalPeriod}
Date: ${reportDate}

EXCAVATION SUMMARY:
- Site Completion: ${report.completionPercentage}%
- Artifacts Discovered: ${report.artifactsFound}/${report.totalArtifacts}
- Documentation Quality: ${report.documentationQuality}%
- Protocol Compliance: ${report.protocolCompliance}%
- Overall Score: ${report.overallScore}/100

ENVIRONMENTAL CONDITIONS:
${JSON.stringify(JSON.parse(site.environmentalConditions), null, 2)}

ARTIFACTS DISCOVERED:
${gameData.discoveredArtifacts.map((id: string, index: number) => `${index + 1}. Artifact ID: ${id}`).join("\n")}

DOCUMENTATION ENTRIES:
${gameData.documentationEntries
  .map(
    (entry: any, index: number) =>
      `${index + 1}. ${entry.entryType.toUpperCase()} at (${entry.gridPosition.x}, ${entry.gridPosition.y}): ${entry.content}`
  )
  .join("\n")}

PROTOCOL VIOLATIONS:
${
  gameData.protocolViolations.length > 0
    ? gameData.protocolViolations
        .map(
          (violation: any, index: number) =>
            `${index + 1}. ${violation.severity.toUpperCase()}: ${violation.description}`
        )
        .join("\n")
    : "None recorded"
}

RECOMMENDATIONS:
${report.recommendations.map((rec: string, index: number) => `${index + 1}. ${rec}`).join("\n")}

This report was generated automatically by the Underwater Archaeology Learning System.
  `.trim();
}

async function updateUserProgress(
  ctx: any,
  userId: Id<"users">,
  gameType: string,
  score: number
) {
  // This would update the user's progress in the studentProgress table
  // Implementation depends on existing progress tracking system
  const existingProgress = await ctx.db
    .query("studentProgress")
    .withIndex("by_user_and_game_type", (q: any) =>
      q.eq("userId", userId).eq("gameType", gameType)
    )
    .first();

  if (existingProgress) {
    await ctx.db.patch(existingProgress._id, {
      bestScore: Math.max(existingProgress.bestScore, score),
      lastPlayed: Date.now(),
    });
  } else {
    await ctx.db.insert("studentProgress", {
      userId,
      gameType: gameType as any,
      completedLevels: 1,
      totalLevels: 10, // This would be dynamic based on difficulty levels
      bestScore: score,
      averageScore: score,
      timeSpent: 0, // This would be calculated from session data
      lastPlayed: Date.now(),
      achievements: [],
    });
  }
}
