'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Package, Truck, Boxes, FileText,
    Menu, X, Building2, Settings, Users
} from 'lucide-react';
import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';

const navItems = [
    { href: '/business', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/business/dispatch', label: 'Dispatch', icon: Truck },
    { href: '/business/orders', label: 'Orders', icon: Package },
    { href: '/business/inventory', label: 'Inventory', icon: Boxes },
    { href: '/business/menu', label: 'Menu/Catalog', icon: FileText },
    { href: '/business/settings', label: 'Settings', icon: Settings },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded, user } = useUser();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const myData = useQuery(api.users.getMyself) as any;

    // Redirect unauthenticated users
    if (isLoaded && !isSignedIn) {
        redirect('/(auth)/sign-in');
    }

    // Note: In production, would check for 'business' role
    // For now allowing access for demo

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-800 border-b border-slate-700 z-50 flex items-center justify-between px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                    <Menu className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-white">BebaX Business</span>
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
                    fixed top-0 left-0 h-full w-72 bg-slate-800 border-r border-slate-700 z-50
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-xl text-white">BebaX</span>
                                <span className="text-xs text-blue-400 block">BUSINESS</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-700"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
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
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'}
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Business Profile */}
                    <div className="p-4 border-t border-slate-700">
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-white truncate">
                                    {user?.fullName || 'Business'}
                                </p>
                                <p className="text-xs text-blue-400">
                                    Business Account
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen bg-slate-900">
                {children}
            </main>
        </div>
    );
}
