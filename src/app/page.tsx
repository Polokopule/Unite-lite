
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Ad, Post as PostType, FeedItem, Comment as CommentType, User } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, Heart, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";


// --- Comment Form ---
function CommentForm({ postId }: { postId: string }) {
    const { user, addComment } = useAppContext();
    const [comment, setComment] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !user) return;
        setIsCommenting(true);
        const success = await addComment(postId, comment);
        setIsCommenting(false);
        if (success) {
            setComment("");
        } else {
            toast({ variant: "destructive", title: "Failed to add comment." });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4">
             <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL} alt={user?.name} />
                <AvatarFallback>{user?.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <Input
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isCommenting}
                className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isCommenting || !comment.trim()}>
                {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
        </form>
    );
}

// --- Comment List ---
function CommentList({ comments }: { comments: CommentType[] }) {
    if (!comments || comments.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 pt-4 border-t mt-2">
            {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.creatorPhotoURL} alt={comment.creatorName} />
                        <AvatarFallback>{comment.creatorName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-2 px-3 text-sm w-full">
                         <Link href={`/profile/${comment.creatorUid}`} className="font-semibold hover:underline">{comment.creatorName}</Link>
                        <p className="text-xs text-muted-foreground pb-1">
                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                        </p>
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Post Card ---
function PostCard({ post }: { post: PostType }) {
    const { user, likePost, loading } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        if(user) {
            setIsLiked(post.likes?.includes(user.uid));
        } else {
            setIsLiked(false);
        }
    }, [user, post.likes]);

    const handleLike = () => {
        if(user && !loading) {
            likePost(post.id);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                     <Link href={`/profile/${post.creatorUid}`}>
                        <Avatar className="h-10 w-10">
                            {post.creatorPhotoURL && <AvatarImage src={post.creatorPhotoURL} alt={post.creatorName} />}
                            <AvatarFallback>{post.creatorName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                         <Link href={`/profile/${post.creatorUid}`} className="font-semibold hover:underline">{post.creatorName}</Link>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{post.content}</p>
            </CardContent>
            <CardFooter className="pb-3 pt-3 flex-col items-start">
                 <div className="flex items-center gap-4 text-muted-foreground">
                     <Button variant="ghost" size="sm" onClick={handleLike} disabled={!user} className="flex items-center gap-2">
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{post.likes?.length || 0}</span>
                    </Button>
                     <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setShowComments(!showComments)}>
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments?.length || 0}</span>
                    </Button>
                </div>
                {showComments && (
                    <div className="w-full pt-2">
                       <CommentList comments={post.comments || []} />
                       {user && <CommentForm postId={post.id} />}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

// --- Ad Card in Feed ---
function AdCard({ ad }: { ad: Ad }) {
    return (
        <Card className="w-full max-w-2xl mx-auto bg-primary/5 border-primary/20">
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

export default function HomePage() {
    const { loading, posts, ads } = useAppContext();

    const feedItems = useMemo(() => {
        const allPosts: FeedItem[] = posts.map(p => ({ ...p, itemType: 'post' as const }));

        // Simple random ad injection
        const feed: FeedItem[] = [...allPosts];
        if (ads.length > 0) {
            for (let i = 0; i < feed.length; i += 5) {
                const adIndex = Math.floor(Math.random() * ads.length);
                const randomAd: FeedItem = { ...ads[adIndex], itemType: 'ad' as const };
                if (randomAd) {
                    feed.splice(i + 4, 0, randomAd);
                }
            }
        }

        // Sort by timestamp descending
        feed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        return feed;

    }, [posts, ads]);

    if (loading) {
        return (
             <div className="container mx-auto py-8">
                <div className="w-full max-w-2xl mx-auto space-y-6">
                    <Card className="w-full">
                        <CardHeader><div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div></CardHeader>
                        <CardContent><div className="h-20 bg-muted rounded-md animate-pulse"></div></CardContent>
                        <CardFooter><div className="h-8 w-24 bg-muted rounded-md animate-pulse"></div></CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold font-headline mb-8">Home Feed</h1>
                 <div className="space-y-6">
                    {feedItems.length > 0 ? (
                        feedItems.map((item) => 
                            item.itemType === 'post' 
                                ? <PostCard key={`post-${item.id}`} post={item} />
                                : <AdCard key={`ad-${item.id}`} ad={item} />
                        )
                    ) : (
                        <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                            <h2 className="text-xl font-semibold">The feed is empty!</h2>
                            <p className="mt-4">No posts have been made yet. Sign up and be the first to share something.</p>
                             <Button asChild variant="default" className="mt-4">
                               <Link href="/signup-user">Create an Account</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
