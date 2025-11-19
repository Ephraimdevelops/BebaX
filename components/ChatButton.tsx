'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MessageCircle } from 'lucide-react';
import ChatInterface from './ChatInterface';

interface ChatButtonProps {
    rideId: any; // Id<"rides">
}

export default function ChatButton({ rideId }: ChatButtonProps) {
    const [showChat, setShowChat] = useState(false);
    const messages = useQuery(api.messages.getByRide, { ride_id: rideId });

    // Count unread messages
    const unreadCount = messages?.filter((m) => !m.read).length || 0;

    return (
        <>
            <button
                onClick={() => setShowChat(true)}
                className="relative btn-bebax-primary flex items-center justify-center space-x-2"
            >
                <MessageCircle className="w-5 h-5" />
                <span>Chat</span>
                {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {showChat && (
                <ChatInterface rideId={rideId} onClose={() => setShowChat(false)} />
            )}
        </>
    );
}
