'use client';

import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    showHomeLink?: boolean;
    showBackLink?: boolean;
}

export function ErrorState({
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    onRetry,
    showHomeLink = true,
    showBackLink = false,
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">{message}</p>
            <div className="flex gap-3">
                {onRetry && (
                    <Button onClick={onRetry} className="bg-slate-900 hover:bg-slate-800 text-white">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                )}
                {showBackLink && (
                    <Button variant="outline" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                )}
                {showHomeLink && (
                    <Link href="/">
                        <Button variant="outline">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}

// Empty State Component
interface EmptyStateProps {
    icon?: React.ReactNode;
    title?: string;
    message?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({
    icon,
    title = 'No data found',
    message = 'There is nothing to display here yet.',
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
            {icon && (
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-4">{message}</p>
            {action && (
                <Button onClick={action.onClick} className="bg-orange-500 hover:bg-orange-600 text-white">
                    {action.label}
                </Button>
            )}
        </div>
    );
}

// Not Found State
export function NotFoundState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <p className="text-8xl font-black text-slate-200 dark:text-slate-700 mb-4">404</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link href="/">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>
            </Link>
        </div>
    );
}

// Offline State
export function OfflineState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You&apos;re Offline</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                Please check your internet connection and try again.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-slate-900 hover:bg-slate-800 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
            </Button>
        </div>
    );
}
