import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Check if a user is eligible for certification
 */
export const checkCertificationEligibility = query({
  args: { userId: v.id("users") },
  returns: v.object({
    isEligible: v.boolean(),
    completionPercentage: v.number(),
    missingRequirements: v.array(v.string()),
    estimatedTimeToCompletion: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // Get overall progress
    const overallProgress = await ctx.db
      .query("overallProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!overallProgress) {
      return {
        isEligible: false,
        completionPercentage: 0,
        missingRequirements: ["No progress recorded yet"],
        estimatedTimeToCompletion: 300, // 5 hours estimated
      };
    }

    // Get game-specific progress
    const gameProgress = await ctx.db
      .query("studentProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const missingRequirements: string[] = [];
    const requiredGames: Array<{
      type: string;
      minScore: number;
      name: string;
    }> = [
      {
        type: "artifact_identification",
        minScore: 80,
        name: "Artifact Identification",
      },
      {
        type: "excavation_simulation",
        minScore: 75,
        name: "Excavation Techniques",
      },
    ];

    let totalEstimatedTime = 0;

    for (const required of requiredGames) {
      const progress = gameProgress.find((p) => p.gameType === required.type);

      if (!progress) {
        missingRequirements.push(
          `Complete ${required.name} game (minimum ${required.minScore}% score)`
        );
        totalEstimatedTime += 60; // 1 hour per missing game
      } else if (progress.bestScore < required.minScore) {
        missingRequirements.push(
          `Improve ${required.name} score to ${required.minScore}% (current: ${progress.bestScore}%)`
        );
        totalEstimatedTime += 30; // 30 minutes to improve
      }
    }

    // Check overall completion requirement (85%)
    if (overallProgress.overallCompletion < 85) {
      missingRequirements.push(
        `Reach 85% overall completion (current: ${overallProgress.overallCompletion.toFixed(1)}%)`
      );
    }

    const isEligible = missingRequirements.length === 0;

    return {
      isEligible,
      completionPercentage: overallProgress.overallCompletion,
      missingRequirements,
      estimatedTimeToCompletion: isEligible ? undefined : totalEstimatedTime,
    };
  },
});

/**
 * Evaluate user for certification (internal function)
 */
export const evaluateForCertification = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({
    isEligible: v.boolean(),
    overallScore: v.number(),
    gameScores: v.string(), // JSON string of scores by game type
    requirements: v.array(
      v.object({
        gameType: v.string(),
        requiredScore: v.number(),
        actualScore: v.number(),
        met: v.boolean(),
        description: v.string(),
      })
    ),
    feedback: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get game-specific progress
    const gameProgress = await ctx.db
      .query("studentProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const requirements = [
      {
        gameType: "artifact_identification",
        requiredScore: 80,
        description:
          "Artifact Identification - Demonstrate ability to identify and classify underwater artifacts",
      },
      {
        gameType: "excavation_simulation",
        requiredScore: 75,
        description:
          "Excavation Techniques - Show proficiency in proper archaeological excavation methods",
      },
    ];

    const evaluatedRequirements = requirements.map((req) => {
      const progress = gameProgress.find((p) => p.gameType === req.gameType);
      const actualScore = progress?.bestScore || 0;

      return {
        gameType: req.gameType,
        requiredScore: req.requiredScore,
        actualScore,
        met: actualScore >= req.requiredScore,
        description: req.description,
      };
    });

    const allRequirementsMet = evaluatedRequirements.every((r) => r.met);

    // Calculate overall score (weighted average)
    const gameScores: Record<string, number> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const req of evaluatedRequirements) {
      const progress = gameProgress.find((p) => p.gameType === req.gameType);
      const score = progress?.bestScore || 0;
      gameScores[req.gameType] = score;

      // Weight artifact identification more heavily (60%), excavation (40%)
      const weight = req.gameType === "artifact_identification" ? 0.6 : 0.4;
      totalWeightedScore += score * weight;
      totalWeight += weight;
    }

    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Generate feedback
    const feedback: string[] = [];

    if (allRequirementsMet) {
      feedback.push(
        "Congratulations! You meet all requirements for certification."
      );
      feedback.push(
        `Your overall score of ${overallScore.toFixed(1)}% demonstrates strong competency in underwater archaeology.`
      );
    } else {
      feedback.push("You do not yet meet all certification requirements.");

      for (const req of evaluatedRequirements) {
        if (!req.met) {
          const gap = req.requiredScore - req.actualScore;
          feedback.push(
            `${req.gameType}: Need ${gap.toFixed(1)}% more to reach the required ${req.requiredScore}% score.`
          );
        }
      }
    }

    // Update overall progress certification status
    const overallProgress = await ctx.db
      .query("overallProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (overallProgress) {
      await ctx.db.patch(overallProgress._id, {
        certificationStatus: allRequirementsMet ? "eligible" : "not_eligible",
      });
    }

    return {
      isEligible: allRequirementsMet,
      overallScore,
      gameScores: JSON.stringify(gameScores),
      requirements: evaluatedRequirements,
      feedback,
    };
  },
});

