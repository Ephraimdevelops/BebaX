import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles (linked to Clerk)
  userProfiles: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("customer"), v.literal("driver"), v.literal("admin"), v.literal("fleet_owner")),
    orgId: v.optional(v.id("organizations")), // Link to Organization
    orgRole: v.optional(v.union(v.literal("admin"), v.literal("user"))), // Role within Org
    driverId: v.optional(v.id("drivers")), // Link to Driver profile (Captain's Exam)
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
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("pending_docs"),
      v.literal("suspended"),
      v.literal("banned")
    )),
    created_at: v.string(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_org", ["orgId"])
    .index("by_driverId", ["driverId"]),

  // Products / Menu Items (Digital Showroom)
  products: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.number()), // Optional - some items don't have prices
    image: v.optional(v.string()),
    inStock: v.boolean(),
    category: v.optional(v.string()),
    created_at: v.string(),
  })
    .index("by_org", ["orgId"]), // To list products for an org
  // .index("by_category", ["category"]), // Optional: for filtering

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
    billingCycleStart: v.optional(v.string()), // Fixed duplicate
    logo: v.optional(v.string()),
    // Enhanced Business Profile
    description: v.optional(v.string()),
    coverPhoto: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),
    // Verified status
    verified: v.optional(v.boolean()),
    verificationStatus: v.optional(v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected"))),
    // Digital Showroom (B2B Marketing Layer)
    whatsapp_number: v.optional(v.string()), // WhatsApp contact for inquiries
    location_locked: v.optional(v.boolean()), // Admin-verified location
    operating_hours: v.optional(v.string()), // e.g., "Mon-Sat 8AM-6PM"
    profile_views: v.optional(v.number()), // Track showroom visibility
    lead_count: v.optional(v.number()), // WhatsApp/Call clicks
    pickup_count: v.optional(v.number()), // Rides originating from this business
    // Empire Edition: Approval Flow
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("rejected"),
      v.literal("suspended"),
      v.literal("action_required")
    )),
    licensePhotoUrl: v.optional(v.string()), // Uploaded business license
    // Rejection / Correction Loop Fields
    rejection_reason: v.optional(v.string()), // e.g., "Blurry Document"
    rejection_message: v.optional(v.string()), // Custom admin message
    rejection_action: v.optional(v.union(v.literal("request_changes"), v.literal("permanent_ban"))),
    rejected_at: v.optional(v.string()), // Timestamp
    created_at: v.string(),
  }).index("by_tier", ["tier"])
    .index("by_verified", ["verified"])
    .index("by_status", ["status"]),

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
    is_busy: v.optional(v.boolean()), // True if currently on a trip
    // Enforce 7 Tanzanian Vehicle Types (plus legacy support)
    vehicle_type: v.union(
      v.literal("boda"), v.literal("toyo"), v.literal("kirikuu"),
      v.literal("pickup"), v.literal("canter"), v.literal("fuso"),
      v.literal("trailer"),
      // Legacy
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
    // Verification Flow Fields
    verification_status: v.optional(v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("action_required")
    )),
    rejection_reason: v.optional(v.string()), // e.g., "Blurry License Photo"
    rejection_message: v.optional(v.string()), // Custom admin message
    rejection_action: v.optional(v.union(v.literal("request_changes"), v.literal("permanent_ban"))),
    rejected_at: v.optional(v.string()), // Timestamp
    vehicle_plate: v.optional(v.string()),
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
    origin_business_id: v.optional(v.id("organizations")), // B2B: Ride originated from this business (for attribution)
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
    // Visual References & Mission Split
    mission_mode: v.optional(v.union(v.literal("item"), v.literal("move"))),
    cargo_ref_id: v.optional(v.string()), // 's', 'm', 'l', 'xl'
    house_size_id: v.optional(v.string()), // 'studio', '2-3rooms', 'big'
    cargo_photo_url: v.optional(v.string()), // Mandatory for L/XL
    special_instructions: v.optional(v.string()),
    scheduled_time: v.optional(v.string()),
    distance: v.number(),
    fare_estimate: v.number(),
    locked_price: v.optional(v.number()), // Safe Lock Price
    pricing_snapshot: v.optional(v.string()), // JSON of RouteResult metadata
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
      loading_start_time: v.optional(v.number()),  // Unix timestamp (ms)
      loading_end_time: v.optional(v.number()),
      demurrage_fee: v.optional(v.number()),
      // Smart Cargo System
      transport_fare: v.optional(v.number()), // Ride fare only (commissionable)
      helper_fee: v.optional(v.number()), // Pass-through to driver (NOT commissionable)
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
    loading_start_time: v.optional(v.number()),  // Unix timestamp (ms)
    loading_end_time: v.optional(v.number()),
    demurrage_fee: v.optional(v.number()),
    // Smart Cargo System
    transport_fare: v.optional(v.number()), // Ride fare only (commissionable)
    helper_fee: v.optional(v.number()), // Pass-through to driver (NOT commissionable)
    helpers_count: v.optional(v.number()),
    cargo_size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"), v.literal("huge"))),
    is_fragile: v.optional(v.boolean()),
    // Business Dispatch Fields (Root level)
    recipient_name: v.optional(v.string()),
    recipient_phone: v.optional(v.string()),
    waybill_number: v.optional(v.string()), // Unique ID e.g., "WB-12345"
  })
    .index("by_customer", ["customer_clerk_id"])
    .index("by_driver", ["driver_clerk_id"])
    .index("by_status", ["status"])
    .index("by_waybill", ["waybill_number"]),

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

  // ============================================
  // AFRICAN LOGISTICS ENGINE - NEW TABLES
  // ============================================

  // Pricing Configuration (Tanzania Matrix)
  pricing_config: defineTable({
    vehicle_type: v.union(
      v.literal('boda'), v.literal('toyo'), v.literal('bajaji'),
      v.literal('kirikuu'), v.literal('pickup'), v.literal('canter'),
      v.literal('fuso'), v.literal('trailer')
    ),
    base_fare: v.number(),
    rate_per_km: v.number(),
    rate_per_min: v.number(),
    min_fare: v.number(),
    loading_window_min: v.number(),
    demurrage_rate: v.number(),
    commission_rate: v.number(),
    surge_cap: v.number(),
    min_hourly_net: v.number(),
    currency: v.string(),
    updated_at: v.string(),
  }).index("by_vehicle", ["vehicle_type"]),

  // Driver Wallets (Commission Ledger)
  driver_wallets: defineTable({
    user_clerk_id: v.string(),
    user_type: v.union(v.literal("driver"), v.literal("fleet_owner")),
    balance: v.number(),
    status: v.union(v.literal("active"), v.literal("locked")),
    locked_reason: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_user", ["user_clerk_id"])
    .index("by_status", ["status"]),

  // Wallet Transactions (Immutable Log)
  wallet_transactions: defineTable({
    wallet_id: v.id("driver_wallets"),
    amount: v.number(),
    type: v.union(
      v.literal("commission"),
      v.literal("topup"),
      v.literal("trip_earnings"),
      v.literal("demurrage"),
      v.literal("adjustment")
    ),
    reference_id: v.optional(v.string()),
    balance_after: v.number(),
    created_at: v.string(),
  }).index("by_wallet", ["wallet_id"])
    .index("by_type", ["type"]),

  // Movers Module (Complex Relocations)
  moves: defineTable({
    customer_clerk_id: v.string(),
    ride_id: v.optional(v.id("rides")),
    vehicle_type: v.string(),
    items_summary: v.string(),
    volume_tier: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    floors: v.object({ origin: v.number(), dest: v.number() }),
    has_elevator: v.boolean(),
    distance_to_parking: v.union(v.literal("close"), v.literal("far")),
    helper_count: v.number(),
    photos: v.array(v.string()),
    pickup_location: v.object({ lat: v.number(), lng: v.number(), address: v.string() }),
    dropoff_location: v.object({ lat: v.number(), lng: v.number(), address: v.string() }),
    quote_amount: v.number(),
    quote_breakdown: v.optional(v.object({
      base: v.number(),
      distance: v.number(),
      floor_fee: v.number(),
      helper_fee: v.number(),
    })),
    status: v.union(
      v.literal("quoting"), v.literal("booked"), v.literal("driver_assigned"),
      v.literal("loading"), v.literal("in_transit"), v.literal("unloading"),
      v.literal("completed"), v.literal("cancelled")
    ),
    scheduled_date: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_customer", ["customer_clerk_id"])
    .index("by_status", ["status"]),

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

  // ============================================
  // ADMIN CONTROL TABLES
  // ============================================

  // System Configuration (Kill Switch, Feature Flags)
  system_config: defineTable({
    key: v.string(), // e.g., "is_service_active", "maintenance_message"
    value: v.string(), // JSON encoded value
    updated_by: v.optional(v.string()), // Admin clerkId
    updated_at: v.string(),
  }).index("by_key", ["key"]),

  // Support Tickets (Customer Service)
  support_tickets: defineTable({
    user_clerk_id: v.string(),
    user_type: v.union(v.literal("customer"), v.literal("driver")),
    ride_id: v.optional(v.id("rides")),
    issue_type: v.union(
      v.literal("ride_issue"),
      v.literal("payment_issue"),
      v.literal("driver_complaint"),
      v.literal("customer_complaint"),
      v.literal("app_bug"),
      v.literal("other")
    ),
    subject: v.string(),
    description: v.string(),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    assigned_to: v.optional(v.string()), // Admin clerkId
    resolution: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_status", ["status"])
    .index("by_user", ["user_clerk_id"])
    .index("by_priority", ["priority"]),

  // Admin Audit Logs (Critical for compliance)
  admin_logs: defineTable({
    admin_clerk_id: v.string(),
    action: v.string(), // e.g., "ban_driver", "update_pricing", "toggle_service"
    target_type: v.optional(v.string()), // e.g., "driver", "pricing_config", "system"
    target_id: v.optional(v.string()),
    old_value: v.optional(v.string()), // JSON
    new_value: v.optional(v.string()), // JSON
    reason: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_admin", ["admin_clerk_id"])
    .index("by_action", ["action"]),

  // Reviews (Two-way: Driver ↔ Customer)
  reviews: defineTable({
    ride_id: v.id("rides"),
    reviewer_clerk_id: v.string(), // Who gave the review
    reviewee_clerk_id: v.string(), // Who received the review
    reviewer_role: v.union(v.literal("driver"), v.literal("customer")),
    rating: v.number(), // 1-5 stars
    comment: v.optional(v.string()),
    created_at: v.string(),
  })
    .index("by_ride", ["ride_id"])
    .index("by_reviewer", ["reviewer_clerk_id"])
    .index("by_reviewee", ["reviewee_clerk_id"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // FUEL-INDEX PRICING BRAIN
  // ═══════════════════════════════════════════════════════════════════════════

  // System Settings (Economic Configuration)
  system_settings: defineTable({
    setting_key: v.string(),      // e.g., "fuel_price_tzs", "commission_rate"
    value: v.number(),            // The numeric value
    description: v.optional(v.string()),
    last_updated: v.number(),     // Timestamp
    updated_by: v.optional(v.string()), // clerkId of admin
  }).index("by_key", ["setting_key"]),

  // Pricing Rules (Per-Vehicle Configuration)
  pricing_rules: defineTable({
    vehicle_type: v.string(),     // "boda", "toyo", "kirikuu", "canter", "fuso"
    pricing_model: v.union(v.literal("range"), v.literal("linear")),

    // Multipliers (× Fuel Price)
    base_fare_multiplier: v.number(),   // Loading fee multiplier
    per_km_multiplier: v.number(),      // Distance rate multiplier
    min_fare_multiplier: v.number(),    // Floor price multiplier

    // Range Tiers (for Boda, Toyo only)
    range_tiers: v.optional(v.array(v.object({
      max_km: v.number(),
      multiplier: v.number()
    }))),

    // Loading/Demurrage Logic
    free_loading_minutes: v.number(),
    demurrage_multiplier: v.number(),   // Cost per minute after free time

    // Status
    is_active: v.boolean(),
    last_updated: v.number(),
    updated_by: v.optional(v.string()),
  }).index("by_vehicle", ["vehicle_type"])
    .index("by_active", ["is_active"]),
});

