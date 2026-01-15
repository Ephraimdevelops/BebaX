'use client';

import { X } from 'lucide-react';

interface FareBreakdown {
    baseFare: number;
    distanceFare: number;
    timeFare?: number;
    trafficSurcharge?: number;
    peakHourCharge?: number;
    insurance?: number;
    discount?: number;
    total: number;
}

interface PriceBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    breakdown: FareBreakdown;
    distance?: number;
    vehicleType?: string;
}

export function PriceBreakdownModal({
    isOpen,
    onClose,
    breakdown,
    distance,
    vehicleType = 'Standard',
}: PriceBreakdownModalProps) {
    if (!isOpen) return null;

    const items = [
        { label: 'Base Fare', value: breakdown.baseFare, always: true },
        { label: `Distance (${distance || 0} km)`, value: breakdown.distanceFare, always: true },
        { label: 'Time Charge', value: breakdown.timeFare, always: false },
        { label: 'Traffic Surcharge', value: breakdown.trafficSurcharge, always: false },
        { label: 'Peak Hour (+20%)', value: breakdown.peakHourCharge, always: false },
        { label: 'Cargo Insurance', value: breakdown.insurance, always: false },
    ].filter(item => item.always || item.value);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fare Breakdown</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Vehicle Type */}
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                        <p className="text-sm text-purple-600 dark:text-purple-400">Vehicle Type</p>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{vehicleType}</p>
                    </div>

                    {/* Breakdown Items */}
                    <div className="space-y-3 mb-4">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-500">{item.label}</span>
                                <span className="text-slate-900 dark:text-white">
                                    TZS {(item.value || 0).toLocaleString()}
                                </span>
                            </div>
                        ))}

                        {/* Discount */}
                        {breakdown.discount && breakdown.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-green-500">Discount</span>
                                <span className="text-green-500">
                                    - TZS {breakdown.discount.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                            <span className="text-2xl font-black text-purple-600">
                                TZS {breakdown.total.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Info */}
                    <p className="mt-4 text-xs text-slate-400 text-center">
                        Final fare may vary based on actual route and traffic conditions
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PriceBreakdownModal;
