'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, Bell, Moon, Globe, LogOut, Trash2, ChevronRight, Check, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DriverSettingsPage() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const router = useRouter();

    
    const driver = useQuery(api.drivers.getCurrentDriver);

    // Settings state
    const [pushNotifications, setPushNotifications] = useState(true);
    const [soundAlerts, setSoundAlerts] = useState(true);
    const [autoAccept, setAutoAccept] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);
    const [language, setLanguage] = useState('English');

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await signOut();
            router.push('/');
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('This will permanently delete your account and all data. This action cannot be undone. Are you sure?')) {
            try {
                await user?.delete();
                router.push('/');
            } catch (err: any) {
                alert(err.message || 'Could not delete account. Contact support.');
            }
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/driver" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>

            {/* Profile Section */}
            <div className="mb-6">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                    Profile
                </h2>
                <Card className="bg-[#1E293B] border border-slate-700 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-4 p-4 border-b border-slate-700">
                            <div className="w-14 h-14 rounded-full bg-slate-700 overflow-hidden">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-7 h-7 text-slate-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold">{user?.fullName || 'Driver'}</p>
                                <p className="text-slate-500 text-sm">{driver?.vehicle_type || 'No vehicle'}</p>
                            </div>
                            <Link href="/driver/documents" className="text-[#FF5722] text-sm font-medium">
                                Edit
                            </Link>
                        </div>
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-slate-500" />
                                <span className="text-white">Phone</span>
                            </div>
                            <span className="text-slate-500 text-sm">
                                {user?.primaryPhoneNumber?.phoneNumber || 'Not set'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-slate-500" />
                                <span className="text-white">Email</span>
                            </div>
                            <span className="text-slate-500 text-sm truncate max-w-40">
                                {user?.primaryEmailAddress?.emailAddress || 'Not set'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notifications Section */}
            <div className="mb-6">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                    Notifications
                </h2>
                <Card className="bg-[#1E293B] border border-slate-700 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-slate-500" />
                                <span className="text-white">Push Notifications</span>
                            </div>
                            <Switch
                                checked={pushNotifications}
                                onCheckedChange={setPushNotifications}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔔</span>
                                <span className="text-white">Sound Alerts for Jobs</span>
                            </div>
                            <Switch
                                checked={soundAlerts}
                                onCheckedChange={setSoundAlerts}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Driving Preferences */}
            <div className="mb-6">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                    Driving Preferences
                </h2>
                <Card className="bg-[#1E293B] border border-slate-700 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <Truck className="w-5 h-5 text-slate-500" />
                                <div>
                                    <span className="text-white block">Auto-Accept Jobs</span>
                                    <span className="text-slate-500 text-xs">Automatically accept matching jobs</span>
                                </div>
                            </div>
                            <Switch
                                checked={autoAccept}
                                onCheckedChange={setAutoAccept}
                            />
                        </div>
                        <button
                            onClick={() => setShowLangModal(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-slate-500" />
                                <span className="text-white">Language</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-sm">{language}</span>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </div>
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Account Actions */}
            <div className="mb-8">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                    Account Actions
                </h2>
                <Card className="bg-[#1E293B] border border-slate-700 overflow-hidden">
                    <CardContent className="p-0">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                        >
                            <LogOut className="w-5 h-5 text-[#FF5722]" />
                            <span className="text-[#FF5722] font-medium">Sign Out</span>
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full flex items-center gap-3 p-4 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 className="w-5 h-5 text-red-500" />
                            <span className="text-red-500 font-medium">Delete Account</span>
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Version */}
            <p className="text-center text-slate-600 text-xs">
                BebaX Driver v2.0.1 (Build 124)
            </p>

            {/* Language Modal */}
            {showLangModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowLangModal(false)}>
                    <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-sm border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white text-center mb-4">Select Language</h3>
                        {['English', 'Swahili', 'French'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => { setLanguage(lang); setShowLangModal(false); }}
                                className="w-full flex items-center justify-between p-4 border-b border-slate-700 hover:bg-slate-700/50"
                            >
                                <span className={language === lang ? 'text-[#FF5722] font-bold' : 'text-white'}>
                                    {lang}
                                </span>
                                {language === lang && <Check className="w-5 h-5 text-[#FF5722]" />}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowLangModal(false)}
                            className="w-full mt-4 text-slate-400 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
