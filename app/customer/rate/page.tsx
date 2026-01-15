'use client';

import { useState, Suspense } from 'react';
import { Star, ArrowLeft, Send, Loader2, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const QUICK_TAGS = [
    'Friendly driver',
    'Clean vehicle',
    'On time',
    'Safe driving',
    'Good communication',
    'Careful with cargo',
];

function RateRideContent() {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tip, setTip] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const tipOptions = [0, 1000, 2000, 5000];

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        // In production, would call api.rides.rateRide
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmitted(true);
        setIsSubmitting(false);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <ThumbsUp className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h2>
                <p className="text-slate-500 text-center mb-8">Your feedback helps improve our service</p>
                <Link href="/customer">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        Back to Home
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/customer" className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow">
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rate Your Trip</h1>
            </div>

            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl max-w-md mx-auto">
                <CardContent className="p-6">
                    {/* Stars */}
                    <div className="text-center mb-8">
                        <p className="text-slate-500 mb-4">How was your experience?</p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-10 h-10 ${star <= (hoverRating || rating)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-slate-300 dark:text-slate-600'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                            </p>
                        )}
                    </div>

                    {/* Quick Tags */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                            What went well?
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTags.includes(tag)
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Additional Comments (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us more about your experience..."
                            rows={3}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white resize-none"
                        />
                    </div>

                    {/* Tip */}
                    <div className="mb-8">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                            Add a tip for your driver
                        </p>
                        <div className="flex gap-2">
                            {tipOptions.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => setTip(amount)}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tip === amount
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    {amount === 0 ? 'No tip' : `TZS ${amount.toLocaleString()}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                        className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Submit Rating
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RateRidePage() {
    return <RateRideContent />;
}