/**
 * Get detailed certification assessment for a user
 */
export const getCertificationAssessment = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      isEligible: v.boolean(),
      overallScore: v.number(),
      gameScores: v.record(v.string(), v.number()),
      requirements: v.array(
        v.object({
          gameType: v.string(),
          requiredScore: v.number(),
          actualScore: v.number(),
          met: v.boolean(),
          description: v.string(),
        })
      ),
      strengths: v.array(v.string()),
      weaknesses: v.array(v.string()),
      recommendations: v.array(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const gameProgress = await ctx.db
      .query("studentProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (gameProgress.length === 0) {
      return null;
    }

    const requirements = [
      {
        gameType: "artifact_identification",
        requiredScore: 80,
        description: "Artifact Identification",
      },
      {
        gameType: "excavation_simulation",
        requiredScore: 75,
        description: "Excavation Techniques",
      },
    ];

    const evaluatedRequirements = requirements.map((req) => {
      const progress = gameProgress.find((p) => p.gameType === req.gameType);
      const actualScore = progress?.bestScore || 0;

      return {
        gameType: req.gameType,
        requiredScore: req.requiredScore,
        actualScore,
        met: actualScore >= req.requiredScore,
        description: req.description,
      };
    });

    const allRequirementsMet = evaluatedRequirements.every((r) => r.met);

    // Calculate scores
    const gameScores: Record<string, number> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const req of evaluatedRequirements) {
      const progress = gameProgress.find((p) => p.gameType === req.gameType);
      const score = progress?.bestScore || 0;
      gameScores[req.gameType] = score;

      const weight = req.gameType === "artifact_identification" ? 0.6 : 0.4;
      totalWeightedScore += score * weight;
      totalWeight += weight;
    }

    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    for (const req of evaluatedRequirements) {
      const progress = gameProgress.find((p) => p.gameType === req.gameType);

      if (progress) {
        if (progress.bestScore >= 90) {
          strengths.push(
            `Excellent performance in ${req.description} (${progress.bestScore}%)`
          );
        } else if (progress.bestScore >= req.requiredScore) {
          strengths.push(
            `Good performance in ${req.description} (${progress.bestScore}%)`
          );
        } else {
          weaknesses.push(
            `${req.description} needs improvement (${progress.bestScore}% / ${req.requiredScore}% required)`
          );
          recommendations.push(
            `Practice ${req.description} to improve your score by ${(req.requiredScore - progress.bestScore).toFixed(1)}%`
          );
        }
      } else {
        weaknesses.push(`${req.description} not yet attempted`);
        recommendations.push(`Complete ${req.description} game`);
      }
    }

    if (allRequirementsMet) {
      recommendations.push(
        "You are ready for certification! Proceed to generate your certificate."
      );
    }

    return {
      userId: args.userId,
      isEligible: allRequirementsMet,
      overallScore,
      gameScores,
      requirements: evaluatedRequirements,
      strengths,
      weaknesses,
      recommendations,
    };
  },
});

