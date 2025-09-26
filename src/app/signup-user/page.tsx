
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/app-context";
import { User as UserIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const GoogleIcon = () => <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>;
const FacebookIcon = () => <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-.83 0-1 .17-1 .5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"></path></svg>;

export default function SignUpUserPage() {
  const { login } = useAppContext();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<null | 'google' | 'facebook'>(null);

  const handleSocialLogin = async (providerName: 'google' | 'facebook') => {
    setIsSocialLoading(providerName);
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      const firebaseUser = auth.currentUser;
      if (firebaseUser?.email) {
        await login(firebaseUser.email, 'user');
      }
    } catch (error: any) {
      console.error("Social login error:", error);
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await login(email, 'user');
    } catch (error: any) {
      console.error("Email/password sign up error:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: "This email might already be in use or the password is too weak.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Create a User Account</CardTitle>
            <CardDescription>Start learning and earning points today.</CardDescription>
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
                disabled={isLoading || !!isSocialLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="at least 6 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !!isSocialLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || !!isSocialLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                  Or sign up with
                  </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <Button variant="outline" type="button" onClick={() => handleSocialLogin('google')} disabled={isLoading || !!isSocialLoading}>
                {isSocialLoading === 'google' ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
              </Button>
              <Button variant="outline" type="button" onClick={() => handleSocialLogin('facebook')} disabled={isLoading || !!isSocialLoading}>
                {isSocialLoading === 'facebook' ? <Loader2 className="animate-spin" /> : <FacebookIcon />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Already have an account? <Button variant="link" asChild className="p-0 h-auto"><Link href="/login-user">Log In</Link></Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
