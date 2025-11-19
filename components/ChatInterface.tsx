'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
    rideId: any; // Id<"rides">
    onClose: () => void;
}

const QUICK_REPLIES = [
    "I'm here",
    "Running 5 min late",
    "On my way",
    "Where are you?",
    "Thank you!",
];

export default function ChatInterface({ rideId, onClose }: ChatInterfaceProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messages = useQuery(api.messages.getByRide, { ride_id: rideId });
    const sendMessage = useMutation(api.messages.send);
    const markAsRead = useMutation(api.messages.markAsRead);

    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when chat is opened
    useEffect(() => {
        if (messages && messages.length > 0) {
            const unreadMessages = messages.filter(
                (m) => !m.read && m.sender_clerk_id !== user?.id
            );

            unreadMessages.forEach((msg) => {
                markAsRead({ ride_id: rideId });
            });
        }
    }, [messages, user?.id]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        setIsSending(true);
        try {
            await sendMessage({
                ride_id: rideId,
                message: text.trim(),
            });
            setMessageText('');
        } catch (error: any) {
            toast({
                title: 'Failed to send',
                description: error.message || 'Please try again',
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleQuickReply = (reply: string) => {
        handleSend(reply);
    };

    if (!messages) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8">
                    <Loader2 className="w-8 h-8 text-bebax-green animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center animate-fade-in">
            <div className="bg-white w-full md:w-[500px] md:rounded-2xl rounded-t-3xl shadow-bebax-xl flex flex-col max-h-[90vh] md:max-h-[600px] animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-bebax-green-light rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-bebax-green" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-bebax-black">Chat</h3>
                            <p className="text-xs text-gray-500">Real-time messaging</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600">No messages yet</p>
                            <p className="text-sm text-gray-500">Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_clerk_id === user?.id;
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe
                                            ? 'bg-bebax-green text-white'
                                            : 'bg-gray-100 text-bebax-black'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.message}</p>
                                        <p
                                            className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'
                                                }`}
                                        >
                                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-4 py-2 border-t border-gray-100">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {QUICK_REPLIES.map((reply) => (
                            <button
                                key={reply}
                                onClick={() => handleQuickReply(reply)}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-colors"
                                disabled={isSending}
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(messageText);
                                }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 input-bebax"
                            disabled={isSending}
                        />
                        <button
                            onClick={() => handleSend(messageText)}
                            disabled={isSending || !messageText.trim()}
                            className="w-12 h-12 bg-bebax-green hover:bg-bebax-green/90 disabled:bg-gray-300 rounded-xl flex items-center justify-center transition-colors"
                        >
                            {isSending ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
