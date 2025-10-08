
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Briefcase, ChevronDown, LogOut, User as UserIcon, Wallet, Users, Bell, Rss } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const { user, firebaseUser, logout } = useAppContext();
  const pathname = usePathname();

  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] || '') + (names[names.length - 1][0] || '');
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className={`transition-colors hover:text-primary ${pathname === '/' ? 'text-primary' : ''}`}>Home</Link>
            <Link href="/" className="transition-colors hover:text-primary">Courses</Link>
            <Link href="/groups" className={`transition-colors hover:text-primary ${pathname === '/groups' ? 'text-primary' : ''}`}>Groups</Link>
            <Link href="/community" className={`transition-colors hover:text-primary ${pathname === '/community' ? 'text-primary' : ''}`}>Community</Link>
            {user?.type === 'user' && (
              <Link href="/watch-ads" className="transition-colors hover:text-primary">Earn Points</Link>
            )}
             {user?.type === 'business' && (
                <Link href="/create-ad" className="transition-colors hover:text-primary">Create Ad</Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 font-semibold">
                  <Wallet className="h-4 w-4 text-muted-foreground"/>
                  <span>{user.points}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                         {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name} />}
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard"><UserIcon className="mr-2 h-4 w-4" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                       <Link href={`/profile/${user.uid}`}><UserIcon className="mr-2 h-4 w-4" />My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">Login <ChevronDown className="h-4 w-4 ml-1" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/login-user"><UserIcon className="mr-2 h-4 w-4"/>As a User</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/login-business"><Briefcase className="mr-2 h-4 w-4"/>As a Business</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>Sign Up <ChevronDown className="h-4 w-4 ml-1" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/signup-user"><UserIcon className="mr-2 h-4 w-4"/>As a User</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup-business"><Briefcase className="mr-2 h-4 w-4"/>As a Business</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
             <div className="md:hidden">
                {/* Mobile menu could be implemented here with a Sheet component */}
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
