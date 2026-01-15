'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, Plus, CreditCard, Banknote, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function WalletPage() {
    const { user } = useUser();
    
    const myData = useQuery(api.users.getMyself);

    // Mock wallet balance - in real app this would come from Convex
    const walletBalance = 0;

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/customer" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            </div>

            {/* Balance Card */}
            <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 text-white mb-8 overflow-hidden">
                <CardContent className="p-6">
                    <p className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-2">
                        Available Balance
                    </p>
                    <p className="text-5xl font-black mb-6">
                        TZS {walletBalance.toLocaleString()}
                    </p>
                    <div className="h-px bg-slate-700 mb-6" />
                    <Button className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white h-14 rounded-xl font-bold">
                        <Plus className="w-5 h-5 mr-2" />
                        TOP UP FUNDS
                    </Button>
                </CardContent>
            </Card>

            {/* Payment Methods */}
            <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">
                    Payment Methods
                </h2>

                <div className="space-y-3">
                    {/* Cash */}
                    <Card className="border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                    <Banknote className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Cash</p>
                                    <p className="text-sm text-gray-500">Pay on delivery</p>
                                </div>
                                <CheckCircle className="w-6 h-6 text-[#FF5722]" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* M-Pesa */}
                    <Card className="border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">M-Pesa / Mobile Money</p>
                                    <p className="text-sm text-gray-500">Pay with mobile wallet</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Recent Transactions */}
            <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">
                    Recent Transactions
                </h2>

                <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500 italic">No recent transactions</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
