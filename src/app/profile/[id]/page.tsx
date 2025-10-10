

"use client";

import { useParams } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import React, { useEffect, useState, useMemo } from "react";
import { User as UserType, Post as PostType, Comment as CommentType, LinkPreview } from "@/lib/types";
import { Loader2, UserPlus, UserMinus, MessageCircle, Heart, Send, File as FileIcon, Share2, Link2, SendToBack, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// --- Comment Form ---
function CommentForm({ postId, parentId = null, onCommentPosted }: { postId: string; parentId?: string | null, onCommentPosted?: () => void }) {
    const { user, addComment } = useAppContext();
    const [comment, setComment] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !user) return;
        setIsCommenting(true);
        const success = await addComment(postId, comment, parentId);
        setIsCommenting(false);
        if (success) {
            setComment("");
            if (onCommentPosted) onCommentPosted();
        } else {
            toast({ variant: "destructive", title: "Failed to add comment." });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
             <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL} alt={user?.name} />
                <AvatarFallback>{user?.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <Input
                placeholder="Write a reply..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isCommenting}
                className="flex-1 h-9"
            />
            <Button type="submit" size="icon" variant="ghost" disabled={isCommenting || !comment.trim()}>
                {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
        </form>
    );
}

// --- Comment ---
function CommentItem({ comment, postId }: { comment: CommentType; postId: string }) {
    const { user, likeComment } = useAppContext();
    const [showReplyForm, setShowReplyForm] = useState(false);
    
    const isLiked = user ? comment.likes.includes(user.uid) : false;

    const handleLike = () => {
        if (!user) return;
        likeComment(postId, comment.id);
    }
    
    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.creatorPhotoURL} alt={comment.creatorName} />
                <AvatarFallback>{comment.creatorName.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="w-full">
                 <div className="bg-muted rounded-lg p-2 px-3 text-sm w-full">
                    <Link href={`/profile/${comment.creatorUid}`} className="font-semibold hover:underline">{comment.creatorName}</Link>
                    <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 pt-1">
                    <span>{formatTimeAgo(new Date(comment.timestamp).getTime())}</span>
                    <button onClick={handleLike} disabled={!user} className={`font-semibold hover:underline ${isLiked ? 'text-primary' : ''}`}>Like</button>
                    <button onClick={() => setShowReplyForm(!showReplyForm)} className="font-semibold hover:underline">Reply</button>
                     {comment.likes.length > 0 && (
                        <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                            {comment.likes.length}
                        </span>
                    )}
                </div>
                 {showReplyForm && user && (
                    <div className="pl-0 pt-1">
                       <CommentForm postId={postId} parentId={comment.id} onCommentPosted={() => setShowReplyForm(false)} />
                    </div>
                 )}
            </div>
        </div>
    )
}

