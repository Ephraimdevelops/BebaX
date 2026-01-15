'use client';

import { useState } from 'react';
import { Package, Truck, Box, Refrigerator, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CargoType {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    requiresPhoto?: boolean;
    requiresValue?: boolean;
}

const CARGO_TYPES: CargoType[] = [
    { id: 'general', label: 'General', icon: <Package className="w-6 h-6" />, description: 'Boxes, furniture, equipment' },
    { id: 'fragile', label: 'Fragile', icon: <AlertTriangle className="w-6 h-6 text-orange-500" />, description: 'Glass, electronics, delicate items', requiresPhoto: true },
    { id: 'perishable', label: 'Perishable', icon: <Refrigerator className="w-6 h-6 text-blue-500" />, description: 'Food, medicine, temperature-sensitive' },
    { id: 'bulk', label: 'Bulk', icon: <Truck className="w-6 h-6 text-purple-500" />, description: 'Large quantities, pallets' },
    { id: 'high_value', label: 'High Value', icon: <Box className="w-6 h-6 text-yellow-500" />, description: 'Electronics, jewelry', requiresValue: true, requiresPhoto: true },
];

interface SmartCargoSelectorProps {
    onSelect: (cargoType: string, details?: { photo?: string; value?: number }) => void;
    onClose?: () => void;
}

export function SmartCargoSelector({ onSelect, onClose }: SmartCargoSelectorProps) {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [cargoValue, setCargoValue] = useState<string>('');

    const selectedCargo = CARGO_TYPES.find(c => c.id === selectedType);

    const handleConfirm = () => {
        if (!selectedType) return;
        const details: { photo?: string; value?: number } = {};
        if (cargoValue) details.value = parseInt(cargoValue, 10);
        onSelect(selectedType, details);
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">What are you shipping?</h3>
            <p className="text-slate-500 text-sm mb-6">Select the type of cargo for proper handling</p>

            {/* Cargo Types Grid */}
            <div className="space-y-3 mb-6">
                {CARGO_TYPES.map((cargo) => (
                    <button
                        key={cargo.id}
                        onClick={() => setSelectedType(cargo.id)}
                        className={`
                            w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                            ${selectedType === cargo.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-slate-200 hover:border-slate-300'}
                        `}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedType === cargo.id ? 'bg-orange-100' : 'bg-slate-100'
                            }`}>
                            {cargo.icon}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900">{cargo.label}</p>
                            <p className="text-sm text-slate-500">{cargo.description}</p>
                        </div>
                        {selectedType === cargo.id && (
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Additional Fields for High Value */}
            {selectedCargo?.requiresValue && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Estimated Cargo Value (TZS)
                    </label>
                    <input
                        type="number"
                        value={cargoValue}
                        onChange={(e) => setCargoValue(e.target.value)}
                        placeholder="Enter value"
                        className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ Insurance coverage depends on declared value
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {onClose && (
                    <Button onClick={onClose} variant="outline" className="flex-1 h-12 rounded-xl">
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={handleConfirm}
                    disabled={!selectedType}
                    className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                >
                    Confirm Cargo Type
                </Button>
            </div>
        </div>
    );
}
