'use client';

import { useState, useCallback } from 'react';
import { VEHICLE_FLEET, VehicleId } from '@/lib/vehicleRegistry';
import { Button } from '@/components/ui/button';
import { Banknote, Wallet, Check } from 'lucide-react';

interface VehicleCardProps {
    vehicle: typeof VEHICLE_FLEET[0];
    isSelected: boolean;
    onSelect: (id: string) => void;
}

const VehicleCard = ({ vehicle, isSelected, onSelect }: VehicleCardProps) => {
    return (
        <button
            onClick={() => onSelect(vehicle.id)}
            className={`
                flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all
                min-w-[130px] h-[150px] bg-white hover:border-orange-400
                ${isSelected
                    ? 'border-orange-500 scale-105 shadow-lg shadow-orange-500/20'
                    : 'border-slate-200 hover:scale-102'}
            `}
        >
            <div className="w-20 h-14 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-3xl">🚛</span>
            </div>
            <p className={`font-bold text-sm ${isSelected ? 'text-orange-500' : 'text-slate-900'}`}>
                {vehicle.label}
            </p>
            <p className="text-xs text-slate-500 text-center mt-1 line-clamp-2">
                {vehicle.capacity}
            </p>
        </button>
    );
};

interface VehicleSelectionSheetProps {
    onSelectVehicle: (id: VehicleId, backendType: string) => void;
    hasOrgId?: boolean;
    onPaymentChange?: (method: 'cash' | 'wallet') => void;
    onConfirm?: () => void;
}

export function VehicleSelectionSheet({
    onSelectVehicle,
    hasOrgId = false,
    onPaymentChange,
    onConfirm,
}: VehicleSelectionSheetProps) {
    const [selectedId, setSelectedId] = useState<VehicleId | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');

    const handleSelect = useCallback((id: string) => {
        const vehicleId = id as VehicleId;
        setSelectedId(vehicleId);
        const vehicle = VEHICLE_FLEET.find(v => v.id === id);
        if (vehicle) {
            onSelectVehicle(vehicleId, vehicle.tier.toString());
        }
    }, [onSelectVehicle]);

    const handlePaymentToggle = (method: 'cash' | 'wallet') => {
        if (method === 'wallet' && !hasOrgId) {
            alert('You must belong to an Organization to use this feature.');
            return;
        }
        setPaymentMethod(method);
        onPaymentChange?.(method);
    };

    const handleConfirm = () => {
        onConfirm?.();
    };

    const selectedVehicle = VEHICLE_FLEET.find(v => v.id === selectedId);

    return (
        <div className="bg-white rounded-t-3xl border-t border-slate-200 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Select Vehicle</h3>
                {hasOrgId && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded">
                        B2B ENABLED
                    </span>
                )}
            </div>

            {/* Vehicle List - Horizontal Scroll */}
            <div className="overflow-x-auto pb-4 -mx-2">
                <div className="flex gap-3 px-2">
                    {VEHICLE_FLEET.map((vehicle) => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            isSelected={selectedId === vehicle.id}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            </div>

            {/* Options Panel - Shows after selection */}
            {selectedId && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Payment Method Toggle (B2B only) */}
                    {hasOrgId && (
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => handlePaymentToggle('cash')}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
                                    ${paymentMethod === 'cash'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500'}
                                `}
                            >
                                <Banknote className="w-4 h-4" />
                                Cash
                            </button>
                            <button
                                onClick={() => handlePaymentToggle('wallet')}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
                                    ${paymentMethod === 'wallet'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-slate-500'}
                                `}
                            >
                                <Wallet className="w-4 h-4" />
                                Company Wallet
                            </button>
                        </div>
                    )}

                    {/* Confirm Button */}
                    <Button
                        onClick={handleConfirm}
                        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-xl shadow-lg"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        CONFIRM {selectedVehicle?.label.toUpperCase()}
                    </Button>
                </div>
            )}
        </div>
    );
}
