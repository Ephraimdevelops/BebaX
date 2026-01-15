'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    CheckCircle, XCircle, User, FileText, Clock, Phone,
    Car, MapPin, Eye, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

export default function ApprovalsPage() {
    const pendingDrivers = useQuery(api.admin.getPendingDriversEnriched) as any;
    const verifyDriver = useMutation(api.admin.verifyDriver);
    const rejectDriver = useMutation(api.admin.rejectDriver);

    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<any>(null);

    const handleApprove = async (driverId: Id<"drivers">) => {
        setProcessing(driverId);
        try {
            await verifyDriver({ driver_id: driverId });
            setSelectedDriver(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (driverId: Id<"drivers">) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        setProcessing(driverId);
        try {
            await rejectDriver({ driverId: driverId, reason });
            setSelectedDriver(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Driver Approvals</h1>
                    <p className="text-slate-400">Review and approve pending driver applications</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-orange-400">{pendingDrivers?.length || 0}</p>
                        <p className="text-sm text-slate-400">Pending</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-green-400">—</p>
                        <p className="text-sm text-slate-400">Approved Today</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-red-400">—</p>
                        <p className="text-sm text-slate-400">Rejected Today</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending List */}
            {pendingDrivers && pendingDrivers.length > 0 ? (
                <div className="space-y-4">
                    {pendingDrivers.map((driver: any) => (
                        <Card key={driver._id} className="bg-slate-800 border-slate-700">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center">
                                            <User className="w-7 h-7 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{driver.user_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Phone className="w-4 h-4" />
                                                <span>{driver.user_phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                <Clock className="w-4 h-4" />
                                                <span>Applied {new Date(driver.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                                        PENDING
                                    </span>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-slate-700/30 rounded-xl">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">NIDA Number</p>
                                        <p className="text-white font-medium">{driver.nida_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">License</p>
                                        <p className="text-white font-medium">{driver.license_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Vehicle Type</p>
                                        <p className="text-white font-medium capitalize">{driver.vehicle_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Plate</p>
                                        <p className="text-white font-medium">{driver.vehicle_plate}</p>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {driver.nida_photo && (
                                        <a
                                            href={driver.nida_photo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-300">NIDA Photo</span>
                                            <Eye className="w-4 h-4 text-slate-500" />
                                        </a>
                                    )}
                                    {driver.license_photo && (
                                        <a
                                            href={driver.license_photo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-300">License Photo</span>
                                            <Eye className="w-4 h-4 text-slate-500" />
                                        </a>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleApprove(driver._id)}
                                        disabled={processing === driver._id}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        {processing === driver._id ? 'Processing...' : 'Approve'}
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(driver._id)}
                                        disabled={processing === driver._id}
                                        variant="outline"
                                        className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
                                    >
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-12 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                        <p className="text-slate-400">No pending driver approvals at the moment.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
