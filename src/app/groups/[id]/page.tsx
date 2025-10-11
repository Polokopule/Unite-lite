
"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Group, Message, User as UserType, LinkPreview } from "@/lib/types";
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Users, Send, Paperclip, Image as ImageIcon, Download, File as FileIcon, Music, Video, Menu, Mic, Square, Smile, Copy, Pencil, Trash2, Check, CheckCheck, Share2, MoreVertical, ArrowLeft, Info, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
    if (!preview.title) return null;
    return (
        <a href={preview.url} target="_blank" rel="noopener noreferrer" className="mt-2 border rounded-lg overflow-hidden block bg-background hover:bg-muted/50 transition-colors">
            {preview.imageUrl && (
                <div className="relative aspect-video">
                     <Image src={preview.imageUrl} alt={preview.title} fill className="object-cover" />
                </div>
            )}
            <div className="p-3">
                <p className="font-semibold text-sm truncate">{preview.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
                 <p className="text-xs text-muted-foreground truncate mt-1 break-all">{preview.url}</p>
            </div>
        </a>
    )
}

function SystemMessage({ content }: { content: string }) {
    return (
        <div className="flex justify-center my-4">
            <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full flex items-center gap-2">
                <Info className="h-3 w-3"/>
                <span>{content}</span>
            </div>
        </div>
    );
}

const isVerified = (user: UserType) => {
    return user.email === 'polokopule91@gmail.com' || (user.followers && user.followers.length >= 1000000);
}

