'use client';

import { SignIn, SignUp, UserButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, MapPin, Clock, User, Briefcase, CheckCircle, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import CustomerDashboard from "@/components/CustomerDashboard.jsx";
import DriverDashboard from "@/components/DriverDashboard.jsx";
import { useToast } from "@/hooks/use-toast";
import DriverRegistration from "@/components/DriverRegistration";
import AdminDashboard from "@/components/AdminDashboard";

export default function Home() {
    const { isSignedIn, user } = useUser();
    const { toast } = useToast();
    const currentProfile = useQuery(api.users.getCurrentProfile);
    const createProfile = useMutation(api.users.createOrUpdateProfile);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
    });

    const { isAuthenticated, isLoading } = useConvexAuth();

    useEffect(() => {
        console.log("Convex Auth State:", { isAuthenticated, isLoading, user: user?.id });
    }, [isAuthenticated, isLoading, user]);

    // Handle profile creation
    const handleRoleSelection = async (role) => {
        setSelectedRole(role);
        setShowForm(true);
    };

    const handleSubmitProfile = async () => {
        if (!formData.name || !formData.phone) {
            toast({
                title: "Missing Information",
                description: "Please enter your name and phone number",
                variant: "destructive",
            });
            return;
        }

        if (!isAuthenticated) {
            toast({
                title: "Authentication Pending",
                description: "Please wait a moment while we verify your account...",
                variant: "default",
            });
            return;
        }

        setIsCreating(true);

        try {
            await createProfile({
                role: selectedRole,
                phone: formData.phone,
                name: formData.name,
                email: user?.primaryEmailAddress?.emailAddress,
            });

            toast({
                title: "Welcome to BebaX! 🎉",
                description: `Your ${selectedRole} account is ready`,
            });
        } catch (error) {
            console.error("Error creating profile:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create profile. Please try again.",
                variant: "destructive",
            });
            // Don't reset form on error so user can try again
            setIsCreating(false);
        }
    };

    // Not signed in - Show auth
    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-bebax-green-light via-white to-bebax-green-light flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8 animate-fade-in">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-bebax-green rounded-3xl mb-4 shadow-bebax-xl">
                            <Truck className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-5xl font-bold text-bebax-black mb-2">BebaX</h1>
                        <p className="text-lg text-gray-600">Move anything, anywhere in Tanzania</p>
                    </div>

                    {/* Auth Card */}
                    <Card className="border-0 shadow-bebax-xl animate-slide-up">
                        <CardContent className="p-6">
                            <Tabs defaultValue="signin" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                                    <TabsTrigger value="signin" className="text-base font-semibold">Sign In</TabsTrigger>
                                    <TabsTrigger value="signup" className="text-base font-semibold">Sign Up</TabsTrigger>
                                </TabsList>
                                <TabsContent value="signin" className="mt-0">
                                    <SignIn
                                        routing="hash"
                                        appearance={{
                                            elements: {
                                                rootBox: "w-full",
                                                card: "shadow-none",
                                                formButtonPrimary: "bg-bebax-green hover:bg-bebax-green-dark",
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
                                                card: "shadow-none",
                                                formButtonPrimary: "bg-bebax-green hover:bg-bebax-green-dark",
                                            }
                                        }}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Features */}
                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-bebax-md flex items-center justify-center mx-auto mb-2">
                                <CheckCircle className="w-7 h-7 text-bebax-green" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Verified Drivers</p>
                        </div>
                        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-bebax-md flex items-center justify-center mx-auto mb-2">
                                <MapPin className="w-7 h-7 text-bebax-green" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Live Tracking</p>
                        </div>
                        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-bebax-md flex items-center justify-center mx-auto mb-2">
                                <Clock className="w-7 h-7 text-bebax-green" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Fast Service</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // User signed in but no profile - Role selection
    if (!currentProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-bebax-green-light via-white to-white flex items-center justify-center p-4">
                <Card className="w-full max-w-lg border-0 shadow-bebax-xl animate-slide-up">
                    <CardHeader className="text-center pb-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-bebax-green rounded-3xl mx-auto mb-4">
                            <Truck className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold mb-2">Welcome to BebaX!</CardTitle>
                        <CardDescription className="text-base text-gray-600">
                            Hi {user?.firstName}! 👋 Choose how you'd like to use BebaX
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-6">
                        {!showForm ? (
                            <>
                                {/* Customer Option */}
                                <button
                                    onClick={() => handleRoleSelection("customer")}
                                    disabled={isCreating}
                                    className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${selectedRole === "customer"
                                        ? 'border-bebax-green bg-bebax-green-light scale-[0.98]'
                                        : 'border-gray-200 hover:border-bebax-green hover:bg-bebax-green-light hover:scale-[1.02]'
                                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-bebax-sm hover:shadow-bebax-md`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${selectedRole === "customer"
                                            ? 'bg-bebax-green'
                                            : 'bg-bebax-green-light group-hover:bg-bebax-green'
                                            }`}>
                                            <User className={`w-7 h-7 transition-colors ${selectedRole === "customer"
                                                ? 'text-white'
                                                : 'text-bebax-green group-hover:text-white'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-bebax-black mb-1">I need delivery</h3>
                                            <p className="text-sm text-gray-600">Book a ride to move your goods</p>
                                        </div>
                                    </div>
                                </button>

                                {/* Driver Option */}
                                <button
                                    onClick={() => handleRoleSelection("driver")}
                                    disabled={isCreating}
                                    className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${selectedRole === "driver"
                                        ? 'border-bebax-green bg-bebax-green-light scale-[0.98]'
                                        : 'border-gray-200 hover:border-bebax-green hover:bg-bebax-green-light hover:scale-[1.02]'
                                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-bebax-sm hover:shadow-bebax-md`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${selectedRole === "driver"
                                            ? 'bg-bebax-green'
                                            : 'bg-bebax-green-light group-hover:bg-bebax-green'
                                            }`}>
                                            <Truck className={`w-7 h-7 transition-colors ${selectedRole === "driver"
                                                ? 'text-white'
                                                : 'text-bebax-green group-hover:text-white'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-bebax-black mb-1">I want to drive</h3>
                                            <p className="text-sm text-gray-600">Earn money delivering goods</p>
                                        </div>
                                    </div>
                                </button>

                                {/* Admin Option */}
                                <button
                                    onClick={() => handleRoleSelection("admin")}
                                    disabled={isCreating}
                                    className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${selectedRole === "admin"
                                        ? 'border-bebax-green bg-bebax-green-light scale-[0.98]'
                                        : 'border-gray-200 hover:border-bebax-green hover:bg-bebax-green-light hover:scale-[1.02]'
                                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-bebax-sm hover:shadow-bebax-md`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${selectedRole === "admin"
                                            ? 'bg-bebax-green'
                                            : 'bg-bebax-green-light group-hover:bg-bebax-green'
                                            }`}>
                                            <Shield className={`w-7 h-7 transition-colors ${selectedRole === "admin"
                                                ? 'text-white'
                                                : 'text-bebax-green group-hover:text-white'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-bebax-black mb-1">Admin</h3>
                                            <p className="text-sm text-gray-600">Manage platform</p>
                                        </div>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter your full name"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-bebax-green focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+255712345678 or 0712345678"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-bebax-green focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex space-x-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowForm(false);
                                            setSelectedRole(null);
                                        }}
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmitProfile}
                                        disabled={isCreating}
                                        className="flex-1 btn-bebax-primary"
                                    >
                                        {isCreating ? "Creating..." : "Create Profile"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main app - Route to appropriate dashboard
    if (currentProfile.role === "customer") {
        return <CustomerDashboard />;
    }

    if (currentProfile.role === "driver") {
        // Check if driver has completed registration
        const driver = useQuery(api.drivers.getCurrentDriver);

        // Show registration form if driver profile doesn't exist
        if (driver === null || driver === undefined) {
            return <DriverRegistration />;
        }

        return <DriverDashboard />;
    }

    // Admin dashboard
    return <AdminDashboard />;
}
