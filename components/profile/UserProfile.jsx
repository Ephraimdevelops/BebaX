'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Shield, Clock, Settings, Star, Home, Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserProfile({ profile, user }) {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Passenger ID Card */}
            <Card className="border-0 shadow-xl shadow-orange-500/5 bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <User className="w-32 h-32 text-[#FF5722]" />
                </div>
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                                <AvatarImage src={user?.imageUrl} />
                                <AvatarFallback className="bg-orange-100 text-[#FF5722] text-2xl font-bold">
                                    {profile?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                5.0
                            </div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-[#121212] mb-1">{profile?.name}</h2>
                            <p className="text-gray-500 font-medium mb-3">{profile?.phone}</p>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 border border-orange-100">
                                <span className="w-2 h-2 bg-[#FF5722] rounded-full mr-2 animate-pulse"></span>
                                <span className="text-xs font-bold text-[#FF5722] uppercase tracking-wide">Passenger ID</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Shortcuts */}
            <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-[#FF5722]/30 hover:shadow-md transition-all text-left group">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                        <Home className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="font-bold text-gray-900">Home</p>
                    <p className="text-xs text-gray-500 truncate">Set location</p>
                </button>

                <button className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-[#FF5722]/30 hover:shadow-md transition-all text-left group">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="font-bold text-gray-900">Work</p>
                    <p className="text-xs text-gray-500 truncate">Set location</p>
                </button>
            </div>

            {/* Preferences */}
            <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Shield className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Ride Insurance</p>
                                <p className="text-xs text-gray-500">Always add protection</p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>

            {/* Past Rides Preview */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-gray-900">Recent Activity</h3>
                    <button className="text-xs font-bold text-[#FF5722] hover:text-[#E64A19]">View All</button>
                </div>

                {/* Empty State for now, or map through rides if available */}
                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">No recent rides</p>
                    <Button variant="link" className="text-[#FF5722] font-bold text-sm mt-1">
                        Book your first ride
                    </Button>
                </div>
            </div>
        </div>
    );
}
