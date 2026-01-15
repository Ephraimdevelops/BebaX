'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Banknote, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

export default function EarningsPage() {

    const earnings = useQuery(api.drivers.getEarnings);

    const history = useQuery(api.rides.listDriverHistory);

    const payCommission = useMutation(api.drivers.payCommission);

    const [paying, setPaying] = useState(false);

    const data = earnings || {
        today: 0,
        week: 0,
        previous_week: 0,
        month: 0,
        cash_collected: 0,
        wallet_balance: 0,
        commission_debt: 0,
    };

    const isDebt = data.wallet_balance < 0;
    const debtAmount = Math.abs(data.wallet_balance);
    const previousWeek = data.previous_week ?? 0;
    const trend = data.week > previousWeek ? 'up' : 'down';
    const trendPercent = previousWeek > 0
        ? Math.round(((data.week - previousWeek) / previousWeek) * 100)
        : 100;

    const handlePayDebt = async () => {
        if (!isDebt) return;
        setPaying(true);
        try {
            await payCommission({ amount: debtAmount });
            alert("Success! Commission paid successfully.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setPaying(false);
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/driver" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Earnings</h1>
            </div>

            {/* Hero Card */}
            <Card className="bg-[#1E293B] border-0 mb-6">
                <CardContent className="p-6">
                    <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-2">
                        TOTAL EARNINGS (WEEK)
                    </p>
                    <p className="text-4xl font-black text-white mb-4">
                        TZS {data.week.toLocaleString()}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                            {trend === 'up'
                                ? <TrendingUp className="w-4 h-4 text-white" />
                                : <TrendingDown className="w-4 h-4 text-white" />
                            }
                            <span className="text-white text-sm font-bold">
                                {Math.abs(trendPercent)}% vs last week
                            </span>
                        </div>
                        <span className="text-slate-400 text-sm">
                            Today: TZS {data.today.toLocaleString()}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-[#1E293B] border border-slate-700">
                    <CardContent className="p-4">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-3">
                            <Banknote className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p className="text-slate-500 text-xs mb-1">Cash in Hand</p>
                        <p className="text-white text-lg font-bold">
                            TZS {data.cash_collected.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border ${isDebt ? 'bg-red-500/10 border-red-500/30' : 'bg-[#1E293B] border-slate-700'}`}>
                    <CardContent className="p-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isDebt ? 'bg-red-500/20' : 'bg-green-500/10'
                            }`}>
                            <Wallet className={`w-5 h-5 ${isDebt ? 'text-red-500' : 'text-green-500'}`} />
                        </div>
                        <p className="text-slate-500 text-xs mb-1">Wallet Balance</p>
                        <p className={`text-lg font-bold ${isDebt ? 'text-red-500' : 'text-green-500'}`}>
                            TZS {data.wallet_balance.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Commission Debt Card */}
            {isDebt && (
                <Card className="bg-red-500/10 border border-red-500/30 mb-8">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-red-400 font-bold mb-1">Commission Due</p>
                                <p className="text-slate-400 text-sm">Pay expected commission to unlock features.</p>
                            </div>
                            <p className="text-red-400 text-lg font-black">
                                TZS {debtAmount.toLocaleString()}
                            </p>
                        </div>
                        <Button
                            onClick={handlePayDebt}
                            disabled={paying}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold"
                        >
                            {paying ? 'Processing...' : 'Lipa Deni Now'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Recent Trips */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold">Recent Trips</h2>
                    <Link href="/driver/history" className="text-[#FF5722] text-sm font-medium">
                        See All
                    </Link>
                </div>

                {history && history.length > 0 ? (
                    <div className="space-y-3">
                        {history.slice(0, 5).map((trip: any) => (
                            <Card key={trip._id} className="bg-[#1E293B] border border-slate-700">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-slate-500 text-xs">
                                                {formatTime(trip._creationTime)}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">
                                                    {trip.vehicle_type}
                                                </span>
                                                <span className="text-green-500 text-xs font-bold">
                                                    {trip.status?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-white font-bold">
                                            TZS {(trip.fare_estimate || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#FF5722]" />
                                            <p className="text-slate-400 text-sm truncate">
                                                {trip.pickup_address || 'Pickup'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <p className="text-slate-400 text-sm truncate">
                                                {trip.dropoff_address || 'Dropoff'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-[#1E293B] border border-dashed border-slate-700">
                        <CardContent className="p-8 text-center">
                            <p className="text-slate-500">No trips yet. Go online to start earning!</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
