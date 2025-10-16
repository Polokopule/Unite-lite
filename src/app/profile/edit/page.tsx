
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2, Save, User as UserIcon, Upload, KeyRound } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";

export default function EditProfilePage() {
    const { user, updateUserProfile, loading } = useAppContext();
    const router = useRouter();

    const [name, setName] = useState("");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading) {
            if (user) {
                setName(user.name);
                setProfileImageUrl(user.photoURL || null);
            } else {
                toast.error('You must be logged in to edit your profile.');
                router.push('/');
            }
        }
    }, [user, loading, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            setProfileImageUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSaving(true);
        await updateUserProfile(name, profileImage);
        setIsSaving(false);
    };

    const handleChangePassword = async () => {
        if (!user?.email) return;
        setIsSendingReset(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast.success(`A password reset link has been sent to ${user.email}.`);
        } catch (error) {
             toast.error("Could not send password reset email.");
        } finally {
            setIsSendingReset(false);
        }
    }

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
                                <CardDescription>Update your name, profile picture, and password.</CardDescription>
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
                        <Separator />
                        <div className="space-y-2">
                            <Label>Password</Label>
                             <Card className="bg-muted/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium text-sm">Change Password</p>
                                    <p className="text-sm text-muted-foreground">A password reset link will be sent to your email.</p>
                                </div>
                                <Button type="button" variant="secondary" onClick={handleChangePassword} disabled={isSendingReset}>
                                    {isSendingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>}
                                    Send Reset Link
                                </Button>
                             </Card>
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