/**
 * Get all users eligible for certification
 */
export const getEligibleUsers = query({
  args: {},
  returns: v.array(
    v.object({
      userId: v.id("users"),
      userName: v.string(),
      overallCompletion: v.number(),
      totalScore: v.number(),
      lastActivity: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const eligibleProgress = await ctx.db
      .query("overallProgress")
      .withIndex("by_certification_status", (q) =>
        q.eq("certificationStatus", "eligible")
      )
      .collect();

    const results = [];

    for (const progress of eligibleProgress) {
      const user = await ctx.db.get(progress.userId);

      if (user) {
        results.push({
          userId: progress.userId,
          userName: user.name,
          overallCompletion: progress.overallCompletion,
          totalScore: progress.totalScore,
          lastActivity: progress.lastActivity,
        });
      }
    }

    return results;
  },
});

/**
 * Generate a verification code for a certificate
 */
function generateVerificationCode(userId: string, timestamp: number): string {
  // Create a unique verification code based on user ID and timestamp
  const baseString = `${userId}-${timestamp}`;
  let hash = 0;

  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to alphanumeric string
  const hashStr = Math.abs(hash).toString(36).toUpperCase();
  const timestampStr = timestamp.toString(36).toUpperCase();

  return `UWA-${timestampStr}-${hashStr}`.substring(0, 20);
}

/**
 * Generate a digital signature for a certificate
 */
function generateDigitalSignature(
  userId: string,
  verificationCode: string,
  issueDate: number
): string {
  // Create a digital signature combining multiple elements
  const signatureBase = `${userId}:${verificationCode}:${issueDate}:UWAC`;
  let signature = 0;

  for (let i = 0; i < signatureBase.length; i++) {
    const char = signatureBase.charCodeAt(i);
    signature = (signature << 5) - signature + char;
    signature = signature & signature;
  }

  return Math.abs(signature).toString(16).toUpperCase().padStart(16, "0");
}

/**
 * Generate a digital certificate for a user
 */
export const generateCertificate = mutation({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      success: v.boolean(),
      certificateId: v.id("certificates"),
      verificationCode: v.string(),
      message: v.string(),
    }),
    v.object({
      success: v.boolean(),
      message: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Check if user already has a valid certificate
    const existingCertificate = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isValid"), true))
      .first();

    if (existingCertificate) {
      return {
        success: false,
        message: "User already has a valid certificate",
      };
    }

    // Evaluate eligibility
    const evaluation: {
      isEligible: boolean;
      overallScore: number;
      gameScores: string;
      requirements: Array<{
        gameType: string;
        requiredScore: number;
        actualScore: number;
        met: boolean;
        description: string;
      }>;
      feedback: string[];
    } = await ctx.runMutation(internal.certification.evaluateForCertification, {
      userId: args.userId,
    });

    if (!evaluation.isEligible) {
      return {
        success: false,
        message: "User does not meet certification requirements",
      };
    }

    // Get user information
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Generate certificate details
    const issueDate = Date.now();
    const verificationCode = generateVerificationCode(args.userId, issueDate);
    const digitalSignature = generateDigitalSignature(
      args.userId,
      verificationCode,
      issueDate
    );

    // Create certificate
    const certificateId = await ctx.db.insert("certificates", {
      userId: args.userId,
      studentName: user.name,
      certificateType: "junior_underwater_archaeologist",
      issueDate,
      scores: evaluation.gameScores,
      verificationCode,
      digitalSignature,
      isValid: true,
    });

    // Update overall progress to certified status
    const overallProgress = await ctx.db
      .query("overallProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (overallProgress) {
      await ctx.db.patch(overallProgress._id, {
        certificationStatus: "certified",
      });
    }

    return {
      success: true,
      certificateId,
      verificationCode,
      message: "Certificate generated successfully",
    };
  },
});

/**
 * Get certificate by ID
 */
export const getCertificate = query({
  args: { certificateId: v.id("certificates") },
  returns: v.union(
    v.object({
      _id: v.id("certificates"),
      userId: v.id("users"),
      studentName: v.string(),
      certificateType: v.literal("junior_underwater_archaeologist"),
      issueDate: v.number(),
      scores: v.string(),
      verificationCode: v.string(),
      digitalSignature: v.string(),
      isValid: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.certificateId);
  },
});

/**
 * Get user's certificate
 */
export const getUserCertificate = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("certificates"),
      userId: v.id("users"),
      studentName: v.string(),
      certificateType: v.literal("junior_underwater_archaeologist"),
      issueDate: v.number(),
      scores: v.string(),
      verificationCode: v.string(),
      digitalSignature: v.string(),
      isValid: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isValid"), true))
      .first();
  },
});

