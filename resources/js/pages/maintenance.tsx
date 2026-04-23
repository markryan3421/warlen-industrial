// pages/maintenance.tsx
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Settings, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MaintenanceProps {
    page?: string;
    message?: string;
    intendedUrl?: string | null;
}

export default function Maintenance({ 
    page = 'This page', 
    message = 'is currently under maintenance.',
    intendedUrl = null 
}: MaintenanceProps) {
    const [seconds, setSeconds] = useState(5);
    const { props } = usePage();

    useEffect(() => {
        // Get the URL from props (passed from controller) or session or referrer
        let previousUrl = intendedUrl || document.referrer || '/';
        
        // If it's the maintenance page itself, go to dashboard
        if (previousUrl.includes('/maintenance')) {
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
        
        // If it's the maintenance page itself, go to dashboard
        if (previousUrl.includes('/maintenance')) {
            previousUrl = '/dashboard';
        }
        
        window.location.href = previousUrl;
    };

    return (
        <>
            <Head title={`${page} - Maintenance`} />
            
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
                <Card className="max-w-md w-full shadow-xl border-yellow-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            <div className="rounded-full bg-yellow-100 p-4 w-20 h-20 flex items-center justify-center mx-auto">
                                <Settings className="h-10 w-10 text-yellow-600 animate-spin-slow" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-yellow-800">
                            Under Maintenance
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            {page} {message}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-full">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-700">
                                    Redirecting in {seconds} second{seconds !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex justify-center">
                            <Button
                                onClick={handleGoBack}
                                variant="outline"
                                className="gap-2 hover:bg-yellow-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back Now
                            </Button>
                        </div>
                        
                        <p className="text-xs text-center text-muted-foreground">
                            Please check back later or contact support if the issue persists.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <style>{`
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}</style>
        </>
    );
}