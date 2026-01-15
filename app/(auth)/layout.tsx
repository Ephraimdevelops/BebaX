'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn, isLoaded } = useUser();

    // Redirect authenticated users away from auth pages
    if (isLoaded && isSignedIn) {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Top-left blob */}
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
                {/* Bottom-right blob */}
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
                {/* Center accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
