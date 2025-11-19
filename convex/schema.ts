import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles (linked to Clerk)
  userProfiles: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("customer"), v.literal("driver"), v.literal("admin")),
    phone: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
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
  }).index("by_clerk_id", ["clerkId"]),

  // Drivers
  drivers: defineTable({
    clerkId: v.string(),
    license_number: v.string(),
    nida_number: v.string(),
    documents: v.optional(v.object({
      nida_photo: v.optional(v.string()),
      license_photo: v.optional(v.string()),
      insurance_photo: v.optional(v.string()),
      road_permit_photo: v.optional(v.string()),
    })),
    verified: v.boolean(),
    is_online: v.boolean(),
    current_location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
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
    .index("by_wallet_locked", ["wallet_locked"]),

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
    vehicle_type: v.string(),
    pickup_location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    dropoff_location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
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
    payment_method: v.optional(v.string()),
    payment_status: v.string(),
    cash_collected: v.optional(v.boolean()), // For cash payments
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
});
