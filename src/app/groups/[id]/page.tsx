
"use client";

import { useParams } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Group, Message, User as UserType, LinkPreview } from "@/lib/types";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Users, Send, Paperclip, Image as ImageIcon, Download, File, Music, Video, Menu, Mic, Square } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

function MessageBubble({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
    const renderContent = () => {
        switch (message.type) {
            case 'image':
                return (
                    <div className="relative aspect-video max-w-xs rounded-lg overflow-hidden">
                        <Image src={message.fileUrl!} alt={message.fileName || 'Uploaded image'} fill className="object-cover" />
                    </div>
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
                        <File className="h-6 w-6 text-primary" />
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

    return (
        <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : ''}`}>
            {!isOwnMessage && (
                <Link href={`/profile/${message.creatorUid}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.creatorPhotoURL} alt={message.creatorName} />
                        <AvatarFallback>{message.creatorName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                </Link>
            )}
            <div className={`max-w-md rounded-xl p-3 px-4 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {!isOwnMessage && (
                    <p className="text-xs font-bold pb-1">{message.creatorName}</p>
                )}
                {renderContent()}
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}

function ChatArea({ groupId, messages, groupName }: { groupId: string; messages: Message[], groupName: string }) {
    const { user, sendMessage } = useAppContext();
    const { toast } = useToast();
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendText = async () => {
        if (!text.trim()) return;
        setIsSending(true);
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
        const success = await sendMessage(groupId, { file, type: 'file' });
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
                const success = await sendMessage(groupId, { file: audioFile, type: 'audio' });
                if (!success) {
                    toast({ variant: 'destructive', title: 'Failed to send voice note' });
                }
                setIsSending(false);

                // Clean up
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

    return (
        <Card className="flex flex-col h-full border-0 sm:border rounded-none sm:rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{groupName}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages && messages.length > 0 ? (
                     messages.sort((a,b) => a.timestamp - b.timestamp).map(msg => (
                        <MessageBubble key={msg.id} message={msg} isOwnMessage={user?.uid === msg.creatorUid} />
                    ))
                ) : (
                    <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                        <p>No messages yet. Be the first to say something!</p>
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
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={isSending}
                    >
                        {isRecording ? <Square className="h-4 w-4" /> : (text.trim() ? <Send className="h-4 w-4" /> : <Mic className="h-4 w-4" />)}
                    </Button>
                </div>
            </CardFooter>
        </Card>
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

function MembersList({ members }: { members: UserType[] }) {
    return (
        <ul className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {members.map(member => (
                <li key={member.uid}>
                    <Link href={`/profile/${member.uid}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
                        <Avatar className="h-8 w-8">
                            {member.photoURL && <AvatarImage src={member.photoURL} alt={member.name} />}
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}


export default function GroupPage() {
    const params = useParams();
    const { id: groupId } = params;
    const { user, groups, joinGroup, allUsers, loading } = useAppContext();
    const { toast } = useToast();

    const [group, setGroup] = useState<Group | null>(null);
    const [isMember, setIsMember] = useState(false);
    const [pin, setPin] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    
    useEffect(() => {
        if (loading) return;
        const foundGroup = groups.find(g => g.id === groupId);
        if (foundGroup) {
            setGroup(foundGroup);
            if (user) {
                setIsMember(foundGroup.members?.includes(user.uid) || false);
            }
        }
    }, [groupId, groups, user, loading]);

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
    
    const membersDetails = group?.members?.map(memberId => allUsers.find(u => u.uid === memberId)).filter(Boolean) as UserType[] || [];

    if (loading || !group) {
        return <div className="container mx-auto py-8 flex items-center justify-center h-[calc(100vh-4rem)]"><Loader2 className="animate-spin h-8 w-8" /></div>;
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
        <div className="h-[calc(100vh-4rem-1px)] flex">
            <div className="flex-1 h-full">
                 <ChatArea groupId={group.id} messages={group.messages || []} groupName={group.name}/>
            </div>
            <div className="hidden lg:block w-72 border-l h-full">
                <Card className="h-full border-0 rounded-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Members ({membersDetails.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MembersList members={membersDetails} />
                    </CardContent>
                </Card>
            </div>
             <div className="lg:hidden absolute top-4 right-4">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline">
                            <Users className="h-5 w-5"/>
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5"/> Members ({membersDetails.length})
                            </SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                           <MembersList members={membersDetails} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}

    