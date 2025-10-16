
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { Loader2, KeyRound } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setIsSent(true);
            toast.success("Check your inbox for a link to reset your password.");
        } catch (error: any) {
            toast.error("Could not send reset email. Please ensure the email address is correct.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
             <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                            <KeyRound className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Check Your Email</CardTitle>
                        <CardDescription>A password reset link has been sent to {email}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Follow the instructions in the email to set a new password. If you don't see it, please check your spam folder.</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/login-user">Return to Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            <Card className="w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <CardHeader className="text-center">
                         <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                            <KeyRound className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
                        <CardDescription>Enter your email to receive a password reset link.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isLoading || !email}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
                        </Button>
                         <p className="text-xs text-muted-foreground">
                            Remember your password? <Button variant="link" asChild className="p-0 h-auto"><Link href="/login-user">Log In</Link></Button>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
