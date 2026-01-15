'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        // Initial check
        setIsOffline(!navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await fetch('/api/health', { method: 'HEAD' });
            setIsOffline(false);
        } catch {
            // Still offline
        } finally {
            setIsRetrying(false);
        }
    };

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-3 animate-slide-down">
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">No internet connection</span>
            <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
            >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                Retry
            </button>
        </div>
    );
}

export default OfflineBanner;
