'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Bell, Moon, MapPin, Globe, LogOut, Trash2, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const router = useRouter();

    // Settings state
    const [pushNotifications, setPushNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [locationSharing, setLocationSharing] = useState(true);
    const [language, setLanguage] = useState('English');
    const [showLangModal, setShowLangModal] = useState(false);

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await signOut();
            router.push('/');
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('This will permanently delete your account and data. This action cannot be undone. Are you sure?')) {
            try {
                await user?.delete();
                router.push('/');
            } catch (err: any) {
                alert(err.message || 'Could not delete account. Contact support.');
            }
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/customer" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>

            {/* Account Section */}
            <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Account
                </h2>
                <Card className="border border-gray-100 overflow-hidden">
                    <CardContent className="p-0">
                        <Link href="/customer/profile" className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">Edit Profile</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Link>
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">Phone Number</span>
                            </div>
                            <span className="text-gray-500 text-sm">
                                {user?.primaryPhoneNumber?.phoneNumber || 'Not set'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">Email</span>
                            </div>
                            <span className="text-gray-500 text-sm truncate max-w-40">
                                {user?.primaryEmailAddress?.emailAddress || 'Not set'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notifications Section */}
            <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Notifications
                </h2>
                <Card className="border border-gray-100 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">Push Notifications</span>
                            </div>
                            <Switch
                                checked={pushNotifications}
                                onCheckedChange={setPushNotifications}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preferences Section */}
            <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Preferences
                </h2>
                <Card className="border border-gray-100 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <Moon className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">Dark Mode</span>
                            </div>
                            <Switch
                                checked={darkMode}
                                onCheckedChange={setDarkMode}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">Share Location</span>
                            </div>
                            <Switch
                                checked={locationSharing}
                                onCheckedChange={setLocationSharing}
                            />
                        </div>
                        <button
                            onClick={() => setShowLangModal(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">Language</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">{language}</span>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Support Section */}
            <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Support
                </h2>
                <Card className="border border-gray-100 overflow-hidden">
                    <CardContent className="p-0">
                        <Link href="/customer/support" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">❓</span>
                                <span className="text-gray-900">Help Center</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Account Actions */}
            <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Account Actions
                </h2>
                <Card className="border border-gray-100 overflow-hidden">
                    <CardContent className="p-0">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5 text-[#FF5722]" />
                            <span className="text-[#FF5722] font-medium">Sign Out</span>
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-5 h-5 text-red-500" />
                            <span className="text-red-500 font-medium">Delete Account</span>
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Version */}
            <p className="text-center text-gray-400 text-xs">
                BebaX v2.0.1 (Build 124)
            </p>

            {/* Language Modal */}
            {showLangModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLangModal(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-center mb-4">Select Language</h3>
                        {['English', 'Swahili', 'French'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => { setLanguage(lang); setShowLangModal(false); }}
                                className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                            >
                                <span className={language === lang ? 'text-[#FF5722] font-bold' : 'text-gray-700'}>
                                    {lang}
                                </span>
                                {language === lang && <Check className="w-5 h-5 text-[#FF5722]" />}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowLangModal(false)}
                            className="w-full mt-4 text-gray-500 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
