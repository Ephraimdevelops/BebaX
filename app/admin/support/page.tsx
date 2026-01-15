'use client';

import {
    HelpCircle, MessageSquare, Phone, Mail, ArrowLeft,
    Clock, CheckCircle, AlertCircle, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

// Mock support tickets
const mockTickets = [
    { id: '1', user: 'John Doe', issue: 'Payment not received', status: 'open', priority: 'high', time: '2 hours ago' },
    { id: '2', user: 'Jane Smith', issue: 'Driver was rude', status: 'in_progress', priority: 'medium', time: '5 hours ago' },
    { id: '3', user: 'Mike Johnson', issue: 'Wrong fare charged', status: 'resolved', priority: 'low', time: '1 day ago' },
];

export default function SupportPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

    const filteredTickets = mockTickets.filter((ticket) => {
        const matchesSearch = ticket.user.toLowerCase().includes(search.toLowerCase()) ||
            ticket.issue.toLowerCase().includes(search.toLowerCase());
        if (filter === 'all') return matchesSearch;
        return matchesSearch && ticket.status === filter;
    });

    const stats = {
        open: mockTickets.filter(t => t.status === 'open').length,
        inProgress: mockTickets.filter(t => t.status === 'in_progress').length,
        resolved: mockTickets.filter(t => t.status === 'resolved').length,
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <HelpCircle className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Support Center</h1>
                        <p className="text-slate-400">Manage customer support tickets</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-400">{stats.open}</p>
                            <p className="text-sm text-slate-400">Open</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
                            <p className="text-sm text-slate-400">In Progress</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
                            <p className="text-sm text-slate-400">Resolved</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                        placeholder="Search tickets..."
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'open', 'in_progress', 'resolved'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets List */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    {filteredTickets.length > 0 ? (
                        <div className="divide-y divide-slate-700">
                            {filteredTickets.map((ticket) => (
                                <div key={ticket.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-white font-medium">{ticket.issue}</h3>
                                            <p className="text-sm text-slate-400">From: {ticket.user}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    ticket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-slate-600 text-slate-400'
                                                }`}>
                                                {ticket.priority.toUpperCase()}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${ticket.status === 'open' ? 'bg-red-500/20 text-red-400' :
                                                    ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                }`}>
                                                {ticket.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">{ticket.time}</span>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                                                <MessageSquare className="w-3 h-3 mr-1" />
                                                Reply
                                            </Button>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Resolve
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">No tickets found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contact Methods */}
            <div className="mt-8">
                <h2 className="text-lg font-bold text-white mb-4">Quick Contact</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <Phone className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Support Hotline</p>
                                <p className="text-slate-400">+255 123 456 789</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <Mail className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Email Support</p>
                                <p className="text-slate-400">support@bebax.co.tz</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
