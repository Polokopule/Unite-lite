
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Users, ShieldCheck, MessageSquare, Search, ArrowUpDown, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { User as UserType } from "@/lib/types";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const isVerified = (user: UserType) => {
    return user.email === 'polokopule91@gmail.com' || (user.followers && user.followers.length >= 1000000);
}

type SortOrder = "name-asc" | "name-desc";

export default function CommunityPage() {
    const { allUsers, loading, startConversation, user: currentUser } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState<SortOrder>("name-asc");

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

    const sortedAndFilteredUsers = useMemo(() => {
        const filtered = allUsers.filter(u => 
            u.uid !== auth.currentUser?.uid &&
            u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            if (sortOrder === "name-asc") {
                return a.name.localeCompare(b.name);
            } else { // name-desc
                return b.name.localeCompare(a.name);
            }
        });
    }, [allUsers, searchTerm, auth.currentUser, sortOrder]);
    
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

            <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search for people..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="shrink-0">
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Sort By
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setSortOrder("name-asc")}>
                            Name (A-Z)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOrder("name-desc")}>
                            Name (Z-A)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-4">
                {sortedAndFilteredUsers.map(user => (
                    <Card key={user.uid}>
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4 flex-1 truncate">
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
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" asChild>
                                   <Link href={`/profile/${user.uid}`}>
                                     <UserIcon className="h-5 w-5" />
                                   </Link>
                                </Button>
                                <Button size="icon" variant="outline" onClick={() => handleStartConversation(user)}>
                                    <MessageSquare className="h-5 w-5" />
                                </Button>
                             </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
