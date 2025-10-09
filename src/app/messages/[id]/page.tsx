
"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";
import { Conversation, Message, User as UserType } from "@/lib/types";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Paperclip, ArrowLeft, File as FileIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

function MessageBubble({ message, isOwnMessage, participant }: { message: Message; isOwnMessage: boolean, participant: { name: string, photoURL: string } | undefined }) {
    const renderContent = () => {
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
                            <p className="font-semibold text-sm">{message.fileName}</p>
                            <p className="text-xs text-muted-foreground">Click to download</p>
                        </div>
                    </a>
                );
            case 'text':
            default:
                return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
        }
    };

    return (
        <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : ''}`}>
            {!isOwnMessage && participant && (
                <Link href={`/profile/${message.creatorUid}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.photoURL} alt={participant.name} />
                        <AvatarFallback>{participant.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                </Link>
            )}
            <div className={`max-w-md rounded-xl p-3 px-4 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {renderContent()}
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}


export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const { id: conversationId } = params;
    const { user, getConversationById, sendDirectMessage, loading } = useAppContext();
    const { toast } = useToast();

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login-user');
            return;
        }
        const foundConvo = getConversationById(conversationId as string);
        if (foundConvo) {
            setConversation(foundConvo);
        } else if (!loading) {
            toast({ variant: "destructive", title: "Conversation not found." });
            router.push('/');
        }
    }, [conversationId, getConversationById, user, loading, router, toast]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation?.messages]);

    const handleSendText = async () => {
        if (!text.trim()) return;
        setIsSending(true);
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

    const getOtherParticipant = () => {
        if (!user || !conversation) return null;
        const otherUid = conversation.participantUids.find(uid => uid !== user.uid);
        return conversation.participants[otherUid!];
    }
    
    if (loading || !conversation) {
        return (
            <div className="container mx-auto py-8 h-screen flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }
    
    const otherParticipant = getOtherParticipant();

    return (
        <div className="container mx-auto py-4 h-[calc(100vh-4rem-1px)]">
             <Card className="flex flex-col h-full">
                <CardHeader className="flex-row items-center border-b">
                    <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    {otherParticipant && (
                        <Link href={`/profile/${conversation.participantUids.find(uid => uid !== user?.uid)}`} className="flex items-center gap-3">
                             <Avatar>
                                <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.name} />
                                <AvatarFallback>{otherParticipant.name?.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{otherParticipant.name}</CardTitle>
                        </Link>
                    )}
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversation.messages && conversation.messages.length > 0 ? (
                        conversation.messages.sort((a,b) => a.timestamp - b.timestamp).map(msg => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isOwnMessage={user?.uid === msg.creatorUid}
                                participant={conversation.participants[msg.creatorUid]}
                            />
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                            <p>This is the beginning of your conversation.</p>
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
                        <Button size="icon" onClick={handleSendText} disabled={isSending || !text.trim()}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

    