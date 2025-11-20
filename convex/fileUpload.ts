import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * File Upload Module for BebaX
 * Handles document uploads for drivers, cargo photos, and vehicle images
 * Uses Convex file storage
 */

// Validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Generate upload URL for file
 * Client will use this URL to upload the file
 */
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Save uploaded file metadata
 * Called after client uploads file to the generated URL
 */
export const saveFileMetadata = mutation({
    args: {
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        category: v.union(
            v.literal("driver_document"),
            v.literal("vehicle_photo"),
            v.literal("cargo_photo"),
            v.literal("profile_photo")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Validate file size
        if (args.fileSize > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
        }

        // Validate file type
        const allowedTypes = args.category === "driver_document"
            ? ALLOWED_DOCUMENT_TYPES
            : ALLOWED_IMAGE_TYPES;

        if (!allowedTypes.includes(args.fileType)) {
            throw new Error(`File type ${args.fileType} not allowed for ${args.category}`);
        }

        // Store file URL
        const fileUrl = await ctx.storage.getUrl(args.storageId);

        return {
            storageId: args.storageId,
            url: fileUrl,
            fileName: args.fileName,
            fileType: args.fileType,
            fileSize: args.fileSize,
            uploadedBy: identity.subject,
            uploadedAt: new Date().toISOString(),
        };
    },
});

/**
 * Upload driver documents (NIDA, license, insurance, permit)
 */
export const uploadDriverDocuments = mutation({
    args: {
        nida_photo: v.optional(v.id("_storage")),
        license_photo: v.optional(v.id("_storage")),
        insurance_photo: v.optional(v.id("_storage")),
        road_permit_photo: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!driver) {
            throw new Error("Driver profile not found");
        }

        // Get URLs for uploaded files
        const documents: any = {};

        if (args.nida_photo) {
            documents.nida_photo = await ctx.storage.getUrl(args.nida_photo);
        }
        if (args.license_photo) {
            documents.license_photo = await ctx.storage.getUrl(args.license_photo);
        }
        if (args.insurance_photo) {
            documents.insurance_photo = await ctx.storage.getUrl(args.insurance_photo);
        }
        if (args.road_permit_photo) {
            documents.road_permit_photo = await ctx.storage.getUrl(args.road_permit_photo);
        }

        // Update driver documents
        await ctx.db.patch(driver._id, {
            documents: {
                ...driver.documents,
                ...documents,
            },
        });

        // Notify admin for verification
        const admins = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .collect();

        for (const admin of admins) {
            await ctx.db.insert("notifications", {
                user_clerk_id: admin.clerkId,
                type: "verification",
                title: "New Driver Documents",
                body: `Driver ${driver.clerkId} uploaded documents for verification`,
                read: false,
                created_at: new Date().toISOString(),
            });
        }

        return { success: true, documents };
    },
});

/**
 * Upload vehicle photos
 */
export const uploadVehiclePhotos = mutation({
    args: {
        vehicle_id: v.id("vehicles"),
        photos: v.array(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const vehicle = await ctx.db.get(args.vehicle_id);
        if (!vehicle || vehicle.driver_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        // Validate max 5 photos
        if (args.photos.length > 5) {
            throw new Error("Maximum 5 vehicle photos allowed");
        }

        // Get URLs
        const photoUrls = await Promise.all(
            args.photos.map(async (storageId) => {
                return await ctx.storage.getUrl(storageId);
            })
        );

        // Filter out any null values
        const validPhotoUrls = photoUrls.filter((url): url is string => url !== null);

        await ctx.db.patch(args.vehicle_id, {
            photos: validPhotoUrls,
        });

        return { success: true, photos: validPhotoUrls };
    },
});

/**
 * Delete file from storage
 */
export const deleteFile = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        await ctx.storage.delete(args.storageId);
        return { success: true };
    },
});

/**
 * Get file URL from storage ID
 */
export const getFileUrl = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
