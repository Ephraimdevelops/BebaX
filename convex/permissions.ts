import { GenericId, v } from "convex/values";

// 1. Define Capabilities (Not just roles)
export type Permission =
    | "ride:request"
    | "ride:accept"
    | "ride:cancel"
    | "driver:go_online"
    | "driver:view_earnings"
    | "fleet:manage_drivers"
    | "admin:ban_user"
    | "admin:view_logs"
    | "admin:manage_pricing";

// 2. Define Role Structure
export type Role = "customer" | "driver" | "admin" | "fleet_owner";

// 3. The Permission Matrix
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    customer: [
        "ride:request",
        "ride:cancel", // Can cancel their own rides
    ],
    driver: [
        "ride:accept",
        "ride:cancel", // Can cancel assigned rides
        "driver:go_online",
        "driver:view_earnings",
    ],
    fleet_owner: [
        "fleet:manage_drivers",
        "driver:view_earnings", // Can view fleet earnings
    ],
    admin: [
        "ride:request",
        "ride:accept",
        "ride:cancel",
        "driver:go_online",
        "driver:view_earnings",
        "fleet:manage_drivers",
        "admin:ban_user",
        "admin:view_logs",
        "admin:manage_pricing",
    ],
};

// 4. The "Bouncer" Function
// Usage: if (!can(user.role, 'ride:accept')) throw new Error('Unauthorized');
export function can(role: Role, permission: Permission): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role];
    return permissions?.includes(permission) ?? false;
}

// 5. Helper to validate role strings
export function isValidRole(role: string): role is Role {
    return ["customer", "driver", "admin", "fleet_owner"].includes(role);
}
