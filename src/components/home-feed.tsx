
"use client";

import { useAppContext } from "@/contexts/app-context";
import { CreatePostForm } from "@/components/create-post-form";
import { PostCard } from "@/components/post-card";

export default function HomeFeed() {
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
