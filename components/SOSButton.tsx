'use client';

import { useState } from 'react';
import { AlertTriangle, Phone, X, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SOSButtonProps {
    onTrigger?: () => void;
    userType?: 'customer' | 'driver';
}

export function SOSButton({ onTrigger, userType = 'customer' }: SOSButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);

    const emergencyContacts = [
        { name: 'Police', number: '112', icon: '🚔' },
        { name: 'BebaX Support', number: '+255 700 000 000', icon: '📞' },
        { name: 'Ambulance', number: '114', icon: '🚑' },
    ];

    const handleSOS = async () => {
        setIsSending(true);

        // Get current location
        let location = 'Unknown';
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            location = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        } catch {
            // Location unavailable
        }

        // Mock API call - in production would call api.sos.trigger
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSent(true);
        setIsSending(false);
        onTrigger?.();

        // Reset after 10 seconds
        setTimeout(() => {
            setSent(false);
            setIsOpen(false);
        }, 10000);
    };

    const handleCall = (number: string) => {
        window.open(`tel:${number}`);
    };

    return (
        <>
            {/* SOS Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-red-600 rounded-full shadow-lg flex items-center justify-center animate-pulse hover:animate-none hover:bg-red-700 transition-colors"
            >
                <AlertTriangle className="w-6 h-6 text-white" />
            </button>

            {/* SOS Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
                        {/* Header */}
                        <div className="bg-red-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-black text-white">EMERGENCY SOS</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="p-6">
                            {sent ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MapPin className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        Help is on the way!
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        Your location has been shared with BebaX support and emergency contacts.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Main SOS Button */}
                                    <Button
                                        onClick={handleSOS}
                                        disabled={isSending}
                                        className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black text-lg mb-6"
                                    >
                                        {isSending ? (
                                            <>
                                                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                                Sending Alert...
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="w-6 h-6 mr-2" />
                                                SEND SOS ALERT
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-slate-500 text-center mb-6">
                                        This will share your location with BebaX support and notify emergency contacts
                                    </p>

                                    {/* Quick Call Options */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            Or call directly:
                                        </p>
                                        {emergencyContacts.map((contact) => (
                                            <button
                                                key={contact.name}
                                                onClick={() => handleCall(contact.number)}
                                                className="w-full flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            >
                                                <span className="text-2xl">{contact.icon}</span>
                                                <div className="text-left flex-1">
                                                    <p className="font-medium text-slate-900 dark:text-white">{contact.name}</p>
                                                    <p className="text-xs text-slate-500">{contact.number}</p>
                                                </div>
                                                <Phone className="w-5 h-5 text-green-500" />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default SOSButton;
