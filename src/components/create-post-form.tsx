
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
import { Textarea } from "./ui/textarea";


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


function PostForm({ onPostSuccess, initialFile }: { onPostSuccess: () => void, initialFile?: File | null }) {
    const { user, addPost } = useAppContext();
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(initialFile || null);
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
    
    useEffect(() => {
        if(initialFile) {
            setFile(initialFile)
        }
    }, [initialFile])

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
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`What's on your mind, ${user.name}?`}
                    className="min-h-[120px]"
                    autoFocus
                />
                {file && <FilePreview file={file} onRemove={() => setFile(null)} />}
                {isFetchingPreview && !linkPreview && <div className="text-sm text-muted-foreground">Fetching link preview...</div>}
                {linkPreview && <LinkPreviewCard preview={linkPreview} onRemove={() => setLinkPreview(null)} />}
            </div>
            <DialogFooter>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
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
    const [initialFile, setInitialFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) {
        return null;
    }

    const handlePostSuccess = () => {
        setIsDialogOpen(false);
        setInitialFile(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInitialFile(file);
            setIsDialogOpen(true);
        }
        // Reset file input to allow selecting the same file again
        if(e.target) e.target.value = '';
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <div className="bg-card border-b p-4">
                 <div className="container mx-auto flex items-center gap-2">
                    <DialogTrigger asChild>
                        <div className="flex-1 h-10 rounded-full border border-input bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-accent cursor-text flex items-center min-w-0">
                            <span className="truncate">{`What's on your mind, ${user.name}?`}</span>
                        </div>
                    </DialogTrigger>
                    
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="text-blue-500" />
                    </Button>
                    
                    <Button onClick={() => setIsDialogOpen(true)} className="rounded-full">Post</Button>
                 </div>
            </div>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>Create Post</DialogTitle>
                </DialogHeader>
                <PostForm onPostSuccess={handlePostSuccess} initialFile={initialFile} />
            </DialogContent>
        </Dialog>
    );
}