function MessageBubble({ message, isOwnMessage, groupId, memberCount }: { message: Message; isOwnMessage: boolean; groupId: string; memberCount: number; }) {
    const { toast } = useToast();
    const { user, allUsers, editMessage, deleteMessage, reactToMessage } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    
    const creator = allUsers.find(u => u.uid === message.creatorUid);

    if (message.type === 'system') {
        return <SystemMessage content={message.content} />;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        toast({ title: "Copied to clipboard!" });
    };

    const handleEdit = async () => {
        if (!editedContent.trim()) return;
        const success = await editMessage(groupId, message.id, editedContent);
        if (success) {
            setIsEditing(false);
            toast({ title: "Message updated" });
        } else {
            toast({ variant: 'destructive', title: "Failed to edit message" });
        }
    };
    
    const handleDelete = async () => {
        const success = await deleteMessage(groupId, message.id);
         if (!success) {
            toast({ variant: 'destructive', title: "Failed to delete message" });
        }
    };

    const handleReaction = (emoji: EmojiClickData) => {
        reactToMessage(groupId, message.id, emoji.emoji);
    };

    const renderContent = () => {
        if (isEditing) {
            return (
                <div className="space-y-2">
                    <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="min-h-[60px]" />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleEdit}>Save</Button>
                    </div>
                </div>
            )
        }
        switch (message.type) {
            case 'image':
                 return (
                     <Dialog>
                        <DialogTrigger asChild>
                             <div className="relative max-w-xs cursor-pointer">
                                <Image
                                    src={message.fileUrl!}
                                    alt={message.fileName || 'Uploaded image'}
                                    width={400}
                                    height={400}
                                    className="object-contain rounded-lg h-auto w-full"
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl p-2">
                            <div className="relative aspect-video">
                                <Image src={message.fileUrl!} alt={message.fileName || 'Uploaded image'} fill className="object-contain" />
                            </div>
                            <DialogFooter>
                                <Button asChild variant="outline">
                                    <a href={message.fileUrl} download={message.fileName || 'image'}>
                                        <Download className="mr-2 h-4 w-4" /> Download
                                    </a>
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                );
            case 'video':
                return (
                    <video controls src={message.fileUrl!} className="max-w-xs rounded-lg" />
                );
            case 'audio':
                return (
                    <audio controls src={message.fileUrl!} className="w-full" />
                );
            case 'file':
                return (
                    <a href={message.fileUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg hover:bg-secondary transition-colors">
                        <FileIcon className="h-6 w-6 text-primary" />
                        <div>
                            <p className="font-semibold text-sm break-all">{message.fileName}</p>
                            <p className="text-xs text-muted-foreground">Click to download</p>
                        </div>
                    </a>
                );
            case 'text':
            default:
                return (
                    <div className="break-words">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.linkPreview && <LinkPreviewCard preview={message.linkPreview} />}
                    </div>
                );
        }
    };
    
    const reactions = Object.entries(message.reactions || {});
    
    const readCount = message.readBy ? Object.keys(message.readBy).length : 0;
    const isSeenByAll = readCount >= memberCount;

    return (
        <div className={`group flex items-end gap-2 ${isOwnMessage ? 'justify-end' : ''}`}>
            {!isOwnMessage && (
                <Link href={`/profile/${message.creatorUid}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.creatorPhotoURL} alt={message.creatorName} />
                        <AvatarFallback>{message.creatorName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                </Link>
            )}
             <div className={`flex items-center gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                         </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent>
                         <Popover>
                            <PopoverTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Smile className="mr-2 h-4 w-4" /> React
                                </DropdownMenuItem>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 border-0">
                                <EmojiPicker onEmojiClick={handleReaction} />
                            </PopoverContent>
                        </Popover>

                        {message.type === 'text' && (
                             <DropdownMenuItem onClick={handleCopy}>
                                <Copy className="mr-2 h-4 w-4" /> Copy
                            </DropdownMenuItem>
                        )}
                        {isOwnMessage && message.type === 'text' && (
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        )}
                         {isOwnMessage && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete this message.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div 
                    className={`relative max-w-md rounded-xl p-3 px-4 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                >
                    {!isOwnMessage && (
                        <p className="text-xs font-bold pb-1 flex items-center gap-1">
                            <span>{message.creatorName}</span>
                            {creator && isVerified(creator) && <ShieldCheck className="h-3 w-3 text-primary" />}
                        </p>
                    )}
                    {renderContent()}
                    <div className={`flex items-center justify-end gap-1.5 text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {message.isEdited && <span>(edited)</span>}
                        <span>{formatTimeAgo(new Date(message.timestamp).getTime())}</span>
                        {isOwnMessage && (
                            isSeenByAll ? <CheckCheck size={16} /> : <Check size={16} />
                        )}
                    </div>
                    {reactions.length > 0 && (
                        <div className={`absolute -bottom-3 flex gap-1 ${isOwnMessage ? 'right-2' : 'left-2'}`}>
                            {reactions.map(([emoji, uids]) => (
                                <div key={emoji} className="bg-background border rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
                                    <span>{emoji}</span>
                                    <span>{uids.length}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
}

function useDebounce(value: any, delay: number) {
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

function ChatArea({ groupId, messages, group, members, membersDetails }: { groupId: string; messages: Message[], group: Group | null, members: UserType[], membersDetails: UserType[] }) {
    const { user, sendMessage, updateTypingStatus, deleteGroup, updateGroupPin } = useAppContext();
    const { toast } = useToast();
    const router = useRouter();
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    
    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'previewing'>('idle');
    const [recordedAudio, setRecordedAudio] = useState<{ url: string; blob: Blob } | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const lastTextRef = useRef("");
    const debouncedText = useDebounce(text, 500);

    const [newPin, setNewPin] = useState(group?.pin || "");
    const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
    const [isSavingPin, setIsSavingPin] = useState(false);

    useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (user) {
            const isTyping = text.length > 0 && lastTextRef.current.length === 0;
            const isStoppedTyping = text.length === 0 && lastTextRef.current.length > 0;

            if (isTyping) {
                updateTypingStatus(groupId, true);
            } else if (isStoppedTyping) {
                updateTypingStatus(groupId, false);
            }
        }
        lastTextRef.current = text;
    }, [text, user, groupId, updateTypingStatus]);

    useEffect(() => {
        if (user && debouncedText.length === 0 && lastTextRef.current.length > 0) {
            updateTypingStatus(groupId, false);
        }
    }, [debouncedText, user, groupId, updateTypingStatus]);
    
    const typingUsers = group?.typing ? Object.keys(group.typing)
        .filter(uid => group.typing![uid] && uid !== user?.uid)
        .map(uid => members.find(m => m.uid === uid)?.name || "Someone") : [];


    const handleSendText = async () => {
        if (!text.trim() || !user) return;
        setIsSending(true);
        updateTypingStatus(groupId, false);
        const success = await sendMessage(groupId, { content: text, type: 'text' });
        if (success) {
            setText("");
        } else {
            toast({ variant: 'destructive', title: "Failed to send message" });
        }
        setIsSending(false);
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSending(true);
        toast({ title: 'Uploading...', description: `Sending ${file.name}`});
        const success = await sendMessage(groupId, { file });
        if (!success) {
            toast({ variant: 'destructive', title: `Failed to upload file` });
        }
        setIsSending(false);
        if (e.target) e.target.value = '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setRecordedAudio({ url: audioUrl, blob: audioBlob });
                setRecordingState('previewing');
                audioChunksRef.current = [];
                 stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setRecordingState('recording');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Microphone access denied', description: 'Please allow microphone access in your browser settings.' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
    
    const handleSendAudio = async () => {
        if (!recordedAudio) return;
        setIsSending(true);
        toast({ title: 'Uploading...', description: 'Sending voice note' });
        const audioFile = new window.File([recordedAudio.blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        const success = await sendMessage(groupId, { file: audioFile });
        if (!success) {
            toast({ variant: 'destructive', title: 'Failed to send voice note' });
        }
        setIsSending(false);
        setRecordedAudio(null);
        setRecordingState('idle');
    };

    const handleDeleteAudio = () => {
        if (recordedAudio) {
            URL.revokeObjectURL(recordedAudio.url);
        }
        setRecordedAudio(null);
        setRecordingState('idle');
    };

    const handlePrimaryAction = () => {
        if (text.trim()) {
            handleSendText();
        } else if (recordingState === 'idle') {
            startRecording();
        } else if (recordingState === 'recording') {
            stopRecording();
        } else if (recordingState === 'previewing') {
            handleSendAudio();
        }
    };
    
    const handleCopyInviteLink = () => {
        const inviteLink = `${window.location.origin}/groups/${groupId}`;
        navigator.clipboard.writeText(inviteLink);
        toast({ title: "Invite link copied to clipboard!" });
    };

    const isCreator = user?.uid === group?.creatorUid;

    const handleDeleteGroup = async () => {
        if (!group) return;
        const success = await deleteGroup(group.id);
        if (success) {
            toast({ title: "Group Deleted" });
            router.push('/groups');
        } else {
            toast({ variant: 'destructive', title: "Failed to delete group" });
        }
    };

    const handleSavePin = async () => {
        if (!group) return;
        setIsSavingPin(true);
        const success = await updateGroupPin(group.id, newPin);
        if (success) {
            toast({ title: "PIN Updated", description: "The group's privacy settings have been changed." });
            setIsPinDialogOpen(false);
        } else {
            toast({ variant: 'destructive', title: "Failed to update PIN" });
        }
        setIsSavingPin(false);
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="relative z-50 flex-shrink-0 flex items-center justify-between p-4 border-b bg-background">
                <div className="flex items-center gap-3">
                     <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={group?.photoURL} alt={group?.name} />
                        <AvatarFallback><Users/></AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{group?.name}</CardTitle>
                         {typingUsers.length > 0 && (
                            <p className="text-xs text-muted-foreground italic">
                                {typingUsers.join(", ")} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                            </p>
                         )}
                    </div>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <Dialog>
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Users className="mr-2 h-4 w-4"/> View Members
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Members ({membersDetails.length})</DialogTitle>
                                </DialogHeader>
                                <MembersList members={membersDetails} group={group} />
                            </DialogContent>
                        </Dialog>
                        <DropdownMenuItem onClick={handleCopyInviteLink}>
                             <Share2 className="mr-2 h-4 w-4"/> Copy Invite Link
                        </DropdownMenuItem>
                        {isCreator && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={`/groups/edit/${groupId}`}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit Group
                                    </Link>
                                </DropdownMenuItem>
                                <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Lock className="mr-2 h-4 w-4" /> Set PIN
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Set Group PIN</DialogTitle>
                                            <DialogDescription>
                                                Leave this blank to make the group public. Setting a PIN will make it private.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Label htmlFor="pin-input">Group PIN</Label>
                                            <Input
                                                id="pin-input"
                                                value={newPin}
                                                onChange={(e) => setNewPin(e.target.value)}
                                                placeholder="Enter a PIN..."
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleSavePin} disabled={isSavingPin}>
                                                {isSavingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save PIN
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Group
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the group and all its messages. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteGroup}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            
            <ScrollArea className="flex-1 bg-muted/20" viewportRef={scrollViewportRef}>
                 <div className="p-4 space-y-6">
                    {messages && messages.length > 0 ? (
                         messages.sort((a,b) => a.timestamp - b.timestamp).map(msg => (
                            <MessageBubble key={msg.id} message={msg} isOwnMessage={user?.uid === msg.creatorUid} groupId={groupId} memberCount={Object.keys(group?.members || {}).length || 1} />
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                            <p>No messages yet. Be the first to say something!</p>
                        </div>
                    )}
                 </div>
            </ScrollArea>
           
            <footer className="flex-shrink-0 border-t p-4 bg-background">
                 <div className="flex items-center gap-2 w-full">
                    {recordingState === 'previewing' && recordedAudio ? (
                        <>
                            <Button variant="destructive" size="icon" onClick={handleDeleteAudio} disabled={isSending}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <audio controls src={recordedAudio.url} className="flex-1" />
                        </>
                    ) : recordingState === 'recording' ? (
                        <div className="flex-1 flex items-center gap-2 bg-muted p-2 rounded-lg">
                            <Mic className="h-5 w-5 text-destructive animate-pulse" />
                            <p className="text-sm text-muted-foreground">Recording...</p>
                        </div>
                    ) : (
                         <>
                            <Textarea
                                placeholder="Type a message..."
                                value={text}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendText();
                                  }
                                }}
                                onChange={(e) => setText(e.target.value)}
                                disabled={isSending}
                                rows={1}
                                className="max-h-24 resize-none"
                            />
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" 
                                className="hidden" 
                            />
                            <Button size="icon" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                                <Paperclip className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Button
                        size="icon"
                        variant={recordingState === 'recording' ? "destructive" : "default"}
                        onClick={handlePrimaryAction}
                        disabled={isSending}
                    >
                        {text.trim() && recordingState === 'idle' ? <Send className="h-4 w-4" />
                         : recordingState === 'recording' ? <Square className="h-4 w-4" />
                         : recordingState === 'previewing' ? <Send className="h-4 w-4" />
                         : <Mic className="h-4 w-4" />
                        }
                    </Button>
                </div>
            </footer>
        </div>
    );
}

const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
        return (names[0][0] || '') + (names[names.length - 1][0] || '');
    }
    return name.substring(0, 2).toUpperCase();
};

function MembersList({ members, group }: { members: UserType[], group: Group | null }) {
    
    const getJoinMethodText = (memberUid: string) => {
        if (group?.creatorUid === memberUid) {
            return "Group Creator";
        }
        const memberInfo = group?.members[memberUid];
        if (memberInfo?.joinMethod === 'invite') {
            return "Joined via invite link";
        }
        return "Joined from group list";
    };

    return (
        <ul className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {members.map(member => (
                <li key={member.uid}>
                    <Link href={`/profile/${member.uid}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
                        <Avatar className="h-8 w-8 relative">
                            {member.photoURL && <AvatarImage src={member.photoURL} alt={member.name} />}
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            {member.presence?.state === 'online' && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />}
                        </Avatar>
                        <div className="flex-1">
                            <span className="flex items-center gap-1">
                                {member.name}
                                {isVerified(member) && <ShieldCheck className="h-4 w-4 text-primary" />}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                {getJoinMethodText(member.uid)}
                            </p>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}


export default function GroupPage() {
    const params = useParams();
    const { id: groupId } = params;
    const { user, groups, joinGroup, allUsers, loading, markMessagesAsRead } = useAppContext();
    const { toast } = useToast();

    const [group, setGroup] = useState<Group | null>(null);
    const [isMember, setIsMember] = useState(false);
    const [pin, setPin] = useState("");
    const [isJoining, setIsJoining] = useState(isMember);
    
    useEffect(() => {
        if (loading) return;
        const foundGroup = groups.find(g => g.id === groupId);
        if (foundGroup) {
            setGroup(foundGroup);
            if (user) {
                const member = Object.keys(foundGroup.members || {}).includes(user.uid);
                setIsMember(member);
                if (member) {
                    markMessagesAsRead(groupId as string);
                }
            }
        }
    }, [groupId, groups, user, loading, markMessagesAsRead]);

    const handleJoin = async () => {
        if (!group) return;
        setIsJoining(true);
        const success = await joinGroup(group.id, pin);
        setIsJoining(false);

        if (success) {
            toast({ title: `Welcome to ${group.name}!` });
            setPin("");
        } else {
            toast({ variant: "destructive", title: "Failed to join group", description: "The PIN may be incorrect or you may already be a member." });
        }
    };
    
    const membersDetails = group?.members ? Object.keys(group.members).map(memberId => allUsers.find(u => u.uid === memberId)).filter(Boolean) as UserType[] : [];

    if (loading || !group) {
        return <div className="container mx-auto py-8 flex items-center justify-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    if (!isMember) {
        return (
            <div className="container mx-auto py-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline flex items-center gap-3">{group.name} {group.hasPin && <Lock className="h-6 w-6 text-muted-foreground" />}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                        <p className="text-sm text-muted-foreground pt-2">Created by {group.creatorName}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 border-2 border-dashed rounded-lg flex flex-col items-center gap-4 text-center">
                            <h3 className="text-xl font-semibold">You are not a member of this group.</h3>
                            {group.hasPin ? (
                                <div className="w-full max-w-sm space-y-4">
                                    <p className="text-muted-foreground">This is a private group. Please enter the PIN to join.</p>
                                    <div className="space-y-2">
                                        <Label htmlFor="pin">Group PIN</Label>
                                        <Input
                                            id="pin"
                                            type="password"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            placeholder="Enter PIN"
                                        />
                                    </div>
                                    <Button onClick={handleJoin} disabled={isJoining || !pin}>
                                        {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Join Group
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={handleJoin} disabled={isJoining}>
                                    {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Join Group
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
         <div className="h-screen bg-background">
             <ChatArea groupId={group.id} messages={group.messages || []} group={group} members={membersDetails} membersDetails={membersDetails} />
        </div>
    );
}

    

    

    
