/**
 * BebaX Vehicle Fleet Registry - Web Version
 * Shared with mobile - same vehicle definitions
 */

export interface VehicleDefinition {
    id: VehicleId;
    label: string;
    labelSw: string;
    capacity: string;
    description: string;
    icon: string;
    tier: 1 | 2 | 3;
    baseFare: number;
    fuelEfficiency: number;
    trafficRate: number;
    fuelType: 'petrol' | 'diesel';
}

export type VehicleId = 'boda' | 'toyo' | 'kirikuu' | 'pickup' | 'canter' | 'fuso';

export const VEHICLE_FLEET: VehicleDefinition[] = [
    // TIER 1: LIGHT VEHICLES
    {
        id: 'boda',
        label: 'Boda',
        labelSw: 'Pikipiki',
        capacity: 'Small Parcel / 20kg',
        description: 'Fast motorcycle delivery for documents and small packages',
        icon: 'two-wheeler',
        tier: 1,
        baseFare: 3000,
        fuelEfficiency: 35,
        trafficRate: 50,
        fuelType: 'petrol',
    },
    {
        id: 'toyo',
        label: 'Toyo',
        labelSw: 'Guta',
        capacity: '300-500kg',
        description: 'Cargo tricycle for town loads and market runs',
        icon: 'electric-rickshaw',
        tier: 1,
        baseFare: 10000,
        fuelEfficiency: 15,
        trafficRate: 100,
        fuelType: 'petrol',
    },

    // TIER 2: MEDIUM VEHICLES
    {
        id: 'kirikuu',
        label: 'Kirikuu',
        labelSw: 'Kirikuu',
        capacity: '1 Ton',
        description: 'SME Standard Mini Truck - The Workhorse',
        icon: 'local-shipping',
        tier: 2,
        baseFare: 13000,
        fuelEfficiency: 12,
        trafficRate: 150,
        fuelType: 'diesel',
    },
    {
        id: 'pickup',
        label: 'Pickup',
        labelSw: 'Pikapi',
        capacity: 'Standard Hilux (1-1.5 Ton)',
        description: 'Standard pickup for rough terrain & medium loads',
        icon: 'airport-shuttle',
        tier: 2,
        baseFare: 15000,
        fuelEfficiency: 10,
        trafficRate: 150,
        fuelType: 'diesel',
    },

    // TIER 3: HEAVY VEHICLES
    {
        id: 'canter',
        label: 'Canter',
        labelSw: 'Kanta',
        capacity: '3-4 Ton',
        description: 'Box Body Truck for house moving & bulk cargo',
        icon: 'local-shipping',
        tier: 3,
        baseFare: 25000,
        fuelEfficiency: 7,
        trafficRate: 200,
        fuelType: 'diesel',
    },
    {
        id: 'fuso',
        label: 'Fuso',
        labelSw: 'Fuso',
        capacity: '10+ Ton',
        description: 'Heavy Tipper/Truck for construction & industrial',
        icon: 'local-shipping',
        tier: 3,
        baseFare: 50000,
        fuelEfficiency: 4,
        trafficRate: 300,
        fuelType: 'diesel',
    },
];

// Helper functions
export const getVehicleById = (id: VehicleId): VehicleDefinition | undefined => {
    return VEHICLE_FLEET.find(v => v.id === id);
};

export const VALID_VEHICLE_IDS = VEHICLE_FLEET.map(v => v.id);

export const VERIFICATION_TIERS = {
    1: 'Auto-verification (documents only)',
    2: 'Standard verification (documents + vehicle photo)',
    3: 'Manual verification (full inspection required)',
};

export const getVehiclesByTier = (tier: 1 | 2 | 3): VehicleDefinition[] => {
    return VEHICLE_FLEET.filter(v => v.tier === tier);
};
