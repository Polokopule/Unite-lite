
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2, Save, User as UserIcon, Upload } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function EditProfilePage() {
    const { user, updateUserProfile, loading } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading) {
            if (user) {
                setName(user.name);
                setProfileImageUrl(user.photoURL || null);
            } else {
                toast({ variant: 'destructive', title: 'Unauthorized', description: 'You must be logged in to edit your profile.' });
                router.push('/');
            }
        }
    }, [user, loading, router, toast]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            setProfileImageUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }

        setIsSaving(true);
        const success = await updateUserProfile(name, profileImage);
        setIsSaving(false);

        if (success) {
            toast({ title: "Profile Updated!", description: "Your changes have been saved." });
            router.push('/dashboard');
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update your profile. Please try again." });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave();
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        const names = name.split(' ');
        if (names.length > 1) {
            return (names[0][0] || '') + (names[names.length - 1][0] || '');
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading || !user) {
        return <div className="container mx-auto py-8"><p>Loading editor...</p></div>;
    }

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            <Card className="w-full max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <UserIcon className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="text-2xl font-headline">Edit Profile</CardTitle>
                                <CardDescription>Update your name and profile picture.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Profile Picture</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    {profileImageUrl && <AvatarImage src={profileImageUrl} alt={name} />}
                                    <AvatarFallback className="text-3xl">{getInitials(name)}</AvatarFallback>
                                </Avatar>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Change Picture
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || !name.trim()}>
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

    