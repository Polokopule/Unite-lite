
"use client";

import { useAppContext } from "@/contexts/app-context";
import WelcomePage from "@/app/welcome/page";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const { user, loading } = useAppContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);


    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    
    if (!user) {
        return <WelcomePage />;
    }

    // This will be shown briefly before redirecting
    return (
        <div className="h-screen w-full flex items-center justify-center">
            <p>Redirecting to your dashboard...</p>
        </div>
    );
}
