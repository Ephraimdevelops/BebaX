'use client';

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Briefcase, Truck, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingFlow() {
    const { user } = useUser();
    const { toast } = useToast();
    const createProfile = useMutation(api.users.createOrUpdateProfile);

    const [step, setStep] = useState('selection'); // 'selection' | 'form'
    const [selectedRole, setSelectedRole] = useState(null); // 'customer' | 'driver' | 'org_admin'
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.fullName || "",
        phone: "",
        // Business specific
        companyName: "",
        tin: "",
    });

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setStep('form');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Map internal role names
            // 'customer' -> 'customer'
            // 'driver' -> 'driver'
            // 'business' -> 'admin' (for now, or create a new role if backend supports it. Sticking to 'admin' for orgs based on existing logic)

            const roleToSubmit = selectedRole === 'business' ? 'admin' : selectedRole;

            await createProfile({
                role: roleToSubmit,
                name: selectedRole === 'business' ? formData.companyName : formData.name,
                phone: formData.phone,
                email: user?.primaryEmailAddress?.emailAddress,
                // Note: TIN and Company Name might need separate handling or schema update if not supported in createProfile yet.
                // For now, we'll assume basic profile creation and Org creation happens later or we pack it into name/metadata if needed.
                // Actually, for Business, we should probably create an Organization record too. 
                // But let's stick to the requested flow: Create Profile -> Redirect. 
                // The backend createOrUpdateProfile handles the user profile. 
            });

            toast({
                title: "Welcome to BebaX!",
                description: "Your account has been created successfully.",
            });

            // The parent component (Home) will detect the new profile and redirect
        } catch (error) {
            console.error("Onboarding error:", error);
            toast({
                title: "Error",
                description: "Failed to create account. Please try again.",
                variant: "destructive",
            });
            setIsSubmitting(false);
        }
    };

    if (step === 'selection') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-[#121212] mb-4">Welcome to BebaX</h1>
                        <p className="text-xl text-gray-500">Choose how you want to get started</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {/* Personal Account */}
                        <Card
                            className="group hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-[#FF5722] relative overflow-hidden h-full flex flex-col"
                            onClick={() => handleRoleSelect('customer')}
                        >
                            <CardContent className="p-8 text-center flex-1 flex flex-col">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#FF5722] transition-colors">
                                    <User className="w-10 h-10 text-blue-500 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-[#121212] mb-2">Personal</h3>
                                <p className="text-gray-500 mb-6 flex-1">Book rides and move goods instantly.</p>
                                <div className="flex items-center justify-center text-[#FF5722] font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Business Account */}
                        <Card
                            className="group hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-[#FF5722] relative overflow-hidden h-full flex flex-col"
                            onClick={() => handleRoleSelect('business')}
                        >
                            <CardContent className="p-8 text-center flex-1 flex flex-col">
                                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#FF5722] transition-colors">
                                    <Briefcase className="w-10 h-10 text-purple-500 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-[#121212] mb-2">Business</h3>
                                <p className="text-gray-500 mb-6 flex-1">Manage fleet, expenses, and team access.</p>
                                <div className="flex items-center justify-center text-[#FF5722] font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                                    Create Account <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Driver Account */}
                        <Card
                            className="group hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-[#FF5722] relative overflow-hidden h-full flex flex-col"
                            onClick={() => handleRoleSelect('driver')}
                        >
                            <CardContent className="p-8 text-center flex-1 flex flex-col">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#FF5722] transition-colors">
                                    <Truck className="w-10 h-10 text-green-500 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-[#121212] mb-2">Driver</h3>
                                <p className="text-gray-500 mb-6 flex-1">Earn money by moving goods.</p>
                                <div className="flex items-center justify-center text-[#FF5722] font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                                    Join Fleet <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        {selectedRole === 'customer' && 'Create Personal Account'}
                        {selectedRole === 'business' && 'Create Business Account'}
                        {selectedRole === 'driver' && 'Become a Driver'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        Complete your profile to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {selectedRole === 'business' ? (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 outline-none transition-all"
                                    placeholder="Enter company name"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 outline-none transition-all"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 outline-none transition-all"
                                placeholder="+255..."
                            />
                        </div>

                        {selectedRole === 'business' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">TIN (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.tin}
                                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 outline-none transition-all"
                                    placeholder="Tax Identification Number"
                                />
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12"
                                onClick={() => setStep('selection')}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <span className="animate-pulse">Creating...</span> : 'Create Account'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
