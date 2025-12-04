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

const documentationQuestValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  questType: v.union(
    v.literal("take_photos"),
    v.literal("record_measurements"),
    v.literal("document_artifacts"),
    v.literal("complete_grid_survey"),
    v.literal("write_field_notes")
  ),
  targetCount: v.number(),
  currentCount: v.number(),
  isComplete: v.boolean(),
  reward: v.number(),
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

    // Parse original site artifacts to get artifact IDs and conditions
    const originalArtifacts = site.siteArtifacts.map((artifactStr: string) =>
      JSON.parse(artifactStr)
    );

    // Randomize artifact positions
    const randomizedArtifacts = randomizeArtifactPositions(
      originalArtifacts,
      site.gridWidth,
      site.gridHeight
    );

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

    // Initialize documentation quests based on difficulty
    const documentationQuests = initializeDocumentationQuests(
      args.difficulty,
      randomizedArtifacts.length,
      site.gridWidth * site.gridHeight
    );

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
      documentationQuests,
      protocolViolations: [],
      // Store randomized artifact positions in game data
      randomizedArtifacts,
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

    // Use randomized artifacts from game data if available, otherwise fall back to site artifacts
    const siteArtifacts =
      gameData.randomizedArtifacts ||
      site.siteArtifacts.map((artifactStr: string) => JSON.parse(artifactStr));
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
  returns: v.object({
    success: v.boolean(),
    questsCompleted: v.array(v.string()),
    bonusScore: v.number(),
  }),
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

    // Update documentation quests
    const questsCompleted: string[] = [];
    let bonusScore = 0;

    if (gameData.documentationQuests) {
      for (const quest of gameData.documentationQuests) {
        if (quest.isComplete) continue;

        let shouldIncrement = false;

        switch (quest.questType) {
          case "take_photos":
            if (args.entryType === "photo") shouldIncrement = true;
            break;
          case "record_measurements":
            if (args.entryType === "measurement") shouldIncrement = true;
            break;
          case "document_artifacts":
            if (args.entryType === "discovery" && args.artifactId)
              shouldIncrement = true;
            break;
          case "write_field_notes":
            if (args.entryType === "note") shouldIncrement = true;
            break;
        }

        if (shouldIncrement) {
          quest.currentCount++;
          if (quest.currentCount >= quest.targetCount && !quest.isComplete) {
            quest.isComplete = true;
            questsCompleted.push(quest.title);
            bonusScore += quest.reward;
          }
        }
      }
    }

    // Update score if quests were completed
    const newScore = session.currentScore + bonusScore;

    await ctx.db.patch(args.sessionId, {
      currentScore: newScore,
      gameData: JSON.stringify(gameData),
    });

    return {
      success: true,
      questsCompleted,
      bonusScore,
    };
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

    // Use randomized artifacts from game data if available
    const siteArtifacts =
      gameData.randomizedArtifacts ||
      site.siteArtifacts.map((artifactStr: string) => JSON.parse(artifactStr));

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
        documentationQuests: v.optional(v.array(documentationQuestValidator)),
        protocolViolations: v.array(protocolViolationValidator),
        randomizedArtifacts: v.optional(
          v.array(
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
          )
        ),
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
        // Use randomized artifacts from game data if available
        siteArtifacts:
          gameData.randomizedArtifacts ||
          site.siteArtifacts.map((artifactStr: string) =>
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
        documentationQuests: gameData.documentationQuests || [],
        protocolViolations: gameData.protocolViolations || [],
      },
    };
  },
});

// Helper functions

/**
 * Randomize artifact positions on the grid
 * Ensures no two artifacts occupy the same position
 */
