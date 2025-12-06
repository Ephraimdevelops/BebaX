import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Wallet, Users, MapPin, Copy, ExternalLink, Edit2, Check, X } from 'lucide-react';
import OrgProfile from './profile/OrgProfile';

export default function OrganizationDashboard({ userProfile }) {
    const org = useQuery(api.organizations.getOrg, { orgId: userProfile.orgId });
    const members = useQuery(api.organizations.getMembers, { orgId: userProfile.orgId });
    const rides = useQuery(api.organizations.getOrgRides, { orgId: userProfile.orgId });
    const updateLimit = useMutation(api.organizations.updateMemberLimit);

    const [editingMember, setEditingMember] = useState(null);
    const [newLimit, setNewLimit] = useState('');
    const [showTopUpModal, setShowTopUpModal] = useState(false);

    if (!org || !members || !rides) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const handleUpdateLimit = async (userId) => {
        try {
            await updateLimit({ userId, limit: parseInt(newLimit) });
            setEditingMember(null);
            setNewLimit('');
        } catch (error) {
            console.error("Failed to update limit:", error);
            alert("Failed to update limit. Please try again.");
        }
    };

    const copyTrackingLink = (token) => {
        const url = `https://beba.app/track/${token}`;
        navigator.clipboard.writeText(url);
        alert("Tracking link copied to clipboard!");
    };

    return (
        <div className="space-y-8">
            {/* 1. Organization Profile & Wallet */}
            <OrgProfile profile={userProfile} org={org} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Team Management (The Staff Leash) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        Team Management
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-3 pl-2">Name</th>
                                    <th className="pb-3">Role</th>
                                    <th className="pb-3">Daily Limit</th>
                                    <th className="pb-3 text-right pr-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {members.map((member) => (
                                    <tr key={member._id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-4 pl-2 font-medium text-gray-900">{member.name}</td>
                                        <td className="py-4 text-gray-500 capitalize">{member.orgRole}</td>
                                        <td className="py-4">
                                            {editingMember === member._id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={newLimit}
                                                        onChange={(e) => setNewLimit(e.target.value)}
                                                        className="w-24 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                        placeholder={member.spendingLimitPerDay}
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleUpdateLimit(member._id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingMember(null)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600">TZS {member.spendingLimitPerDay?.toLocaleString() || 'Unlimited'}</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            {editingMember !== member._id && member.orgRole !== 'admin' && (
                                                <button
                                                    onClick={() => {
                                                        setEditingMember(member._id);
                                                        setNewLimit(member.spendingLimitPerDay || '');
                                                    }}
                                                    className="text-gray-400 hover:text-orange-500 p-2 rounded-full hover:bg-orange-50 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Ride History (Tracking Integration) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        Recent Business Trips
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {rides.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No business trips yet.</div>
                        ) : (
                            rides.map((ride) => (
                                <div key={ride._id} className="p-4 rounded-xl border border-gray-100 hover:border-orange-100 hover:bg-orange-50/30 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-semibold text-gray-900">{ride.vehicle_type.toUpperCase()}</div>
                                            <div className="text-xs text-gray-500">{new Date(ride.created_at).toLocaleDateString()} • {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {ride.status}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                        <div className="truncate max-w-[120px]">{ride.pickup_location.address}</div>
                                        <span className="text-gray-300">→</span>
                                        <div className="truncate max-w-[120px]">{ride.dropoff_location.address}</div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                        <div className="font-medium text-gray-900">TZS {ride.fare_estimate.toLocaleString()}</div>

                                        {/* Tracking Button */}
                                        {(ride.status === 'ongoing' || ride.status === 'accepted' || ride.status === 'loading') && (
                                            <button
                                                onClick={() => copyTrackingLink(ride.guestTrackingToken)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                                            >
                                                <Copy className="w-3 h-3" />
                                                Track Live
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Top Up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Top Up Wallet</h3>
                            <button onClick={() => setShowTopUpModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <p className="text-sm text-orange-800 font-medium mb-1">Bank Transfer</p>
                                <p className="text-lg font-bold text-gray-900">CRDB Bank</p>
                                <p className="text-gray-600">Account: 0152837465900</p>
                                <p className="text-gray-600">Name: Beba Logistics Ltd</p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-600 font-medium mb-1">Mobile Money</p>
                                <p className="text-lg font-bold text-gray-900">M-Pesa / Airtel Money</p>
                                <p className="text-gray-600">Paybill: 556677</p>
                                <p className="text-gray-600">Account: {org.name}</p>
                            </div>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                Funds will reflect automatically within 5 minutes of transfer.
                                <br />For urgent support call: +255 700 000 000
                            </p>
                        </div>

                        <button
                            onClick={() => setShowTopUpModal(false)}
                            className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
