
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Ad, Post as PostType, FeedItem, Comment as CommentType, Course, Group, User as UserType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, Heart, Send, ShoppingBag, Wallet, CheckCircle, PlusCircle, Home as HomeIcon, Bell, Users, Lock, User as UserIconLucide } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePostForm } from "@/components/create-post-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { getAuth } from "firebase/auth";


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
        <div className="w-full bg-card border-b py-4">
            <div className="container mx-auto">
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
                <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                <div className="pb-3 pt-3 flex-col items-start">
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

        return feed;

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
                feedItems.map((item) => 
                    item.itemType === 'post' 
                        ? <PostCard key={`post-${item.id}`} post={item} />
                        : <AdCard key={`ad-${item.id}`} ad={item} />
                )
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


function NotificationsContent() {
    return (
        <div className="container mx-auto py-8">
            <h2 className="text-3xl font-bold font-headline mb-4">Notifications</h2>
             <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground py-12">
                        <Bell className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold">No new notifications</h3>
                        <p>Check back later to see updates.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function HomePage() {
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState("home");
    
    useEffect(() => {
        if (window.location.hash) {
            const tab = window.location.hash.substring(1);
            if (['home', 'courses', 'groups', 'community', 'notifications'].includes(tab)) {
                setActiveTab(tab);
            }
        }
    }, []);

    return (
        <div className="w-full">
            <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="sticky top-16 z-40 bg-background border-b">
                    <div className="container mx-auto">
                        <TabsList className="grid w-full grid-cols-5 max-w-lg mx-auto">
                            <TabsTrigger value="home"><HomeIcon className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="courses"><ShoppingBag className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="groups"><Users className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="community"><Users className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="notifications"><Bell className="h-5 w-5" /></TabsTrigger>
                        </TabsList>
                    </div>
                </div>
                <TabsContent value="home" className="mt-0">
                    {user && <CreatePostForm />}
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
                <TabsContent value="notifications" className="mt-0">
                    <NotificationsContent />
                </TabsContent>
            </Tabs>
        </div>
    );
}
