'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Phone, User } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'driver';
    timestamp: Date;
}

interface ChatInterfaceProps {
    driverName?: string;
    driverPhone?: string;
    rideId?: string;
    onClose?: () => void;
}

export function ChatInterface({
    driverName = 'Driver',
    driverPhone,
    rideId,
    onClose
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Hello! I am on my way to pick you up.', sender: 'driver', timestamp: new Date(Date.now() - 60000) },
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: input.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
        setInput('');

        // Mock driver response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: getAutoResponse(input),
                sender: 'driver',
                timestamp: new Date(),
            }]);
        }, 1500);
    };

    const getAutoResponse = (msg: string): string => {
        const lower = msg.toLowerCase();
        if (lower.includes('where') || lower.includes('location')) {
            return 'I am about 5 minutes away. You can track me on the map!';
        }
        if (lower.includes('wait') || lower.includes('coming')) {
            return 'No problem, take your time. I will wait for you.';
        }
        if (lower.includes('thank')) {
            return 'You are welcome! See you soon.';
        }
        return 'Got it! I will be there shortly.';
    };

    const handleCall = () => {
        if (driverPhone) {
            window.open(`tel:${driverPhone}`);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">{driverName}</p>
                        <p className="text-xs text-green-500">Online • On the way</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {driverPhone && (
                        <button onClick={handleCall} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                            <Phone className="w-5 h-5 text-green-500" />
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.sender === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-md'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md'
                                }`}
                        >
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                                {formatTime(msg.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto">
                {['I am coming down', 'Where are you?', 'Please wait', 'Thank you'].map((text) => (
                    <button
                        key={text}
                        onClick={() => setInput(text)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        {text}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center disabled:opacity-50"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatInterface;
