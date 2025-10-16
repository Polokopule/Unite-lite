
"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BellRing, Moon, Sun, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
    const { user, loading, enableNotifications } = useAppContext();
    const { theme, setTheme } = useTheme();
    const [isPwa, setIsPwa] = useState(false);
    const [isEnabling, setIsEnabling] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        if(!loading && !user) {
            router.push('/login-user');
        }
    }, [user, loading, router]);

    useEffect(() => {
        // Check if running in PWA mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsPwa(true);
        }
    }, []);

    const handleEnableNotifications = async () => {
        setIsEnabling(true);
        try {
            await enableNotifications();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Notification Error',
                description: error.message || 'Could not enable notifications.'
            });
        } finally {
            setIsEnabling(false);
        }
    }

    if (loading || !user) {
        return <div className="container mx-auto py-8"><p>Loading settings...</p></div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-2xl">
             <div className="flex items-center gap-4 mb-8">
                <SettingsIcon className="h-8 w-8" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and application settings.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                           <div className="p-2 bg-muted rounded-full">
                             {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                           </div>
                           <div>
                            <Label htmlFor="dark-mode-switch" className="font-semibold">Dark Mode</Label>
                            <p className="text-sm text-muted-foreground">Toggle between light and dark themes.</p>
                           </div>
                        </div>
                        <Switch
                            id="dark-mode-switch"
                            checked={theme === "dark"}
                            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications from Unite.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                       <div className="flex items-center gap-4">
                           <div className="p-2 bg-muted rounded-full">
                            <BellRing className="h-5 w-5 text-primary" />
                           </div>
                           <div>
                                <Label className="font-semibold">Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive notifications on your device, even when the app is closed.</p>
                           </div>
                       </div>
                        <Button onClick={handleEnableNotifications} disabled={isEnabling}>
                            {isEnabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enable
                        </Button>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
