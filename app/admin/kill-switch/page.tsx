'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Power, ArrowLeft, AlertTriangle, CheckCircle, Rocket, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function KillSwitchPage() {
    const [isLoading, setIsLoading] = useState(false);

    const serviceStatus = useQuery(api.admin.getServiceStatus) as any;
    const toggleService = useMutation(api.admin.toggleService);

    const isActive = serviceStatus?.isActive ?? true;

    const handleToggle = async () => {
        const confirmed = window.confirm(
            isActive
                ? '⚠️ DISABLE SERVICE?\n\nThis will prevent ALL new bookings. Active rides will continue. This is for emergencies only.'
                : '✅ ENABLE SERVICE?\n\nThis will re-enable the booking system for all users.'
        );

        if (!confirmed) return;

        setIsLoading(true);
        try {
            await toggleService({ active: !isActive });
            alert(isActive ? '🔴 Service Disabled' : '✅ Service Enabled');
        } catch (error: any) {
            alert(error.message || 'Failed to toggle service');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Kill Switch</h1>
                    <p className="text-slate-400">Emergency service control</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto">
                {/* Status Card */}
                <Card className={`w-full mb-8 border-2 ${isActive ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <CardContent className="p-8 text-center">
                        {isActive ? (
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        ) : (
                            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        )}
                        <h2 className={`text-2xl font-black mb-2 ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                            {isActive ? 'SERVICE ACTIVE' : 'SERVICE DISABLED'}
                        </h2>
                        <p className="text-slate-400">
                            {isActive
                                ? 'All systems operational. Bookings are being processed normally.'
                                : 'Emergency mode active. No new bookings are being accepted.'}
                        </p>
                    </CardContent>
                </Card>

                {/* Warning */}
                <div className="w-full p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-8">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div className="text-sm text-yellow-400">
                            <p className="font-semibold mb-1">The Kill Switch is for emergencies only!</p>
                            <ul className="list-disc list-inside space-y-1 text-yellow-400/80">
                                <li>System outages</li>
                                <li>Major incidents</li>
                                <li>Natural disasters</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* THE BIG BUTTON */}
                <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className={`
                        w-48 h-48 rounded-full flex flex-col items-center justify-center
                        font-bold text-white transition-all transform hover:scale-105
                        shadow-2xl
                        ${isActive
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                            : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}
                    `}
                >
                    {isLoading ? (
                        <Loader2 className="w-12 h-12 animate-spin" />
                    ) : isActive ? (
                        <>
                            <Power className="w-12 h-12 mb-2" />
                            <span className="text-sm">DISABLE</span>
                            <span className="text-sm">SERVICE</span>
                        </>
                    ) : (
                        <>
                            <Rocket className="w-12 h-12 mb-2" />
                            <span className="text-sm">ENABLE</span>
                            <span className="text-sm">SERVICE</span>
                        </>
                    )}
                </button>

                <p className="text-xs text-slate-500 mt-8 text-center">
                    Super Admin access required. All actions are logged.
                </p>
            </div>
        </div>
    );
}
