'use client';

import { SignIn, SignUp, useUser } from "@clerk/nextjs";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, User, Loader2 } from "lucide-react";
import { useEffect } from "react";
import CustomerDashboard from "@/components/CustomerDashboard.jsx";
import DriverDashboard from "@/components/DriverDashboard.jsx";
import AdminDashboard from "@/components/AdminDashboard";
import OnboardingFlow from "@/components/OnboardingFlow";
import DriverRegistration from "@/components/DriverRegistration";

export default function Home() {
    const { isSignedIn, user } = useUser();
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();

    // Fetch full user context (Profile, Driver, Org) in one shot
    const myData = useQuery(api.users.getMyself);

    // Loading State - "Silky Smooth" Pulse
    if (isAuthLoading || (isSignedIn && myData === undefined)) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
                <div className="relative">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-[#FF5722] blur-3xl opacity-20 animate-pulse rounded-full"></div>

                    {/* Logo Container */}
                    <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl shadow-orange-500/10 flex items-center justify-center animate-bounce-slow">
                        <Truck className="w-12 h-12 text-[#FF5722]" />
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-3">
                    <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF5722] animate-progress w-full origin-left"></div>
                    </div>
                    <p className="text-sm font-medium text-gray-400 animate-pulse">Loading BebaX...</p>
                </div>
            </div>
        );
    }

    // Not Signed In - Show Auth Landing
    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Value Prop */}
                    <div className="space-y-8 animate-fade-in">
                        <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <div className="w-2 h-2 bg-[#FF5722] rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-gray-600">Live in Dar es Salaam</span>
                        </div>

                        <div>
                            <h1 className="text-6xl font-bold text-[#121212] leading-tight mb-6 tracking-tight">
                                Move anything, <br />
                                <span className="text-[#FF5722]">anywhere.</span>
                            </h1>
                            <p className="text-xl text-gray-500 leading-relaxed max-w-md">
                                From documents to furniture, BebaX connects you with reliable drivers in minutes.
                            </p>
                        </div>

                        <div className="flex items-center space-x-8">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-[#F8FAFC] bg-gray-200 flex items-center justify-center overflow-hidden">
                                        <User className="w-6 h-6 text-gray-400" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="font-bold text-[#121212]">2,000+ Drivers</p>
                                <p className="text-sm text-gray-500">Ready to move</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Auth Card */}
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#FF5722]/10 to-purple-500/10 rounded-[2rem] blur-2xl" />
                        <Card className="relative border-0 shadow-2xl shadow-black/5 bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                            <CardHeader className="text-center pb-2 pt-8">
                                <div className="w-16 h-16 bg-[#FF5722] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                                    <Truck className="w-8 h-8 text-white" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-[#121212]">Get Started</CardTitle>
                                <CardDescription className="text-gray-500">Sign in to book a ride or become a driver</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <Tabs defaultValue="signin" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-gray-100/50 p-1 rounded-2xl">
                                        <TabsTrigger
                                            value="signin"
                                            className="rounded-xl text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-[#121212] data-[state=active]:shadow-sm transition-all"
                                        >
                                            Sign In
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="signup"
                                            className="rounded-xl text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-[#121212] data-[state=active]:shadow-sm transition-all"
                                        >
                                            Sign Up
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="signin" className="mt-0">
                                        <SignIn
                                            routing="hash"
                                            appearance={{
                                                elements: {
                                                    rootBox: "w-full",
                                                    card: "shadow-none p-0",
                                                    header: "hidden",
                                                    formButtonPrimary: "bg-[#FF5722] hover:bg-[#E64A19] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all",
                                                    formFieldInput: "rounded-xl border-gray-200 focus:border-[#FF5722] focus:ring-[#FF5722]/20 py-3",
                                                    footerActionLink: "text-[#FF5722] hover:text-[#E64A19]",
                                                }
                                            }}
                                        />
                                    </TabsContent>
                                    <TabsContent value="signup" className="mt-0">
                                        <SignUp
                                            routing="hash"
                                            appearance={{
                                                elements: {
                                                    rootBox: "w-full",
                                                    card: "shadow-none p-0",
                                                    header: "hidden",
                                                    formButtonPrimary: "bg-[#FF5722] hover:bg-[#E64A19] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all",
                                                    formFieldInput: "rounded-xl border-gray-200 focus:border-[#FF5722] focus:ring-[#FF5722]/20 py-3",
                                                    footerActionLink: "text-[#FF5722] hover:text-[#E64A19]",
                                                }
                                            }}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        );
    }

    // Signed In but No Profile -> Onboarding Flow
    if (!myData?.profile) {
        return <OnboardingFlow />;
    }

    // Smart Routing based on Role
    const { profile, driver } = myData;

    // Check for "Switch to Personal" mode
    // We use window.location.search directly or a hook if available. 
    // Since this is a client component, we can use useSearchParams from next/navigation
    // But let's import it first.

    // For now, let's use a simple check if we can't easily add the hook import without rewriting imports.
    // Actually, let's just add the hook.

    if (profile.role === 'driver') {
        // Check if driver registration is complete
        if (!driver) {
            return <DriverRegistration />;
        }
        return <DriverDashboard />;
    }

    if (profile.role === 'admin') {
        // "Instant Switch" Logic
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('mode') === 'personal') {
                return <CustomerDashboard />;
            }
        }

        // Note: AdminDashboard might need to be updated to handle 'org_admin' logic if different
        // For now, assuming AdminDashboard is the correct view for business owners
        return <AdminDashboard />;
    }

    // Default to Customer Dashboard
    return <CustomerDashboard />;
}
