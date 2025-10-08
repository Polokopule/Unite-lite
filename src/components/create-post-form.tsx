
"use client";

import { useState } from "react";
import { useAppContext } from "@/contexts/app-context";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export function CreatePostForm() {
    const { user, addPost } = useAppContext();
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
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
            setIsDialogOpen(false); // Close dialog on success
            toast({ title: "Post created!" });
        } else {
            toast({ variant: "destructive", title: "Failed to create post." });
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Card className="w-full max-w-2xl mx-auto">
                <CardContent className="p-4">
                     <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.photoURL} alt={user?.name} />
                            <AvatarFallback>{user?.name?.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <DialogTrigger asChild>
                            <div className="flex-1 h-10 rounded-full border border-input bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-accent cursor-text flex items-center">
                                {`What's on your mind, ${user.name}?`}
                            </div>
                        </DialogTrigger>
                     </div>
                </CardContent>
            </Card>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>Create Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder={`What's on your mind, ${user.name}?`}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            autoFocus
                        />
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={isPosting || !content.trim()} className="w-full">
                            {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Post
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
