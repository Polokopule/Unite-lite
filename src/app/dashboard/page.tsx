
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/contexts/app-context";
import { Ad, Course, Post as PostType, FeedItem, Comment as CommentType } from "@/lib/types";
import { ArrowRight, BookCopy, Eye, PlusCircle, ShoppingBag, Pencil, Trash2, Loader2, MessageCircle, Heart, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";

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

function FeedTab() {
    const { user, loading, posts, ads } = useAppContext();

    const feedItems = useMemo(() => {
        if (!user || loading) return [];

        const followedUserIds = user.following || [];
        
        const relevantPosts: FeedItem[] = posts
            .filter(p => followedUserIds.includes(p.creatorUid) || p.creatorUid === user.uid)
            .map(p => ({ ...p, itemType: 'post' as const }));

        // Simple random ad injection
        const feed: FeedItem[] = [...relevantPosts];
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

    }, [posts, ads, user, loading]);

    if (loading) {
        return <div className="text-center"><p>Loading feed...</p></div>;
    }

    return (
        <div className="space-y-6">
            {feedItems.length > 0 ? (
                feedItems.map((item) => 
                    item.itemType === 'post' 
                        ? <PostCard key={`post-${item.id}`} post={item} />
                        : <AdCard key={`ad-${item.id}`} ad={item} />
                )
            ) : (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg max-w-2xl mx-auto">
                    <p className="mt-4">Your feed is empty.</p>
                    <p className="text-sm">Follow people to see their posts here, or create your first post on your profile!</p>
                    <Button asChild variant="link" className="mt-2">
                       <Link href="/community">Find People to Follow</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
  const { user, loading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const defaultTab = user.type === 'user' ? 'feed' : 'my_ads';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold font-headline mb-2">
        Welcome back, {user.name}!
      </h1>
      <p className="text-muted-foreground mb-8">Here's a summary of your activity on Unite.</p>
      
      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-8">
            {user.type === 'user' && <TabsTrigger value="feed">Feed</TabsTrigger>}
            {user.type === 'user' ? <TabsTrigger value="my_courses">My Courses</TabsTrigger> : <TabsTrigger value="my_ads">My Ad Campaigns</TabsTrigger>}
        </TabsList>

        {user.type === 'user' && (
            <TabsContent value="feed">
                <FeedTab />
            </TabsContent>
        )}
        
        <TabsContent value="my_courses">
            {user.type === 'user' && <UserCoursesDashboard />}
        </TabsContent>

        <TabsContent value="my_ads">
            {user.type === 'business' && <BusinessDashboard />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserCoursesDashboard() {
    const { user, courses, purchasedCourses, deleteCourse } = useAppContext();
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string|null>(null);
    
    if (!user) return null;

    const purchasedCourseDetails = purchasedCourses.map(pc => courses.find(c => c.id === pc.id)).filter(Boolean) as Course[];
    const createdCourses = courses.filter(course => course.creator === user.uid);

    const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
      setDeletingId(courseId);
      const success = await deleteCourse(courseId);
      setDeletingId(null);
      if (success) {
        toast({ title: "Course Deleted", description: `"${courseTitle}" has been removed.` });
      } else {
        toast({ variant: 'destructive', title: "Error", description: "Failed to delete the course." });
      }
    }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Purchased Courses</CardTitle>
            <CardDescription>The courses you have purchased.</CardDescription>
          </CardHeader>
          <CardContent>
            {purchasedCourseDetails.length > 0 ? (
                <ul className="space-y-4">
                    {purchasedCourseDetails.map(course => (
                        <li key={course.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-4">
                               <BookCopy className="h-5 w-5 text-primary"/>
                                <span className="font-medium">{course.title}</span>
                            </div>
                             <Button asChild variant="ghost" size="sm">
                                <Link href={`/courses/${course.id}`}>View Course</Link>
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't purchased any courses yet.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/courses">Browse Courses <ArrowRight className="h-4 w-4 ml-2"/></Link>
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Created Courses</CardTitle>
            <CardDescription>The courses you have created.</CardDescription>
          </CardHeader>
          <CardContent>
            {createdCourses.length > 0 ? (
                <ul className="space-y-2">
                    {createdCourses.map(course => (
                        <li key={course.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="font-medium">{course.title}</span>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" asChild>
                                    <Link href={`/courses/edit/${course.id}`}><Pencil className="h-4 w-4" /></Link>
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={deletingId === course.id}>
                                            {deletingId === course.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete "{course.title}". This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteCourse(course.id, course.title)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't created any courses yet.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/courses/create">Create your first course <ArrowRight className="h-4 w-4 ml-2"/></Link>
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                 <Button asChild size="lg">
                    <Link href="/courses"><ShoppingBag className="mr-2 h-4 w-4"/>Browse Marketplace</Link>
                </Button>
                 <Button asChild size="lg" variant="secondary">
                    <Link href="/courses/create"><PlusCircle className="mr-2 h-4 w-4"/>Create a New Course</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BusinessDashboard() {
    const { user, ads, deleteAd } = useAppContext();
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    if(!user) return null;

    const userAds = ads.filter(ad => ad.creator === user.uid);
    const totalViews = userAds.reduce((sum, ad) => sum + ad.views, 0);
    
    const handleDeleteAd = async (adId: string, campaignName: string) => {
        setDeletingId(adId);
        const success = await deleteAd(adId);
        setDeletingId(null);
        if (success) {
            toast({ title: "Ad Campaign Deleted", description: `"${campaignName}" has been removed.`});
        } else {
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete the ad campaign." });
        }
    }

  return (
     <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>My Ad Campaigns</CardTitle>
                <CardDescription>A list of your active and past ad campaigns.</CardDescription>
            </div>
            <Button asChild>
                <Link href="/create-ad"><PlusCircle className="mr-2 h-4 w-4"/>New Campaign</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {userAds.length > 0 ? (
                <ul className="space-y-2">
                    {userAds.map(ad => (
                        <li key={ad.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                           <div className="flex-1">
                             <p className="font-semibold">{ad.campaignName}</p>
                             <p className="text-sm text-muted-foreground">{ad.content}</p>
                           </div>
                           <div className="flex items-center gap-4 mx-4">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <Eye className="h-5 w-5 text-primary"/>
                                    <span>{ad.views}</span>
                                </div>
                           </div>
                           <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" asChild>
                                    <Link href={`/create-ad/edit/${ad.id}`}><Pencil className="h-4 w-4" /></Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={deletingId === ad.id}>
                                            {deletingId === ad.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the "{ad.campaignName}" campaign. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteAd(ad.id, ad.campaignName)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                           </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't created any ad campaigns.</p>
                     <Button asChild variant="link" className="mt-2">
                        <Link href="/create-ad">Create your first ad <ArrowRight className="h-4 w-4 ml-2"/></Link>
                    </Button>
                </div>
            )}
            {userAds.length > 0 && (
                <>
                <Separator className="my-6"/>
                <div className="flex justify-end items-center gap-4">
                    <p className="font-bold text-lg">Total Views:</p>
                    <p className="font-bold text-2xl text-primary">{totalViews}</p>
                </div>
                </>
            )}
          </CardContent>
        </Card>
      </div>
  );
}

