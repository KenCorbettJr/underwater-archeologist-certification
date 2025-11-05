import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // TODO: Add admin role validation when auth system is complete
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a file URL from storage ID
 */
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get file metadata from storage ID
 */
export const getFileMetadata = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(
    v.object({
      _id: v.id("_storage"),
      _creationTime: v.number(),
      contentType: v.optional(v.string()),
      sha256: v.string(),
      size: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.system.get(args.storageId);
  },
});

/**
 * Delete a file from storage
 */
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Add admin role validation when auth system is complete
    await ctx.storage.delete(args.storageId);
    return null;
  },
});

/**
 * Admin function to upload and store an image for artifacts
 */
export const storeArtifactImage = mutation({
  args: {
    adminClerkId: v.string(),
    storageId: v.id("_storage"),
    artifactName: v.string(),
  },
  returns: v.object({
    storageId: v.id("_storage"),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    // TODO: Add admin role validation when auth system is complete

    // Verify the file exists
    const fileMetadata = await ctx.db.system.get(args.storageId);
    if (!fileMetadata) {
      throw new Error("File not found");
    }

    // Validate it's an image
    if (!fileMetadata.contentType?.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    // Get the URL for the stored file
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get file URL");
    }

    return {
      storageId: args.storageId,
      url,
    };
  },
});

/**
 * Validate image file before upload
 */
export const validateImageFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.object({
    isValid: v.boolean(),
    error: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        contentType: v.string(),
        size: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const fileMetadata = await ctx.db.system.get(args.storageId);

    if (!fileMetadata) {
      return {
        isValid: false,
        error: "File not found",
      };
    }

    // Check if it's an image
    if (!fileMetadata.contentType?.startsWith("image/")) {
      return {
        isValid: false,
        error: "File must be an image (JPEG, PNG, GIF, WebP)",
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileMetadata.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 10MB",
      };
    }

    return {
      isValid: true,
      metadata: {
        contentType: fileMetadata.contentType,
        size: fileMetadata.size,
      },
    };
  },
});
