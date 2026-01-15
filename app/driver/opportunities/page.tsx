'use client';

import { useState } from 'react';
import {
    Briefcase, ArrowLeft, Search, MapPin, DollarSign,
    Building2, Truck, CheckCircle, Send
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Mock listings data - in production these would come from api.b2b.getActiveListings
const MOCK_LISTINGS = [
    { _id: '1', title: 'Daily Delivery Route', business_name: 'Shoprite', category: 'delivery', description: 'Daily deliveries to 5 stores across Dar es Salaam', location: 'Dar es Salaam', vehicle_type: 'Canter', frequency: 'daily', pay_per_trip: 50000 },
    { _id: '2', title: 'Warehouse to Port Transport', business_name: 'TanzaniaPort', category: 'logistics', description: 'Container transport from Ubungo warehouse to port', location: 'Dar es Salaam', vehicle_type: 'Fuso', frequency: 'weekly', pay_per_trip: 150000 },
    { _id: '3', title: 'Food Delivery Partner', business_name: 'Foodie TZ', category: 'food', description: 'Deliver meals across the city - flexible hours', location: 'Dar es Salaam', vehicle_type: 'Boda', frequency: 'daily', pay_per_trip: 5000 },
    { _id: '4', title: 'Office Moving Pack', business_name: 'MoveCorp', category: 'moving', description: 'Weekly office relocations - furniture and equipment', location: 'Arusha', vehicle_type: 'Canter', frequency: 'weekly', pay_per_trip: 80000 },
];

export default function OpportunitiesPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [applyingTo, setApplyingTo] = useState<string | null>(null);
    const [myApplications, setMyApplications] = useState<string[]>([]);

    const listings = MOCK_LISTINGS;
    const categories = ['all', 'delivery', 'moving', 'logistics', 'food'];

    const filteredListings = listings.filter(listing => {
        const matchesSearch = listing.title.toLowerCase().includes(search.toLowerCase()) ||
            listing.business_name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const hasApplied = (listingId: string) => {
        return myApplications.includes(listingId);
    };

    const handleApply = async (listingId: string) => {
        setApplyingTo(listingId);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMyApplications(prev => [...prev, listingId]);
        setApplyingTo(null);
        alert('Application submitted successfully!');
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return 'Daily Routes';
            case 'weekly': return 'Weekly';
            case 'one_time': return 'One-time';
            default: return freq;
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/driver" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Opportunities</h1>
                    <p className="text-slate-400 text-sm">B2B contracts & regular routes</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    placeholder="Search opportunities..."
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === cat
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Listings */}
            <div className="space-y-4">
                {filteredListings.length > 0 ? (
                    filteredListings.map((listing) => {
                        const applied = hasApplied(listing._id);
                        return (
                            <Card key={listing._id} className="bg-slate-800 border-slate-700">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-green-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{listing.title}</h3>
                                                <p className="text-sm text-slate-400">{listing.business_name}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                            {getFrequencyLabel(listing.frequency)}
                                        </span>
                                    </div>

                                    <p className="text-slate-400 text-sm mb-4">{listing.description}</p>

                                    <div className="flex items-center gap-4 mb-4 text-sm">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <MapPin className="w-4 h-4" />
                                            <span>{listing.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Truck className="w-4 h-4" />
                                            <span>{listing.vehicle_type}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="w-5 h-5 text-green-400" />
                                            <span className="text-xl font-bold text-white">
                                                TZS {listing.pay_per_trip.toLocaleString()}
                                            </span>
                                            <span className="text-slate-500 text-sm">/trip</span>
                                        </div>

                                        {applied ? (
                                            <Button disabled className="bg-slate-700 text-slate-400">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Applied
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleApply(listing._id)}
                                                disabled={applyingTo === listing._id}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                {applyingTo === listing._id ? 'Applying...' : 'Apply'}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-12 text-center">
                            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-white mb-1">No opportunities found</h3>
                            <p className="text-slate-400 text-sm">Check back later for new listings</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* My Applications Count */}
            {myApplications.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600 text-white rounded-full shadow-lg text-sm font-medium">
                    {myApplications.length} Active Application{myApplications.length > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
