'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Truck, DollarSign, Clock, Settings, User, FileText,
    HelpCircle, Home, Menu, X, MapPin
} from 'lucide-react';
import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';

const navItems = [
    { href: '/driver', label: 'Cockpit', icon: Home },
    { href: '/driver/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/driver/history', label: 'Trip History', icon: Clock },
    { href: '/driver/documents', label: 'Documents', icon: FileText },
    { href: '/driver/settings', label: 'Settings', icon: Settings },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded, user } = useUser();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    
    const myData = useQuery(api.users.getMyself);
    
    const driver = useQuery(api.drivers.getCurrentDriver);

    // Redirect unauthenticated users
    if (isLoaded && !isSignedIn) {
        redirect('/(auth)/sign-in');
    }

    // Redirect non-drivers to their dashboards
    if (myData?.profile?.role === 'customer') {
        redirect('/customer');
    }
    if (myData?.profile?.role === 'admin') {
        redirect('/admin');
    }

    return (
        <div className="min-h-screen bg-[#0F172A]">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1E293B] border-b border-slate-700 z-50 flex items-center justify-between px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                    <Menu className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#FF5722] rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-white">BebaX Driver</span>
                </div>
                <UserButton afterSignOutUrl="/" />
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-72 bg-[#1E293B] border-r border-slate-700 z-50
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FF5722] rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-xl text-white">Driver</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-700"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Driver Status Badge */}
                    <div className="p-4 border-b border-slate-700">
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${driver?.is_online ? 'bg-green-500/10' : 'bg-slate-700/50'
                            }`}>
                            <div className={`w-3 h-3 rounded-full ${driver?.is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
                                }`} />
                            <span className={`font-medium ${driver?.is_online ? 'text-green-400' : 'text-slate-400'
                                }`}>
                                {driver?.is_online ? 'ONLINE' : 'OFFLINE'}
                            </span>
                            {driver?.verified && (
                                <div className="ml-auto bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded-full">
                                    VERIFIED
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                        ${isActive
                                            ? 'bg-[#FF5722] text-white shadow-lg shadow-orange-500/20'
                                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-slate-700">
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-white truncate">
                                    {user?.fullName || 'Driver'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    ⭐ {driver?.rating?.toFixed(1) || '5.0'} • {driver?.total_trips || 0} trips
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
                {children}
            </main>
        </div>
    );
}
