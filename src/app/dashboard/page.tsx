

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/contexts/app-context";
import { Ad, Course, Post as PostType, FeedItem, Comment as CommentType } from "@/lib/types";
import { ArrowRight, BookCopy, Eye, PlusCircle, ShoppingBag, Pencil, Trash2, Loader2, MessageCircle, Heart, Send, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";


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

  const defaultTab = user.type === 'user' ? 'my_courses' : 'my_ads';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold font-headline mb-2">
        Welcome back, {user.name}!
      </h1>
      <p className="text-muted-foreground mb-8">Here's a summary of your activity on Unite.</p>
      
      <Tabs defaultValue={defaultTab} className="w-full">
         <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-8">
            {user.type === 'user' ? (
                <>
                    <TabsTrigger value="my_courses">My Courses</TabsTrigger>
                    <TabsTrigger value="my_posts">My Posts</TabsTrigger>
                </>
            ) : (
                <>
                    <TabsTrigger value="my_ads">My Ad Campaigns</TabsTrigger>
                    <TabsTrigger value="my_posts">My Posts</TabsTrigger>
                </>
            )}
        </TabsList>
        
        <TabsContent value="my_courses">
            {user.type === 'user' && <UserCoursesDashboard />}
        </TabsContent>

        <TabsContent value="my_ads">
            {user.type === 'business' && <BusinessDashboard />}
        </TabsContent>

        <TabsContent value="my_posts">
            <UserPostsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserPostsDashboard() {
    const { user, posts, deletePost } = useAppContext();
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string|null>(null);

    if (!user) return null;

    const userPosts = posts.filter(post => post.creatorUid === user.uid);

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
         <Card>
          <CardHeader>
            <CardTitle>My Posts</CardTitle>
            <CardDescription>The posts you have created.</CardDescription>
          </CardHeader>
          <CardContent>
            {userPosts.length > 0 ? (
                <ul className="space-y-2">
                    {userPosts.map(post => (
                        <li key={post.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="font-medium truncate pr-4">{post.content.substring(0, 100) || "Media Post"}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button variant="outline" size="icon" asChild>
                                    <Link href={`/posts/edit/${post.id}`}><Pencil className="h-4 w-4" /></Link>
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={deletingId === post.id}>
                                            {deletingId === post.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        </Button>
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
                                            <AlertDialogAction onClick={() => handleDeletePost(post.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't created any posts yet.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/">Create your first post <ArrowRight className="h-4 w-4 ml-2"/></Link>
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
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
                    <Link href="/#courses"><ShoppingBag className="mr-2 h-4 w-4"/>Browse Marketplace</Link>
                </Button>
                 <Button asChild size="lg" variant="secondary">
                    <Link href="/courses/create"><PlusCircle className="mr-2 h-4 w-4"/>Create a New Course</Link>
                </Button>
                 <Button asChild size="lg" variant="outline">
                    <Link href="/profile/edit"><Edit className="mr-2 h-4 w-4"/>Edit Profile</Link>
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

    