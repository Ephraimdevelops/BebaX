'use client';

import { useState } from 'react';
import { MapPin, Clock, DollarSign, Truck, User, Check, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobDetails {
    id: string;
    pickup: { address: string; lat?: number; lng?: number };
    dropoff: { address: string; lat?: number; lng?: number };
    distance: number;
    fare: number;
    vehicleType: string;
    customerName?: string;
    customerPhone?: string;
    cargoType?: string;
    expiresIn?: number; // seconds
}

interface DriverJobCardProps {
    job: JobDetails;
    onAccept: (jobId: string) => void;
    onReject: (jobId: string) => void;
}

export function DriverJobCard({ job, onAccept, onReject }: DriverJobCardProps) {
    const [timeLeft, setTimeLeft] = useState(job.expiresIn || 30);
    const [isAccepting, setIsAccepting] = useState(false);

    // Countdown timer
    useState(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onReject(job.id);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    });

    const handleAccept = async () => {
        setIsAccepting(true);
        await onAccept(job.id);
    };

    const progress = (timeLeft / (job.expiresIn || 30)) * 100;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center">
            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl lg:rounded-2xl overflow-hidden animate-slide-up">
                {/* Timer Bar */}
                <div className="h-1 bg-slate-200 dark:bg-slate-700">
                    <div
                        className="h-full bg-green-500 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Header */}
                <div className="p-4 bg-green-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold">New Trip Request!</p>
                            <p className="text-green-100 text-sm">{job.vehicleType} • {job.distance} km</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">{timeLeft}s</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Route */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-400">PICKUP</p>
                                <p className="text-sm text-slate-900 dark:text-white font-medium">{job.pickup.address}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-400">DROPOFF</p>
                                <p className="text-sm text-slate-900 dark:text-white font-medium">{job.dropoff.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-around p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <div className="text-center">
                            <MapPin className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{job.distance} km</p>
                            <p className="text-xs text-slate-400">Distance</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-600" />
                        <div className="text-center">
                            <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900 dark:text-white">TZS {job.fare.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">Fare</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-600" />
                        <div className="text-center">
                            <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900 dark:text-white">~{Math.round(job.distance * 3)} min</p>
                            <p className="text-xs text-slate-400">Est. Time</p>
                        </div>
                    </div>

                    {/* Cargo */}
                    {job.cargoType && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                <strong>Cargo:</strong> {job.cargoType}
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 flex gap-3 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        onClick={() => onReject(job.id)}
                        variant="outline"
                        className="flex-1 h-14 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                    >
                        <X className="w-5 h-5 mr-2" />
                        Decline
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        {isAccepting ? 'Accepting...' : 'Accept'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default DriverJobCard;
