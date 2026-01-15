"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PRICING DASHBOARD
// Fuel-Index Management Console
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminPricingPage() {
    const pricingData = useQuery(api.pricing.getAllVehiclePricingRules) as any;
    const updateFuelPrice = useMutation(api.pricing.updateFuelPrice);
    const seedPricing = useMutation(api.pricing.initializeSystemSettings);

    const [newFuelPrice, setNewFuelPrice] = useState<number>(3200);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    const handleUpdateFuelPrice = async () => {
        if (!newFuelPrice || newFuelPrice < 1000) {
            alert("Fuel price must be at least 1000 TZS");
            return;
        }
        setIsUpdating(true);
        try {
            await updateFuelPrice({ price: newFuelPrice });
            alert("Fuel price updated successfully!");
        } catch (error) {
            alert("Error updating fuel price: " + error);
        }
        setIsUpdating(false);
    };

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            await seedPricing({});
            alert("Pricing data seeded successfully!");
        } catch (error) {
            alert("Error seeding data: " + error);
        }
        setIsSeeding(false);
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>⛽ Fuel-Index Pricing Brain</h1>
                <p style={styles.subtitle}>
                    Manage fleet pricing based on current fuel costs
                </p>
            </div>

            {/* Inflation Slider */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>💹 Fuel Price Control</h2>
                <div style={styles.fuelRow}>
                    <div>
                        <label style={styles.label}>Current Fuel Price (TZS/L)</label>
                        <div style={styles.currentPrice}>
                            {pricingData?.fuelPrice?.toLocaleString() ?? "Loading..."}
                        </div>
                    </div>
                    <div>
                        <label style={styles.label}>New Price</label>
                        <input
                            type="number"
                            value={newFuelPrice}
                            onChange={(e) => setNewFuelPrice(Number(e.target.value))}
                            style={styles.input}
                            min={1000}
                            step={100}
                        />
                    </div>
                    <button
                        onClick={handleUpdateFuelPrice}
                        disabled={isUpdating}
                        style={{
                            ...styles.button,
                            ...(isUpdating ? styles.buttonDisabled : {}),
                        }}
                    >
                        {isUpdating ? "Updating..." : "Update Fuel Price"}
                    </button>
                </div>
            </div>

            {/* Override Matrix */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>🚛 Fleet Pricing Matrix</h2>
                <p style={styles.cardSubtitle}>
                    Real-time calculated prices based on fuel cost × multipliers
                </p>

                {pricingData?.rules && pricingData.rules.length > 0 ? (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Vehicle</th>
                                    <th style={styles.th}>Model</th>
                                    <th style={styles.th}>Base ×</th>
                                    <th style={styles.th}>Per-Km ×</th>
                                    <th style={styles.th}>Min ×</th>
                                    <th style={styles.th}>Base Fare</th>
                                    <th style={styles.th}>Per-Km</th>
                                    <th style={styles.th}>Min Fare</th>
                                    <th style={styles.th}>Free Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pricingData.rules.map((rule: any) => (
                                    <tr key={rule._id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <span style={styles.vehicleName}>
                                                {rule.vehicle_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.badge,
                                                    backgroundColor:
                                                        rule.pricing_model === "range"
                                                            ? "#DBEAFE"
                                                            : "#DCFCE7",
                                                    color:
                                                        rule.pricing_model === "range"
                                                            ? "#1E40AF"
                                                            : "#166534",
                                                }}
                                            >
                                                {rule.pricing_model}
                                            </span>
                                        </td>
                                        <td style={styles.td}>{rule.base_fare_multiplier}×</td>
                                        <td style={styles.td}>{rule.per_km_multiplier}×</td>
                                        <td style={styles.td}>{rule.min_fare_multiplier}×</td>
                                        <td style={styles.tdHighlight}>
                                            {rule.calculatedBaseFare?.toLocaleString()} TZS
                                        </td>
                                        <td style={styles.tdHighlight}>
                                            {rule.calculatedPerKm?.toLocaleString()} TZS
                                        </td>
                                        <td style={styles.tdHighlight}>
                                            {rule.calculatedMinFare?.toLocaleString()} TZS
                                        </td>
                                        <td style={styles.td}>{rule.free_loading_minutes} min</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        <p>No pricing rules found. Seed the database first.</p>
                        <button
                            onClick={handleSeedData}
                            disabled={isSeeding}
                            style={{
                                ...styles.button,
                                ...(isSeeding ? styles.buttonDisabled : {}),
                            }}
                        >
                            {isSeeding ? "Seeding..." : "🌱 Seed Pricing Data"}
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>⚙️ Quick Actions</h2>
                <div style={styles.actionsRow}>
                    <button
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        style={{
                            ...styles.buttonSecondary,
                            ...(isSeeding ? styles.buttonDisabled : {}),
                        }}
                    >
                        {isSeeding ? "Seeding..." : "🌱 Re-Seed Defaults"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#0F172A",
        padding: "40px",
        color: "white",
    },
    header: {
        marginBottom: "32px",
    },
    title: {
        fontSize: "32px",
        fontWeight: "800",
        marginBottom: "8px",
    },
    subtitle: {
        fontSize: "16px",
        color: "#94A3B8",
    },
    card: {
        backgroundColor: "#1E293B",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "24px",
    },
    cardTitle: {
        fontSize: "20px",
        fontWeight: "700",
        marginBottom: "8px",
    },
    cardSubtitle: {
        fontSize: "14px",
        color: "#94A3B8",
        marginBottom: "16px",
    },
    fuelRow: {
        display: "flex",
        alignItems: "flex-end",
        gap: "24px",
        flexWrap: "wrap",
    },
    label: {
        display: "block",
        fontSize: "14px",
        color: "#94A3B8",
        marginBottom: "8px",
    },
    currentPrice: {
        fontSize: "28px",
        fontWeight: "800",
        color: "#22C55E",
    },
    input: {
        padding: "12px 16px",
        fontSize: "18px",
        fontWeight: "700",
        borderRadius: "8px",
        border: "2px solid #334155",
        backgroundColor: "#0F172A",
        color: "white",
        width: "150px",
    },
    button: {
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "700",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#3B82F6",
        color: "white",
        cursor: "pointer",
    },
    buttonSecondary: {
        padding: "12px 24px",
        fontSize: "14px",
        fontWeight: "600",
        borderRadius: "8px",
        border: "2px solid #334155",
        backgroundColor: "transparent",
        color: "#94A3B8",
        cursor: "pointer",
    },
    buttonDisabled: {
        opacity: 0.5,
        cursor: "not-allowed",
    },
    tableContainer: {
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    th: {
        textAlign: "left",
        padding: "12px 16px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottom: "1px solid #334155",
    },
    tr: {
        borderBottom: "1px solid #334155",
    },
    td: {
        padding: "16px",
        fontSize: "14px",
        color: "#E2E8F0",
    },
    tdHighlight: {
        padding: "16px",
        fontSize: "14px",
        fontWeight: "700",
        color: "#22C55E",
    },
    vehicleName: {
        fontWeight: "800",
        letterSpacing: "0.5px",
    },
    badge: {
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "700",
        textTransform: "uppercase",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px",
        color: "#94A3B8",
    },
    actionsRow: {
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
    },
};
