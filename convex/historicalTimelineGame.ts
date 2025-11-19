import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Historical timeline game data structure
interface TimelineGameData {
  events: TimelineEvent[];
  userOrder: string[]; // Array of event IDs in user's current order
  correctOrder: string[]; // Array of event IDs in correct chronological order
  matches: CultureMatch[];
  score: number;
  hintsUsed: number;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  dateRange: string;
  actualDate: number; // Year for sorting
  culture: string;
  artifactIds: Id<"gameArtifacts">[];
  imageUrl?: string;
  isPlaced: boolean;
}

interface CultureMatch {
  artifactId: Id<"gameArtifacts">;
  selectedCulture: string;
  correctCulture: string;
  isCorrect: boolean;
}

// Start a new historical timeline game
export const startHistoricalTimelineGame = mutation({
  args: {
    userId: v.id("users"),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
  },
  returns: v.id("gameSessions"),
  handler: async (ctx, args) => {
    // Generate timeline events based on difficulty
    const events = generateTimelineEvents(args.difficulty);
    const correctOrder = events
      .sort((a, b) => a.actualDate - b.actualDate)
      .map((e) => e.id);

    // Shuffle events for user
    const shuffledEvents = [...events].sort(() => Math.random() - 0.5);

    const gameData: TimelineGameData = {
      events: shuffledEvents.map((e) => ({ ...e, isPlaced: false })),
      userOrder: [],
      correctOrder,
      matches: [],
      score: 0,
      hintsUsed: 0,
    };

    const sessionId = await ctx.db.insert("gameSessions", {
      userId: args.userId,
      gameType: "historical_timeline",
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

// Place an event on the timeline
export const placeEvent = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    eventId: v.string(),
    position: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: TimelineGameData = JSON.parse(session.gameData);

    // Update event placement
    const event = gameData.events.find((e) => e.id === args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    event.isPlaced = true;

    // Insert at position or add to end
    if (args.position >= 0 && args.position <= gameData.userOrder.length) {
      gameData.userOrder.splice(args.position, 0, args.eventId);
    } else {
      gameData.userOrder.push(args.eventId);
    }

    gameData.completionPercentage = Math.round(
      (gameData.userOrder.length / gameData.events.length) * 100
    );

    await ctx.db.patch(args.sessionId, {
      completionPercentage: gameData.completionPercentage,
      gameData: JSON.stringify(gameData),
    });

    return {
      success: true,
      feedback: "Event placed on timeline",
    };
  },
});

// Reorder events on the timeline
export const reorderEvents = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    newOrder: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: TimelineGameData = JSON.parse(session.gameData);
    gameData.userOrder = args.newOrder;

    await ctx.db.patch(args.sessionId, {
      gameData: JSON.stringify(gameData),
    });

    return { success: true };
  },
});

// Submit culture match
export const submitCultureMatch = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    artifactId: v.id("gameArtifacts"),
    selectedCulture: v.string(),
  },
  returns: v.object({
    isCorrect: v.boolean(),
    correctCulture: v.string(),
    score: v.number(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const artifact = await ctx.db.get(args.artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    const gameData: TimelineGameData = JSON.parse(session.gameData);

    const isCorrect = artifact.culture === args.selectedCulture;
    const matchScore = isCorrect ? 50 : 0;

    gameData.matches.push({
      artifactId: args.artifactId,
      selectedCulture: args.selectedCulture,
      correctCulture: artifact.culture,
      isCorrect,
    });

    gameData.score += matchScore;

    await ctx.db.patch(args.sessionId, {
      currentScore: session.currentScore + matchScore,
      gameData: JSON.stringify(gameData),
    });

    return {
      isCorrect,
      correctCulture: artifact.culture,
      score: matchScore,
    };
  },
});

// Check timeline order and calculate score
export const checkTimelineOrder = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    correctCount: v.number(),
    totalCount: v.number(),
    score: v.number(),
    feedback: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: TimelineGameData = JSON.parse(session.gameData);

    let correctCount = 0;
    const feedback: string[] = [];

    // Check each position
    for (let i = 0; i < gameData.userOrder.length; i++) {
      if (gameData.userOrder[i] === gameData.correctOrder[i]) {
        correctCount++;
      } else {
        const event = gameData.events.find(
          (e) => e.id === gameData.userOrder[i]
        );
        if (event) {
          feedback.push(`${event.title} is in the wrong position`);
        }
      }
    }

    const accuracy = correctCount / gameData.correctOrder.length;
    const timelineScore = Math.round(accuracy * 500);

    gameData.score += timelineScore;

    await ctx.db.patch(args.sessionId, {
      currentScore: session.currentScore + timelineScore,
      gameData: JSON.stringify(gameData),
    });

    return {
      correctCount,
      totalCount: gameData.correctOrder.length,
      score: timelineScore,
      feedback,
    };
  },
});

// Get game state
export const getHistoricalTimelineGame = query({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    session: v.object({
      _id: v.id("gameSessions"),
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
    gameData: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    return {
      session,
      gameData: session.gameData,
    };
  },
});

// Complete the timeline game
export const completeHistoricalTimelineGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    success: v.boolean(),
    finalScore: v.number(),
    accuracy: v.number(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: TimelineGameData = JSON.parse(session.gameData);

    // Calculate final accuracy
    let correctPositions = 0;
    for (let i = 0; i < gameData.userOrder.length; i++) {
      if (gameData.userOrder[i] === gameData.correctOrder[i]) {
        correctPositions++;
      }
    }

    const accuracy = (correctPositions / gameData.correctOrder.length) * 100;

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endTime: Date.now(),
    });

    return {
      success: true,
      finalScore: session.currentScore,
      accuracy: Math.round(accuracy),
    };
  },
});

// Helper function to generate timeline events
function generateTimelineEvents(difficulty: string): TimelineEvent[] {
  const beginnerEvents: TimelineEvent[] = [
    {
      id: "event_1",
      title: "Ancient Greek Amphora",
      description: "Clay vessels used for storing wine and olive oil",
      dateRange: "500-300 BCE",
      actualDate: -400,
      culture: "Ancient Greek",
      artifactIds: [],
      isPlaced: false,
    },
    {
      id: "event_2",
      title: "Roman Shipwreck",
      description: "Merchant vessel carrying trade goods",
      dateRange: "100-200 CE",
      actualDate: 150,
      culture: "Roman",
      artifactIds: [],
      isPlaced: false,
    },
    {
      id: "event_3",
      title: "Viking Longship",
      description: "Norse seafaring vessel",
      dateRange: "800-1000 CE",
      actualDate: 900,
      culture: "Viking",
      artifactIds: [],
      isPlaced: false,
    },
    {
      id: "event_4",
      title: "Spanish Galleon",
      description: "Treasure ship from the New World",
      dateRange: "1500-1700 CE",
      actualDate: 1600,
      culture: "Spanish Colonial",
      artifactIds: [],
      isPlaced: false,
    },
    {
      id: "event_5",
      title: "Industrial Era Steamship",
      description: "Early steam-powered vessel",
      dateRange: "1850-1900 CE",
      actualDate: 1875,
      culture: "Industrial",
      artifactIds: [],
      isPlaced: false,
    },
  ];

  return beginnerEvents;
}
