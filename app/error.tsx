'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-bebax-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-bebax-black mb-2">
                        Something went wrong!
                    </h2>

                    <p className="text-gray-600 mb-6">
                        {error.message || "An unexpected error occurred"}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={reset}
                            className="w-full btn-bebax-primary"
                        >
                            Try again
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full btn-bebax-secondary"
                        >
                            Go home
                        </button>
                    </div>

                    {error.digest && (
                        <p className="text-xs text-gray-400 mt-4">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
