
"use client";

import { useAppContext } from "@/contexts/app-context";
import WelcomePage from "@/app/welcome/page";
import HomeFeed from "@/components/home-feed";

export default function HomePage() {
    const { user, loading } = useAppContext();

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

    return <HomeFeed />;
}
