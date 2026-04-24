// pages/not-found.tsx
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface NotFoundProps {
    page?: string;
    message?: string;
    intendedUrl?: string | null;
}

export default function NotFound({ 
    page = 'This page', 
    message = 'could not be found.',
    intendedUrl = null 
}: NotFoundProps) {
    const [seconds, setSeconds] = useState(5);
    const { props } = usePage();

    useEffect(() => {
        // Get the URL from props (passed from controller) or session or referrer
        let previousUrl = intendedUrl || document.referrer || '/';
        
        // If it's the not-found page itself, go to dashboard
        if (previousUrl.includes('/not-found')) {
            previousUrl = '/dashboard';
        }
        
        const timer = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = previousUrl;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [intendedUrl]);

    const handleGoBack = () => {
        let previousUrl = intendedUrl || document.referrer || '/';
        
        // If it's the not-found page itself, go to dashboard
        if (previousUrl.includes('/not-found')) {
            previousUrl = '/dashboard';
        }
        
        window.location.href = previousUrl;
    };

    const handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    return (
        <>
            <Head title={`${page} - Not Found`} />
            
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50 p-4">
                <Card className="max-w-md w-full shadow-xl border-red-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            <div className="rounded-full bg-red-100 p-4 w-20 h-20 flex items-center justify-center mx-auto">
                                <AlertCircle className="h-10 w-10 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-red-800">
                            404 - Page Not Found
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            {page} {message}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full">
                                <span className="text-sm font-medium text-red-700">
                                    Redirecting in {seconds} second{seconds !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex justify-center gap-3">
                            <Button
                                onClick={handleGoBack}
                                variant="outline"
                                className="gap-2 hover:bg-red-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </Button>
                            <Button
                                onClick={handleGoHome}
                                className="gap-2 bg-red-600 hover:bg-red-700"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                        </div>
                        
                        <p className="text-xs text-center text-muted-foreground">
                            The page you're looking for might have been moved, deleted, or never existed.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}