function randomizeArtifactPositions(
  artifacts: any[],
  gridWidth: number,
  gridHeight: number
): any[] {
  const usedPositions = new Set<string>();
  const randomizedArtifacts = [];

  for (const artifact of artifacts) {
    let position;
    let attempts = 0;
    const maxAttempts = 100;

    // Find a unique random position
    do {
      const x = Math.floor(Math.random() * gridWidth);
      const y = Math.floor(Math.random() * gridHeight);
      position = { x, y };
      attempts++;

      if (attempts >= maxAttempts) {
        // Fallback: use any available position
        for (let fallbackX = 0; fallbackX < gridWidth; fallbackX++) {
          for (let fallbackY = 0; fallbackY < gridHeight; fallbackY++) {
            const key = `${fallbackX},${fallbackY}`;
            if (!usedPositions.has(key)) {
              position = { x: fallbackX, y: fallbackY };
              break;
            }
          }
          if (position) break;
        }
        break;
      }
    } while (usedPositions.has(`${position.x},${position.y}`));

    usedPositions.add(`${position.x},${position.y}`);

    // Randomize depth slightly (keep within reasonable range)
    const baseDepth = artifact.depth || 0.5;
    const depthVariation = (Math.random() - 0.5) * 0.3; // ±0.15
    const randomizedDepth = Math.max(
      0.3,
      Math.min(0.95, baseDepth + depthVariation)
    );

    randomizedArtifacts.push({
      artifactId: artifact.artifactId,
      gridPosition: position,
      depth: randomizedDepth,
      isDiscovered: false,
      condition: artifact.condition,
    });
  }

  return randomizedArtifacts;
}

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

      return {
        success: true,
        newGameData,
        discoveries: [`Documented cell at position (${gridX}, ${gridY})`],
        violations,
        score,
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

  // Update grid survey quest if it exists
  if (newGameData.documentationQuests && cell.excavated) {
    const gridSurveyQuest = newGameData.documentationQuests.find(
      (q: any) => q.questType === "complete_grid_survey"
    );
    if (gridSurveyQuest && !gridSurveyQuest.isComplete) {
      const excavatedCount = newGameData.excavatedCells.filter(
        (c: any) => c.excavated
      ).length;
      gridSurveyQuest.currentCount = excavatedCount;
      if (gridSurveyQuest.currentCount >= gridSurveyQuest.targetCount) {
        gridSurveyQuest.isComplete = true;
        score += gridSurveyQuest.reward;
        discoveries.push(`Quest completed: ${gridSurveyQuest.title}!`);
      }
    }
  }

  return {
    success: true,
    newGameData,
    discoveries,
    violations,
    score,
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

/**
 * Initialize documentation quests based on difficulty level
 */
function initializeDocumentationQuests(
  difficulty: "beginner" | "intermediate" | "advanced",
  artifactCount: number,
  totalCells: number
): any[] {
  const quests = [];

  // Base quests for all difficulty levels
  quests.push({
    id: "quest_photos",
    title: "Site Photography",
    description: "Take photos to document the excavation site",
    questType: "take_photos",
    targetCount:
      difficulty === "beginner" ? 3 : difficulty === "intermediate" ? 5 : 8,
    currentCount: 0,
    isComplete: false,
    reward: 50,
  });

  quests.push({
    id: "quest_measurements",
    title: "Record Measurements",
    description: "Take accurate measurements of artifacts and features",
    questType: "record_measurements",
    targetCount:
      difficulty === "beginner" ? 4 : difficulty === "intermediate" ? 6 : 10,
    currentCount: 0,
    isComplete: false,
    reward: 50,
  });

  quests.push({
    id: "quest_artifacts",
    title: "Document Artifacts",
    description: "Create detailed documentation for discovered artifacts",
    questType: "document_artifacts",
    targetCount: Math.max(1, Math.floor(artifactCount * 0.5)),
    currentCount: 0,
    isComplete: false,
    reward: 100,
  });

  // Additional quests for intermediate and advanced
  if (difficulty === "intermediate" || difficulty === "advanced") {
    quests.push({
      id: "quest_field_notes",
      title: "Field Notes",
      description:
        "Write detailed field notes about excavation methods and observations",
      questType: "write_field_notes",
      targetCount: difficulty === "intermediate" ? 3 : 5,
      currentCount: 0,
      isComplete: false,
      reward: 75,
    });
  }

  // Advanced only quest
  if (difficulty === "advanced") {
    quests.push({
      id: "quest_grid_survey",
      title: "Complete Grid Survey",
      description: "Document at least 50% of the excavation grid",
      questType: "complete_grid_survey",
      targetCount: Math.floor(totalCells * 0.5),
      currentCount: 0,
      isComplete: false,
      reward: 150,
    });
  }

  return quests;
}
