'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { CodeNoteLogo } from './CodeNoteLogo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export function LoginForm() {
    const { signInWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await signInWithEmail(email, password);
        // Loading state is handled by the global auth loading state now
        // so we don't need to set it back to false here.
    };
    
    return (
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                </Button>
            </CardFooter>
        </form>
    );
}

export function SignUpForm() {
    const { signUpWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await signUpWithEmail(email, password);
    };

    return (
         <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                </Button>
            </CardFooter>
        </form>
    );
}

export function LoginPage() {
    const { loginWithGoogle, loading } = useAuth();

    return (
        <div className="flex h-dvh w-screen flex-col items-center justify-center bg-background">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] p-8">
                <div className="flex flex-col space-y-2 text-center items-center">
                    <CodeNoteLogo />
                    <h1 className="text-2xl font-semibold tracking-tight mt-4">
                        Welcome to CodeNote
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your personal code snippet organizer.
                    </p>
                </div>
                
                <Tabs defaultValue="signin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="signin">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sign In</CardTitle>
                                <CardDescription>Access your existing account.</CardDescription>
                            </CardHeader>
                            <LoginForm />
                        </Card>
                    </TabsContent>
                    <TabsContent value="signup">
                        <Card>
                             <CardHeader>
                                <CardTitle>Sign Up</CardTitle>
                                <CardDescription>Create a new account to get started.</CardDescription>
                            </CardHeader>
                            <SignUpForm />
                        </Card>
                    </TabsContent>
                </Tabs>
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                        </span>
                    </div>
                </div>

                <Button variant="outline" type="button" onClick={loginWithGoogle} className="h-12 text-base" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-6 w-6" />}
                    Sign in with Google
                </Button>

                <p className="px-8 text-center text-sm text-muted-foreground">
                    By continuing, you agree to our{" "}
                    <a
                        href="/terms"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                        href="/privacy"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Privacy Policy
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
