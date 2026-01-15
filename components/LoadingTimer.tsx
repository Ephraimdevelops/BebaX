'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface LoadingTimerProps {
    duration?: number; // seconds
    message?: string;
    submessage?: string;
    onTimeout?: () => void;
}

export function LoadingTimer({
    duration = 120,
    message = 'Finding your driver',
    submessage = 'This usually takes less than 2 minutes',
    onTimeout
}: LoadingTimerProps) {
    const [elapsed, setElapsed] = useState(0);
    const [dots, setDots] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed(prev => {
                if (prev >= duration) {
                    clearInterval(timer);
                    onTimeout?.();
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);

        const dotsTimer = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        return () => {
            clearInterval(timer);
            clearInterval(dotsTimer);
        };
    }, [duration, onTimeout]);

    const progress = (elapsed / duration) * 100;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return (
        <div className="flex flex-col items-center justify-center p-8">
            {/* Animated Radar */}
            <div className="relative w-32 h-32 mb-6">
                {/* Outer rings */}
                {[1, 2, 3].map((ring) => (
                    <div
                        key={ring}
                        className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-ping"
                        style={{
                            animationDelay: `${ring * 0.5}s`,
                            animationDuration: '2s',
                        }}
                    />
                ))}

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Search className="w-8 h-8 text-white animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Message */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {message}{dots}
            </h3>
            <p className="text-sm text-slate-500 mb-6">{submessage}</p>

            {/* Timer */}
            <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-mono">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mt-4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export default LoadingTimer;
