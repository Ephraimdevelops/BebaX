'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Star, Wallet, Calendar, ChevronRight, AlertCircle, FileText, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export default function DriverProfile({ profile, driver, user }) {
    const [showEarnings, setShowEarnings] = useState(true);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Driver Identity Card */}
            <div className="bg-gradient-to-br from-[#121212] to-[#2d2d2d] rounded-3xl p-6 text-white shadow-xl shadow-black/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Truck className="w-48 h-48 text-white" />
                </div>

                <div className="relative z-10 flex items-center gap-6 mb-8">
                    <div className="relative">
                        <Avatar className="w-20 h-20 border-2 border-[#FF5722]">
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback className="bg-gray-800 text-white font-bold">
                                {profile?.name?.charAt(0) || "D"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-[#FF5722] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {profile?.rating || "5.0"}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-1">{profile?.name}</h2>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online & Ready
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5 relative group">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Earnings Today</p>
                            <button
                                onClick={() => setShowEarnings(!showEarnings)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                {showEarnings ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                        </div>
                        <p className="text-2xl font-bold text-[#FF5722]">
                            {showEarnings ? "TSh 0" : "••••••"}
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                        <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Trips Today</p>
                        <p className="text-2xl font-bold text-white">0</p>
                    </div>
                </div>
            </div>

            {/* Vehicle Card */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Truck className="w-5 h-5 text-gray-400" />
                        Vehicle Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <h3 className="font-bold text-gray-900">{driver?.vehicleType || "Vehicle"}</h3>
                            <p className="text-sm text-gray-500 font-mono">{driver?.plateNumber || "NO PLATE"}</p>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Truck className="w-6 h-6 text-[#FF5722]" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Status */}
            <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            Documents
                        </CardTitle>
                        {/* Logic to show red dot if documents expiring/missing */}
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        className="w-full justify-between h-14 rounded-xl border-gray-200 hover:border-[#FF5722] hover:bg-orange-50 hover:text-[#FF5722] group"
                    >
                        <span className="font-bold text-gray-700 group-hover:text-[#FF5722]">Update Documents</span>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF5722]" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
