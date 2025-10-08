
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users } from "lucide-react";
import Link from "next/link";
import { getAuth } from "firebase/auth";

export default function CommunityPage() {
    const { allUsers, loading } = useAppContext();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const getInitials = (name: string) => {
        if (!name) return '??';
        const names = name.split(' ');
        if (names.length > 1) {
            return (names[0][0] || '') + (names[names.length - 1][0] || '');
        }
        return name.substring(0, 2).toUpperCase();
    };
    
    if (loading) {
        return <div className="container mx-auto py-8"><p>Loading community...</p></div>
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline mb-2">Community</h1>
                    <p className="text-muted-foreground mb-8">Browse and connect with other users on Unite.</p>
                </div>
                <Button asChild>
                    <Link href="/groups"><Users className="mr-2 h-4 w-4"/>Browse Groups</Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allUsers.filter(u => u.uid !== currentUser?.uid).map(user => (
                    <Card key={user.uid} className="text-center">
                        <CardHeader>
                            <Avatar className="h-20 w-20 mx-auto border-2 border-primary">
                                {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name} />}
                                <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="text-lg">{user.name}</CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">{user.type}</p>
                            <Button asChild variant="outline" className="mt-4 w-full">
                                <Link href={`/profile/${user.uid}`}>
                                    <User className="mr-2 h-4 w-4" />
                                    View Profile
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
