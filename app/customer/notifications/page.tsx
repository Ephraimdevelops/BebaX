'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Bell, ArrowLeft, Check, Trash2, Package, Truck, AlertCircle,
    Star, DollarSign, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock notifications
const mockNotifications = [
    { id: '1', type: 'ride', title: 'Ride Completed', message: 'Your ride to Kinondoni was completed', time: '2 hours ago', read: false },
    { id: '2', type: 'promo', title: '20% Off!', message: 'Use code BEBA20 on your next ride', time: '1 day ago', read: false },
    { id: '3', type: 'driver', title: 'Driver Arriving', message: 'Your driver is 2 minutes away', time: '2 days ago', read: true },
    { id: '4', type: 'payment', title: 'Payment Received', message: 'TZS 15,000 added to wallet', time: '3 days ago', read: true },
    { id: '5', type: 'system', title: 'App Update', message: 'New features available!', time: '1 week ago', read: true },
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' ? true : !n.read
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ride': return <Package className="w-5 h-5 text-purple-500" />;
            case 'promo': return <Star className="w-5 h-5 text-yellow-500" />;
            case 'driver': return <Truck className="w-5 h-5 text-green-500" />;
            case 'payment': return <DollarSign className="w-5 h-5 text-green-500" />;
            case 'system': return <Settings className="w-5 h-5 text-blue-500" />;
            default: return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/customer" className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-purple-600">{unreadCount} unread</p>
                        )}
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={markAllRead} variant="ghost" size="sm" className="text-purple-600">
                        <Check className="w-4 h-4 mr-1" />
                        Mark all read
                    </Button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${filter === 'all'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${filter === 'unread'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`bg-white dark:bg-slate-800 border-0 shadow ${!notification.read ? 'ring-2 ring-purple-500/20' : ''
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notification.read
                                            ? 'bg-purple-100 dark:bg-purple-900/30'
                                            : 'bg-slate-100 dark:bg-slate-700'
                                        }`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0" onClick={() => markAsRead(notification.id)}>
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className={`font-semibold ${!notification.read
                                                    ? 'text-slate-900 dark:text-white'
                                                    : 'text-slate-600 dark:text-slate-400'
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-purple-600 rounded-full" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mb-1">{notification.message}</p>
                                        <p className="text-xs text-slate-400">{notification.time}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No notifications</h3>
                        <p className="text-sm text-slate-500">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
