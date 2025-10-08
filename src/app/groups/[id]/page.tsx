
"use client";

import { useParams } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Group } from "@/lib/types";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Users, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function GroupPage() {
    const params = useParams();
    const { id: groupId } = params;
    const { user, groups, joinGroup, allUsers, loading } = useAppContext();
    const { toast } = useToast();

    const [group, setGroup] = useState<Group | null>(null);
    const [isMember, setIsMember] = useState(false);
    const [pin, setPin] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    
    useEffect(() => {
        if (loading) return;
        const foundGroup = groups.find(g => g.id === groupId);
        if (foundGroup) {
            setGroup(foundGroup);
            if (user) {
                setIsMember(foundGroup.members?.includes(user.uid) || false);
            }
        }
    }, [groupId, groups, user, loading]);

    const handleJoin = async () => {
        if (!group) return;
        setIsJoining(true);
        const success = await joinGroup(group.id, pin);
        setIsJoining(false);

        if (success) {
            toast({ title: `Welcome to ${group.name}!` });
            setPin("");
        } else {
            toast({ variant: "destructive", title: "Failed to join group", description: "The PIN may be incorrect or you may already be a member." });
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
    
    const membersDetails = group?.members?.map(memberId => allUsers.find(u => u.uid === memberId)).filter(Boolean) || [];

    if (loading || !group) {
        return <div className="container mx-auto py-8"><Loader2 className="animate-spin" /> Loading group...</div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline flex items-center gap-3">{group.name} {group.hasPin && <Lock className="h-6 w-6 text-muted-foreground" />}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                    <p className="text-sm text-muted-foreground pt-2">Created by {group.creatorName}</p>
                </CardHeader>
                <CardContent>
                    {!isMember ? (
                        <div className="p-6 border-2 border-dashed rounded-lg flex flex-col items-center gap-4 text-center">
                            <h3 className="text-xl font-semibold">You are not a member of this group.</h3>
                            {group.hasPin ? (
                                <div className="w-full max-w-sm space-y-4">
                                    <p className="text-muted-foreground">This is a private group. Please enter the PIN to join.</p>
                                    <div className="space-y-2">
                                        <Label htmlFor="pin">Group PIN</Label>
                                        <Input
                                            id="pin"
                                            type="password"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            placeholder="Enter PIN"
                                        />
                                    </div>
                                    <Button onClick={handleJoin} disabled={isJoining || !pin}>
                                        {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Join Group
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={handleJoin} disabled={isJoining}>
                                    {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Join Group
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Chat Area - To be implemented */}
                            <div className="md:col-span-2">
                                 <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/> Group Chat</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-96 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                                            <p className="text-muted-foreground">Chat feature coming soon!</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            {/* Members List */}
                            <div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Members ({membersDetails.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {membersDetails.map(member => member && (
                                                <li key={member.uid} className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        {member.photoURL && <AvatarImage src={member.photoURL} alt={member.name} />}
                                                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{member.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
