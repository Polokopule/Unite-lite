

"use client";

import { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip, X, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { generateLinkPreview } from "@/services/link-preview";
import { LinkPreview as LinkPreviewType } from "@/lib/types";
import Image from "next/image";
import { MentionsInput, Mention } from 'react-mentions';


// A simple debounce hook
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

function LinkPreviewCard({ preview, onRemove }: { preview: LinkPreviewType, onRemove: () => void }) {
    if (!preview.title) return null;
    return (
        <div className="relative mt-2 border rounded-lg overflow-hidden">
             <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white hover:text-white rounded-full z-10"
                onClick={onRemove}
            >
                <X className="h-4 w-4" />
            </Button>
            {preview.imageUrl && (
                <div className="relative aspect-video">
                     <Image src={preview.imageUrl} alt={preview.title} fill className="object-cover" />
                </div>
            )}
            <div className="p-3 bg-muted/50">
                <a href={preview.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    <p className="font-semibold text-sm truncate">{preview.title}</p>
                </a>
                <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
            </div>
        </div>
    )
}

function FilePreview({ file, onRemove }: { file: File, onRemove: () => void }) {
     const isImage = file.type.startsWith('image/');
     const isVideo = file.type.startsWith('video/');
     const isAudio = file.type.startsWith('audio/');
     const objectUrl = URL.createObjectURL(file);

     return (
        <div className="relative mt-2 border rounded-lg overflow-hidden max-w-sm">
             <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white hover:text-white rounded-full z-10"
                onClick={onRemove}
            >
                <X className="h-4 w-4" />
            </Button>
            {isImage && (
                <div className="relative aspect-video">
                    <Image src={objectUrl} alt={file.name} fill className="object-cover" />
                </div>
            )}
            {isVideo && (
                <video controls src={objectUrl} className="w-full rounded-lg" />
            )}
            {isAudio && (
                 <audio controls src={objectUrl} className="w-full" />
            )}
            {!isImage && !isVideo && !isAudio && (
                <div className="p-3 bg-muted/50 flex items-center gap-3">
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="font-semibold text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                </div>
            )}
        </div>
     )
}


function PostForm({ onPostSuccess }: { onPostSuccess: () => void }) {
    const { user, addPost, allUsers } = useAppContext();
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [linkPreview, setLinkPreview] = useState<LinkPreviewType | null>(null);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const debouncedContent = useDebounce(content, 500);
    const urlRegex = /(https?:\/\/[^\s]+)/;

    useEffect(() => {
        const fetchPreview = async () => {
            const match = debouncedContent.match(urlRegex);
            if (match && !linkPreview && !file) {
                const url = match[0];
                setIsFetchingPreview(true);
                try {
                    const preview = await generateLinkPreview({ url });
                    if (preview.title) {
                        setLinkPreview(preview);
                    }
                } catch (error) {
                    console.error("Failed to generate link preview", error);
                } finally {
                    setIsFetchingPreview(false);
                }
            }
        };
        fetchPreview();
    }, [debouncedContent, linkPreview, file]);

    if (!user) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setLinkPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !file) return;

        setIsPosting(true);
        const success = await addPost({
            content,
            file,
            linkPreview: linkPreview
        });
        setIsPosting(false);

        if (success) {
            onPostSuccess();
            toast({ title: "Post created!" });
        } else {
            toast({ variant: "destructive", title: "Failed to create post." });
        }
    };

    const usersForMentions = allUsers.map(u => ({ id: u.uid, display: u.name }));

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                {user?.name && typeof content === 'string' && (
                    <MentionsInput
                        value={content}
                        onChange={(e) => setContent(e.target.value || '')}
                        placeholder={`What's on your mind, ${user.name}?`}
                        className="mentions"
                        classNames={{
                            control: "mentions__control",
                            input: "mentions__input",
                            suggestions: "mentions__suggestions",
                            item: "mentions__item",
                            itemFocused: "mentions__item--focused",
                        }}
                        autoFocus
                    >
                        <Mention
                            trigger="@"
                            data={usersForMentions}
                            className="mentions__mention"
                            style={{}}
                        />
                    </MentionsInput>
                )}
                {file && <FilePreview file={file} onRemove={() => setFile(null)} />}
                {isFetchingPreview && !linkPreview && <div className="text-sm text-muted-foreground">Fetching link preview...</div>}
                {linkPreview && <LinkPreviewCard preview={linkPreview} onRemove={() => setLinkPreview(null)} />}
            </div>
            <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center border-t pt-2">
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Attach file">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </div>
                <Button type="submit" disabled={isPosting || (!content.trim() && !file)} className="w-full sm:w-auto">
                    {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post
                </Button>
            </DialogFooter>
        </form>
    );
}


export function CreatePostForm() {
    const { user } = useAppContext();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    if (!user) {
        return null;
    }

    const handlePostSuccess = () => {
        setIsDialogOpen(false);
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <div className="bg-card border-b p-4">
                 <div className="container mx-auto flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.photoURL} alt={user?.name} />
                        <AvatarFallback>{user?.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <DialogTrigger asChild>
                        <div className="flex-1 h-10 rounded-full border border-input bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-accent cursor-text flex items-center">
                            {`What's on your mind, ${user.name}?`}
                        </div>
                    </DialogTrigger>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsDialogOpen(true)}>
                            <ImageIcon className="text-green-500"/>
                        </Button>
                         <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsDialogOpen(true)}>
                            <Paperclip className="text-blue-500" />
                        </Button>
                         <Button onClick={() => setIsDialogOpen(true)} className="rounded-full">Post</Button>
                    </div>
                 </div>
            </div>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>Create Post</DialogTitle>
                </DialogHeader>
                <PostForm onPostSuccess={handlePostSuccess} />
            </DialogContent>
        </Dialog>
    );
}
