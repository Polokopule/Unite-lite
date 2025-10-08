
"use client";

import { useParams } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { User as UserType } from "@/lib/types";
import { Loader2, UserPlus, UserMinus, Users, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
    const params = useParams();
    const { id: profileUserId } = params;
    const { user: currentUser, allUsers, loading, followUser, unfollowUser } = useAppContext();
    const { toast } = useToast();

    const [profileUser, setProfileUser] = useState<UserType | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!loading && allUsers.length > 0) {
            const foundUser = allUsers.find(u => u.uid === profileUserId);
            if (foundUser) {
                setProfileUser(foundUser);
            }
        }
    }, [profileUserId, allUsers, loading]);

    useEffect(() => {
        if (currentUser && profileUser) {
            setIsFollowing(currentUser.following?.includes(profileUser.uid) || false);
        }
    }, [currentUser, profileUser]);
    
    const handleFollow = async () => {
        if (!profileUser) return;
        setIsProcessing(true);
        await followUser(profileUser.uid);
        toast({ title: "Followed", description: `You are now following ${profileUser.name}.`});
        setIsProcessing(false);
    };

    const handleUnfollow = async () => {
        if (!profileUser) return;
        setIsProcessing(true);
        await unfollowUser(profileUser.uid);
        toast({ title: "Unfollowed", description: `You are no longer following ${profileUser.name}.`});
        setIsProcessing(false);
    };

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return names[0][0] + names[names.length - 1][0];
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading || !profileUser) {
        return <div className="container mx-auto py-8"><p>Loading profile...</p></div>;
    }

    const isOwnProfile = currentUser?.uid === profileUser.uid;

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                        {/* A real app would use profileUser.photoURL */}
                        <AvatarFallback className="text-4xl font-bold">
                            {getInitials(profileUser.name)}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-3xl font-headline">{profileUser.name}</CardTitle>
                    <CardDescription>{profileUser.email}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center gap-8 text-center my-4">
                        <div>
                            <p className="text-2xl font-bold">{profileUser.followers?.length || 0}</p>
                            <p className="text-sm text-muted-foreground">Followers</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{profileUser.following?.length || 0}</p>
                            <p className="text-sm text-muted-foreground">Following</p>
                        </div>
                    </div>
                     {currentUser && !isOwnProfile && (
                        <div className="text-center mt-6">
                            {isFollowing ? (
                                <Button onClick={handleUnfollow} disabled={isProcessing} variant="outline">
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserMinus className="mr-2 h-4 w-4"/>}
                                    Unfollow
                                </Button>
                            ) : (
                                <Button onClick={handleFollow} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>}
                                    Follow
                                </Button>
                            )}
                        </div>
                    )}
                    <div className="mt-8 pt-6 border-t">
                        <h3 className="text-xl font-semibold mb-4 text-center">Feed</h3>
                        <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                             <p className="mt-4">Posts from {profileUser.name} will appear here.</p>
                             <p className="text-sm">This feature is coming soon!</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
