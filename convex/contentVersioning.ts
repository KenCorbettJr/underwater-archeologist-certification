import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateAdminRole } from "./adminAuth";
import { api } from "./_generated/api";

const resourceTypeValidator = v.union(
  v.literal("gameArtifacts"),
  v.literal("excavationSites"),
  v.literal("challenges")
);

/**
 * Create a new version of content
 */
export const createContentVersion = mutation({
  args: {
    adminClerkId: v.string(),
    resourceType: resourceTypeValidator,
    resourceId: v.string(),
    contentData: v.string(),
    changeDescription: v.optional(v.string()),
  },
  returns: v.id("contentVersions"),
  handler: async (ctx, args) => {
    await validateAdminRole(ctx, args.adminClerkId);

    // Get the current version number
    const existingVersions = await ctx.db
      .query("contentVersions")
      .withIndex("by_resource", (q) =>
        q
          .eq("resourceType", args.resourceType)
          .eq("resourceId", args.resourceId)
      )
      .collect();

    const currentVersion =
      existingVersions.length > 0
        ? Math.max(...existingVersions.map((v) => v.version))
        : 0;

    const newVersion = currentVersion + 1;

    // Mark all previous versions as not current
    for (const version of existingVersions) {
      if (version.isCurrentVersion) {
        await ctx.db.patch(version._id, { isCurrentVersion: false });
      }
    }

    // Create new version
    const versionId = await ctx.db.insert("contentVersions", {
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      version: newVersion,
      contentData: args.contentData,
      changeDescription: args.changeDescription,
      changedBy: args.adminClerkId,
      timestamp: Date.now(),
      isCurrentVersion: true,
    });

    // Log the action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "create_content_version",
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      details: `Created version ${newVersion}${args.changeDescription ? `: ${args.changeDescription}` : ""}`,
    });

    return versionId;
  },
});

/**
 * Get all versions for a resource
 */
export const getContentVersions = query({
  args: {
    resourceType: resourceTypeValidator,
    resourceId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("contentVersions"),
      version: v.number(),
      contentData: v.string(),
      changeDescription: v.optional(v.string()),
      changedBy: v.string(),
      timestamp: v.number(),
      isCurrentVersion: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("contentVersions")
      .withIndex("by_resource", (q) =>
        q
          .eq("resourceType", args.resourceType)
          .eq("resourceId", args.resourceId)
      )
      .order("desc")
      .collect();

    return versions;
  },
});

/**
 * Get a specific version
 */
export const getContentVersion = query({
  args: {
    versionId: v.id("contentVersions"),
  },
  returns: v.union(
    v.object({
      _id: v.id("contentVersions"),
      resourceType: resourceTypeValidator,
      resourceId: v.string(),
      version: v.number(),
      contentData: v.string(),
      changeDescription: v.optional(v.string()),
      changedBy: v.string(),
      timestamp: v.number(),
      isCurrentVersion: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.versionId);
  },
});

/**
 * Revert to a previous version
 */
export const revertToVersion = mutation({
  args: {
    adminClerkId: v.string(),
    versionId: v.id("contentVersions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateAdminRole(ctx, args.adminClerkId);

    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    // Create a new version with the old content
    await ctx.runMutation(api.contentVersioning.createContentVersion, {
      adminClerkId: args.adminClerkId,
      resourceType: version.resourceType,
      resourceId: version.resourceId,
      contentData: version.contentData,
      changeDescription: `Reverted to version ${version.version}`,
    });

    return null;
  },
});

/**
 * Submit content for approval
 */
export const submitForApproval = mutation({
  args: {
    adminClerkId: v.string(),
    resourceType: resourceTypeValidator,
    resourceId: v.string(),
    versionId: v.id("contentVersions"),
  },
  returns: v.id("contentApprovals"),
  handler: async (ctx, args) => {
    await validateAdminRole(ctx, args.adminClerkId);

    // Check if there's already a pending approval for this resource
    const existingApproval = await ctx.db
      .query("contentApprovals")
      .withIndex("by_resource", (q) =>
        q
          .eq("resourceType", args.resourceType)
          .eq("resourceId", args.resourceId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingApproval) {
      throw new Error("There is already a pending approval for this resource");
    }

    const approvalId = await ctx.db.insert("contentApprovals", {
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      versionId: args.versionId,
      status: "pending",
      submittedBy: args.adminClerkId,
      submittedAt: Date.now(),
    });

    // Log the action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "submit_for_approval",
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      details: "Submitted content for approval",
    });

    return approvalId;
  },
});

/**
 * Approve or reject content
 */
export const reviewContent = mutation({
  args: {
    adminClerkId: v.string(),
    approvalId: v.id("contentApprovals"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateAdminRole(ctx, args.adminClerkId);

    const approval = await ctx.db.get(args.approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }

    if (approval.status !== "pending") {
      throw new Error("This approval has already been reviewed");
    }

    // Update approval status
    await ctx.db.patch(args.approvalId, {
      status: args.status,
      reviewedBy: args.adminClerkId,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
    });

    // If approved, apply the version to the actual resource
    if (args.status === "approved") {
      const version = await ctx.db.get(approval.versionId);
      if (version) {
        const contentData = JSON.parse(version.contentData);

        // Apply the content based on resource type
        if (approval.resourceType === "gameArtifacts") {
          await ctx.db.patch(contentData._id, contentData);
        } else if (approval.resourceType === "excavationSites") {
          await ctx.db.patch(contentData._id, contentData);
        } else if (approval.resourceType === "challenges") {
          await ctx.db.patch(contentData._id, contentData);
        }
      }
    }

    // Log the action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: args.status === "approved" ? "approve_content" : "reject_content",
      resourceType: approval.resourceType,
      resourceId: approval.resourceId,
      details: args.reviewNotes || `Content ${args.status}`,
    });

    return null;
  },
});

/**
 * Get pending approvals
 */
export const getPendingApprovals = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("contentApprovals"),
      resourceType: resourceTypeValidator,
      resourceId: v.string(),
      versionId: v.id("contentVersions"),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      ),
      submittedBy: v.string(),
      submittedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("contentApprovals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

/**
 * Get approval history for a resource
 */
export const getApprovalHistory = query({
  args: {
    resourceType: resourceTypeValidator,
    resourceId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("contentApprovals"),
      versionId: v.id("contentVersions"),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      ),
      submittedBy: v.string(),
      reviewedBy: v.optional(v.string()),
      submittedAt: v.number(),
      reviewedAt: v.optional(v.number()),
      reviewNotes: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentApprovals")
      .withIndex("by_resource", (q) =>
        q
          .eq("resourceType", args.resourceType)
          .eq("resourceId", args.resourceId)
      )
      .order("desc")
      .collect();
  },
});
