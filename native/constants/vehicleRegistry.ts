export const VEHICLE_FLEET = [
    { id: 'boda', label: 'Boda Boda', capacity: '1 Pas / Small Parcel', type: 'bike', backendTier: 'tricycle' }, // Mapping boda to tricycle tier for now if boda tier missing
    { id: 'bajaj', label: 'Bajaji', capacity: '3 Pas / 300kg', type: 'trike', backendTier: 'tricycle' },
    { id: 'kirikuu', label: 'Kirikuu', capacity: '700kg (Box)', type: 'light_truck', description: 'Suzuki Carry Class', backendTier: 'van' },
    { id: 'pickup_s', label: 'Pickup (Single)', capacity: '1 Tonne', type: 'truck', description: 'Long Bed', backendTier: 'truck' },
    { id: 'pickup_d', label: 'Pickup (Double)', capacity: '800kg', type: 'truck', description: 'Short Bed + 4 Pax', backendTier: 'truck' },
    { id: 'canter', label: 'Canter', capacity: '3-4 Tonnes', type: 'heavy', backendTier: 'truck' },
    { id: 'semi', label: 'Semi Trailer', capacity: '20+ Tonnes', type: 'heavy', backendTier: 'semitrailer' }
];
