
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Ad, Post as PostType, FeedItem, Comment as CommentType, Course, Group, User as UserType, Notification, LinkPreview, Conversation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, Heart, Send, ShoppingBag, Wallet, CheckCircle, PlusCircle, Home as HomeIcon, Bell, Users, Lock, User as UserIconLucide, Reply, File as FileIcon, Search, MessageSquare, Share2, Link2, SendToBack, Trash, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePostForm } from "@/components/create-post-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { getAuth } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

// Reusable MentionTextarea component
function MentionTextarea({
  value,
  onChange,
  placeholder,
  allUsers,
  onMention,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allUsers: UserType[];
  onMention: (id: string, display: string) => void;
}) {
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mentionResults = useMemo(() => {
    if (!mentionQuery) return [];
    return allUsers.filter(u =>
      u.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [mentionQuery, allUsers]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const mentionMatch = text.match(/@(\w+)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: UserType) => {
    const newContent = value.replace(/@(\w+)$/, `@[${user.name}](${user.uid}) `);
    onChange(newContent);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        placeholder={placeholder}
        className="min-h-[120px]"
      />
      {showMentions && mentionResults.length > 0 && (
        <Card className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto">
          <CardContent className="p-2">
            {mentionResults.map(user => (
              <div
                key={user.uid}
                onClick={() => handleMentionSelect(user)}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL} alt={user.name} />
                  <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function SharePostDialog({ post, children }: { post: PostType, children: React.ReactNode }) {
    const { user, allUsers, startConversation, sendDirectMessage } = useAppContext();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return allUsers.filter(u =>
            u.uid !== user?.uid &&
            u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allUsers, user]);

    const handleShare = async () => {
        if (!selectedUser) return;
        setIsSharing(true);
        const postUrl = `${window.location.origin}/posts/${post.id}`;
        const conversationId = await startConversation(selectedUser.uid);
        if (conversationId) {
            await sendDirectMessage(conversationId, {
                content: `Check out this post: ${postUrl}`,
                type: 'text'
            });
            toast({ title: "Post Shared!", description: `Successfully shared with ${selectedUser.name}.` });
        } else {
            toast({ variant: 'destructive', title: "Failed to share post." });
        }
        setIsSharing(false);
        setOpen(false);
        setSelectedUser(null);
        setSearchTerm("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share Post</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {selectedUser ? (
                        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={selectedUser.photoURL} alt={selectedUser.name} />
                                    <AvatarFallback>{selectedUser.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span>{selectedUser.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
                        </div>
                    ) : (
                        <div>
                            <Input
                                placeholder="Search for a user..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchResults.length > 0 && (
                                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                                    {searchResults.map(u => (
                                        <div key={u.uid} onClick={() => setSelectedUser(u)} className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={u.photoURL} alt={u.name} />
                                                <AvatarFallback>{u.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <span>{u.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <Button onClick={handleShare} disabled={!selectedUser || isSharing} className="w-full">
                        {isSharing ? <Loader2 className="animate-spin" /> : `Share with ${selectedUser?.name || '...'}`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function CommentForm({ postId, parentId = null, onCommentPosted }: { postId: string; parentId?: string | null, onCommentPosted?: () => void }) {
    const { user, addComment, allUsers } = useAppContext();
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
    
    if (!user) return null;

    return (
        <form onSubmit={handleSubmit} className="flex items-start gap-2 pt-2">
             <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL} alt={user?.name} />
                <AvatarFallback>{user?.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                 <MentionTextarea
                    value={comment}
                    onChange={setComment}
                    placeholder="Write a reply..."
                    allUsers={allUsers}
                    onMention={() => {}}
                />
            </div>
            <Button type="submit" size="icon" variant="ghost" disabled={isCommenting || !comment.trim()}>
                {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
        </form>
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

// --- Comment ---
function CommentItem({ comment, postId }: { comment: CommentType; postId: string }) {
    const { user, likeComment } = useAppContext();
    const [showReplyForm, setShowReplyForm] = useState(false);
    
    const isLiked = user ? comment.likes.includes(user.uid) : false;

    const handleLike = () => {
        if (!user) return;
        likeComment(postId, comment.id);
    }
    
    const renderContentWithMentions = (content: string) => {
        // Simple regex to find mentions like @[User Name](userId)
        const mentionRegex = /@\[(.+?)\]\((.+?)\)/g;
        const parts = content.split(mentionRegex);
        return parts.map((part, index) => {
            if (index % 3 === 1) { // This is the user name
                const userId = parts[index + 1];
                return (
                    <Link key={index} href={`/profile/${userId}`} className="text-primary font-semibold hover:underline">
                        @{part}
                    </Link>
                );
            }
            if (index % 3 === 2) { // This is the user id, we skip it
                return null;
            }
            return part; // This is regular text
        });
    };
    
    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.creatorPhotoURL} alt={comment.creatorName} />
                <AvatarFallback>{comment.creatorName.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="w-full">
                 <div className="bg-muted rounded-lg p-2 px-3 text-sm w-full">
                    <Link href={`/profile/${comment.creatorUid}`} className="font-semibold hover:underline">{comment.creatorName}</Link>
                    <p className="whitespace-pre-wrap break-words">{renderContentWithMentions(comment.content)}</p>
                    {comment.linkPreview && <LinkPreviewCard preview={comment.linkPreview} />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 pt-1">
                    <span>{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
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
    const { user, likePost, loading, deletePost } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string|null>(null);

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
    
    const handleCopyLink = () => {
        const postUrl = `${window.location.origin}/posts/${post.id}`;
        navigator.clipboard.writeText(postUrl);
        toast({ title: "Link Copied!", description: "The post link has been copied to your clipboard." });
    };

    const renderContentWithMentions = (content: string) => {
        const mentionRegex = /@\[(.+?)\]\((.+?)\)/g;
        const parts = content.split(mentionRegex);
        return parts.map((part, index) => {
            if (index % 3 === 1) { // This is the user name
                const userId = parts[index + 1];
                return (
                    <Link key={index} href={`/profile/${userId}`} className="text-primary font-semibold hover:underline">
                        @{part}
                    </Link>
                );
            }
            if (index % 3 === 2) { // This is the user id, we skip it
                return null;
            }
            return part; // This is regular text
        });
    };
    
    const handleDeletePost = async (postId: string) => {
        setDeletingId(postId);
        const success = await deletePost(postId);
        setDeletingId(null);
        if (success) {
            toast({ title: "Post Deleted", description: "Your post has been removed." });
        } else {
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete the post." });
        }
    }

    return (
        <div className="w-full bg-card border-b py-4">
            <div className="container mx-auto">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 mb-4">
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
                    {user?.uid === post.creatorUid && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <span className="sr-only">More options</span>
                                    ...
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/posts/edit/${post.id}`}><Pencil className="mr-2 h-4 w-4" />Edit</Link>
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                             <Trash className="mr-2 h-4 w-4" />Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete your post. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeletePost(post.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                {post.content && <p className="whitespace-pre-wrap mb-2 break-words">{renderContentWithMentions(post.content)}</p>}
                
                {post.linkPreview && <LinkPreviewCard preview={post.linkPreview} />}
                
                <PostAttachment post={post} />

                <div className="pt-4 mt-4 border-t">
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <Button variant="ghost" size="sm" onClick={handleLike} disabled={!user} className="flex items-center gap-2">
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                            <span>{post.likes?.length || 0}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setShowComments(!showComments)}>
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments?.length || 0}</span>
                        </Button>
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
                                <SharePostDialog post={post}>
                                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                         <SendToBack className="mr-2 h-4 w-4" />
                                         <span>Share in Unite</span>
                                    </DropdownMenuItem>
                                </SharePostDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {showComments && (
                        <div className="w-full pt-2">
                            <CommentList comments={post.comments || []} postId={post.id} />
                            {user && <CommentForm postId={post.id} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Ad Card in Feed ---
function AdCard({ ad }: { ad: Ad }) {
    return (
        <div className="w-full bg-primary/5 border-b py-4">
             <div className="container mx-auto">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">{ad.campaignName}</h3>
                    <span className="text-xs font-bold uppercase text-primary">AD</span>
                </div>
                <p>{ad.content}</p>
             </div>
        </div>
    );
}

function FeedContent() {
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
        
        // Add a unique key for rendering
        return feed.map((item, index) => ({ ...item, uniqueId: `${item.id}-${index}` }));

    }, [posts, ads]);
    
    if (loading) {
        return (
            <div className="w-full space-y-6 container mx-auto">
                <div className="w-full border-b py-4">
                    <div className="flex items-center gap-4 mb-4"><div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div> <div className="h-4 w-1/4 bg-muted rounded-md animate-pulse"></div></div>
                    <div className="h-20 bg-muted rounded-md animate-pulse mb-4"></div>
                    <div className="h-8 w-1/4 bg-muted rounded-md animate-pulse"></div>
                </div>
            </div>
        );
    }
    
     return (
         <div className="bg-card">
            {feedItems.length > 0 ? (
                feedItems.map((item) => {
                    if (item.itemType === 'post') {
                        return <PostCard key={item.id} post={item as PostType} />
                    }
                    // The uniqueId is used here to avoid key collision for ads
                    return <AdCard key={(item as any).uniqueId} ad={item as Ad} />
                })
            ) : (
                <div className="container mx-auto">
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg my-4">
                        <h2 className="text-xl font-semibold">The feed is empty!</h2>
                        <p className="mt-4">No posts have been made yet. Sign up and be the first to share something.</p>
                        <Button asChild variant="default" className="mt-4">
                        <Link href="/signup-user">Create an Account</Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
     )
}

function CoursesContent() {
  const { courses, user, purchaseCourse, purchasedCourses } = useAppContext();
  const { toast } = useToast();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (courseId: string, title: string) => {
    setPurchasingId(courseId);
    const success = await purchaseCourse(courseId);
    setPurchasingId(null);
    if (success) {
      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased "${title}".`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "You may not have enough points or already own this course.",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-3xl font-bold font-headline">Courses</h2>
                <p className="text-muted-foreground">Browse our marketplace of user-created courses.</p>
            </div>
             {user?.type === 'user' && (
                <Button asChild className="mt-4 sm:mt-0">
                    <Link href="/courses/create"><PlusCircle className="h-4 w-4 mr-2"/>Create Course</Link>
                </Button>
            )}
        </div>


      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {courses.map((course) => {
            const isPurchased = purchasedCourses.some(pc => pc.id === course.id);
            const isPurchasing = purchasingId === course.id;
            const excerpt = course.content.replace(/<[^>]+>/g, '').substring(0, 100) + '...';

            return (
              <Card key={course.id} className="flex flex-col">
                 <Link href={`/courses/${course.id}`} className="block">
                    <div className="relative aspect-video">
                    <Image
                        src={course.imageUrl}
                        alt={course.title}
                        data-ai-hint={course.imageHint}
                        fill
                        className="object-cover rounded-t-lg"
                    />
                    </div>
                </Link>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{excerpt}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">Created by: {course.creatorName}</p>
                </CardContent>
                <div className="flex justify-between items-center p-6 pt-0">
                    <div className="font-bold text-lg flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-accent"/>
                        <span>{course.price}</span>
                    </div>
                  {user?.type === 'user' ? (
                     isPurchased ? (
                         <Link href={`/courses/${course.id}`}>
                            <Badge variant="secondary" className="border-green-500 text-green-600 hover:bg-green-50">
                               <CheckCircle className="h-4 w-4 mr-2"/> View Course
                            </Badge>
                         </Link>
                     ) : (
                        <Button onClick={() => handlePurchase(course.id, course.title)} disabled={isPurchasing}>
                            {isPurchasing ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <ShoppingBag className="h-4 w-4 mr-2"/>}
                            {isPurchasing ? 'Purchasing...' : 'Purchase'}
                        </Button>
                     )
                  ) : (
                    <Button disabled={!user} onClick={() => user && handlePurchase(course.id, course.title)}><ShoppingBag className="h-4 w-4 mr-2"/> Purchase</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No Courses Available</h2>
            <p className="text-muted-foreground mt-2">Check back later or be the first to create one!</p>
        </div>
      )}
    </div>
  );
}

function GroupsContent() {
    const { groups, user } = useAppContext();

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Groups</h1>
                    <p className="text-muted-foreground">Find and join groups to collaborate and chat.</p>
                </div>
                {user && (
                    <Button asChild className="mt-4 sm:mt-0">
                        <Link href="/groups/create"><PlusCircle className="h-4 w-4 mr-2"/>Create Group</Link>
                    </Button>
                )}
            </div>

            {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <Card key={group.id} className="flex flex-col hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="truncate">{group.name}</span>
                                    {group.hasPin && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                                </CardTitle>
                                <CardDescription>{group.description.substring(0, 100)}{group.description.length > 100 && '...'}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>{group.members?.length || 0} members</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                 <Button asChild className="w-full">
                                    <Link href={`/groups/${group.id}`}>View Group</Link>
                                 </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No Groups Yet</h2>
                    <p className="text-muted-foreground mt-2">Be the first to create one and start a community!</p>
                </div>
            )}
        </div>
    );
}

function CommunityContent() {
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
                                    <UserIconLucide className="mr-2 h-4 w-4" />
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

function MessagesContent() {
    const { user, allUsers, conversations, startConversation, loading } = useAppContext();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserType[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const filteredUsers = allUsers.filter(u =>
            u.uid !== user?.uid &&
            u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filteredUsers);
        setIsSearching(false);
    }, [searchTerm, allUsers, user]);

    const handleStartConversation = async (otherUser: UserType) => {
        const conversationId = await startConversation(otherUser.uid);
        if (conversationId) {
            router.push(`/messages/${conversationId}`);
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

    const getOtherParticipant = (convo: Conversation) => {
        if (!user) return null;
        const otherUid = convo.participantUids.find(uid => uid !== user.uid);
        return convo.participants[otherUid!];
    }
    
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold font-headline mb-4">Messages</h1>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search for people to message"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchResults.length > 0 && (
                    <Card className="absolute top-full mt-2 w-full z-10 max-h-60 overflow-y-auto">
                        <CardContent className="p-2">
                           {searchResults.map(foundUser => (
                               <div key={foundUser.uid} onClick={() => handleStartConversation(foundUser)} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                                   <Avatar className="h-8 w-8">
                                        <AvatarImage src={foundUser.photoURL} alt={foundUser.name} />
                                        <AvatarFallback>{getInitials(foundUser.name)}</AvatarFallback>
                                   </Avatar>
                                   <span>{foundUser.name}</span>
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                )}
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && <p>Loading conversations...</p>}
                    {!loading && conversations.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-xl font-semibold">No conversations yet</h3>
                            <p>Use the search bar to find someone to talk to.</p>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {conversations.map(convo => {
                                const otherParticipant = getOtherParticipant(convo);
                                if (!otherParticipant) return null;
                                return (
                                    <li key={convo.id}>
                                         <Link href={`/messages/${convo.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.name} />
                                                <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-semibold truncate">{otherParticipant.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">{convo.lastMessage?.content || 'No messages yet'}</p>
                                            </div>
                                             {convo.lastMessage && (
                                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(convo.lastMessage.timestamp), { addSuffix: true })}</p>
                                             )}
                                         </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}

function NotificationsContent() {
    const { notifications, loading } = useAppContext();

    const getNotificationMessage = (n: Notification) => {
        switch (n.type) {
            case 'new_follower':
                return <>started following you.</>;
            case 'post_like':
                return <>liked your post.</>;
            case 'comment_like':
                return <>liked your comment.</>;
            case 'new_comment':
                return <>commented on your post.</>;
            case 'new_reply':
                return <>replied to your comment.</>;
            case 'mention':
                return <>mentioned you in a {n.message}.</>
            case 'new_group_message':
                return <span className="text-muted-foreground">{n.message}</span>;
            case 'new_direct_message':
                 return <span className="text-muted-foreground">{n.message}</span>
            default:
                return null;
        }
    }

    return (
        <div className="container mx-auto py-8">
            <h2 className="text-3xl font-bold font-headline mb-4">Notifications</h2>
             <div className="bg-card border rounded-lg">
                <div className="p-0">
                    {loading && <p className="p-6">Loading notifications...</p>}
                    {!loading && notifications.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            <Bell className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-xl font-semibold">No new notifications</h3>
                            <p>Check back later to see updates.</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                           {notifications.map(n => (
                               <li key={n.id} className={`p-4 flex items-center gap-4 transition-colors ${!n.isRead ? 'bg-primary/5' : 'bg-transparent'}`}>
                                   <Link href={`/profile/${n.actorUid}`}>
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={n.actorPhotoURL} alt={n.actorName} />
                                            <AvatarFallback>{n.actorName?.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                   </Link>
                                   <div className="flex-1">
                                       <p className="text-sm">
                                           <Link href={`/profile/${n.actorUid}`} className="font-bold hover:underline">{n.actorName}</Link>
                                           {' '}
                                           {getNotificationMessage(n)}
                                       </p>
                                       <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}</p>
                                   </div>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={n.targetUrl}>View</Link>
                                    </Button>
                               </li>
                           ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function HomePage() {
    const { user, notifications, markNotificationsAsRead } = useAppContext();
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState("home");
    
    // This effect handles both setting the initial tab from the URL hash
    // and navigating to the hash when the tab is changed.
    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (hash && ['home', 'courses', 'groups', 'community', 'messages', 'notifications'].includes(hash)) {
            setActiveTab(hash);
        } else {
             setActiveTab('home');
        }
    }, [pathname]); // Rerun when path changes, e.g. navigating away and back.
    
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.push(`/#${tab}`, { scroll: false });
    };

    const hasUnreadNotifications = notifications.some(n => !n.isRead);

    useEffect(() => {
        if (activeTab === 'notifications' && hasUnreadNotifications) {
            // Add a small delay to allow user to see the change
            setTimeout(() => {
                markNotificationsAsRead();
            }, 1000);
        }
    }, [activeTab, hasUnreadNotifications, markNotificationsAsRead]);

    // Don't show tabs on profile pages
    if (pathname.startsWith('/profile/')) {
        return null;
    }

    return (
        <div className="w-full">
            <Tabs defaultValue="home" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="sticky top-16 z-40 bg-background border-b">
                    <div className="container mx-auto">
                        <TabsList className="grid w-full grid-cols-6 max-w-2xl mx-auto">
                            <TabsTrigger value="home"><HomeIcon className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="courses"><ShoppingBag className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="groups"><Users className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="community"><UserIconLucide className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="messages"><MessageSquare className="h-5 w-5" /></TabsTrigger>
                             <TabsTrigger value="notifications" className="relative">
                                <Bell className="h-5 w-5" />
                                {hasUnreadNotifications && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />}
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>
                 <TabsContent value="home" className="mt-0">
                    <CreatePostForm />
                    <FeedContent />
                </TabsContent>
                <TabsContent value="courses" className="mt-0">
                    <CoursesContent />
                </TabsContent>
                <TabsContent value="groups" className="mt-0">
                    <GroupsContent />
                </TabsContent>
                <TabsContent value="community" className="mt-0">
                    <CommunityContent />
                </TabsContent>
                <TabsContent value="messages" className="mt-0">
                    <MessagesContent />
                </TabsContent>
                <TabsContent value="notifications" className="mt-0">
                    <NotificationsContent />
                </TabsContent>
            </Tabs>
        </div>
    );
}

    