'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    MapPin, Wallet, Clock, Settings, User, MessageSquare,
    HelpCircle, Home, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';

const navItems = [
    { href: '/customer', label: 'Home', icon: Home },
    { href: '/customer/rides', label: 'My Rides', icon: Clock },
    { href: '/customer/wallet', label: 'Wallet', icon: Wallet },
    { href: '/customer/settings', label: 'Settings', icon: Settings },
    { href: '/customer/support', label: 'Support', icon: HelpCircle },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded, user } = useUser();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const myData = useQuery(api.users.getMyself) as any;

    // Redirect unauthenticated users
    if (isLoaded && !isSignedIn) {
        redirect('/(auth)/sign-in');
    }

    // Redirect drivers/admins to their dashboards
    if (myData?.profile?.role === 'driver') {
        redirect('/driver');
    }
    if (myData?.profile?.role === 'admin') {
        redirect('/admin');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#FF5722] rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">BebaX</span>
                </div>
                <UserButton afterSignOutUrl="/" />
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FF5722] rounded-xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-xl">BebaX</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
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
                                            : 'text-gray-600 hover:bg-gray-100'}
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                    {user?.fullName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.primaryEmailAddress?.emailAddress}
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