// --- Comment List ---
function CommentList({ comments, postId }: { comments: CommentType[]; postId: string }) {
    const topLevelComments = useMemo(() => comments.filter(c => !c.parentId), [comments]);
    const replies = useMemo(() => comments.filter(c => c.parentId), [comments]);

    const getReplies = (commentId: string) => {
        return replies.filter(reply => reply.parentId === commentId);
    }

    if (!comments || comments.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 pt-4 border-t mt-4">
            {topLevelComments.map((comment) => (
                <div key={comment.id}>
                    <CommentItem comment={comment} postId={postId} />
                    <div className="pl-11 mt-2 space-y-3 border-l-2 ml-4">
                        {getReplies(comment.id).map(reply => (
                            <CommentItem key={reply.id} comment={reply} postId={postId} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
    if (!preview.title) return null;
    return (
        <a href={preview.url} target="_blank" rel="noopener noreferrer" className="mt-2 border rounded-lg overflow-hidden block hover:bg-muted/50 transition-colors">
            {preview.imageUrl && (
                <div className="relative aspect-video">
                     <Image src={preview.imageUrl} alt={preview.title} fill className="object-cover" />
                </div>
            )}
            <div className="p-3">
                <p className="font-semibold text-sm truncate">{preview.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
                 <p className="text-xs text-muted-foreground truncate mt-1 break-all">{preview.url}</p>
            </div>
        </a>
    )
}

function PostAttachment({ post }: { post: PostType }) {
    if (!post.fileUrl || !post.fileType) return null;

    if (post.fileType === 'image') {
        return (
            <div className="relative aspect-video mt-2 rounded-lg overflow-hidden border">
                <Image src={post.fileUrl} alt={post.fileName || "Uploaded image"} fill className="object-cover" />
            </div>
        )
    }
    
    if (post.fileType === 'video') {
        return (
             <video controls src={post.fileUrl} className="w-full rounded-lg mt-2 border bg-black" />
        )
    }
    
    if (post.fileType === 'audio') {
        return (
             <audio controls src={post.fileUrl} className="w-full mt-2" />
        )
    }
    
    return (
        <a href={post.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-3 bg-muted p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <FileIcon className="h-8 w-8 text-muted-foreground" />
            <div>
                <p className="font-semibold">{post.fileName || "Attached File"}</p>
                <p className="text-sm text-muted-foreground">Click to download</p>
            </div>
        </a>
    )
}


// --- Post Card ---
function PostCard({ post }: { post: PostType }) {
    const { user, allUsers, likePost } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const { toast } = useToast();

    const likers = useMemo(() => {
        return allUsers.filter(user => post.likes?.includes(user.uid));
    }, [allUsers, post.likes]);

    useEffect(() => {
        if(user) {
            setIsLiked(post.likes?.includes(user.uid));
        }
    }, [user, post.likes]);

    const handleLike = () => {
        if(user) likePost(post.id);
    };

    const handleCopyLink = () => {
        const postUrl = `${window.location.origin}/posts/${post.id}`;
        navigator.clipboard.writeText(postUrl);
        toast({ title: "Link Copied!", description: "The post link has been copied to your clipboard." });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                {post.repostedFrom && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        <Repeat className="h-4 w-4" />
                        Reposted from <Link href={`/profile/${post.repostedFrom.creatorUid}`} className="font-semibold hover:underline">{post.repostedFrom.creatorName}</Link>
                    </div>
                )}
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
                            {formatTimeAgo(new Date(post.timestamp).getTime())}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {post.content && <p className="whitespace-pre-wrap mb-2 break-words">{post.content}</p>}
                
                {post.linkPreview && <LinkPreviewCard preview={post.linkPreview} />}
                
                <PostAttachment post={post} />
            </CardContent>
            <CardFooter className="pb-3 pt-3 flex-col items-start">
                <div className="pt-4 mt-4 border-t w-full">
                    <div className="flex items-center text-muted-foreground">
                            <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center gap-2">
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:underline" disabled={(post.likes?.length || 0) === 0}>
                                    <span>{post.likes?.length || 0} likes</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <div className="max-h-60 overflow-y-auto">
                                    {likers.length > 0 ? likers.map(liker => (
                                        <DropdownMenuItem key={liker.uid} asChild>
                                            <Link href={`/profile/${liker.uid}`} className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={liker.photoURL} alt={liker.name}/>
                                                    <AvatarFallback>{liker.name.substring(0,2)}</AvatarFallback>
                                                </Avatar>
                                                <span>{liker.name}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )) : <DropdownMenuItem disabled>No likes yet.</DropdownMenuItem>}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator orientation="vertical" className="h-4 mx-2" />

                        <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setShowComments(!showComments)}>
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments?.length || 0}</span>
                        </Button>
                        
                        <Separator orientation="vertical" className="h-4 mx-2" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                    <Share2 className="h-4 w-4" />
                                    <span>Share</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={handleCopyLink}>
                                    <Link2 className="mr-2 h-4 w-4" />
                                    <span>Copy Link</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>
                                    <SendToBack className="mr-2 h-4 w-4" />
                                    <span>Share in Unite (soon)</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {showComments && (
                    <div className="w-full pt-2">
                        <CommentList comments={post.comments || []} postId={post.id} />
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
                <h3 className="text-xl font-semibold">Posts</h3>
                
                {userPosts.length > 0 ? (
                    <div className="space-y-6">
                        {userPosts.sort((a,b) => b.timestamp - a.timestamp).map((post) => <PostCard key={post.id} post={post} />)}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <p className="mt-4">No posts yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
