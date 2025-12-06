/**
 * Maps granular UI vehicle types to backend-supported types.
 * This ensures compatibility with the existing Convex schema while allowing
 * a rich, localized UI (e.g., Kirikuu, Bajaji).
 */
export const mapUiTypeToBackend = (uiType: string): "tricycle" | "van" | "truck" | "semitrailer" => {
    switch (uiType) {
        case 'boda':
        case 'bajaj':
            return 'tricycle';
        case 'kirikuu':
            return 'van';
        case 'pickup_s':
        case 'pickup_d':
        case 'canter':
            return 'truck';
        case 'semi':
            return 'semitrailer';
        default:
            // Fallback for safety, though UI should prevent this
            console.warn(`Unknown UI type: ${uiType}, defaulting to 'van'`);
            return 'van';
    }
};
