/**
 * Maps granular UI vehicle types to backend-supported types.
 * 
 * UPDATE: Backend now natively supports all Tanzanian vehicle types.
 * This function now passes through the ID as the backend type.
 */
import { VehicleId } from '../constants/vehicleRegistry';

// We now support all these types directly in the backend schema
export const mapUiTypeToBackend = (uiType: VehicleId): string => {
    return uiType;
};
