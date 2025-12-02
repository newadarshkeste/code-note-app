'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { CodeNoteLogo } from './CodeNoteLogo';

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export function LoginPage() {
    const { loginWithGoogle } = useAuth();

    return (
        <div className="flex h-dvh w-screen flex-col items-center justify-center bg-background">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] p-8">
                <div className="flex flex-col space-y-2 text-center items-center">
                    <CodeNoteLogo />
                    <h1 className="text-2xl font-semibold tracking-tight mt-4">
                        Welcome to CodeNote
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in to continue to your notes
                    </p>
                </div>
                
                <Button variant="outline" type="button" onClick={loginWithGoogle} className="h-12 text-base">
                    <GoogleIcon className="mr-2 h-6 w-6" />
                    Sign in with Google
                </Button>

                <p className="px-8 text-center text-sm text-muted-foreground">
                    By clicking continue, you agree to our{" "}
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
