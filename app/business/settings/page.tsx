'use client';

import { Settings, ArrowLeft, Building2, Bell, Shield, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

export default function BusinessSettingsPage() {
    return (
        <div className="p-6 lg:p-8 min-h-screen">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/business" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>

            <div className="space-y-6 max-w-2xl">
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader><CardTitle className="text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5" />Business Profile
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div><p className="text-white">Business Name</p><p className="text-sm text-slate-400">Your company name</p></div>
                            <Button variant="outline" className="border-slate-600 text-slate-300">Edit</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader><CardTitle className="text-white flex items-center gap-2">
                        <Bell className="w-5 h-5" />Notifications
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div><p className="text-white">Order Updates</p><p className="text-sm text-slate-400">Get notified on order status</p></div>
                            <Switch checked={true} onCheckedChange={() => { }} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div><p className="text-white">Driver Alerts</p><p className="text-sm text-slate-400">Delivery notifications</p></div>
                            <Switch checked={true} onCheckedChange={() => { }} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader><CardTitle className="text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />Billing
                    </CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <div><p className="text-white">Payment Methods</p><p className="text-sm text-slate-400">Manage payment options</p></div>
                            <Button variant="outline" className="border-slate-600 text-slate-300">Manage</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
