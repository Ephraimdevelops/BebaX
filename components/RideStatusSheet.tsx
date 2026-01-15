'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageCircle, X, Share2, CheckCircle, MapPin, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type RideStatus = 'SEARCHING' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS';

export interface DriverInfo {
    name: string;
    photo?: string;
    rating: number;
    trips: number;
    phone: string;
    vehicleModel: string;
    vehicleColor: string;
    plateNumber: string;
    eta: number;
    pin: string;
}

interface RideStatusSheetProps {
    status: RideStatus;
    driver?: DriverInfo;
    freeWaitingSeconds?: number;
    onCancel?: () => void;
    onCall?: () => void;
    onChat?: () => void;
    onShareRide?: () => void;
    onImComing?: () => void;
}

const SEARCHING_TEXTS = [
    'Finding your ride...',
    'Scanning nearby drivers...',
    'Matching you with the best driver...',
    'Almost there...',
];

const MOCK_DRIVER: DriverInfo = {
    name: 'Juma',
    rating: 4.9,
    trips: 1247,
    phone: '+255712345678',
    vehicleModel: 'Honda Ace',
    vehicleColor: 'Red',
    plateNumber: 'MC 555-XYZ',
    eta: 4,
    pin: '8890',
};

export function RideStatusSheet({
    status,
    driver = MOCK_DRIVER,
    freeWaitingSeconds = 300,
    onCancel,
    onCall,
    onChat,
    onShareRide,
    onImComing,
}: RideStatusSheetProps) {
    const [searchTextIndex, setSearchTextIndex] = useState(0);
    const [waitingTime, setWaitingTime] = useState(freeWaitingSeconds);
    const [hasNotifiedDriver, setHasNotifiedDriver] = useState(false);

    // Rotate search texts
    useEffect(() => {
        if (status !== 'SEARCHING') return;
        const interval = setInterval(() => {
            setSearchTextIndex((prev) => (prev + 1) % SEARCHING_TEXTS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [status]);

    // Countdown timer for ARRIVED state
    useEffect(() => {
        if (status !== 'ARRIVED') {
            setWaitingTime(freeWaitingSeconds);
            return;
        }
        const interval = setInterval(() => {
            setWaitingTime((prev) => (prev <= 0 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [status, freeWaitingSeconds]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleImComing = () => {
        setHasNotifiedDriver(true);
        onImComing?.();
    };

    // SEARCHING STATE
    if (status === 'SEARCHING') {
        return (
            <div className="bg-white rounded-t-3xl p-8 shadow-2xl">
                {/* Radar Animation */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="absolute w-48 h-48 rounded-full border-2 border-orange-400 animate-ping opacity-20" />
                        <div className="absolute w-36 h-36 rounded-full border-2 border-orange-400 animate-ping opacity-30 animation-delay-300" />
                        <div className="absolute w-24 h-24 rounded-full border-2 border-orange-400 animate-ping opacity-40 animation-delay-600" />
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <MapPin className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                    <p className="text-xl font-bold text-slate-900 mt-4 animate-pulse">
                        {SEARCHING_TEXTS[searchTextIndex]}
                    </p>
                    <p className="text-slate-500 text-sm mt-2">This usually takes less than a minute</p>
                </div>
                <Button onClick={onCancel} variant="outline" className="w-full h-12 rounded-full border-slate-300 text-slate-600">
                    Cancel
                </Button>
            </div>
        );
    }

    // ARRIVED STATE
    if (status === 'ARRIVED') {
        const isOvertime = waitingTime <= 0;
        return (
            <div className="bg-white rounded-t-3xl p-6 shadow-2xl">
                {/* Arrived Header */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-2 bg-green-100 px-5 py-3 rounded-full animate-pulse">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="font-bold text-green-700">DRIVER ARRIVED</span>
                    </div>
                </div>

                {/* Timer */}
                <div className={`text-center p-5 rounded-2xl mb-6 ${isOvertime ? 'bg-red-50 border-2 border-red-200' : 'bg-slate-50 border-2 border-slate-200'}`}>
                    <p className="text-sm font-semibold text-slate-500 mb-2">
                        {isOvertime ? '⚠️ OVERTIME - Charges Apply' : 'Free Waiting Time'}
                    </p>
                    <p className={`text-5xl font-black font-mono ${isOvertime ? 'text-red-600' : 'text-slate-900'}`}>
                        {formatTime(waitingTime)}
                    </p>
                    {!isOvertime && (
                        <div className="w-full h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${(waitingTime / freeWaitingSeconds) * 100}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Driver Mini Card */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{driver.name}</p>
                            <p className="text-sm text-slate-500">{driver.vehicleModel} • {driver.vehicleColor}</p>
                        </div>
                    </div>
                    <div className="bg-yellow-400 px-3 py-2 rounded-lg">
                        <p className="font-black text-slate-900 text-sm">{driver.plateNumber}</p>
                    </div>
                </div>

                {/* I'm Coming Button */}
                <Button
                    onClick={handleImComing}
                    disabled={hasNotifiedDriver}
                    className={`w-full h-14 rounded-2xl font-bold text-lg mb-4 ${hasNotifiedDriver ? 'bg-slate-500' : 'bg-green-500 hover:bg-green-600'
                        }`}
                >
                    {hasNotifiedDriver ? (
                        <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Driver Notified ✓
                        </>
                    ) : (
                        <>🏃 I&apos;M COMING</>
                    )}
                </Button>

                {/* Secondary Actions */}
                <div className="flex justify-center gap-4">
                    <Button onClick={onCall} variant="outline" className="flex items-center gap-2 px-5 rounded-full">
                        <Phone className="w-4 h-4 text-green-600" />
                        Call Driver
                    </Button>
                    <Button onClick={onChat} variant="outline" className="flex items-center gap-2 px-5 rounded-full">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        Message
                    </Button>
                </div>
            </div>
        );
    }

    // ACCEPTED / IN_PROGRESS STATE
    return (
        <div className="bg-white rounded-t-3xl p-6 shadow-2xl">
            {/* Top Row: ETA & Plate */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900">{driver.eta}</span>
                    <span className="text-xl font-bold text-slate-500">min</span>
                </div>
                <div className="bg-yellow-400 px-4 py-2 rounded-lg">
                    <p className="font-black text-slate-900">{driver.plateNumber}</p>
                </div>
            </div>

            {/* Driver Row */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-xl font-bold text-slate-900">{driver.name}</p>
                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold">{driver.rating}</span>
                        </div>
                    </div>
                    <p className="text-slate-500">{driver.vehicleModel} • {driver.vehicleColor}</p>
                    <p className="text-sm text-slate-400">{driver.trips.toLocaleString()} trips</p>
                </div>
            </div>

            {/* PIN */}
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-semibold text-slate-600">Trip PIN</span>
                </div>
                <div className="flex justify-center gap-2 mb-2">
                    {driver.pin.split('').map((digit, i) => (
                        <div key={i} className="w-12 h-12 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center">
                            <span className="text-2xl font-black text-slate-900">{digit}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500">Share this with your driver</p>
            </div>

            {/* Actions */}
            <div className="flex justify-around mb-4">
                <button onClick={onCall} className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-600">Call</span>
                </button>
                <button onClick={onChat} className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-600">Chat</span>
                </button>
                <button onClick={onCancel} className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-600">Cancel</span>
                </button>
            </div>

            {/* Share */}
            <Button onClick={onShareRide} variant="ghost" className="w-full text-slate-500">
                <Share2 className="w-4 h-4 mr-2" />
                Share Ride Details
            </Button>
        </div>
    );
}
