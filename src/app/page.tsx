
"use client";

import { useAppContext } from "@/contexts/app-context";
import WelcomePage from "@/app/welcome/page";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommunityPage from "./community/page";
import CoursesMarketplacePage from "./courses/page";
import GroupsPage from "./groups/page";
import { CreatePostForm } from "@/components/create-post-form";
import { PostCard } from "@/components/post-card";
import { Bot, Book, Home, MessageSquare, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { ConversationsList } from "@/components/conversations-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


function HomeFeedSkeleton() {
    return (
        <div className="w-full">
            <div className="bg-card border-b p-4">
                 <div className="flex items-center gap-2 container w-full">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-10 flex-1 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                 </div>
            </div>
            <div className="container mx-auto py-8 max-w-2xl space-y-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
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
            <div className="container mx-auto py-8 max-w-2xl space-y-6">
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


export default function HomePage() {
    const { user, loading } = useAppContext();
    const router = useRouter();

    if (loading) {
        return (
            <div className="container mx-auto py-4">
                <Tabs defaultValue="home" className="w-full">
                    <TabsList className="grid w-full grid-cols-6 mb-8">
                        <TabsTrigger value="home"><Home className="h-5 w-5" /></TabsTrigger>
                        <TabsTrigger value="courses"><Book className="h-5 w-5" /></TabsTrigger>
                        <TabsTrigger value="community"><Users className="h-5 w-5" /></TabsTrigger>
                        <TabsTrigger value="groups"><Users className="h-5 w-5" /></TabsTrigger>
                        <TabsTrigger value="messages"><MessageSquare className="h-5 w-5" /></TabsTrigger>
                        <TabsTrigger value="ai_chat" asChild><Link href="/messages/ai"><Bot className="h-5 w-5"/></Link></TabsTrigger>
                    </TabsList>
                    <TabsContent value="home">
                        <HomeFeedSkeleton />
                    </TabsContent>
                </Tabs>
            </div>
        );
    }
    
    if (!user) {
        return <WelcomePage />;
    }

    return (
      <div className="container mx-auto py-4">
        <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
                <TabsTrigger value="home"><Home className="h-5 w-5" /></TabsTrigger>
                <TabsTrigger value="courses"><Book className="h-5 w-5" /></TabsTrigger>
                <TabsTrigger value="community"><Users className="h-5 w-5" /></TabsTrigger>
                <TabsTrigger value="groups"><Users className="h-5 w-5" /></TabsTrigger>
                <TabsTrigger value="messages"><MessageSquare className="h-5 w-5" /></TabsTrigger>
                <TabsTrigger value="ai_chat" asChild><Link href="/messages/ai"><Bot className="h-5 w-5"/></Link></TabsTrigger>
            </TabsList>
            
            <TabsContent value="home">
              <HomeFeed />
            </TabsContent>
            <TabsContent value="courses">
              <CoursesMarketplacePage />
            </TabsContent>
            <TabsContent value="community">
              <CommunityPage />
            </TabsContent>
            <TabsContent value="groups">
                <GroupsPage />
            </TabsContent>
            <TabsContent value="messages">
                <ConversationsList />
            </TabsContent>
        </Tabs>
      </div>
    );
}
