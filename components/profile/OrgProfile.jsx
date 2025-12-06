'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Wallet, Users, FileText, CheckCircle, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrgProfile({ profile, org }) {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Business Hero */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-black/5 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Briefcase className="w-40 h-40 text-[#FF5722]" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-[#FF5722]">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[#121212] flex items-center gap-2">
                                    {org?.name || "My Company"}
                                    <CheckCircle className="w-5 h-5 text-green-500 fill-green-100" />
                                </h2>
                                <p className="text-gray-500 text-sm">Business Account</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-full border-gray-200 hover:border-[#FF5722] hover:text-[#FF5722]"
                            onClick={() => window.location.href = '/?mode=personal'}
                        >
                            Switch to Personal
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#FF5722] text-white rounded-2xl p-5 shadow-lg shadow-orange-500/20">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <Wallet className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Wallet Balance</span>
                            </div>
                            <p className="text-3xl font-bold">TSh {org?.walletBalance?.toLocaleString() || "0"}</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-gray-500">
                                <FileText className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Monthly Spend</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">TSh 0</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-gray-500">
                                <Users className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Active Employees</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{org?.members?.length || 1}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Tabs */}
            <Tabs defaultValue="team" className="w-full">
                <TabsList className="w-full h-12 bg-gray-100/50 p-1 rounded-xl mb-6">
                    <TabsTrigger value="team" className="flex-1 rounded-lg font-bold">Team</TabsTrigger>
                    <TabsTrigger value="invoices" className="flex-1 rounded-lg font-bold">Invoices</TabsTrigger>
                    <TabsTrigger value="settings" className="flex-1 rounded-lg font-bold">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="team" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Team Members</h3>
                        <Button size="sm" className="bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-full px-4">
                            <Plus className="w-4 h-4 mr-1" /> Invite
                        </Button>
                    </div>

                    {/* Team List Placeholder */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-0">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                                            {i === 1 ? "JD" : "AS"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{i === 1 ? "John Doe" : "Alice Smith"}</p>
                                            <p className="text-xs text-gray-500">Employee</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invoices">
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No invoices yet</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
