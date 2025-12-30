"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    Shield,
    Upload,
    Camera,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    ArrowLeft,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Id } from "../../convex/_generated/dataModel";

export default function InsuranceClaimsPage() {
    const [selectedRide, setSelectedRide] = useState<Id<"rides"> | null>(null);
    const [claimAmount, setClaimAmount] = useState("");
    const [claimReason, setClaimReason] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get insurance tiers
    const tiers = useQuery(api.insurance.getTiers);

    // Get user's claims
    const myClaims = useQuery(api.insurance.getMyClai);

    // File claim mutation
    const fileClaim = useMutation(api.insurance.fileClaim);

    const handleSubmitClaim = async () => {
        if (!selectedRide || !claimAmount || !claimReason) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            // For now we'll use the basic tier - in production, get from ride
            const basicTier = tiers?.find(t => t.code === "basic");
            if (!basicTier) {
                throw new Error("Insurance tier not found");
            }

            await fileClaim({
                rideId: selectedRide,
                tierId: basicTier._id,
                declaredValue: parseInt(claimAmount),
                claimAmount: parseInt(claimAmount),
                claimReason,
                evidencePhotos: photos,
            });

            alert("Claim submitted successfully!");
            setSelectedRide(null);
            setClaimAmount("");
            setClaimReason("");
            setPhotos([]);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Shield className="text-orange-500" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Insurance Claims</h1>
                            <p className="text-gray-500">File and track your cargo insurance claims</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* File New Claim */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">File a New Claim</h2>

                        <div className="space-y-6">
                            {/* Select Ride */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Trip *
                                </label>
                                <p className="text-xs text-gray-400 mb-2">
                                    Choose the trip where damage occurred
                                </p>
                                {/* In production, fetch recent rides with insurance */}
                                <select
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    value={selectedRide || ""}
                                    onChange={(e) => setSelectedRide(e.target.value as Id<"rides">)}
                                >
                                    <option value="">Select a recent trip...</option>
                                    {/* Would be populated with actual rides */}
                                </select>
                            </div>

                            {/* Claim Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Claim Amount (TZS) *
                                </label>
                                <input
                                    type="number"
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                    placeholder="e.g., 100000"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Claim Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    What Happened? *
                                </label>
                                <textarea
                                    value={claimReason}
                                    onChange={(e) => setClaimReason(e.target.value)}
                                    placeholder="Describe the damage or loss in detail..."
                                    rows={4}
                                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Evidence Photos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Evidence Photos
                                </label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                                    <Camera className="mx-auto text-gray-300 mb-3" size={32} />
                                    <p className="text-gray-500 text-sm mb-2">
                                        Upload photos of the damaged cargo
                                    </p>
                                    <button className="text-orange-500 font-medium text-sm hover:text-orange-600">
                                        <Upload size={16} className="inline mr-1" />
                                        Upload Photos
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmitClaim}
                                disabled={isSubmitting || !selectedRide || !claimAmount || !claimReason}
                                className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Claim"}
                            </button>

                            <p className="text-xs text-gray-400 text-center">
                                Claims are typically reviewed within 24-48 hours
                            </p>
                        </div>
                    </div>

                    {/* Coverage Info */}
                    <div className="space-y-6">
                        {/* Coverage Tiers */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Coverage Tiers</h3>
                            <div className="space-y-3">
                                {tiers?.map((tier) => (
                                    <div key={tier._id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-800">{tier.name}</span>
                                            <span className="text-sm text-orange-600">
                                                {tier.fee === 0 ? "Free" : `+${tier.fee.toLocaleString()} TZS`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Up to {tier.maxCoverage.toLocaleString()} TZS
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* My Claims History */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">My Claims</h3>
                            <div className="space-y-3">
                                {myClaims?.map((claim) => (
                                    <div
                                        key={claim._id}
                                        className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">
                                                {claim.claimAmount.toLocaleString()} TZS
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(claim.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <ClaimStatus status={claim.status} />
                                    </div>
                                ))}
                                {(!myClaims || myClaims.length === 0) && (
                                    <p className="text-gray-400 text-sm text-center py-4">
                                        No claims filed yet
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ClaimStatus({ status }: { status: string }) {
    const config = {
        pending: { icon: <Clock size={14} />, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
        under_review: { icon: <AlertTriangle size={14} />, color: "text-blue-600 bg-blue-50", label: "Reviewing" },
        approved: { icon: <CheckCircle size={14} />, color: "text-green-600 bg-green-50", label: "Approved" },
        rejected: { icon: <XCircle size={14} />, color: "text-red-600 bg-red-50", label: "Rejected" },
        paid: { icon: <CheckCircle size={14} />, color: "text-purple-600 bg-purple-50", label: "Paid" },
    };

    const c = config[status as keyof typeof config] || config.pending;

    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${c.color}`}>
            {c.icon}
            {c.label}
        </span>
    );
}
