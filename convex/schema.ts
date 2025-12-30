import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles (linked to Clerk)
  userProfiles: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("customer"), v.literal("driver"), v.literal("admin"), v.literal("fleet_owner")),
    orgId: v.optional(v.id("organizations")), // Link to Organization
    orgRole: v.optional(v.union(v.literal("admin"), v.literal("user"))), // Role within Org
    spendingLimitPerDay: v.optional(v.number()), // Daily spending limit
    phone: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    emergencyContact: v.optional(v.string()), // Added for SOS
    profilePhoto: v.optional(v.string()),
    pushToken: v.optional(v.string()), // Expo push token
    defaultAddress: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
    rating: v.number(),
    totalRides: v.number(),
    created_at: v.string(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_org", ["orgId"]),

  // Organizations (B2B Entities)
  organizations: defineTable({
    name: v.string(),
    tinNumber: v.optional(v.string()),
    walletBalance: v.number(), // Available funds
    reservedBalance: v.number(), // Funds held for active rides
    creditLimit: v.number(), // Overdraft limit
    billingModel: v.union(v.literal("prepaid"), v.literal("invoice")),
    adminEmail: v.string(),
    // Contact Info
    phone: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    // Location (for accurate pickups)
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
    // Business Profile
    industry: v.optional(v.string()),
    logisticsNeeds: v.optional(v.array(v.string())),
    expectedMonthlyVolume: v.optional(v.number()),
    specialRequirements: v.optional(v.string()),
    // B2B Tier Fields (optional for backward compatibility)
    tier: v.optional(v.union(v.literal("starter"), v.literal("business"), v.literal("enterprise"))),
    commissionRate: v.optional(v.number()), // 0.08 - 0.15 (8% - 15%)
    apiKey: v.optional(v.string()),
    apiEnabled: v.optional(v.boolean()),
    monthlyVolume: v.optional(v.number()), // Running total
    billingCycleStart: v.optional(v.string()),
    logo: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    created_at: v.string(),
  }).index("by_tier", ["tier"])
    .index("by_verified", ["verified"]),

  // Insurance Tiers
  insurance_tiers: defineTable({
    name: v.string(), // "Basic", "Standard", "Premium"
    code: v.string(), // "basic", "standard", "premium"
    fee: v.number(), // in TZS
    maxCoverage: v.number(), // max claim amount in TZS
    description: v.string(),
    isActive: v.boolean(),
    created_at: v.string(),
  }).index("by_code", ["code"]),

  // Insurance Claims
  insurance_claims: defineTable({
    rideId: v.id("rides"),
    customerClerkId: v.string(),
    tierId: v.id("insurance_tiers"),
    declaredValue: v.number(), // Value declared at booking
    claimAmount: v.number(), // Amount being claimed
    claimReason: v.string(),
    evidencePhotos: v.array(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("paid")
    ),
    adminNotes: v.optional(v.string()),
    approvedAmount: v.optional(v.number()),
    payoutMethod: v.optional(v.union(v.literal("mpesa"), v.literal("airtel"), v.literal("tigo"))),
    payoutNumber: v.optional(v.string()),
    payoutTransactionId: v.optional(v.string()),
    created_at: v.string(),
    resolvedAt: v.optional(v.string()),
  }).index("by_ride", ["rideId"])
    .index("by_customer", ["customerClerkId"])
    .index("by_status", ["status"]),

  // Business Listings (Companies seeking drivers)
  business_listings: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("retail"),
      v.literal("construction"),
      v.literal("agriculture"),
      v.literal("manufacturing"),
      v.literal("e-commerce"),
      v.literal("logistics"),
      v.literal("other")
    ),
    routeType: v.union(v.literal("local"), v.literal("regional"), v.literal("national")),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("on_demand")),
    vehicleRequirements: v.array(v.string()), // ["truck", "van"]
    estimatedMonthlyTrips: v.number(),
    payRate: v.optional(v.string()), // e.g., "50,000 - 100,000 TZS per trip"
    isActive: v.boolean(),
    created_at: v.string(),
  }).index("by_org", ["organizationId"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // Driver Applications to Business Listings
  listing_applications: defineTable({
    listingId: v.id("business_listings"),
    driverClerkId: v.string(),
    coverLetter: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    created_at: v.string(),
    respondedAt: v.optional(v.string()),
  }).index("by_listing", ["listingId"])
    .index("by_driver", ["driverClerkId"]),

  // Fleets
  fleets: defineTable({
    owner_id: v.string(), // Clerk ID of fleet owner
    name: v.string(),
    total_earnings: v.number(),
    created_at: v.string(),
  }).index("by_owner", ["owner_id"]),

  // Drivers
  drivers: defineTable({
    clerkId: v.string(),
    fleet_id: v.optional(v.id("fleets")),
    license_number: v.string(),
    nida_number: v.string(),
    documents: v.optional(v.object({
      nida_photo: v.optional(v.id("_storage")),
      license_photo: v.optional(v.id("_storage")),
      insurance_photo: v.optional(v.id("_storage")),
      road_permit_photo: v.optional(v.id("_storage")),
    })),
    verified: v.boolean(),
    is_online: v.boolean(),
    // Enforce 6 Tanzanian Vehicle Types (plus legacy support - removed trailer)
    vehicle_type: v.union(
      v.literal("boda"), v.literal("toyo"), v.literal("kirikuu"),
      v.literal("pickup"), v.literal("canter"), v.literal("fuso"),
      // Legacy (Removed trailer types)
      v.literal("bajaji"), v.literal("bajaj"), v.literal("tricycle"),
      v.literal("van"), v.literal("truck"),
      v.literal("pickup_s"), v.literal("pickup_d"),
      v.literal("classic"), v.literal("boxbody")
    ),
    current_location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      geohash: v.string(), // Added for geospatial queries
    })),
    last_location_update: v.optional(v.string()),
    rating: v.number(),
    total_trips: v.number(),
    total_earnings: v.number(),
    commission_rate: v.number(),
    payout_method: v.optional(v.union(v.literal("mpesa"), v.literal("airtel"), v.literal("tigo"))),
    payout_number: v.optional(v.string()),
    // Financial wallet fields
    wallet_account_id: v.optional(v.id("accounts")),
    wallet_balance: v.number(), // Cached balance in TZS (can be negative)
    wallet_locked: v.boolean(),
    wallet_lock_reason: v.optional(v.string()),
    created_at: v.string(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_online_status", ["is_online"])
    .index("by_wallet_locked", ["wallet_locked"])
    .index("by_fleet_id", ["fleet_id"])
    .index("by_geohash", ["current_location.geohash"]), // Index for geo-queries

  // Vehicles
  vehicles: defineTable({
    driver_clerk_id: v.string(),
    type: v.union(v.literal("tricycle"), v.literal("van"), v.literal("truck"), v.literal("semitrailer")),
    plate_number: v.string(),
    capacity_kg: v.number(),
    photos: v.optional(v.array(v.string())),
    base_fare: v.number(),
    per_km_rate: v.number(),
    created_at: v.string(),
  }).index("by_driver", ["driver_clerk_id"]),

  // Rides
  rides: defineTable({
    customer_clerk_id: v.string(),
    driver_clerk_id: v.optional(v.string()),
    org_id: v.optional(v.id("organizations")), // Linked Organization
    listing_id: v.optional(v.id("business_listings")), // Linked to job listing
    vehicle_type: v.string(),
    pickup_location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
      geohash: v.optional(v.string()), // Added for geospatial queries
    }),
    dropoff_location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
      geohash: v.optional(v.string()), // Added for geospatial queries
    }),
    cargo_details: v.string(),
    cargo_photos: v.optional(v.array(v.string())),
    special_instructions: v.optional(v.string()),
    scheduled_time: v.optional(v.string()),
    distance: v.number(),
    fare_estimate: v.number(),
    negotiated_fare: v.optional(v.number()),
    final_fare: v.optional(v.number()),
    negotiation_history: v.optional(v.array(v.object({
      from: v.union(v.literal("customer"), v.literal("driver")),
      amount: v.number(),
      timestamp: v.string(),
    }))),
    status: v.string(),
    payment_method: v.union(v.literal("cash"), v.literal("mobile_money"), v.literal("wallet")), // Added wallet
    payment_status: v.string(),
    cash_collected: v.optional(v.boolean()), // For cash payments
    insurance_opt_in: v.optional(v.boolean()),
    insurance_tier_id: v.optional(v.string()), // Basic, Standard, Corporate
    insurance_fee: v.optional(v.number()),
    is_business_trip: v.optional(v.boolean()),
    driver_location_updates: v.optional(v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      timestamp: v.string(),
    }))),
    customer_rating: v.optional(v.number()),
    driver_rating: v.optional(v.number()),
    customer_review: v.optional(v.string()),
    driver_review: v.optional(v.string()),
    tip_amount: v.optional(v.number()),
    created_at: v.string(),
    accepted_at: v.optional(v.string()),
    loading_started_at: v.optional(v.string()),
    trip_started_at: v.optional(v.string()),
    delivered_at: v.optional(v.string()),
    completed_at: v.optional(v.string()),
    cancelled_at: v.optional(v.string()),
  })
    .index("by_customer", ["customer_clerk_id"])
    .index("by_driver", ["driver_clerk_id"])
    .index("by_status", ["status"]),

  // Messages
  messages: defineTable({
    ride_id: v.id("rides"),
    sender_clerk_id: v.string(),
    message: v.string(),
    type: v.optional(v.union(v.literal("text"), v.literal("audio"), v.literal("image"))),
    format: v.optional(v.string()), // e.g., "audio/m4a"
    timestamp: v.string(),
    read: v.boolean(),
  }).index("by_ride", ["ride_id"]),

  // Notifications
  notifications: defineTable({
    user_clerk_id: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    ride_id: v.optional(v.id("rides")),
    created_at: v.string(),
  }).index("by_user", ["user_clerk_id"]),

  // Payouts
  payouts: defineTable({
    driver_clerk_id: v.string(),
    amount: v.number(),
    commission: v.number(),
    net_amount: v.number(),
    method: v.union(v.literal("mpesa"), v.literal("airtel"), v.literal("tigo")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    transaction_id: v.optional(v.string()),
    created_at: v.string(),
    processed_at: v.optional(v.string()),
  }).index("by_driver", ["driver_clerk_id"]),

  // Financial Accounts (wallets, platform revenue, etc.)
  accounts: defineTable({
    type: v.union(
      v.literal("platform_revenue"),
      v.literal("driver_wallet"),
      v.literal("cash_on_hand")
    ),
    reference_id: v.optional(v.string()), // driver clerk_id or other reference
    currency: v.string(), // "TZS"
    created_at: v.string(),
  }).index("by_reference", ["reference_id"])
    .index("by_type", ["type"]),

  // Ledger Entries (Immutable financial log)
  ledger_entries: defineTable({
    account_id: v.id("accounts"),
    amount: v.number(), // in TZS shillings (integer)
    direction: v.union(v.literal("credit"), v.literal("debit")),
    balance_after: v.optional(v.number()), // snapshot for quick reads
    type: v.union(
      v.literal("trip_charge"),
      v.literal("commission"),
      v.literal("settlement"),
      v.literal("cash_reconciliation"),
      v.literal("adjustment"),
      v.literal("payout")
    ),
    related_trip_id: v.optional(v.id("rides")),
    related_settlement_id: v.optional(v.id("settlements")),
    provider: v.optional(v.string()), // "mpesa", "stripe", "cash"
    provider_event_id: v.optional(v.string()), // for idempotency
    metadata: v.optional(v.any()),
    created_at: v.string(),
  })
    .index("by_account", ["account_id"])
    .index("by_trip", ["related_trip_id"])
    .index("by_provider_event", ["provider_event_id"])
    .index("by_type", ["type"]),

  // Settlements (driver pays platform for commissions)
  settlements: defineTable({
    driver_clerk_id: v.string(),
    amount: v.number(), // TZS
    method: v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("cash_deposit")
    ),
    provider_event_id: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    metadata: v.optional(v.any()),
    created_at: v.string(),
    completed_at: v.optional(v.string()),
  })
    .index("by_driver", ["driver_clerk_id"])
    .index("by_provider_event", ["provider_event_id"])
    .index("by_status", ["status"]),

  // Webhook Events (for idempotency)
  webhook_events: defineTable({
    provider: v.string(), // "mpesa", "stripe"
    event_payload: v.any(),
    provider_event_id: v.string(),
    processed: v.boolean(),
    created_at: v.string(),
  }).index("by_provider_event", ["provider_event_id"]),

  // Rate limiting table
  rateLimits: defineTable({
    key: v.string(), // Format: "clerkId:action"
    count: v.number(),
    windowStart: v.number(), // Unix timestamp
    expiresAt: v.number(), // Unix timestamp
  }).index("by_key", ["key"])
    .index("by_expiry", ["expiresAt"]),

  // SOS Alerts
  sos_alerts: defineTable({
    ride_id: v.optional(v.id("rides")),
    user_clerk_id: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    status: v.union(v.literal("active"), v.literal("resolved")),
    resolved_at: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_status", ["status"])
    .index("by_user", ["user_clerk_id"]),
});
