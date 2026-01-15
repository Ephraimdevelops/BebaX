'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Wallet, ArrowLeft, AlertTriangle, Snowflake, CheckCircle,
    Phone, DollarSign, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WalletWatchPage() {
    const lowBalanceWallets = useQuery(api.admin.getLowBalanceWallets) as any[] || [];
    const freezeWallet = useMutation(api.admin.freezeWallet);

    const handleFreeze = async (driverId: string, driverName: string) => {
        const confirmed = window.confirm(
            `Freeze wallet for ${driverName}?\n\nThis will block them from accepting cash trips until they settle their balance.`
        );

        if (!confirmed) return;

        try {
            await freezeWallet({
                driver_id: driverId as any,
                reason: 'Negative wallet balance - requires commission settlement',
            });
            alert('Wallet Frozen ❄️ - Driver has been notified');
        } catch (error: any) {
            alert(error.message || 'Failed to freeze wallet');
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Wallet Watch</h1>
                            <p className="text-slate-400">Low balance drivers</p>
                        </div>
                    </div>
                </div>
                {lowBalanceWallets.length > 0 && (
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                        {lowBalanceWallets.length}
                    </span>
                )}
            </div>

            {/* Summary Banner */}
            <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
                <CardContent className="p-4 flex items-center gap-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    <div>
                        <p className="font-semibold text-yellow-400">Low Balance Drivers</p>
                        <p className="text-sm text-slate-400">
                            Drivers with balance below TZS -2,000 cannot accept cash trips
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Wallets List */}
            {lowBalanceWallets.length > 0 ? (
                <div className="space-y-4">
                    {lowBalanceWallets.map((wallet: any) => (
                        <Card key={wallet._id} className="bg-slate-800 border-slate-700">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{wallet.driver_name || 'Driver'}</h3>
                                            <div className="flex items-center gap-1 text-sm text-slate-400">
                                                <Phone className="w-3 h-3" />
                                                <span>{wallet.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${wallet.balance < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                                            TZS {wallet.balance.toLocaleString()}
                                        </p>
                                        <Button
                                            onClick={() => handleFreeze(wallet._id, wallet.driver_name || 'Driver')}
                                            size="sm"
                                            className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <Snowflake className="w-4 h-4 mr-1" />
                                            Freeze
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-12 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">All Clear! 🎉</h3>
                        <p className="text-slate-400">No drivers with critically low balances</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
