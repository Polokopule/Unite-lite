
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/app-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Save, BookText } from "lucide-react";
import { Post } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";

export default function EditPostPage() {
  const { user, posts, updatePost, loading } = useAppContext();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const postId = params.id as string;
    const foundPost = posts.find(p => p.id === postId);

    if (foundPost) {
        if (user && user.uid === foundPost.creatorUid) {
            setPost(foundPost);
            setContent(foundPost.content || "");
            setIsAuthorized(true);
        } else {
             toast({ variant: 'destructive', title: 'Unauthorized', description: 'You are not the creator of this post.'});
             router.push('/dashboard');
        }
    } else if(!loading) {
         toast({ variant: 'destructive', title: 'Not Found', description: 'This post does not exist.'});
         router.push('/dashboard');
    }

  }, [user, loading, posts, params.id, router, toast]);
  

  const handleSave = async () => {
    if (!post || !content.trim()) {
        toast({
            variant: "destructive",
            title: "Missing Content",
            description: "Post content cannot be empty.",
        });
        return;
    }
    
    setIsSaving(true);
    const success = await updatePost(post.id, { content });
    setIsSaving(false);

    if(success) {
        toast({
            title: "Post Updated!",
            description: `Your post has been saved.`
        });
        router.push('/dashboard');
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update the post. Please try again.",
        });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };
  
  if (loading || !post || !isAuthorized) {
      return <div className="container mx-auto py-8"><p>Loading editor...</p></div>
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
             <div className="flex items-center gap-4">
                <BookText className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl font-headline">Edit Post</CardTitle>
                    <CardDescription>Update the content of your post.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content">Post Content</Label>
               <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`What's on your mind, ${user?.name}?`}
                    className="min-h-[120px]"
                />
            </div>
            {post.fileUrl && (
                <div className="space-y-2">
                    <Label>Attachment</Label>
                    <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted">
                        Attachments cannot be changed after a post is created.
                    </div>
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={!content.trim() || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
