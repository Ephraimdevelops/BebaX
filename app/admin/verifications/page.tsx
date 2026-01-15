'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    FileCheck, User, Clock, CheckCircle, XCircle, ArrowLeft,
    FileText, Eye, Camera, Car
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerificationsPage() {
    const pendingDrivers = useQuery(api.admin.getPendingDriversEnriched) as any;

    // Group by document status
    const documentStats = {
        pending: pendingDrivers?.length || 0,
        approved: 0, // Would need separate API
        rejected: 0,
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">KYC Verifications</h1>
                    <p className="text-slate-400">Verify driver documents and identities</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-orange-400">{documentStats.pending}</p>
                            <p className="text-sm text-slate-400">Pending Review</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-400">—</p>
                            <p className="text-sm text-slate-400">Approved</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-red-400">—</p>
                            <p className="text-sm text-slate-400">Rejected</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Document Types */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Document Requirements</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { name: 'NIDA Card', icon: User, required: true },
                        { name: 'Driving License', icon: FileText, required: true },
                        { name: 'Profile Photo', icon: Camera, required: true },
                        { name: 'Vehicle Registration', icon: Car, required: false },
                    ].map((doc) => (
                        <Card key={doc.name} className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4 text-center">
                                <doc.icon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-white font-medium">{doc.name}</p>
                                <span className={`text-xs ${doc.required ? 'text-red-400' : 'text-slate-500'}`}>
                                    {doc.required ? 'Required' : 'Optional'}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Pending Documents */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                        <span>Pending Document Reviews</span>
                        <Link href="/admin/approvals" className="text-sm text-red-400 font-normal hover:underline">
                            Go to Approvals →
                        </Link>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingDrivers && pendingDrivers.length > 0 ? (
                        <div className="space-y-4">
                            {pendingDrivers.map((driver: any) => (
                                <div key={driver._id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center">
                                            <User className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{driver.user_name}</p>
                                            <p className="text-sm text-slate-500">
                                                Applied {new Date(driver.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1">
                                            {driver.nida_photo && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full" title="NIDA" />
                                            )}
                                            {driver.license_photo && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full" title="License" />
                                            )}
                                            {!driver.nida_photo && (
                                                <span className="w-2 h-2 bg-red-500 rounded-full" title="Missing NIDA" />
                                            )}
                                        </div>
                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                                            Pending
                                        </span>
                                        <Link
                                            href="/admin/approvals"
                                            className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
                                        >
                                            <Eye className="w-4 h-4 text-white" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">All Documents Reviewed</h3>
                            <p className="text-slate-400">No pending document verifications.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
