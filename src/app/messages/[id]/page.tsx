

"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Conversation, Message, User as UserType, LinkPreview } from "@/lib/types";
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Paperclip, ArrowLeft, File as FileIcon, Mic, Square, Smile, Copy, Pencil, Trash2, Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Textarea } from "@/components/ui/textarea";

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
                    <div className="relative aspect-video max-w-xs rounded-lg overflow-hidden">
                        <Image src={message.fileUrl!} alt={message.fileName || 'Uploaded image'} fill className="object-cover" />
                    </div>
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
        <div className={`group flex items-end gap-2 ${isOwnMessage ? 'justify-end' : ''}`} onContextMenu={(e) => e.preventDefault()}>
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
                         <div className={`relative max-w-md rounded-xl p-3 px-4 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {renderContent()}
                            <div className={`flex items-center justify-end gap-1.5 text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {message.isEdited && <span>(edited)</span>}
                                <span>{format(new Date(message.timestamp), "p")}</span>
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
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
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

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const { id: conversationId } = params;
    const { user, getConversationById, sendDirectMessage, loading, allUsers, markMessagesAsRead, updateTypingStatus } = useAppContext();
    const { toast } = useToast();

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    const lastTextRef = useRef("");
    const debouncedText = useDebounce(text, 500);

     useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login-user');
            return;
        }
        const foundConvo = getConversationById(conversationId as string);
        if (foundConvo) {
            setConversation(foundConvo);
            markMessagesAsRead(conversationId as string, true);
        } else if (!loading) {
            toast({ variant: "destructive", title: "Conversation not found." });
            router.push('/');
        }
         return () => {
            if(foundConvo) {
                 markMessagesAsRead(conversationId as string, true);
            }
         }
    }, [conversationId, getConversationById, user, loading, router, toast, markMessagesAsRead]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation?.messages]);
    
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
        if (user && debouncedText.length > 0 && lastTextRef.current.length > 0) {
            updateTypingStatus(conversationId as string, false, true);
        }
    }, [debouncedText, user, conversationId, updateTypingStatus]);

    const handleSendText = async () => {
        if (!text.trim() || !user) return;
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
        if (!file) return;

        setIsSending(true);
        toast({ title: 'Uploading...', description: `Sending ${file.name}` });
        const success = await sendDirectMessage(conversationId as string, { file, type: 'file' }); // type will be re-evaluated in context
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
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
                
                setIsSending(true);
                toast({ title: 'Uploading...', description: 'Sending voice note' });
                const success = await sendDirectMessage(conversationId as string, { file: audioFile, type: 'audio' });
                if (!success) {
                    toast({ variant: 'destructive', title: 'Failed to send voice note' });
                }
                setIsSending(false);

                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Microphone access denied', description: 'Please allow microphone access in your browser settings.' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    
    const handleSendAction = () => {
        if (text.trim()) {
            handleSendText();
        } else if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    };
    
    const handleReleaseSendAction = () => {
        if (!text.trim()) {
             stopRecording();
        }
    };

    const getOtherParticipant = () => {
        if (!user || !conversation) return null;
        const otherUid = conversation.participantUids.find(uid => uid !== user.uid);
        if (!otherUid) return null;
        // Get the full user object from allUsers to include presence
        return allUsers.find(u => u.uid === otherUid) || null;
    }
    
    if (loading || !conversation) {
        return (
            <div className="h-[calc(100vh-4rem-1px)] flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }
    
    const otherParticipant = getOtherParticipant();
    const isTyping = conversation.typing && otherParticipant && conversation.typing[otherParticipant.uid];

    return (
        <div className="h-[calc(100vh-4rem-1px)]">
             <Card className="flex flex-col h-full border-0 sm:border rounded-none sm:rounded-lg">
                <CardHeader className="flex-row items-center border-b p-4">
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
                                <CardTitle>{otherParticipant.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {isTyping ? <span className="italic">typing...</span> : 
                                     otherParticipant.presence?.state === 'online' ? 'Online' : 
                                     otherParticipant.presence?.lastChanged ? `Last seen ${formatDistanceToNow(otherParticipant.presence.lastChanged, { addSuffix: true })}` : 'Offline'
                                    }
                                </p>
                            </div>
                        </Link>
                    )}
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
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
                    <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter className="border-t p-4">
                    <div className="flex items-center gap-2 w-full">
                        {isRecording ? (
                            <div className="flex-1 flex items-center gap-2 bg-muted p-2 rounded-lg">
                                <Mic className="h-5 w-5 text-destructive animate-pulse" />
                                <p className="text-sm text-muted-foreground">Recording...</p>
                            </div>
                        ) : (
                            <Input
                                placeholder="Type a message..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendText()}
                                disabled={isSending}
                            />
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                            className="hidden"
                        />
                        <Button size="icon" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSending || isRecording}>
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button 
                            size="icon"
                            variant={isRecording ? "destructive" : "default"}
                            onMouseDown={handleSendAction}
                            onMouseUp={handleReleaseSendAction}
                            onTouchStart={handleSendAction}
                            onTouchEnd={handleReleaseSendAction}
                            disabled={isSending}
                        >
                            {isRecording ? <Square className="h-4 w-4" /> : (text.trim() ? <Send className="h-4 w-4" /> : <Mic className="h-4 w-4" />)}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

    
