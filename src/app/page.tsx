
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
import { Bot, Book, Home, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { ConversationsList } from "@/components/conversations-list";


function HomeFeed() {
    const { posts, loading } = useAppContext();

    if (loading) {
        return <div className="container mx-auto py-8"><p>Loading feed...</p></div>;
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
            <div className="h-screen w-full flex items-center justify-center">
                <p>Loading...</p>
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
                <TabsTrigger value="home"><Home className="mr-2 h-4 w-4" />Home</TabsTrigger>
                <TabsTrigger value="courses"><Book className="mr-2 h-4 w-4" />Courses</TabsTrigger>
                <TabsTrigger value="community"><Users className="mr-2 h-4 w-4" />Community</TabsTrigger>
                <TabsTrigger value="groups"><Users className="mr-2 h-4 w-4" />Groups</TabsTrigger>
                <TabsTrigger value="messages"><MessageSquare className="mr-2 h-4 w-4" />Messages</TabsTrigger>
                <TabsTrigger value="ai_chat" asChild><Link href="/messages/ai"><Bot className="mr-2 h-4 w-4"/>AI Chat</Link></TabsTrigger>
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

