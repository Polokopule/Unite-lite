
"use client";

import { useAppContext } from "@/contexts/app-context";
import WelcomePage from "@/app/welcome/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommunityPage from "./community/page";
import CoursesMarketplacePage from "./courses/page";
import GroupsPage from "./groups/page";
import { CreatePostForm } from "@/components/create-post-form";
import { PostCard } from "@/components/post-card";
import { Home, Book, Users, MessageSquare, BellRing, LayoutDashboard, Building2, User } from "lucide-react";
import Link from "next/link";
import { ConversationsList } from "@/app/conversations-list";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationsPage from "./notifications/page";
import { useRouter } from "next/navigation";


function HomeFeedSkeleton() {
    return (
        <div className="space-y-6">
            <div className="bg-card border-b p-4">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-10 flex-1 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                 </div>
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-lg">
                    <div className="p-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 pt-0 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function HomeFeed() {
    const { posts, loading } = useAppContext();

    if (loading) {
        return <HomeFeedSkeleton />;
    }

    return (
        <div className="w-full">
            <CreatePostForm />
            <div className="py-8 space-y-6">
                {posts.length > 0 ? (
                    posts.map(post => <PostCard key={post.id} post={post} />)
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold">The feed is empty.</h2>
                        <p className="mt-2">Be the first to share something with the community!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MessagesSkeleton() {
    return (
        <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center p-2 gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function GroupsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
        </div>
    );
}

export default function HomePage() {
    const { user, loading } = useAppContext();
    const router = useRouter();

    if (loading) {
        return (
            <div>
                <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                    <div className="w-full">
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
                 <div className="p-4"><HomeFeedSkeleton /></div>
            </div>
        );
    }
    
    if (!user) {
        return <WelcomePage />;
    }

    return (
      <div className="w-full">
        <Tabs defaultValue="home" className="w-full">
            <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="w-full">
                    <TabsList className="grid w-full grid-cols-7 h-16">
                        <TabsTrigger value="home"><Home className="h-6 w-6" /></TabsTrigger>
                        <TabsTrigger value="courses"><Book className="h-6 w-6" /></TabsTrigger>
                        <TabsTrigger value="community"><Users className="h-6 w-6" /></TabsTrigger>
                        <TabsTrigger value="groups"><Building2 className="h-6 w-6" /></TabsTrigger>
                        <TabsTrigger value="messages"><MessageSquare className="h-6 w-6" /></TabsTrigger>
                        <TabsTrigger value="notifications"><BellRing className="h-6 w-6" /></TabsTrigger>
                        <TabsTrigger value="dashboard" onClick={() => router.push('/dashboard')}><LayoutDashboard className="h-6 w-6" /></TabsTrigger>
                    </TabsList>
                </div>
            </div>
            
            <div className="w-full">
                <TabsContent value="home" className="p-0 m-0">
                  <HomeFeed />
                </TabsContent>
                <TabsContent value="courses">
                  <CoursesMarketplacePage />
                </TabsContent>
                <TabsContent value="community">
                  <CommunityPage />
                </TabsContent>
                <TabsContent value="groups">
                     <div className="container mx-auto py-8">
                        {loading ? <GroupsSkeleton /> : <GroupsPage />}
                    </div>
                </TabsContent>
                <TabsContent value="messages">
                    <div className="container mx-auto py-8">
                        {loading ? <MessagesSkeleton /> : <ConversationsList />}
                    </div>
                </TabsContent>
                 <TabsContent value="notifications">
                    <NotificationsPage />
                </TabsContent>
            </div>
        </Tabs>
      </div>
    );
}
