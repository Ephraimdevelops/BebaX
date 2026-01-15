'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const documentTypes = [
    { id: 'license', label: 'Driving License', description: 'Valid Tanzanian driving license', required: true },
    { id: 'nida', label: 'NIDA / National ID', description: 'National identification card', required: true },
    { id: 'vehicle_registration', label: 'Vehicle Registration', description: 'Vehicle ownership certificate', required: true },
    { id: 'insurance', label: 'Insurance Certificate', description: 'Vehicle insurance document', required: false },
    { id: 'profile_photo', label: 'Profile Photo', description: 'Clear photo of your face', required: true },
];

export default function DocumentsPage() {
    
    const driver = useQuery(api.drivers.getCurrentDriver);

    // Mock document status - in real app this would come from driver data
    const documentStatus: Record<string, 'pending' | 'approved' | 'rejected' | null> = {
        license: driver?.license_number ? 'approved' : null,
        nida: driver?.nida_number && driver.nida_number !== 'pending' ? 'approved' : null,
        vehicle_registration: driver?.vehicle_plate && driver.vehicle_plate !== 'pending' ? 'pending' : null,
        insurance: null,
        profile_photo: 'approved',
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'approved': return 'text-green-500 bg-green-500/10';
            case 'pending': return 'text-yellow-500 bg-yellow-500/10';
            case 'rejected': return 'text-red-500 bg-red-500/10';
            default: return 'text-slate-500 bg-slate-700';
        }
    };

    const getStatusIcon = (status: string | null) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Upload className="w-5 h-5 text-slate-500" />;
        }
    };

    const approvedCount = Object.values(documentStatus).filter(s => s === 'approved').length;
    const totalRequired = documentTypes.filter(d => d.required).length;

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/driver" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Documents</h1>
                    <p className="text-slate-500 text-sm">Manage your verification documents</p>
                </div>
            </div>

            {/* Verification Status Card */}
            <Card className={`mb-8 border-0 ${driver?.verified ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${driver?.verified ? 'bg-green-500/20' : 'bg-yellow-500/20'
                            }`}>
                            {driver?.verified
                                ? <CheckCircle className="w-7 h-7 text-green-500" />
                                : <AlertCircle className="w-7 h-7 text-yellow-500" />
                            }
                        </div>
                        <div>
                            <h2 className={`text-lg font-bold ${driver?.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                                {driver?.verified ? 'Verified Driver' : 'Verification Pending'}
                            </h2>
                            <p className="text-slate-400 text-sm">
                                {approvedCount} of {totalRequired} required documents approved
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Document List */}
            <div className="space-y-4">
                {documentTypes.map((doc) => {
                    const status = documentStatus[doc.id];
                    return (
                        <Card key={doc.id} className="bg-[#1E293B] border border-slate-700">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(status)}`}>
                                        {getStatusIcon(status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-medium">{doc.label}</p>
                                            {doc.required && (
                                                <span className="text-[10px] text-red-400 font-bold uppercase">Required</span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm">{doc.description}</p>
                                    </div>
                                    <div>
                                        {status === 'approved' ? (
                                            <span className="text-green-500 text-xs font-bold uppercase">Approved</span>
                                        ) : status === 'pending' ? (
                                            <span className="text-yellow-500 text-xs font-bold uppercase">Pending</span>
                                        ) : status === 'rejected' ? (
                                            <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                                                Resubmit
                                            </Button>
                                        ) : (
                                            <Button size="sm" className="bg-[#FF5722] hover:bg-[#E64A19] text-white">
                                                Upload
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Help Text */}
            <p className="text-slate-600 text-sm text-center mt-8">
                Documents are reviewed within 24-48 hours. Contact support if you need help.
            </p>
        </div>
    );
}
