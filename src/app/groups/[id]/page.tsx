
"use client";

import { useParams } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Group, Message, User as UserType } from "@/lib/types";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Users, Send, Paperclip, Image as ImageIcon, Download, File } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

function MessageBubble({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
    const renderContent = () => {
        switch (message.type) {
            case 'image':
                return (
                    <div className="relative aspect-video max-w-xs rounded-lg overflow-hidden">
                        <Image src={message.fileUrl!} alt={message.fileName || 'Uploaded image'} fill className="object-cover" />
                    </div>
                );
            case 'file':
                return (
                    <a href={message.fileUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg hover:bg-secondary transition-colors">
                        <File className="h-6 w-6 text-primary" />
                        <div>
                            <p className="font-semibold text-sm">{message.fileName}</p>
                            <p className="text-xs text-muted-foreground">Click to download</p>
                        </div>
                    </a>
                );
            case 'text':
            default:
                return <p className="whitespace-pre-wrap">{message.content}</p>;
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

function ChatArea({ groupId, messages }: { groupId: string; messages: Message[] }) {
    const { user, sendMessage } = useAppContext();
    const { toast } = useToast();
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSending(true);
        toast({ title: 'Uploading...', description: `Sending ${file.name}`});
        const success = await sendMessage(groupId, { file, type });
        if (!success) {
            toast({ variant: 'destructive', title: `Failed to upload ${type}` });
        }
        setIsSending(false);
        // Reset file input
        if (e.target) e.target.value = '';
    };

    return (
        <Card className="flex flex-col h-[70vh]">
            <CardHeader>
                <CardTitle>Group Chat</CardTitle>
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
            <CardFooter className="border-t pt-4">
                <div className="flex items-center gap-2 w-full">
                    <Input
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendText()}
                        disabled={isSending}
                    />
                    <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" />
                    <Button size="icon" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={isSending}>
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'file')} className="hidden" />
                    <Button size="icon" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button size="icon" onClick={handleSendText} disabled={isSending || !text.trim()}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </CardFooter>
        </Card>
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
    
    const getInitials = (name: string) => {
        if (!name) return '??';
        const names = name.split(' ');
        if (names.length > 1) {
            return (names[0][0] || '') + (names[names.length - 1][0] || '');
        }
        return name.substring(0, 2).toUpperCase();
    };
    
    const membersDetails = group?.members?.map(memberId => allUsers.find(u => u.uid === memberId)).filter(Boolean) as UserType[] || [];

    if (loading || !group) {
        return <div className="container mx-auto py-8"><Loader2 className="animate-spin" /> Loading group...</div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline flex items-center gap-3">{group.name} {group.hasPin && <Lock className="h-6 w-6 text-muted-foreground" />}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                    <p className="text-sm text-muted-foreground pt-2">Created by {group.creatorName}</p>
                </CardHeader>
                {!isMember && (
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
                )}
            </Card>

            {isMember && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                         <ChatArea groupId={group.id} messages={group.messages || []}/>
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Members ({membersDetails.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
                                    {membersDetails.map(member => (
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
