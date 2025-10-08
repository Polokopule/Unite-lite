
"use client";

import { useParams } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { User as UserType, Post as PostType, FeedItem } from "@/lib/types";
import { Loader2, UserPlus, UserMinus, Users, BookOpen, Heart, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";

// --- Create Post Form ---
function CreatePostForm() {
    const { addPost } = useAppContext();
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsPosting(true);
        const success = await addPost(content);
        setIsPosting(false);

        if (success) {
            setContent("");
            toast({ title: "Post created!" });
        } else {
            toast({ variant: "destructive", title: "Failed to create post." });
        }
    };

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-xl">Create a New Post</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <Textarea
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                        className="mb-4"
                    />
                    <Button type="submit" disabled={isPosting || !content.trim()}>
                        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// --- Post Card ---
function PostCard({ post }: { post: PostType }) {
    const { user, likePost } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        if(user) {
            setIsLiked(post.likes?.includes(user.uid));
        }
    }, [user, post.likes]);

    const handleLike = () => {
        if(user) likePost(post.id);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                        {post.creatorPhotoURL && <AvatarImage src={post.creatorPhotoURL} alt={post.creatorName} />}
                        <AvatarFallback>{post.creatorName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{post.creatorName}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{post.content}</p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex items-center gap-4">
                 <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center gap-2">
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{post.likes?.length || 0} Likes</span>
                </Button>
                 <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Comment</span>
                </Button>
            </CardFooter>
        </Card>
    );
}

// --- Ad Card in Feed ---
function AdCard({ ad }: { ad: Ad }) {
    return (
        <Card className="w-full bg-primary/5 border-primary/20">
             <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{ad.campaignName}</CardTitle>
                    <span className="text-xs font-bold uppercase text-primary">AD</span>
                </div>
            </CardHeader>
            <CardContent>
                <p>{ad.content}</p>
            </CardContent>
        </Card>
    );
}


export default function ProfilePage() {
    const params = useParams();
    const { id: profileUserId } = params;
    const { user: currentUser, allUsers, loading, followUser, unfollowUser, posts, ads } = useAppContext();
    const { toast } = useToast();

    const [profileUser, setProfileUser] = useState<UserType | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Create a memoized feed that combines posts and ads
    const userFeed = useMemo(() => {
        const userPosts = posts.filter(p => p.creatorUid === profileUserId).map(p => ({ ...p, itemType: 'post' as const }));

        // Simple random ad injection
        const feed: FeedItem[] = [...userPosts];
        if (ads.length > 0) {
            // Insert an ad every 5 posts, for example
            for (let i = 0; i < feed.length; i += 5) {
                const adIndex = Math.floor(Math.random() * ads.length);
                const randomAd = ads[adIndex];
                if (randomAd) {
                    feed.splice(i + 4, 0, { ...randomAd, itemType: 'ad' as const });
                }
            }
        }
        return feed;

    }, [posts, ads, profileUserId]);


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
            <Card className="mb-8">
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                        {profileUser.photoURL && <AvatarImage src={profileUser.photoURL} alt={profileUser.name} />}
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
                </CardContent>
            </Card>

            <div className="space-y-6">
                {isOwnProfile && <CreatePostForm />}
                
                <h3 className="text-xl font-semibold">Feed</h3>
                
                {userFeed.length > 0 ? (
                    <div className="space-y-6">
                        {userFeed.map((item) => 
                            item.itemType === 'post' 
                                ? <PostCard key={item.id} post={item} />
                                : <AdCard key={item.id} ad={item} />
                        )}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4">No posts yet.</p>
                        {isOwnProfile && <p className="text-sm">Why not create your first one?</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
