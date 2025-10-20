
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import Link from "next/link";
import { Users, Lock, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

function GroupsPageSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader className="flex-row items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <Skeleton className="h-4 w-20" />
                    </CardContent>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function GroupsPage() {
    const { groups, user, loading } = useAppContext();
    
    if (loading) {
        return <GroupsPageSkeleton />;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Groups</h1>
                    <p className="text-muted-foreground">Find and join groups to collaborate and chat.</p>
                </div>
                {user && (
                    <Button asChild className="mt-4 sm:mt-0">
                        <Link href="/groups/create"><PlusCircle className="h-4 w-4 mr-2"/>Create Group</Link>
                    </Button>
                )}
            </div>

            {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <Card key={group.id} className="flex flex-col hover:shadow-lg transition-shadow">
                            <CardHeader className="flex-row items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={group.photoURL} alt={group.name} />
                                    <AvatarFallback><Users/></AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="truncate">{group.name}</span>
                                        {group.hasPin && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">{group.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>{Object.keys(group.members || {}).length} members</span>
                                </div>
                            </CardContent>
                            <CardContent>
                                 <Button asChild className="w-full">
                                    <Link href={`/groups/${group.id}`}>View Group</Link>
                                 </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No Groups Yet</h2>
                    <p className="text-muted-foreground mt-2">Be the first to create one and start a community!</p>
                </div>
            )}
        </div>
    );
}
