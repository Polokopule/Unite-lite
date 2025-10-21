
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Conversation } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import { Bot, Check, CheckCheck, Pin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function ConversationListSkeleton() {
    return (
        <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center p-2 gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ConversationItem({ conversation, currentUserId }: { conversation: Conversation, currentUserId: string }) {
    const { allUsers, lockedConversations } = useAppContext();
    const otherParticipantUid = conversation.participantUids.find(uid => uid !== currentUserId);
    const otherParticipant = allUsers.find(u => u.uid === otherParticipantUid);
    const isPinned = conversation.pinnedBy && conversation.pinnedBy[currentUserId];
    
    if (!otherParticipant) {
        return null;
    }
    
    const lastMessage = conversation.lastMessage;
    const isSeen = lastMessage?.readBy && lastMessage.readBy[currentUserId];
    const isOwnLastMessage = lastMessage?.creatorUid === currentUserId;
    
    const getReadStatusIcon = () => {
        if (!isOwnLastMessage || !lastMessage) return null;
        if (lastMessage.readBy && Object.keys(lastMessage.readBy).includes(otherParticipantUid)) {
            return <CheckCheck className="h-4 w-4 text-primary" />;
        }
        return <Check className="h-4 w-4 text-muted-foreground" />;
    };

    const isLocked = !!lockedConversations[conversation.id];

    return (
        <Link href={isLocked ? '#' : `/messages/${conversation.id}`} className="block hover:bg-muted/50 rounded-lg" onClick={(e) => {if(isLocked) e.preventDefault()}}>
            <div className="flex items-center p-2 gap-3 relative">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.name} />
                    <AvatarFallback>{otherParticipant.name?.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">{otherParticipant.name}</p>
                        {lastMessage && <p className="text-xs text-muted-foreground shrink-0 ml-2">{formatTimeAgo(lastMessage.timestamp)}</p>}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                             {isOwnLastMessage && getReadStatusIcon()}
                             <p className={`truncate ${!isSeen && !isOwnLastMessage ? 'font-bold text-foreground' : ''}`}>
                                {isLocked ? "Chat is locked" : lastMessage?.content || "No messages yet"}
                            </p>
                        </div>
                    </div>
                </div>
                 {isPinned && <Pin className="h-4 w-4 text-muted-foreground absolute top-2 right-2" />}
            </div>
        </Link>
    );
}


export function ConversationsList() {
    const { user, conversations, loading } = useAppContext();

    if (loading) {
        return <ConversationListSkeleton />;
    }

    if (!user) {
        return <p>Please log in.</p>;
    }

    return (
        <div>
            {conversations.length > 0 ? (
                <div className="space-y-1">
                    
                    {conversations.map(convo => (
                        <ConversationItem key={convo.id} conversation={convo} currentUserId={user.uid} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">No Conversations</h3>
                    <p>Start a new chat from the Community page.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/community">Find People</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
