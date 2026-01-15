/**
 * BebaX Vehicle Fleet Registry - "Bongo Edition"
 * The Single Source of Truth for all vehicle types
 * 
 * Updated with Cost-Plus model specs:
 * - Base Fare (TZS)
 * - Fuel Efficiency (km/L)
 * - Traffic Rate (TZS/min)
 * - Fuel Type (petrol/diesel)
 * 
 * Tanzanian fleet optimized for Dar es Salaam logistics
 */

export interface VehicleDefinition {
    id: VehicleId;
    label: string;
    labelSw: string; // Swahili name
    capacity: string;
    description: string;
    icon: string; // MaterialIcons name (Fallback)
    image: any; // 3D Asset Source
    tier: 1 | 2 | 3; // Verification tier
    // ═══════════════════════════════════════════════════════════════
    // BONGO PRICING ENGINE SPECS
    // ═══════════════════════════════════════════════════════════════
    baseFare: number; // TZS - Fixed booking fee
    fuelEfficiency: number; // km/L - How far on 1 liter
    trafficRate: number; // TZS/min - Opportunity cost in traffic
    fuelType: 'petrol' | 'diesel'; // Fuel type for pricing
}

export type VehicleId = 'boda' | 'toyo' | 'kirikuu' | 'pickup' | 'canter' | 'fuso';

export const VEHICLE_FLEET: VehicleDefinition[] = [
    // ═══════════════════════════════════════════════════════════════
    // TIER 1: LIGHT VEHICLES (Auto-verification)
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'boda',
        label: 'Boda',
        labelSw: 'Pikipiki',
        capacity: 'Small Parcel / 20kg',
        description: 'Fast motorcycle delivery for documents and small packages',
        icon: 'two-wheeler',
        image: require('../../assets/images/vehicles/boda.png'),
        tier: 1,
        // Bongo Pricing
        baseFare: 3000,
        fuelEfficiency: 35, // km/L - Super efficient
        trafficRate: 50, // TZS/min - Lowest, can weave through
        fuelType: 'petrol',
    },
    {
        id: 'toyo',
        label: 'Toyo',
        labelSw: 'Guta',
        capacity: '300-500kg',
        description: 'Cargo tricycle for town loads and market runs',
        icon: 'electric-rickshaw',
        image: require('../../assets/images/vehicles/toyo.png'),
        tier: 1,
        // Bongo Pricing
        baseFare: 10000,
        fuelEfficiency: 15, // km/L
        trafficRate: 100, // TZS/min
        fuelType: 'petrol',
    },

    // ═══════════════════════════════════════════════════════════════
    // TIER 2: MEDIUM VEHICLES (Standard verification)
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'kirikuu',
        label: 'Kirikuu',
        labelSw: 'Kirikuu',
        capacity: '1 Ton',
        description: 'SME Standard Mini Truck - The Workhorse',
        icon: 'local-shipping',
        image: require('../../assets/images/vehicles/kirikuu.png'),
        tier: 2,
        // Bongo Pricing (Smaller than Pickup, hence slightly cheaper)
        baseFare: 13000,
        fuelEfficiency: 12, // km/L
        trafficRate: 150, // TZS/min
        fuelType: 'diesel',
    },
    {
        id: 'pickup',
        label: 'Pickup',
        labelSw: 'Pikapi',
        capacity: 'Standard Hilux (1-1.5 Ton)',
        description: 'Standard pickup for rough terrain & medium loads',
        icon: 'airport-shuttle',
        image: require('../../assets/images/vehicles/pickup.png'),
        tier: 2,
        // Bongo Pricing
        baseFare: 15000,
        fuelEfficiency: 10, // km/L
        trafficRate: 150, // TZS/min
        fuelType: 'diesel',
    },

    // ═══════════════════════════════════════════════════════════════
    // TIER 3: HEAVY VEHICLES (Full inspection required)
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'canter',
        label: 'Canter',
        labelSw: 'Kanta',
        capacity: '3-4 Ton',
        description: 'Box Body Truck for house moving & bulk cargo',
        icon: 'local-shipping',
        image: require('../../assets/images/vehicles/canter.png'),
        tier: 3,
        // Bongo Pricing
        baseFare: 25000,
        fuelEfficiency: 7, // km/L - Heavy fuel usage
        trafficRate: 200, // TZS/min
        fuelType: 'diesel',
    },
    {
        id: 'fuso',
        label: 'Fuso',
        labelSw: 'Fuso',
        capacity: '10+ Ton',
        description: 'Heavy Tipper/Truck for construction & industrial',
        icon: 'local-shipping',
        image: require('../../assets/images/vehicles/fuso.png'),
        tier: 3,
        // Bongo Pricing
        baseFare: 50000,
        fuelEfficiency: 4, // km/L - Very heavy
        trafficRate: 300, // TZS/min - Highest opportunity cost
        fuelType: 'diesel',
    },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

// Get vehicle by ID
export const getVehicleById = (id: VehicleId): VehicleDefinition | undefined => {
    return VEHICLE_FLEET.find(v => v.id === id);
};

// Get all vehicle IDs for validation
export const VALID_VEHICLE_IDS = VEHICLE_FLEET.map(v => v.id);

// Tier descriptions for verification flow
export const VERIFICATION_TIERS = {
    1: 'Auto-verification (documents only)',
    2: 'Standard verification (documents + vehicle photo)',
    3: 'Manual verification (full inspection required)',
};

// Get vehicles by tier
export const getVehiclesByTier = (tier: 1 | 2 | 3): VehicleDefinition[] => {
    return VEHICLE_FLEET.filter(v => v.tier === tier);
};
