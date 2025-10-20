
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/app-context";
import { User as UserIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { get, ref } from "firebase/database";

const GoogleIcon = () => <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>;

export default function LoginUserPage() {
  const { login, user } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<null | 'google'>(null);

  const handleLogin = async (uid: string, email: string) => {
    const userRef = ref(db, `users/${uid}`);
    const userSnap = await get(userRef);
    if(userSnap.exists() && userSnap.val().banned) {
        toast.error("This account has been banned.");
        await auth.signOut();
        return;
    }
    await login(email, 'user');
    if (window.AndroidApp) window.AndroidApp.saveUid(uid);
  }

  const handleSocialLogin = async (providerName: 'google') => {
    setIsSocialLoading(providerName);
    const provider = new GoogleAuthProvider();
    const loadingToast = toast.loading("Logging in with Google...");
    try {
      await signInWithPopup(auth, provider);
      const firebaseUser = auth.currentUser;
      if (firebaseUser?.email && firebaseUser?.uid) {
        await handleLogin(firebaseUser.uid, firebaseUser.email);
      } else {
        throw new Error("Could not retrieve user information from Google.");
      }
      toast.dismiss(loadingToast);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An unknown error occurred.", { id: loadingToast });
    } finally {
      setIsSocialLoading(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const loadingToast = toast.loading("Logging in...");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      if (firebaseUser?.uid) {
        await handleLogin(firebaseUser.uid, email);
      }
      toast.dismiss(loadingToast);
    } catch (error: any) {
      toast.error("Invalid credentials or user does not exist.", { id: loadingToast });
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
            <CardTitle className="text-2xl font-headline">User Login</CardTitle>
            <CardDescription>Welcome back! Access your courses and points.</CardDescription>
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
              <div className="flex justify-between items-center">
                 <Label htmlFor="password">Password</Label>
                 <Button variant="link" asChild className="p-0 h-auto text-xs"><Link href="/forgot-password">Forgot Password?</Link></Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !!isSocialLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || !!isSocialLoading}>
               {isLoading && <Loader2 className="animate-spin" />}
               {!isLoading && 'Log In'}
            </Button>
            
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                  </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
              <Button variant="outline" type="button" onClick={() => handleSocialLogin('google')} disabled={isLoading || !!isSocialLoading}>
                {isSocialLoading === 'google' ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Don't have an account? <Button variant="link" asChild className="p-0 h-auto"><Link href="/signup-user">Sign Up</Link></Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
