'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Settings, Fuel, DollarSign, Percent, Clock, ArrowLeft,
    Save, RefreshCw, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';

export default function ConfigPage() {
    const systemSettings = useQuery(api.pricing.getAllSystemSettings) as any;
    const fuelPrice = useQuery(api.pricing.getFuelPrice) as any;
    const updateFuelPrice = useMutation(api.pricing.updateFuelPrice);
    const initSettings = useMutation(api.pricing.initializeSystemSettings);

    const [newFuelPrice, setNewFuelPrice] = useState<number>(3200);
    const [updating, setUpdating] = useState(false);
    const [initializing, setInitializing] = useState(false);

    const handleUpdateFuel = async () => {
        if (newFuelPrice < 1000) {
            alert('Fuel price must be at least 1000 TZS');
            return;
        }
        setUpdating(true);
        try {
            await updateFuelPrice({ price: newFuelPrice });
            alert('Fuel price updated successfully!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleInitialize = async () => {
        setInitializing(true);
        try {
            await initSettings({});
            alert('System settings initialized!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setInitializing(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">System Configuration</h1>
                        <p className="text-slate-400">Manage platform settings</p>
                    </div>
                </div>
            </div>

            {/* Fuel Price Control */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Fuel className="w-5 h-5 text-yellow-500" />
                        Fuel Price Index
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="p-4 bg-slate-700/50 rounded-xl">
                            <p className="text-sm text-slate-400 mb-1">Current Price</p>
                            <p className="text-3xl font-bold text-yellow-400">
                                TZS {(fuelPrice?.price || 3200).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">per liter</p>
                        </div>

                        <div className="lg:col-span-2 flex items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-sm text-slate-400 mb-2">New Fuel Price (TZS/L)</label>
                                <Input
                                    type="number"
                                    value={newFuelPrice}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFuelPrice(Number(e.target.value))}
                                    className="bg-slate-700 border-slate-600 text-white"
                                    min={1000}
                                    step={100}
                                />
                            </div>
                            <Button
                                onClick={handleUpdateFuel}
                                disabled={updating}
                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {updating ? 'Updating...' : 'Update'}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <p className="text-sm text-yellow-400">
                                Changing fuel price will automatically update all vehicle pricing through the fuel-index multipliers.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Platform Settings */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Platform Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-700/50 rounded-xl text-center">
                            <Percent className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">15%</p>
                            <p className="text-xs text-slate-500">Commission Rate</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-xl text-center">
                            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">10 min</p>
                            <p className="text-xs text-slate-500">Free Loading Time</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-xl text-center">
                            <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">3,000</p>
                            <p className="text-xs text-slate-500">Min Fare (TZS)</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-xl text-center">
                            <Fuel className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">5,000</p>
                            <p className="text-xs text-slate-500">Helper Fee (TZS)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Actions */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">System Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Button
                            onClick={handleInitialize}
                            disabled={initializing}
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${initializing ? 'animate-spin' : ''}`} />
                            {initializing ? 'Initializing...' : 'Re-Initialize Settings'}
                        </Button>
                        <Link href="/admin/pricing">
                            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Manage Pricing Matrix
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
