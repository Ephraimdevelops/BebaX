/**
 * BebaX Vehicle Fleet Registry
 * The Single Source of Truth for all vehicle types
 * 
 * Tanzanian/Global hybrid structure supporting:
 * - Motorcycle delivery (boda)
 * - Cargo tricycle (toyo/guta)
 * - Mini trucks (kirikuu)
 * - Standard pickups
 * - Box body trucks (canter)
 * - Heavy trucks (fuso)
 * - Semi-trailers
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
    baseFare: number; // TSH
    perKmRate: number; // TSH per km
}

export type VehicleId = 'boda' | 'toyo' | 'kirikuu' | 'pickup' | 'canter' | 'fuso';

export const VEHICLE_FLEET: VehicleDefinition[] = [
    {
        id: 'boda',
        label: 'Boda Boda',
        labelSw: 'Pikipiki',
        capacity: 'Small Parcel / 20kg',
        description: 'Fast motorcycle delivery for documents and small packages',
        icon: 'two-wheeler',
        image: require('../../assets/images/vehicles/boda.png'),
        tier: 1,
        baseFare: 2000,
        perKmRate: 200,
    },
    {
        id: 'toyo',
        label: 'Toyo / Guta',
        labelSw: 'Guta',
        capacity: '300-500kg',
        description: 'Cargo tricycle for town loads and market goods',
        icon: 'electric-rickshaw',
        image: require('../../assets/images/vehicles/toyo.png'),
        tier: 1,
        baseFare: 3000,
        perKmRate: 300,
    },
    {
        id: 'kirikuu',
        label: 'Kirikuu',
        labelSw: 'Kirikuu',
        capacity: '700kg - 1T',
        description: 'Mini truck (Suzuki Carry class) for SME standard loads',
        icon: 'local-shipping',
        image: require('../../assets/images/vehicles/kirikuu.png'),
        tier: 2,
        baseFare: 5000,
        perKmRate: 400,
    },
    {
        id: 'pickup',
        label: 'Pickup',
        labelSw: 'Pikapi',
        capacity: '1-2 Tonnes',
        description: 'Standard pickup truck for rough terrain and versatile loads',
        icon: 'airport-shuttle',
        image: require('../../assets/images/vehicles/pickup.png'),
        tier: 2,
        baseFare: 8000,
        perKmRate: 600,
    },
    {
        id: 'canter',
        label: 'Canter',
        labelSw: 'Kanta',
        capacity: '3-4 Tonnes',
        description: 'Box body truck for house moving and medium cargo',
        icon: 'local-shipping',
        image: require('../../assets/images/vehicles/canter.png'),
        tier: 2,
        baseFare: 15000,
        perKmRate: 800,
    },
    {
        id: 'fuso',
        label: 'Fuso',
        labelSw: 'Fuso',
        capacity: '8-10 Tonnes',
        description: 'Heavy truck for construction materials and agriculture',
        icon: 'local-shipping',
        image: require('../../assets/images/vehicles/fuso.png'),
        tier: 3,
        baseFare: 30000,
        perKmRate: 1200,
    },
];

// export type VehicleId = 'boda' | 'toyo' | 'kirikuu' | 'pickup' | 'canter' | 'fuso'; // moved to top to avoid issues, usually best to edit in place.
// Wait, I need to edit the type definition at the top of the file too. I'll do two chunks or just verify location.
// The type definition is around line 27.
// I will start with removing the array item.

// Helper to get vehicle by ID
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
