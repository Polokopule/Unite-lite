"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/app-context";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SignUpBusinessPage() {
  const { login } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && companyName) {
      login(email, 'business');
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
             <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Create a Business Account</CardTitle>
            <CardDescription>Reach new customers by advertising on AdEd.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Your Company Inc."
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="work@yourcompany.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">Create Account</Button>
            <p className="text-xs text-muted-foreground">
              Already have an account? <Button variant="link" asChild className="p-0 h-auto"><Link href="/login-business">Log In</Link></Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
