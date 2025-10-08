
"use client";

import { useParams } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { User as UserType, Post as PostType, Comment as CommentType } from "@/lib/types";
import { Loader2, UserPlus, UserMinus, MessageCircle, Heart, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { CreatePostForm } from "@/components/create-post-form";

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
                    <div className="bg-muted rounded-lg p-2 text-sm w-full">
                        <p className="font-semibold">{comment.creatorName}</p>
                        <p className="text-xs text-muted-foreground pb-1">
                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                        </p>
                        <p>{comment.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Post Card ---
function PostCard({ post }: { post: PostType }) {
    const { user, likePost } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);

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
            <CardFooter className="pb-3 pt-3 flex-col items-start">
                 <div className="flex items-center gap-4 text-muted-foreground">
                     <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center gap-2">
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

export default function ProfilePage() {
    const params = useParams();
    const { id: profileUserId } = params;
    const { user: currentUser, allUsers, loading, followUser, unfollowUser, posts } = useAppContext();
    const { toast } = useToast();

    const [profileUser, setProfileUser] = useState<UserType | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const userPosts = posts.filter(p => p.creatorUid === profileUserId);

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
        if (!name) return '??';
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
                
                <h3 className="text-xl font-semibold">Posts</h3>
                
                {userPosts.length > 0 ? (
                    <div className="space-y-6">
                        {userPosts.map((post) => <PostCard key={post.id} post={post} />)}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <p className="mt-4">No posts yet.</p>
                        {isOwnProfile && <p className="text-sm">Why not create your first one?</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
