
"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Conversation, Message, User as UserType, LinkPreview, Group } from "@/lib/types";
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Paperclip, ArrowLeft, File as FileIcon, Mic, Square, Smile, Copy, Pencil, Trash2, Check, CheckCheck, MoreVertical, ShieldCheck, ShieldOff, Lock, Unlock, Pin, PinOff, UserX, User, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
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

function MessageBubble({ message, isOwnMessage, participant, conversationId, isLastMessage, otherParticipant }: { message: Message; isOwnMessage: boolean, participant: { name: string, photoURL: string } | undefined, conversationId: string, isLastMessage: boolean, otherParticipant: UserType | null }) {
    const { toast } = useToast();
    const { user, editDirectMessage, deleteDirectMessage, reactToDirectMessage } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        toast({ title: "Copied to clipboard!" });
    };

    const handleEdit = async () => {
        if (!editedContent.trim()) return;
        const success = await editDirectMessage(conversationId, message.id, editedContent);
        if (success) {
            setIsEditing(false);
            toast({ title: "Message updated" });
        } else {
            toast({ variant: 'destructive', title: "Failed to edit message" });
        }
    };
    
    const handleDelete = async () => {
        const success = await deleteDirectMessage(conversationId, message.id);
        if (!success) {
            toast({ variant: 'destructive', title: "Failed to delete message" });
        }
    };

    const handleReaction = (emoji: EmojiClickData) => {
        reactToDirectMessage(conversationId, message.id, emoji.emoji);
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
                return <video controls src={message.fileUrl!} className="max-w-xs rounded-lg" />;
            case 'audio':
                return <audio controls src={message.fileUrl!} className="w-full" />;
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
    
    const isSeen = isLastMessage && otherParticipant && message.readBy && message.readBy[otherParticipant.uid];

    return (
        <div className={`group flex items-end gap-2 ${isOwnMessage ? 'justify-end' : ''}`}>
            {!isOwnMessage && participant && (
                <Link href={`/profile/${message.creatorUid}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.photoURL} alt={participant.name} />
                        <AvatarFallback>{participant.name?.substring(0, 2)}</AvatarFallback>
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
                    {renderContent()}
                    <div className={`flex items-center justify-end gap-1.5 text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {message.isEdited && <span>(edited)</span>}
                        <span>{formatTimeAgo(new Date(message.timestamp).getTime())}</span>
                        {isOwnMessage && (
                            isSeen ? <CheckCheck size={16} /> : <Check size={16} />
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

function SharedGroupsDialog({ otherUser, currentUser, children }: { otherUser: UserType, currentUser: UserType, children: React.ReactNode }) {
    const { groups } = useAppContext();
    const [open, setOpen] = useState(false);

    const sharedGroups = React.useMemo(() => {
        return groups.filter(group => 
            Object.keys(group.members).includes(currentUser.uid) && Object.keys(group.members).includes(otherUser.uid)
        );
    }, [groups, currentUser, otherUser]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Shared Groups with {otherUser.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {sharedGroups.length > 0 ? (
                        <ul className="space-y-2">
                            {sharedGroups.map(group => (
                                <li key={group.id}>
                                    <Link href={`/groups/${group.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                        <Avatar>
                                            <AvatarImage src={group.photoURL} alt={group.name} />
                                            <AvatarFallback>{group.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <span>{group.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">You have no groups in common.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LockChatDialog({ conversationId, isLocked, children }: { conversationId: string, isLocked: boolean, children: React.ReactNode }) {
    const { lockConversation, unlockConversation } = useAppContext();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleLock = async () => {
        if (pin.length !== 4) {
            toast({ variant: 'destructive', title: "PIN must be 4 digits" });
            return;
        }
        if (pin !== confirmPin) {
            toast({ variant: 'destructive', title: "PINs do not match" });
            return;
        }
        setIsSaving(true);
        lockConversation(conversationId, pin);
        setIsSaving(false);
        setPin("");
        setConfirmPin("");
        toast({ title: "Chat Locked" });
        setOpen(false);
    }
    
    const handleUnlock = () => {
        unlockConversation(conversationId);
        toast({ title: "Chat Unlocked" });
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isLocked ? "Unlock Chat" : "Lock Chat"}</DialogTitle>
                </DialogHeader>
                {isLocked ? (
                    <div>
                        <DialogDescription>
                            Unlocking this chat will remove the PIN requirement.
                        </DialogDescription>
                        <DialogFooter className="mt-4">
                            <Button variant="destructive" onClick={handleUnlock}>Unlock</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                         <DialogDescription>
                            Set a 4-digit PIN to lock this conversation. You will need this PIN to view messages.
                        </DialogDescription>
                         <Input
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter 4-digit PIN"
                         />
                         <Input
                            type="password"
                            maxLength={4}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            placeholder="Confirm PIN"
                         />
                         <DialogFooter>
                             <Button onClick={handleLock} disabled={isSaving}>
                                 {isSaving ? <Loader2 className="animate-spin" /> : "Lock Chat"}
                             </Button>
                         </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const { id: conversationId } = params;
    const { user, getConversationById, sendDirectMessage, loading, allUsers, groups, markMessagesAsRead, updateTypingStatus, togglePinConversation, deleteConversationForUser, lockedConversations, unlockConversation, toggleBlockUser } = useAppContext();
    const { toast } = useToast();

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'previewing'>('idle');
    const [recordedAudio, setRecordedAudio] = useState<{ url: string; blob: Blob } | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [isLocked, setIsLocked] = useState(false);
    const [pinInput, setPinInput] = useState("");
    
    const lastTextRef = useRef("");
    const debouncedText = useDebounce(text, 500);

     useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login-user');
            return;
        }
        const convoId = conversationId as string;
        const foundConvo = getConversationById(convoId);

        if (lockedConversations[convoId]) {
            setIsLocked(true);
        } else {
            setIsLocked(false);
        }

        if (foundConvo) {
            setConversation(foundConvo);
            if (!isLocked) {
                 markMessagesAsRead(convoId, true);
            }
        } else if (!loading) {
            toast({ variant: "destructive", title: "Conversation not found." });
            router.push('/#messages');
        }
         return () => {
            if(foundConvo && !isLocked) {
                 markMessagesAsRead(convoId, true);
            }
         }
    }, [conversationId, getConversationById, user, loading, router, toast, markMessagesAsRead, lockedConversations, isLocked]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [conversation?.messages, isLocked]);
    
    useEffect(() => {
        if (user && conversationId) {
            const isTyping = text.length > 0 && lastTextRef.current.length === 0;
            const isStoppedTyping = text.length === 0 && lastTextRef.current.length > 0;

            if (isTyping) {
                updateTypingStatus(conversationId as string, true, true);
            } else if (isStoppedTyping) {
                updateTypingStatus(conversationId as string, false, true);
            }
        }
        lastTextRef.current = text;
    }, [text, user, conversationId, updateTypingStatus]);

    useEffect(() => {
        if (user && debouncedText.length === 0 && lastTextRef.current.length > 0) {
            updateTypingStatus(conversationId as string, false, true);
        }
    }, [debouncedText, user, conversationId, updateTypingStatus]);

    const handleSendText = async () => {
        if (!text.trim() || !user || !otherParticipant) return;
        
        if(user.blockedUsers?.includes(otherParticipant.uid)) {
            toast({ variant: 'destructive', title: "Message not sent", description: `You have blocked ${otherParticipant.name}.` });
            return;
        }
         if(otherParticipant.blockedUsers?.includes(user.uid)) {
            toast({ variant: 'destructive', title: "Message not sent", description: `You have been blocked by ${otherParticipant.name}.` });
            return;
        }

        setIsSending(true);
        updateTypingStatus(conversationId as string, false, true);
        const success = await sendDirectMessage(conversationId as string, { content: text, type: 'text' });
        if (success) {
            setText("");
        } else {
            toast({ variant: 'destructive', title: "Failed to send message" });
        }
        setIsSending(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !otherParticipant || !user) return;
        
        if(user.blockedUsers?.includes(otherParticipant.uid)) {
            toast({ variant: 'destructive', title: "File not sent", description: `You have blocked ${otherParticipant.name}.` });
            return;
        }
        if(otherParticipant.blockedUsers?.includes(user.uid)) {
            toast({ variant: 'destructive', title: "File not sent", description: `You have been blocked by ${otherParticipant.name}.` });
            return;
        }

        setIsSending(true);
        toast({ title: 'Uploading...', description: `Sending ${file.name}` });
        const success = await sendDirectMessage(conversationId as string, { file });
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
        if (!recordedAudio || !otherParticipant || !user) return;

        if (user.blockedUsers?.includes(otherParticipant.uid) || otherParticipant.blockedUsers?.includes(user.uid)) {
            toast({ variant: 'destructive', title: "Voice note not sent", description: "You cannot send messages in this chat." });
            return;
        }

        setIsSending(true);
        toast({ title: 'Uploading...', description: 'Sending voice note' });
        const audioFile = new window.File([recordedAudio.blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        const success = await sendDirectMessage(conversationId as string, { file: audioFile });
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

    const handlePinToggle = () => {
        if (!conversation) return;
        togglePinConversation(conversation.id);
        const isCurrentlyPinned = conversation.pinnedBy && conversation.pinnedBy[user!.uid];
        toast({ title: isCurrentlyPinned ? "Conversation Unpinned" : "Conversation Pinned" });
    }

    const handleDeleteConversation = () => {
        if (!conversation) return;
        deleteConversationForUser(conversation.id);
        toast({ title: "Conversation Deleted" });
        router.push("/#messages");
    }

    const handleUnlock = () => {
        if (lockedConversations[conversationId as string] === pinInput) {
            unlockConversation(conversationId as string);
            setIsLocked(false);
            setPinInput("");
            toast({ title: "Chat Unlocked" });
        } else {
            toast({ variant: 'destructive', title: "Incorrect PIN" });
        }
    }
    
    const handleToggleBlock = () => {
        if (!otherParticipant) return;
        toggleBlockUser(otherParticipant.uid);
        const isBlocked = user?.blockedUsers?.includes(otherParticipant.uid);
        toast({ title: isBlocked ? `Unblocked ${otherParticipant.name}` : `Blocked ${otherParticipant.name}` });
    };

    const getOtherParticipant = () => {
        if (!user || !conversation) return null;
        const otherUid = conversation.participantUids.find(uid => uid !== user.uid);
        if (!otherUid) return null;
        return allUsers.find(u => u.uid === otherUid) || null;
    }
    
    if (loading || !conversation || !user) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }
    
    const otherParticipant = getOtherParticipant();
    const isTyping = conversation.typing && otherParticipant && conversation.typing[otherParticipant.uid];
    const isPinned = conversation.pinnedBy && conversation.pinnedBy[user.uid];
    const amIBlocked = otherParticipant?.blockedUsers?.includes(user.uid);
    const isOtherUserBlocked = user.blockedUsers?.includes(otherParticipant?.uid || '');

    return (
        <div className="fixed inset-0 bg-background z-50 h-[100vh] sm:h-[100vh]">
            <div className="relative h-full">
                <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between border-b p-4 bg-background">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        {otherParticipant && (
                            <Link href={`/profile/${otherParticipant.uid}`} className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.name} />
                                    <AvatarFallback>{otherParticipant.name?.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-semibold leading-none">{otherParticipant.name}</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {isTyping ? <span className="italic">typing...</span> : 
                                        otherParticipant.presence?.state === 'online' ? 'Online' : 
                                        otherParticipant.presence?.lastChanged ? `Last seen ${formatTimeAgo(otherParticipant.presence.lastChanged)}` : 'Offline'
                                        }
                                    </p>
                                </div>
                            </Link>
                        )}
                    </div>
                    {otherParticipant && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/profile/${otherParticipant.uid}`}>
                                        <User className="mr-2 h-4 w-4" /> View Profile
                                    </Link>
                                </DropdownMenuItem>
                                <SharedGroupsDialog otherUser={otherParticipant} currentUser={user}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <FileIcon className="mr-2 h-4 w-4" /> Shared Groups
                                    </DropdownMenuItem>
                                </SharedGroupsDialog>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handlePinToggle}>
                                    {isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                                    {isPinned ? 'Unpin from Top' : 'Pin to Top'}
                                </DropdownMenuItem>
                                <LockChatDialog conversationId={conversation.id} isLocked={isLocked}>
                                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        {isLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                        {isLocked ? 'Unlock Chat' : 'Lock Chat'}
                                    </DropdownMenuItem>
                                </LockChatDialog>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleToggleBlock} className="text-destructive">
                                    {isOtherUserBlocked ? <UserX className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                                    {isOtherUserBlocked ? 'Unblock' : 'Block'}
                                </DropdownMenuItem>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will only delete the conversation for you. The other person will still see the messages. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteConversation}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </header>

                {isLocked ? (
                    <div className="flex flex-col flex-1 items-center justify-center gap-4 p-4 text-center h-full">
                        <Lock className="h-12 w-12 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">This chat is locked</h2>
                        <p className="text-muted-foreground">Enter your PIN to unlock the conversation.</p>
                        <div className="flex gap-2">
                             <Input 
                                type="password"
                                maxLength={4}
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                placeholder="PIN"
                             />
                             <Button onClick={handleUnlock}>Unlock</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="h-full pt-20 pb-24" ref={scrollAreaRef}>
                            <div className="p-4 space-y-6">
                                {conversation.messages && conversation.messages.length > 0 ? (
                                    conversation.messages.sort((a,b) => a.timestamp - b.timestamp).map((msg, idx) => (
                                        <MessageBubble
                                            key={msg.id}
                                            message={msg}
                                            isOwnMessage={user?.uid === msg.creatorUid}
                                            participant={conversation.participants[msg.creatorUid]}
                                            conversationId={conversation.id}
                                            isLastMessage={idx === conversation.messages!.length - 1}
                                            otherParticipant={otherParticipant}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                                        <p>This is the beginning of your conversation.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <footer className="absolute bottom-0 left-0 right-0 z-10 border-t p-4 bg-background">
                           {amIBlocked || isOtherUserBlocked ? (
                                <div className="w-full text-center text-sm text-muted-foreground p-2 bg-muted rounded-md">
                                    {isOtherUserBlocked ? `You have blocked ${otherParticipant?.name}. You cannot send messages.` : `You have been blocked by ${otherParticipant?.name}.`}
                                </div>
                           ) : (
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
                           )}
                        </footer>
                    </>
                )}
            </div>
        </div>
    );
}