/**
 * Verify a certificate by verification code
 */
export const verifyCertificate = query({
  args: { verificationCode: v.string() },
  returns: v.object({
    isValid: v.boolean(),
    certificate: v.union(
      v.object({
        _id: v.id("certificates"),
        studentName: v.string(),
        certificateType: v.literal("junior_underwater_archaeologist"),
        issueDate: v.number(),
        scores: v.string(),
        verificationCode: v.string(),
      }),
      v.null()
    ),
    errorMessage: v.optional(v.string()),
    verifiedDate: v.number(),
  }),
  handler: async (ctx, args) => {
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_verification_code", (q) =>
        q.eq("verificationCode", args.verificationCode)
      )
      .first();

    if (!certificate) {
      return {
        isValid: false,
        certificate: null,
        errorMessage: "Certificate not found",
        verifiedDate: Date.now(),
      };
    }

    if (!certificate.isValid) {
      return {
        isValid: false,
        certificate: null,
        errorMessage: "Certificate has been revoked",
        verifiedDate: Date.now(),
      };
    }

    return {
      isValid: true,
      certificate: {
        _id: certificate._id,
        studentName: certificate.studentName,
        certificateType: certificate.certificateType,
        issueDate: certificate.issueDate,
        scores: certificate.scores,
        verificationCode: certificate.verificationCode,
      },
      verifiedDate: Date.now(),
    };
  },
});

/**
 * Revoke a certificate (admin function)
 */
export const revokeCertificate = mutation({
  args: {
    certificateId: v.id("certificates"),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const certificate = await ctx.db.get(args.certificateId);

    if (!certificate) {
      return {
        success: false,
        message: "Certificate not found",
      };
    }

    await ctx.db.patch(args.certificateId, {
      isValid: false,
    });

    // Update user's certification status
    const overallProgress = await ctx.db
      .query("overallProgress")
      .withIndex("by_user", (q) => q.eq("userId", certificate.userId))
      .first();

    if (overallProgress) {
      await ctx.db.patch(overallProgress._id, {
        certificationStatus: "eligible",
      });
    }

    return {
      success: true,
      message: `Certificate revoked: ${args.reason}`,
    };
  },
});

/**
 * Get all certificates (admin function)
 */
export const getAllCertificates = query({
  args: {
    limit: v.optional(v.number()),
    includeRevoked: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("certificates"),
      userId: v.id("users"),
      studentName: v.string(),
      certificateType: v.literal("junior_underwater_archaeologist"),
      issueDate: v.number(),
      scores: v.string(),
      verificationCode: v.string(),
      digitalSignature: v.string(),
      isValid: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("certificates")
      .withIndex("by_issue_date")
      .order("desc");

    let certificates = await query.collect();

    if (!args.includeRevoked) {
      certificates = certificates.filter((c) => c.isValid);
    }

    if (args.limit) {
      certificates = certificates.slice(0, args.limit);
    }

    return certificates;
  },
});
