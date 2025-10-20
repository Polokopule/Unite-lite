
"use client";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import WelcomePage from "@/app/welcome/page";

export default function HomePage() {
    const { user, loading } = useAppContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);
    
    // While loading, or if user is not logged in, show the welcome page
    if (loading || !user) {
        return <WelcomePage />;
    }

    // If user is logged in, show a loading/redirecting message until the redirect happens
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
}
