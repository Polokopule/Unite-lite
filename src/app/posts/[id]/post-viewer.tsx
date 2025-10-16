

"use client";

import { useParams } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import React, { useEffect, useState, useMemo } from "react";
import { Post as PostType, Comment as CommentType, LinkPreview } from "@/lib/types";
import { Loader2, MessageSquare, Heart, Send, File as FileIcon, Share2, Link2, SendToBack, Repeat, Trash, Pencil, ShieldCheck, Trash2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { User as UserType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

// --- Reusable Components from page.tsx (Consider moving to a components directory) ---

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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const mentionResults = useMemo(() => {
    if (!mentionQuery) return [];
    return allUsers.filter(u =>
      u.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [mentionQuery, allUsers]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const mentionMatch = text.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: UserType) => {
    const newContent = value.replace(/@(\w*)$/, `@[${user.name}](${user.uid}) `);
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
        className="min-h-[80px]"
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
        if (!searchTerm || !user) return [];
        return allUsers.filter(u =>
            u.uid !== user.uid &&
            u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allUsers, user]);
    
    const resetState = () => {
        setSearchTerm("");
        setSelectedUser(null);
        setIsSharing(false);
    }
    
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            resetState();
        }
        setOpen(isOpen);
    }

    const handleShareToFriend = async () => {
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
        handleOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share to a friend</DialogTitle>
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
                    <Button onClick={handleShareToFriend} disabled={!selectedUser || isSharing} className="w-full">
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

const isVerified = (user: UserType) => {
    return user.email === 'polokopule91@gmail.com' || (user.followers && user.followers.length >= 1000000);
}

function CommentItem({ comment, postId }: { comment: CommentType; postId: string }) {
    const { user, allUsers, likeComment, deleteComment } = useAppContext();
    const [showReplyForm, setShowReplyForm] = useState(false);
    
    const creator = allUsers.find(u => u.uid === comment.creatorUid);
    const isLiked = user ? comment.likes.includes(user.uid) : false;

    const handleLike = () => {
        if (!user) return;
        likeComment(postId, comment.id);
    }

    const handleDelete = async () => {
        await deleteComment(postId, comment.id);
    };
    
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
                    <div className="flex items-center gap-1">
                        <Link href={`/profile/${comment.creatorUid}`} className="font-semibold hover:underline">{comment.creatorName}</Link>
                        {creator && isVerified(creator) && <ShieldCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="whitespace-pre-wrap break-words">{renderContentWithMentions(comment.content)}</p>
                    {comment.linkPreview && <LinkPreviewCard preview={comment.linkPreview} />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 pt-1">
                    <span>{formatTimeAgo(new Date(comment.timestamp).getTime())}</span>
                    <Button onClick={handleLike} disabled={!user} variant="ghost" size="icon" className={`h-6 w-6 ${isLiked ? 'text-primary' : ''}`}>
                        <Heart className="h-3 w-3" />
                    </Button>
                    <Button onClick={() => setShowReplyForm(!showReplyForm)} variant="ghost" size="icon" className="h-6 w-6">
                        <MessageSquare className="h-3 w-3" />
                    </Button>
                     {comment.likes.length > 0 && (
                        <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                            {comment.likes.length}
                        </span>
                    )}
                    {user?.uid === comment.creatorUid && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete Comment?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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

function PostCard({ post }: { post: PostType }) {
    const { user, allUsers, likePost, loading, deletePost, addPost } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string|null>(null);

    const likers = useMemo(() => {
        return allUsers.filter(user => post.likes?.includes(user.uid));
    }, [allUsers, post.likes]);

    const creator = allUsers.find(u => u.uid === post.creatorUid);

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

    const handleShareAsPost = async () => {
        await addPost({
            content: post.content,
            repostedFrom: {
                creatorUid: post.creatorUid,
                creatorName: post.creatorName,
            },
            fileUrl: post.fileUrl,
            fileName: post.fileName,
            fileType: post.fileType,
            linkPreview: post.linkPreview,
        });
        toast({ title: "Post Shared!", description: "You have shared this post to your feed." });
    }

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
        <Card className="w-full">
            <CardHeader>
                {post.repostedFrom && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        <Repeat className="h-4 w-4" />
                        Reposted from <Link href={`/profile/${post.repostedFrom.creatorUid}`} className="font-semibold hover:underline">{post.repostedFrom.creatorName}</Link>
                    </div>
                )}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/profile/${post.creatorUid}`}>
                            <Avatar className="h-10 w-10">
                                {post.creatorPhotoURL && <AvatarImage src={post.creatorPhotoURL} alt={post.creatorName} />}
                                <AvatarFallback>{post.creatorName.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <div className="flex items-center gap-1">
                                <Link href={`/profile/${post.creatorUid}`} className="font-semibold hover:underline">{post.creatorName}</Link>
                                {creator && isVerified(creator) && <ShieldCheck className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatTimeAgo(new Date(post.timestamp).getTime())}
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
                </CardHeader>
            <CardContent>
                {post.content && <p className="whitespace-pre-wrap mb-2 break-words">{renderContentWithMentions(post.content)}</p>}
                
                {post.linkPreview && <LinkPreviewCard preview={post.linkPreview} />}
                
                <PostAttachment post={post} />
            </CardContent>

            <CardFooter className="flex-col items-start">
                <div className="pt-4 mt-4 border-t w-full">
                    <div className="flex items-center text-muted-foreground">
                        <Button variant="ghost" size="sm" onClick={handleLike} disabled={!user} className="flex items-center gap-2">
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
                                    <Link2 className="mr-2 h-4 w-4" /> Copy Link
                                </DropdownMenuItem>
                                <SharePostDialog post={post}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <SendToBack className="mr-2 h-4 w-4" /> Share to a friend
                                    </DropdownMenuItem>
                                </SharePostDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Repeat className="mr-2 h-4 w-4" /> Share as new post
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Share this post to your feed?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will create a new post on your profile containing the content and media of the original post.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleShareAsPost}>Yes, share</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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


export default function PostViewer({ postId }: { postId: string }) {
    const { posts, loading } = useAppContext();
    const router = useRouter();

    const [post, setPost] = useState<PostType | null>(null);

    useEffect(() => {
        if (!loading) {
            const foundPost = posts.find(p => p.id === postId);
            if (foundPost) {
                setPost(foundPost);
            } else {
                // If post is not found in the context after loading, maybe it's a new one.
                // Or you might want to redirect to a 404 page.
                // For now, let's just wait for context.
            }
        }
    }, [postId, posts, loading, router]);


    if (loading) {
        return (
            <div className="container mx-auto py-8 max-w-2xl">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div>
                            <div className="space-y-2">
                                 <div className="h-4 w-32 bg-muted rounded-md animate-pulse"></div>
                                 <div className="h-3 w-24 bg-muted rounded-md animate-pulse"></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-20 bg-muted rounded-md animate-pulse mb-4"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!post) {
        return (
             <div className="container mx-auto py-8 text-center">
                <p>Post not found.</p>
                <Button asChild variant="link"><Link href="/">Return to Home</Link></Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <PostCard post={post} />
        </div>
    );
}

    