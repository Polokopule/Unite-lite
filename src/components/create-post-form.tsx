"use client";

import { useState } from "react";
import { useAppContext } from "@/contexts/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function CreatePostForm() {
    const { user, addPost } = useAppContext();
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const { toast } = useToast();

    if (!user) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsPosting(true);
        const success = await addPost(content);
        setIsPosting(false);

        if (success) {
            setContent("");
            toast({ title: "Post created!" });
        } else {
            toast({ variant: "destructive", title: "Failed to create post." });
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto mb-6">
            <CardHeader>
                <CardTitle className="text-xl">Create Post</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.photoURL} alt={user?.name} />
                            <AvatarFallback>{user?.name?.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <Textarea
                            placeholder={`What's on your mind, ${user.name}?`}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={3}
                            className="flex-1"
                        />
                    </div>
                     <div className="flex justify-end mt-4">
                        <Button type="submit" disabled={isPosting || !content.trim()}>
                            {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Post
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}