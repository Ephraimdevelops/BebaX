"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    Briefcase,
    MapPin,
    Calendar,
    Truck,
    Building2,
    ChevronRight,
    Filter,
    Send,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "retail", label: "Retail" },
    { id: "construction", label: "Construction" },
    { id: "agriculture", label: "Agriculture" },
    { id: "manufacturing", label: "Manufacturing" },
    { id: "e-commerce", label: "E-Commerce" },
    { id: "logistics", label: "Logistics" },
];

const ROUTE_TYPES = [
    { id: "all", label: "All Routes" },
    { id: "local", label: "Local" },
    { id: "regional", label: "Regional" },
    { id: "national", label: "National" },
];

export default function OpportunitiesPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedRoute, setSelectedRoute] = useState("all");
    const [applyingTo, setApplyingTo] = useState<Id<"business_listings"> | null>(null);
    const [coverLetter, setCoverLetter] = useState("");

    const listings = useQuery(api.businessListings.getListings, {
        category: selectedCategory === "all" ? undefined : selectedCategory,
        routeType: selectedRoute === "all" ? undefined : selectedRoute,
    });

    const myApplications = useQuery(api.businessListings.getMyApplications);
    const applyToListing = useMutation(api.businessListings.applyToListing);

    const handleApply = async (listingId: Id<"business_listings">) => {
        try {
            await applyToListing({ listingId, coverLetter: coverLetter || undefined });
            setApplyingTo(null);
            setCoverLetter("");
            alert("Application submitted successfully!");
        } catch (error: any) {
            alert(error.message);
        }
    };

    const appliedListingIds = new Set(myApplications?.map(a => a.listingId) || []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900">Business Opportunities</h1>
                    <p className="text-gray-500 mt-1">Find consistent work with verified businesses</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-8">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Category:</span>
                        <div className="flex gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === cat.id
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Route:</span>
                        <div className="flex gap-2">
                            {ROUTE_TYPES.map(route => (
                                <button
                                    key={route.id}
                                    onClick={() => setSelectedRoute(route.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedRoute === route.id
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {route.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Listings */}
                    <div className="lg:col-span-2 space-y-4">
                        {listings?.map((listing) => (
                            <div
                                key={listing._id}
                                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                            {listing.organization?.logo ? (
                                                <img
                                                    src={listing.organization.logo}
                                                    alt=""
                                                    className="w-10 h-10 object-cover rounded"
                                                />
                                            ) : (
                                                <Building2 className="text-orange-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                                            <p className="text-sm text-gray-500">{listing.organization?.name}</p>
                                        </div>
                                    </div>
                                    {listing.organization?.verified && (
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">
                                            Verified
                                        </span>
                                    )}
                                </div>

                                <p className="text-gray-600 text-sm mb-4">{listing.description}</p>

                                <div className="flex flex-wrap gap-3 mb-4">
                                    <Tag icon={<MapPin size={14} />} label={listing.routeType} />
                                    <Tag icon={<Calendar size={14} />} label={listing.frequency} />
                                    <Tag icon={<Truck size={14} />} label={listing.vehicleRequirements.join(", ")} />
                                    <Tag icon={<Briefcase size={14} />} label={`${listing.estimatedMonthlyTrips} trips/mo`} />
                                </div>

                                {listing.payRate && (
                                    <p className="text-orange-600 font-semibold mb-4">{listing.payRate}</p>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    {appliedListingIds.has(listing._id) ? (
                                        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                            <CheckCircle size={16} />
                                            Applied
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setApplyingTo(listing._id)}
                                            className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 flex items-center gap-2"
                                        >
                                            <Send size={16} />
                                            Apply Now
                                        </button>
                                    )}
                                    <button className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
                                        View Details
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {listings?.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No opportunities found matching your filters</p>
                            </div>
                        )}
                    </div>

                    {/* My Applications Sidebar */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Applications</h2>
                        <div className="space-y-3">
                            {myApplications?.map((app) => (
                                <div
                                    key={app._id}
                                    className="p-3 bg-gray-50 rounded-lg"
                                >
                                    <p className="font-medium text-gray-900 text-sm">{app.listing?.title}</p>
                                    <p className="text-xs text-gray-500">{app.organization?.name}</p>
                                    <div className="mt-2">
                                        <ApplicationStatus status={app.status} />
                                    </div>
                                </div>
                            ))}
                            {(!myApplications || myApplications.length === 0) && (
                                <p className="text-gray-400 text-sm text-center py-4">
                                    No applications yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Apply Modal */}
            {applyingTo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply to Opportunity</h3>
                        <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Tell them why you're a great fit (optional)..."
                            className="w-full p-3 border border-gray-200 rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setApplyingTo(null); setCoverLetter(""); }}
                                className="flex-1 py-2 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleApply(applyingTo)}
                                className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                            >
                                Submit Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub Components ---

function Tag({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {icon}
            {label}
        </span>
    );
}

function ApplicationStatus({ status }: { status: string }) {
    const config = {
        pending: { icon: <Clock size={14} />, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
        accepted: { icon: <CheckCircle size={14} />, color: "text-green-600 bg-green-50", label: "Accepted" },
        rejected: { icon: <XCircle size={14} />, color: "text-red-600 bg-red-50", label: "Rejected" },
    };

    const c = config[status as keyof typeof config] || config.pending;

    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${c.color}`}>
            {c.icon}
            {c.label}
        </span>
    );
}
