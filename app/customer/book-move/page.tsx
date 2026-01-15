'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    ArrowLeft, ArrowRight, Home, Sofa, Building2, Truck,
    Users, Calendar, MapPin, Check, Loader2, Package
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Move size options
const MOVE_SIZES = [
    { id: 'small', icon: '📦', title: 'Small Move', description: 'Bedsitter / Studio', vehicle: 'Bajaj', basePrice: 50000 },
    { id: 'medium', icon: '🛋️', title: 'Medium Move', description: '1-2 Bedroom House', vehicle: 'Canter', basePrice: 150000 },
    { id: 'large', icon: '🏠', title: 'Large Move', description: '3+ Bedroom / Office', vehicle: 'Fuso', basePrice: 300000 },
];

// Complexity factors
const COMPLEXITY_OPTIONS = [
    { id: 'ground', label: 'Ground Floor', multiplier: 1.0 },
    { id: 'stairs_1', label: '1-2 Floors (Stairs)', multiplier: 1.2 },
    { id: 'stairs_3', label: '3+ Floors (Stairs)', multiplier: 1.4 },
    { id: 'elevator', label: 'Has Elevator', multiplier: 1.1 },
];

export default function BookMovePage() {
    const [step, setStep] = useState(1);

    // Form state
    const [moveSize, setMoveSize] = useState<string | null>(null);
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropoffAddress, setDropoffAddress] = useState('');
    const [pickupComplexity, setPickupComplexity] = useState('ground');
    const [dropoffComplexity, setDropoffComplexity] = useState('ground');
    const [helpersCount, setHelpersCount] = useState(2);
    const [needsPacking, setNeedsPacking] = useState(false);
    const [moveDate, setMoveDate] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate quote
    const calculateQuote = () => {
        const size = MOVE_SIZES.find(s => s.id === moveSize);
        if (!size) return 0;

        const pickupMult = COMPLEXITY_OPTIONS.find(c => c.id === pickupComplexity)?.multiplier || 1;
        const dropoffMult = COMPLEXITY_OPTIONS.find(c => c.id === dropoffComplexity)?.multiplier || 1;
        const helpersCost = (helpersCount - 2) * 15000; // Extra helpers at 15k each
        const packingCost = needsPacking ? size.basePrice * 0.3 : 0;

        return Math.round(size.basePrice * pickupMult * dropoffMult + helpersCost + packingCost);
    };

    const quote = calculateQuote();
    const selectedSize = MOVE_SIZES.find(s => s.id === moveSize);

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert('Moving request submitted! We will contact you shortly.');
        window.location.href = '/customer';
    };

    const canProceed = () => {
        switch (step) {
            case 1: return moveSize !== null;
            case 2: return pickupAddress.length > 5 && dropoffAddress.length > 5;
            case 3: return true;
            case 4: return moveDate !== '';
            default: return false;
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/customer" className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow">
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Book a Move</h1>
                    <p className="text-slate-500 text-sm">House or office relocation</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === s ? 'bg-purple-600 text-white' :
                                step > s ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}>
                            {step > s ? <Check className="w-4 h-4" /> : s}
                        </div>
                        {s < 4 && <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 mx-1" />}
                    </div>
                ))}
            </div>

            <div className="max-w-lg mx-auto">
                {/* Step 1: Size */}
                {step === 1 && (
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                How big is your move?
                            </h2>
                            <div className="space-y-3">
                                {MOVE_SIZES.map((size) => (
                                    <button
                                        key={size.id}
                                        onClick={() => setMoveSize(size.id)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${moveSize === size.id
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                            }`}
                                    >
                                        <span className="text-3xl">{size.icon}</span>
                                        <div className="text-left flex-1">
                                            <p className="font-bold text-slate-900 dark:text-white">{size.title}</p>
                                            <p className="text-sm text-slate-500">{size.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">From</p>
                                            <p className="font-bold text-purple-600">TZS {size.basePrice.toLocaleString()}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Addresses */}
                {step === 2 && (
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
                        <CardContent className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                Where are you moving?
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Pickup Address
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full" />
                                    <Input
                                        value={pickupAddress}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupAddress(e.target.value)}
                                        placeholder="Current location address"
                                        className="pl-8"
                                    />
                                </div>
                                <select
                                    value={pickupComplexity}
                                    onChange={(e) => setPickupComplexity(e.target.value)}
                                    className="mt-2 w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm"
                                >
                                    {COMPLEXITY_OPTIONS.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Dropoff Address
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
                                    <Input
                                        value={dropoffAddress}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDropoffAddress(e.target.value)}
                                        placeholder="New location address"
                                        className="pl-8"
                                    />
                                </div>
                                <select
                                    value={dropoffComplexity}
                                    onChange={(e) => setDropoffComplexity(e.target.value)}
                                    className="mt-2 w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm"
                                >
                                    {COMPLEXITY_OPTIONS.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Services */}
                {step === 3 && (
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
                        <CardContent className="p-6 space-y-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Additional Services
                            </h2>

                            {/* Helpers */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                                    Number of Helpers
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setHelpersCount(Math.max(2, helpersCount - 1))}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl font-bold"
                                    >
                                        -
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-500" />
                                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{helpersCount}</span>
                                    </div>
                                    <button
                                        onClick={() => setHelpersCount(Math.min(6, helpersCount + 1))}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">2 helpers included. Extra helpers TZS 15,000 each.</p>
                            </div>

                            {/* Packing */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-purple-500" />
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Packing Service</p>
                                        <p className="text-xs text-slate-500">We pack your items (+30%)</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNeedsPacking(!needsPacking)}
                                    className={`w-12 h-6 rounded-full transition-colors ${needsPacking ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${needsPacking ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Special Instructions
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Fragile items, heavy furniture, etc."
                                    rows={3}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Confirm */}
                {step === 4 && (
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
                        <CardContent className="p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Confirm Your Move
                            </h2>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Moving Date
                                </label>
                                <input
                                    type="date"
                                    value={moveDate}
                                    onChange={(e) => setMoveDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Summary */}
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Move Size</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{selectedSize?.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Vehicle</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{selectedSize?.vehicle}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Helpers</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{helpersCount} people</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Packing</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{needsPacking ? 'Yes' : 'No'}</span>
                                </div>
                                <hr className="border-purple-200 dark:border-purple-700" />
                                <div className="flex justify-between">
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">Estimated Total</span>
                                    <span className="text-2xl font-black text-purple-600">TZS {quote.toLocaleString()}</span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 text-center">
                                Final price may vary based on actual inventory and distance
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                    {step > 1 && (
                        <Button onClick={handleBack} variant="outline" className="flex-1 h-14 rounded-xl">
                            Back
                        </Button>
                    )}
                    {step < 4 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex-1 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                        >
                            Next <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!canProceed() || isSubmitting}
                            className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
                            ) : (
                                'Confirm Booking'
                            )}
                        </Button>
                    )}
                </div>

                {/* Live Quote */}
                {moveSize && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900 text-white rounded-full shadow-xl">
                        <span className="text-sm">Estimate: </span>
                        <span className="font-bold">TZS {quote.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
