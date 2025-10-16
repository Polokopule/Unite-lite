
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, ShieldCheck, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { User as UserType } from "@/lib/types";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const isVerified = (user: UserType) => {
    return user.email === 'polokopule91@gmail.com' || (user.followers && user.followers.length >= 1000000);
}

export default function CommunityPage() {
    const { allUsers, loading, startConversation, user: currentUser } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth();
    const [searchTerm, setSearchTerm] = useState("");

    const handleStartConversation = async (otherUser: UserType) => {
        if (!currentUser) {
            toast({
                variant: "destructive",
                title: "Please log in",
                description: "You need to be logged in to send a message.",
            });
            return;
        }
        const conversationId = await startConversation(otherUser.uid);
        if (conversationId) {
            router.push(`/messages/${conversationId}`);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not start conversation.",
            });
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        const names = name.split(' ');
        if (names.length > 1) {
            return (names[0][0] || '') + (names[names.length - 1][0] || '');
        }
        return name.substring(0, 2).toUpperCase();
    };

    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => 
            u.uid !== auth.currentUser?.uid &&
            u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm, auth.currentUser]);
    
    if (loading) {
        return <div className="container mx-auto py-8"><p>Loading community...</p></div>
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline mb-2">Community</h1>
                    <p className="text-muted-foreground">Browse and connect with other users on Unite.</p>
                </div>
                <Button asChild>
                    <Link href="/groups"><Users className="mr-2 h-4 w-4"/>Browse Groups</Link>
                </Button>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search for people..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(user => (
                    <Card key={user.uid}>
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                           <Link href={`/profile/${user.uid}`} className="flex items-center gap-4 flex-1 truncate">
                                <Avatar className="h-12 w-12 border-2 border-primary">
                                    {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name} />}
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xl font-bold">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="truncate">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <span className="font-semibold truncate">{user.name}</span>
                                        {isVerified(user) && <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />}
                                    </div>
                                    <p className="text-sm text-muted-foreground capitalize truncate">{user.type}</p>
                                </div>
                            </Link>
                             <Button size="icon" variant="outline" onClick={() => handleStartConversation(user)}>
                                <MessageSquare className="h-5 w-5" />
                             </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
