"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    Building2,
    Users,
    TrendingUp,
    Wallet,
    Shield,
    Key,
    Plus,
    ChevronRight,
    Truck,
    Clock
} from "lucide-react";

export default function B2BDashboard() {
    const orgStats = useQuery(api.b2b.getOrgStats);
    const teamMembers = useQuery(api.b2b.getTeamMembers);
    const listings = useQuery(api.businessListings.getListings, {});

    const upgradeTier = useMutation(api.b2b.upgradeTier);
    const generateApiKey = useMutation(api.b2b.generateApiKey);

    const [showApiKey, setShowApiKey] = useState<string | null>(null);

    if (!orgStats) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!orgStats.organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                <Building2 size={64} className="text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">No Organization Found</h1>
                <p className="text-gray-500 mb-6 text-center max-w-md">
                    Create or join an organization to access B2B features like team management,
                    volume discounts, and API access.
                </p>
                <button className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition">
                    Create Organization
                </button>
            </div>
        );
    }

    const { organization: org, stats } = orgStats;

    const tierConfig = {
        starter: { label: "Starter", color: "bg-gray-100 text-gray-700", commission: "15%" },
        business: { label: "Business", color: "bg-blue-100 text-blue-700", commission: "12%" },
        enterprise: { label: "Enterprise", color: "bg-purple-100 text-purple-700", commission: "8%" },
    };

    const currentTier = tierConfig[org.tier || "starter"];

    const handleGenerateApiKey = async () => {
        try {
            const result = await generateApiKey();
            setShowApiKey(result.apiKey);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleUpgrade = async (tier: "business" | "enterprise") => {
        try {
            await upgradeTier({ tier });
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${currentTier.color}`}>
                                {currentTier.label}
                            </span>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-500 text-sm">{currentTier.commission} commission</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Wallet Balance</p>
                            <p className="text-xl font-bold text-green-600">
                                {(org.walletBalance || 0).toLocaleString()} TZS
                            </p>
                        </div>
                        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600">
                            Top Up
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={<Users className="text-blue-500" />}
                        label="Team Members"
                        value={stats.totalMembers}
                    />
                    <StatCard
                        icon={<Truck className="text-orange-500" />}
                        label="Total Rides"
                        value={stats.completedRides}
                    />
                    <StatCard
                        icon={<TrendingUp className="text-green-500" />}
                        label="Monthly Spend"
                        value={`${stats.totalSpend.toLocaleString()} TZS`}
                    />
                    <StatCard
                        icon={<Clock className="text-purple-500" />}
                        label="Billing"
                        value={org.billingModel === "prepaid" ? "Prepaid" : "Invoice"}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Team Members */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                            <button className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium">
                                <Plus size={18} />
                                Invite
                            </button>
                        </div>
                        <div className="space-y-4">
                            {teamMembers?.map((member) => (
                                <div
                                    key={member._id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                            <span className="text-orange-600 font-semibold">
                                                {member.name?.charAt(0) || "?"}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.name}</p>
                                            <p className="text-sm text-gray-500">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs px-2 py-1 rounded ${member.orgRole === "admin"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-gray-100 text-gray-600"
                                            }`}>
                                            {member.orgRole || "User"}
                                        </span>
                                        {member.spendingLimitPerDay && (
                                            <span className="text-sm text-gray-500">
                                                {member.spendingLimitPerDay.toLocaleString()} TZS/day
                                            </span>
                                        )}
                                        <ChevronRight size={18} className="text-gray-400" />
                                    </div>
                                </div>
                            ))}
                            {(!teamMembers || teamMembers.length === 0) && (
                                <p className="text-gray-400 text-center py-8">No team members yet</p>
                            )}
                        </div>
                    </div>

                    {/* Plan & API */}
                    <div className="space-y-6">
                        {/* Current Plan */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plan</h2>
                            <div className="space-y-4">
                                <PlanCard
                                    name="Starter"
                                    price="Free"
                                    commission="15%"
                                    features={["Basic dashboard", "Up to 5 team members"]}
                                    isCurrent={org.tier === "starter" || !org.tier}
                                />
                                <PlanCard
                                    name="Business"
                                    price="200K TZS/mo"
                                    commission="12%"
                                    features={["Teams", "Reports", "Bulk booking"]}
                                    isCurrent={org.tier === "business"}
                                    onUpgrade={() => handleUpgrade("business")}
                                    canUpgrade={org.tier === "starter" || !org.tier}
                                />
                                <PlanCard
                                    name="Enterprise"
                                    price="Custom"
                                    commission="8%"
                                    features={["API access", "SLA", "Dedicated support"]}
                                    isCurrent={org.tier === "enterprise"}
                                    onUpgrade={() => handleUpgrade("enterprise")}
                                    canUpgrade={org.tier === "business"}
                                />
                            </div>
                        </div>

                        {/* API Access (Enterprise only) */}
                        {org.tier === "enterprise" && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Key className="text-purple-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">API Access</h2>
                                </div>
                                {showApiKey ? (
                                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm break-all">
                                        {showApiKey}
                                    </div>
                                ) : org.apiKey ? (
                                    <p className="text-gray-500 text-sm">
                                        API key is set. Generate a new one to see it.
                                    </p>
                                ) : null}
                                <button
                                    onClick={handleGenerateApiKey}
                                    className="mt-4 w-full py-2 border border-purple-500 text-purple-500 rounded-lg font-medium hover:bg-purple-50"
                                >
                                    {org.apiKey ? "Regenerate API Key" : "Generate API Key"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- Sub Components ---

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
                {icon}
                <span className="text-gray-500 text-sm">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

function PlanCard({
    name,
    price,
    commission,
    features,
    isCurrent,
    onUpgrade,
    canUpgrade
}: {
    name: string;
    price: string;
    commission: string;
    features: string[];
    isCurrent: boolean;
    onUpgrade?: () => void;
    canUpgrade?: boolean;
}) {
    return (
        <div className={`p-4 rounded-lg border-2 ${isCurrent ? "border-orange-500 bg-orange-50" : "border-gray-100"
            }`}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{name}</span>
                <span className="text-sm text-gray-500">{price}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{commission} commission</p>
            <ul className="text-xs text-gray-600 space-y-1">
                {features.map((f, i) => (
                    <li key={i}>• {f}</li>
                ))}
            </ul>
            {!isCurrent && canUpgrade && onUpgrade && (
                <button
                    onClick={onUpgrade}
                    className="mt-3 w-full py-1.5 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600"
                >
                    Upgrade
                </button>
            )}
            {isCurrent && (
                <div className="mt-3 text-center text-xs text-orange-600 font-medium">
                    Current Plan
                </div>
            )}
        </div>
    );
}
