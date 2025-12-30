import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Validation helpers
const validatePhone = (phone: string) => {
    if (!phone || phone.trim() === "") {
        throw new Error("Phone number is required");
    }
    // Accept any phone number with at least 9 digits
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
        throw new Error(`Phone number must be between 9 and 15 digits (you entered ${digitsOnly.length} digits)`);
    }
};

const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
    }
};

const sanitizeString = (str: string, maxLength: number = 200): string => {
    return str.trim().substring(0, maxLength);
};

// ===== THE BOUNCER =====
// Universal Sync: Ensures every authenticated user has a profile
export const syncUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Check if profile exists
        const existingProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (existingProfile) {
            // Profile exists - return it
            return existingProfile;
        }

        // CREATE NEW PROFILE - The Bouncer lets them in
        const newProfile = {
            clerkId: identity.subject,
            name: identity.name || identity.givenName || "User",
            email: identity.email || "",
            role: "customer" as const, // Default to customer
            phone: "", // Will be captured later via PhoneCaptureModal or profile edit
            rating: 5.0,
            totalRides: 0,
            created_at: new Date().toISOString(),
        };

        const profileId = await ctx.db.insert("userProfiles", newProfile);
        const profile = await ctx.db.get(profileId);

        return profile;
    },
});

// Create or update user profile with validation
export const createOrUpdateProfile = mutation({
    args: {
        role: v.union(v.literal("customer"), v.literal("driver"), v.literal("admin")),
        phone: v.string(),
        name: v.string(),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                throw new Error("Not authenticated");
            }

            // Validate inputs
            validatePhone(args.phone);
            if (args.email) {
                validateEmail(args.email);
            }

            if (args.name.length < 2) {
                throw new Error("Name must be at least 2 characters");
            }
            if (args.name.length > 100) {
                throw new Error("Name must be less than 100 characters");
            }

            // Sanitize name
            const sanitizedName = sanitizeString(args.name, 100);

            const existingProfile = await ctx.db
                .query("userProfiles")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (existingProfile) {
                await ctx.db.patch(existingProfile._id, {
                    role: args.role,
                    phone: args.phone,
                    name: sanitizedName,
                    email: args.email,
                });
                return existingProfile._id;
            }

            // Prepare profile data
            const profileData: any = {
                clerkId: identity.subject,
                role: args.role,
                phone: args.phone,
                name: sanitizedName,
                rating: 5.0,
                totalRides: 0,
                created_at: new Date().toISOString(),
            };

            // Handle email safely
            if (args.email && args.email.trim() !== "") {
                profileData.email = args.email;
            }

            return await ctx.db.insert("userProfiles", profileData);
        } catch (error) {
            throw new Error(`Profile creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
});

// DEV HELPER: Set current user's role (authenticated)
export const setMyRole = mutation({
    args: { role: v.union(v.literal("customer"), v.literal("driver"), v.literal("admin")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile) {
            throw new Error("Profile not found");
        }

        await ctx.db.patch(profile._id, { role: args.role });
        return `Your role is now: ${args.role}`;
    },
});

// Get current user profile
export const getCurrentProfile = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
    },
});

// Get user profile by Clerk ID
export const getProfileByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        if (!args.clerkId || args.clerkId.length < 10) {
            throw new Error("Invalid Clerk ID");
        }

        return await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

// Update profile with validation
export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        profilePhoto: v.optional(v.string()),
        emergencyContact: v.optional(v.string()),
        defaultAddress: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            address: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        let profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        // If profile doesn't exist, create a basic customer profile
        if (!profile) {
            const newProfileId = await ctx.db.insert("userProfiles", {
                clerkId: identity.subject,
                role: "customer",
                name: identity.name || identity.givenName || "User",
                phone: args.phone || "",
                rating: 5.0,
                totalRides: 0,
                created_at: new Date().toISOString(),
            });
            profile = await ctx.db.get(newProfileId);
            if (!profile) {
                throw new Error("Failed to create profile");
            }
        }

        const updates: any = {};

        if (args.name) {
            if (args.name.length < 2 || args.name.length > 100) {
                throw new Error("Name must be between 2 and 100 characters");
            }
            updates.name = sanitizeString(args.name, 100);
        }

        if (args.phone) {
            validatePhone(args.phone);
            updates.phone = args.phone;
        }

        if (args.email) {
            validateEmail(args.email);
            updates.email = args.email;
        }

        if (args.emergencyContact) {
            // Validate emergency contact as phone number
            const digitsOnly = args.emergencyContact.replace(/\D/g, '');
            if (digitsOnly.length >= 9 && digitsOnly.length <= 15) {
                updates.emergencyContact = args.emergencyContact;
            }
        }

        if (args.profilePhoto) {
            // Validate URL format
            if (!args.profilePhoto.startsWith("http")) {
                throw new Error("Invalid profile photo URL");
            }
            updates.profilePhoto = args.profilePhoto;
        }

        if (args.defaultAddress) {
            // Validate coordinates
            if (args.defaultAddress.lat < -90 || args.defaultAddress.lat > 90) {
                throw new Error("Invalid latitude");
            }
            if (args.defaultAddress.lng < -180 || args.defaultAddress.lng > 180) {
                throw new Error("Invalid longitude");
            }
            updates.defaultAddress = args.defaultAddress;
        }

        await ctx.db.patch(profile._id, updates);
        return profile._id;
    },
});

// Update profile photo from storage ID
export const saveProfilePhoto = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) {
            throw new Error("Failed to get image URL");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, { profilePhoto: url });
        } else {
            // Should not happen for authenticated users usually due to syncUser, but handle it
            await ctx.db.insert("userProfiles", {
                clerkId: identity.subject,
                role: "customer",
                name: identity.name || "User",
                phone: "",
                rating: 5.0,
                totalRides: 0,
                profilePhoto: url,
                created_at: new Date().toISOString(),
            });
        }
        return url;
    },
});

// Save Expo push token
export const savePushToken = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile) {
            throw new Error("Profile not found");
        }

        await ctx.db.patch(profile._id, { pushToken: args.token });
    },
});

// Delete user account
export const deleteUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile) {
            throw new Error("Profile not found");
        }

        // In a real app, we might want to soft-delete or anonymize
        // For now, we'll delete the profile record
        await ctx.db.delete(profile._id);

        // If driver, delete driver record too
        if (profile.role === "driver") {
            const driver = await ctx.db
                .query("drivers")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (driver) {
                await ctx.db.delete(driver._id);
            }
        }

        return true;
    },
});


// Get full user context (Profile + Driver + Org)
export const getMyself = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile) {
            return { profile: null, driver: null, org: null };
        }

        let driver = null;
        if (profile.role === "driver") {
            driver = await ctx.db
                .query("drivers")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
        }

        let org = null;
        if (profile.orgId) {
            org = await ctx.db.get(profile.orgId);
        }

        return { profile, driver, org };
    },
});
