
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Briefcase, LogOut, User as UserIcon, Wallet, Users, Home, MessageSquare, Edit, Menu, ShoppingBag, BookOpen, BellRing, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { Separator } from "./ui/separator";

function AuthSheet() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                 <Button variant="ghost" size="icon">
                    <Menu />
                    <span className="sr-only">Open Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Welcome to Unite</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                     <div className="flex flex-col space-y-2">
                        <h3 className="font-semibold">User Account</h3>
                        <Button asChild variant="outline" onClick={() => setOpen(false)}><Link href="/login-user">Login</Link></Button>
                        <Button asChild onClick={() => setOpen(false)}><Link href="/signup-user">Sign Up</Link></Button>
                    </div>
                    <Separator />
                     <div className="flex flex-col space-y-2">
                        <h3 className="font-semibold">Business Account</h3>
                         <Button asChild variant="outline" onClick={() => setOpen(false)}><Link href="/login-business">Login</Link></Button>
                        <Button asChild onClick={() => setOpen(false)}><Link href="/signup-business">Sign Up</Link></Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function UserSheet() {
    const { user, logout } = useAppContext();
    const [open, setOpen] = useState(false);
    
    if (!user) return null;

    const getInitials = (name: string) => {
        if (!name) return '??';
        const names = name.split(' ');
        if (names.length > 1) {
            return (names[0][0] || '') + (names[names.length - 1][0] || '');
        }
        return name.substring(0, 2).toUpperCase();
    };
    
    const handleLinkClick = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                 <Button variant="ghost" size="icon">
                    <Menu />
                    <span className="sr-only">Open Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>
                        <div className="flex items-center gap-3">
                             <Avatar className="h-9 w-9">
                                {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name} />}
                                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                             <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                                </p>
                            </div>
                        </div>
                    </SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                     <div className="flex items-center justify-between rounded-lg border p-3 font-semibold">
                         <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-muted-foreground"/>
                            <span>Points</span>
                         </div>
                        <span>{user.points}</span>
                     </div>
                    <Separator />
                     <div className="flex flex-col gap-2">
                        <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                           <Link href="/"><Home className="mr-2 h-4 w-4" />Home</Link>
                        </Button>
                        <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                           <Link href="/#courses"><ShoppingBag className="mr-2 h-4 w-4" />Courses</Link>
                        </Button>
                         <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                           <Link href="/#groups"><Users className="mr-2 h-4 w-4" />Groups</Link>
                        </Button>
                        <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                           <Link href="/#community"><Users className="mr-2 h-4 w-4" />Community</Link>
                        </Button>
                         <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                           <Link href="/#messages"><MessageSquare className="mr-2 h-4 w-4" />Messages</Link>
                        </Button>
                          {user?.type === 'user' && (
                            <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                                <Link href="/watch-ads"><Wallet className="mr-2 h-4 w-4" />Earn Points</Link>
                            </Button>
                          )}
                           {user?.type === 'business' && (
                             <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                                <Link href="/create-ad"><Briefcase className="mr-2 h-4 w-4" />Create Ad</Link>
                            </Button>
                          )}
                     </div>
                    <Separator />
                     <div className="flex flex-col gap-2">
                        <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                            <Link href="/dashboard"><UserIcon className="mr-2 h-4 w-4" />Dashboard</Link>
                        </Button>
                        <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                           <Link href={`/profile/${user.uid}`}><UserIcon className="mr-2 h-4 w-4" />My Profile</Link>
                        </Button>
                        <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                           <Link href="/profile/edit"><Edit className="mr-2 h-4 w-4" />Edit Profile</Link>
                        </Button>
                        <Button asChild variant="ghost" className="justify-start" onClick={handleLinkClick}>
                           <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                        </Button>
                    </div>
                    <Separator />
                    <Button variant="ghost" className="justify-start" onClick={() => { handleLinkClick(); logout(); }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}


export function Header() {
  const { user } = useAppContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo />
        <div className="flex flex-1 items-center justify-end space-x-4">
            {user ? (
                <UserSheet />
            ) : (
                <AuthSheet />
            )}
        </div>
      </div>
    </header>
  );
}
