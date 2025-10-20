
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import { Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Script from "next/script";

export default function WatchAdsPage() {
  const { user, loading, claimAdPoints } = useAppContext();
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  // 5 minute cooldown
  const COOLDOWN_TIME = 5 * 60 * 1000;
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.type !== 'user')) {
      router.push('/login-user');
    }
  }, [user, loading, router]);
  
   useEffect(() => {
    if (user?.lastAdClaim) {
      const now = Date.now();
      const timeSinceLastClaim = now - user.lastAdClaim;
      if (timeSinceLastClaim < COOLDOWN_TIME) {
        setTimeLeft(COOLDOWN_TIME - timeSinceLastClaim);
      }
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 1000 ? prev - 1000 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [user?.lastAdClaim]);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      // We can check if the ad container has been populated.
      // This is a heuristic and might need adjustment.
      const observer = new MutationObserver((mutations) => {
        if (adRef.current && adRef.current.querySelector('iframe')) {
            setAdLoaded(true);
            observer.disconnect();
        }
      });
      if(adRef.current){
          observer.observe(adRef.current, { childList: true, subtree: true });
      }
      return () => observer.disconnect();
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  const handleClaimPoints = async () => {
    setIsClaiming(true);
    await claimAdPoints();
    setIsClaiming(false);
  };
  
  if (loading || !user || user.type !== 'user') {
    return <div className="container mx-auto py-8"><p>Redirecting...</p></div>;
  }

  const canClaim = timeLeft === 0;

  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6024568817887379"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold font-headline">Watch Ads & Earn Unite Points (UPs)</h1>
        <p className="text-muted-foreground mb-8">View ads from our partners and claim points for your engagement.</p>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Ad Unit</CardTitle>
            <CardDescription>An ad from the Google Display Network.</CardDescription>
          </CardHeader>
          <CardContent ref={adRef}>
            {/* AdSense Unit */}
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-6024568817887379"
              data-ad-slot="8243111277"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
            {!adLoaded && <div className="h-64 flex items-center justify-center bg-muted rounded-md"><Loader2 className="animate-spin"/></div>}
          </CardContent>
           <CardContent>
            <Button
              className="w-full"
              onClick={handleClaimPoints}
              disabled={!canClaim || isClaiming || !adLoaded}
              size="lg"
            >
              {isClaiming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              {!adLoaded ? 'Waiting for ad...' : canClaim ? 'Claim 0.005 UPs' : `Claim again in ${Math.ceil(timeLeft / 1000)}s`}
            </Button>
             <p className="text-xs text-muted-foreground text-center mt-2">You can claim points once every 5 minutes.</p>
           </CardContent>
        </Card>
      </div>
    </>
  );
}
