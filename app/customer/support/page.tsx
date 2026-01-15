'use client';

import { ArrowLeft, MessageSquare, Phone, Mail, FileQuestion, ChevronRight, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const faqItems = [
    {
        question: 'How do I book a move?',
        answer: 'Tap the "Book a Move" button, enter your pickup and delivery locations, select a vehicle type, and confirm your booking.'
    },
    {
        question: 'What payment methods are accepted?',
        answer: 'We accept Cash on delivery and Mobile Money (M-Pesa, Tigo Pesa, Airtel Money).'
    },
    {
        question: 'How do I track my delivery?',
        answer: 'Once a driver accepts your request, you can track them in real-time on the map. You\'ll also receive status updates via notifications.'
    },
    {
        question: 'What if my driver cancels?',
        answer: 'If your driver cancels, we\'ll automatically search for another available driver in your area.'
    },
    {
        question: 'How do I cancel a ride?',
        answer: 'You can cancel from the ride tracking screen before the driver starts the delivery. Cancellation fees may apply after pickup.'
    },
];

export default function SupportPage() {
    return (
        <div className="p-6 lg:p-8 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/customer" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
            </div>

            {/* Contact Options */}
            <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">
                    Contact Us
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <MessageSquare className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="font-semibold text-gray-900">Live Chat</p>
                            <p className="text-xs text-gray-500">Available 24/7</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Phone className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="font-semibold text-gray-900">Call Us</p>
                            <p className="text-xs text-gray-500">+255 700 000 000</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Mail className="w-6 h-6 text-purple-600" />
                            </div>
                            <p className="font-semibold text-gray-900">Email</p>
                            <p className="text-xs text-gray-500">support@bebax.tz</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">
                    Frequently Asked Questions
                </h2>
                <Card className="border border-gray-100 overflow-hidden">
                    <CardContent className="p-0">
                        {faqItems.map((item, index) => (
                            <details
                                key={index}
                                className="border-b border-gray-100 last:border-0 group"
                            >
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                                    <div className="flex items-center gap-3">
                                        <FileQuestion className="w-5 h-5 text-gray-400" />
                                        <span className="font-medium text-gray-900">{item.question}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
                                </summary>
                                <div className="px-4 pb-4 pt-0 pl-12 text-gray-600 text-sm leading-relaxed">
                                    {item.answer}
                                </div>
                            </details>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Additional Resources */}
            <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">
                    Resources
                </h2>
                <Card className="border border-gray-100 overflow-hidden">
                    <CardContent className="p-0">
                        <a href="#" className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <span className="text-gray-900">Terms of Service</span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                        <a href="#" className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <span className="text-gray-900">Privacy Policy</span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                        <a href="#" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <span className="text-gray-900">Safety Guidelines</span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
