
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/utils";
import Link from "next/link";
import { useEffect } from "react";
import { BellRing, Bot, User, Heart, MessageSquare, Repeat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function NotificationSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({length: 5}).map((_, i) => (
                 <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    )
}

const NOTIFICATION_ICONS: { [key: string]: React.ReactNode } = {
  new_follower: <User className="h-5 w-5 text-blue-500" />,
  post_like: <Heart className="h-5 w-5 text-red-500" />,
  comment_like: <Heart className="h-5 w-5 text-red-500" />,
  new_comment: <MessageSquare className="h-5 w-5 text-green-500" />,
  new_reply: <MessageSquare className="h-5 w-5 text-green-500" />,
  mention: <Bot className="h-5 w-5 text-purple-500" />,
  repost: <Repeat className="h-5 w-5 text-gray-500" />,
  default: <BellRing className="h-5 w-5 text-gray-500" />,
};

export default function NotificationsPage() {
    const { notifications, loading, markNotificationsAsRead, allUsers } = useAppContext();

    useEffect(() => {
        markNotificationsAsRead();
    }, [notifications.length, markNotificationsAsRead]);

    if (loading) {
        return <div className="container mx-auto py-8"><NotificationSkeleton /></div>
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold font-headline mb-8">Notifications</h1>
            {notifications.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <ul className="divide-y">
                            {notifications.map(notif => {
                                const actor = allUsers.find(u => u.uid === notif.actorUid);
                                return (
                                    <li key={notif.id} className={`p-4 hover:bg-muted/50 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}>
                                        <Link href={notif.targetUrl || '#'}>
                                            <div className="flex items-start gap-4">
                                                <span className="mt-1">
                                                    {NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default}
                                                </span>
                                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                         <Avatar className="h-8 w-8">
                                                            <AvatarImage src={actor?.photoURL} alt={notif.actorName} />
                                                            <AvatarFallback>{notif.actorName.substring(0,2)}</AvatarFallback>
                                                        </Avatar>
                                                        <p className="text-sm">
                                                            <span className="font-semibold">{notif.actorName}</span> {notif.message}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(notif.timestamp)}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <BellRing className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">No Notifications Yet</h2>
                    <p className="text-muted-foreground mt-2">When something happens, we'll let you know here.</p>
                </div>
            )}
        </div>
    );
}
