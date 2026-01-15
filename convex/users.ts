import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isValidRole } from "./permissions"; // RBAC Validation

// ===== CREATE PROFILE =====
// Called from role-selection screen to create user profile after auth
export const createProfile = mutation({
    args: {
        role: v.union(v.literal("customer"), v.literal("driver")),
        name: v.string(),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Check if profile already exists
        const existingProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (existingProfile) {
            // Update existing profile with new role
            await ctx.db.patch(existingProfile._id, {
                role: args.role,
                name: args.name || existingProfile.name,
                phone: args.phone || existingProfile.phone,
            });
            return existingProfile._id;
        }

        // Create new profile
        const profileId = await ctx.db.insert("userProfiles", {
            clerkId: identity.subject,
            name: args.name || "User",
            email: identity.email || "",
            role: args.role,
            phone: args.phone || "",
            rating: 5.0,
            totalRides: 0,
            created_at: new Date().toISOString(),
        });

        // If driver role, also create driver record
        if (args.role === "driver") {
            await ctx.db.insert("drivers", {
                clerkId: identity.subject,
                license_number: "PENDING",
                nida_number: "PENDING",
                verified: false,
                is_online: false,
                vehicle_type: "boda",
                rating: 5.0,
                total_trips: 0,
                total_earnings: 0,
                commission_rate: 0.1,
                wallet_balance: 0,
                wallet_locked: false,
                created_at: new Date().toISOString(),
            });
        }

        return profileId;
    },
});

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
            // REPAIR LOGIC: Check if Driver role but missing Driver Record
            if (existingProfile.role === "driver") {
                const driverRecord = await ctx.db
                    .query("drivers")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                    .first();

                if (!driverRecord) {
                    // Backfill missing driver record for legacy user
                    await ctx.db.insert("drivers", {
                        clerkId: identity.subject,
                        license_number: "PENDING_UPDATE",
                        nida_number: "pending",
                        verified: false,
                        is_online: false,
                        vehicle_type: "boda", // Default fallback
                        rating: existingProfile.rating || 5.0,
                        total_trips: existingProfile.totalRides || 0,
                        total_earnings: 0,
                        commission_rate: 0.1,
                        wallet_balance: 0,
                        wallet_locked: false,
                        created_at: new Date().toISOString(),
                    });

                    // Also create vehicle if missing
                    await ctx.db.insert("vehicles", {
                        driver_clerk_id: identity.subject,
                        type: "tricycle", // standard fallback
                        plate_number: "UPDATE_NEEDED",
                        capacity_kg: 500,
                        base_fare: 2000,
                        per_km_rate: 1000,
                        created_at: new Date().toISOString(),
                    });
                }
            }
            return existingProfile;
        }

        // CREATE NEW PROFILE - The Bouncer lets them in
        const newProfile = {
            clerkId: identity.subject,
            name: identity.name || identity.givenName || "User",
            email: identity.email || "",
            // DEV SHORTCUT: Auto-admin for specific email domain
            role: (identity.email?.endsWith("@bebax-admin.com") ? "admin" : "customer") as "customer" | "driver" | "admin" | "fleet_owner",
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


// LIGHTWEIGHT SESSION CHECK (Low Latency)
// Returns ONLY vital signs, no bulky json.
export const getSessionContext = query({
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

        if (!profile) return null;

        // Validating Role Integrity (Self-Healing)
        if (!isValidRole(profile.role)) {
            // Log error or fallback? For now just return as customer
            console.error(`Invalid role detected for ${profile._id}: ${profile.role}`);
        }

        // Fetch Org Status if exists
        let orgStatus: string | null = null;
        if (profile.orgId) {
            // Explicitly cast to unknown first to avoid overlap error, then to expected layout
            const org = await ctx.db.get(profile.orgId as any) as unknown as { status?: string } | null;
            orgStatus = org?.status || 'pending';
        }

        return {
            _id: profile._id,
            role: profile.role,
            name: profile.name,
            // Business Fields (Source of Truth for Routing)
            orgId: profile.orgId || null,
            orgRole: profile.orgRole || null,
            orgStatus: orgStatus,
            // Status flags for routing
            is_business_setup: !!profile.orgId,
            onboarding_complete: !!profile.phone,
        };
    },
});
