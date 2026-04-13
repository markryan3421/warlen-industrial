import { Form } from '@inertiajs/react';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import '@fontsource/inter/700.css';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};
import '@fontsource/inter/700.css';

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    // State must be inside the component
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex flex-row h-screen bg-gray-100">
            {/* Left Column - Form */}
            <div className="w-full h-full md:w-1/2">
                <Card className="border-0 md:border-r-2 border-gray-400 shadow-none bg-white rounded-none h-full">
                    {/* This wrapper div will handle the centering */}
                    <div className="flex flex-col justify-center items-center min-h-full px-4 py-8">
                        {/* Centered content container with max width */}
                        <div className="w-full max-w-md">
                            <CardHeader className="px-0 pt-0 pb-6 text-left">
                                <div className="space-y-2 text-shadow-md/15">
                                    <div className="text-xl md:text-2xl lg:text-4xl font-['Inter'] text-[#05469D] lg:mb-15 font-bold tracking-tight">
                                        <div>Warlen Industrial Sales Corporation
                                            <span className="text-[#FD0C0B] lg:text-2xl mt-1 "> DEKA Sales</span>
                                        </div>

                                        <div className="text-sm md:text-base lg:text-xl font-['Inter'] text-gray-700 font-black">
                                            Payroll Management System
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <CardTitle className="text-gray-700 font-['Inter'] font-bold text-lg">
                                            Welcome back!
                                        </CardTitle>
                                        <CardDescription className='text-gray-600 text-sm mt-1'>
                                            Please enter your credentials to access the dashboard.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="px-0 pb-0">
                                {status && (
                                    <div className="font-medium text-sm text-green-600 mb-4 text-center">
                                        {status}
                                    </div>
                                )}

                                <Form
                                    {...store.form()}
                                    resetOnSuccess={['password']}
                                    className="space-y-5"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            {/* Email Field */}
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className='font-bold text-sm'>
                                                    Email Address
                                                </Label>
                                                <div>
                                                    <div className="relative">
                                                        <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500' />
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            placeholder="admin@warlen.com"
                                                            className="w-full pl-10 pr-4 py-2 text-sm text-black border border-gray-300 bg-gray-50 focus:bg-white rounded-md"
                                                            required
                                                            autoFocus
                                                            tabIndex={1}
                                                            autoComplete="email"
                                                        />
                                                    </div>
                                                    {errors?.email && (
                                                        <InputError message={errors.email} className='text-xs mt-1' />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Password Field */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="password" className='font-bold text-sm'>
                                                        Password
                                                    </Label>
                                                </div>

                                                <div className="relative">
                                                    <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500' />
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••••••••••••"
                                                        className="w-full pl-10 pr-10 py-2 text-sm text-black border border-gray-300 bg-gray-50 focus:bg-white rounded-md"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={togglePasswordVisibility}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                        tabIndex={3}
                                                    >
                                                        {showPassword ? (
                                                            <Eye className="h-4 w-4" />
                                                        ) : (
                                                            <EyeOff className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    {errors?.password && (
                                                        <InputError message={errors.password} className='text-xs mt-1' />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Remember Me & Forgot Password */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="remember"
                                                        name="remember"
                                                        className="h-4 w-4 border-2 border-gray-400 data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-700"
                                                    />
                                                    <Label htmlFor="remember" className="text-sm font-normal text-gray-600">
                                                        Remember me
                                                    </Label>
                                                </div>

                                                <TextLink
                                                    href={request()}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            </div>

                                            {/* Login Button */}
                                            <div className='pt-2'>
                                                <Button
                                                    type="submit"
                                                    className="w-full py-5 bg-blue-800 border-2 border-blue-300 text-white font-bold text-sm shadow-md hover:bg-blue-900 hover:border-blue-200 hover:translate-y-[2px] transition-all duration-100"
                                                    tabIndex={4}
                                                    disabled={processing}
                                                    data-test="login-button"
                                                >
                                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                                                    Login
                                                </Button>
                                            </div>

                                            {/* Copyright */}
                                            <p className='text-xs text-gray-600 text-center -mt-2'>
                                                © 2026 Warlen Industrial Sales Corporation, DEKA Sales. All rights reserved.
                                            </p>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right Column - Image */}
            <div className="hidden md:block md:w-1/2 relative">
                <div className="relative h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-blue-700/10 z-10" />
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: 'url(images/loginbackground.jpg)',
                        }}
                    />

                    {/* Centered Logo */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <img
                            src="/images/dekalogo.png"
                            alt="DEKA Logo"
                            className="w-32 h-32 md:w-40 md:h-40 lg:w-60 lg:h-60 drop-shadow-2xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}