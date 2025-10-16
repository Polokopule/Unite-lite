
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Ad, Post as PostType, FeedItem, Course, Group, User as UserType, Notification, Conversation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, CheckCircle, PlusCircle, Home as HomeIcon, Bell, Users, MessageSquare, User as UserIconLucide, Search, Bot, Wallet, Lock, ShieldCheck as ShieldCheck, Settings } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePostForm } from "@/components/create-post-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { getAuth } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/post-card";
import { isVerified, formatTimeAgo } from "@/lib/utils";
import SettingsPage from "@/app/settings/page";
import toast from "react-hot-toast";


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
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (courseId: string, title: string) => {
    setPurchasingId(courseId);
    await purchaseCourse(courseId);
    setPurchasingId(null);
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
                                    <span>{Object.keys(group.members || {}).length} members</span>
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
                            <CardTitle className="text-lg flex items-center justify-center gap-1">
                                <span>{user.name}</span>
                                {isVerified(user) && <ShieldCheck className="h-5 w-5 text-primary" />}
                            </CardTitle>
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
        } else {
            toast.error("Could not start conversation.");
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
        if (!otherUid) return null;
        return allUsers.find(u => u.uid === otherUid);
    }
    
    return (
        <div className="py-8">
            <div className="container mx-auto">
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
                <h2 className="text-2xl font-bold font-headline mb-4">Recent Conversations</h2>
            </div>
            
             <div className="border-y">
                <div className="container mx-auto px-0">
                    {loading && <p className="p-4">Loading conversations...</p>}
                    {!loading && conversations.length === 0 && (
                         <div className="text-center text-muted-foreground py-12">
                            <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-xl font-semibold">No conversations yet</h3>
                            <p>Use the search bar to find someone to talk to.</p>
                        </div>
                    )}
                    <ul className="space-y-0">
                        {user && (
                            <li className="border-b last:border-b-0">
                                <Link href="/messages/ai" className="flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                                    <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                                        <AvatarFallback><Bot /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate">Unite AI</p>
                                        <p className="text-sm text-muted-foreground truncate">Your helpful AI assistant.</p>
                                    </div>
                                </Link>
                            </li>
                        )}
                        {conversations.map(convo => {
                            const otherParticipant = getOtherParticipant(convo);
                            if (!otherParticipant) return null;
                            return (
                                <li key={convo.id} className="border-b last:border-b-0">
                                     <Link href={`/messages/${convo.id}`} className="flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.name} />
                                            <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold truncate">{otherParticipant.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{convo.lastMessage?.content || 'No messages yet'}</p>
                                        </div>
                                         {convo.lastMessage && (
                                            <p className="text-xs text-muted-foreground">{formatTimeAgo(new Date(convo.lastMessage.timestamp).getTime())}</p>
                                         )}
                                     </Link>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>

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
        <div className="py-8">
             <div className="container mx-auto">
                 <h2 className="text-3xl font-bold font-headline mb-4">Notifications</h2>
             </div>
             <div className="bg-card border-y">
                <div className="p-0">
                    {loading && <p className="p-6 container mx-auto">Loading notifications...</p>}
                    {!loading && notifications.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12 container mx-auto">
                            <Bell className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-xl font-semibold">No new notifications</h3>
                            <p>Check back later to see updates.</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                           {notifications.map(n => (
                               <li key={n.id} className={`transition-colors ${!n.isRead ? 'bg-primary/5' : 'bg-transparent'}`}>
                                   <div className="mx-auto p-4 flex items-center gap-4 container">
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
                                           <p className="text-xs text-muted-foreground">{formatTimeAgo(new Date(n.timestamp).getTime())}</p>
                                       </div>
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={n.targetUrl}>View</Link>
                                        </Button>
                                   </div>
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
    const { user, loading, notifications, markNotificationsAsRead } = useAppContext();
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState("home");
    
    // This effect handles both setting the initial tab from the URL hash
    // and navigating to the hash when the tab is changed.
    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const validTabs = ['home', 'courses', 'groups', 'community', 'messages', 'notifications', 'settings'];
        if (hash && validTabs.includes(hash)) {
            if (!loading && !user && (hash === 'messages' || hash === 'notifications' || hash === 'settings')) {
                router.push('/login-user');
            } else {
                setActiveTab(hash);
            }
        } else {
             setActiveTab('home');
        }
    }, [pathname, user, loading, router]); // Rerun when path changes, e.g. navigating away and back.
    
    const handleTabChange = (tab: string) => {
        if (!loading && !user && (tab === 'messages' || tab === 'notifications' || tab === 'settings')) {
            router.push('/login-user');
            return;
        }
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
                        <TabsList className="grid w-full grid-cols-7 max-w-2xl mx-auto">
                            <TabsTrigger value="home"><HomeIcon className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="courses"><ShoppingBag className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="groups"><Users className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="community"><UserIconLucide className="h-5 w-5" /></TabsTrigger>
                            <TabsTrigger value="messages"><MessageSquare className="h-5 w-5" /></TabsTrigger>
                             <TabsTrigger value="notifications" className="relative">
                                <Bell className="h-5 w-5" />
                                {hasUnreadNotifications && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />}
                            </TabsTrigger>
                            <TabsTrigger value="settings"><Settings className="h-5 w-5" /></TabsTrigger>
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
                <TabsContent value="settings" className="mt-0">
                    <SettingsPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}
