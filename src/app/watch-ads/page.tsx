
"use client";

import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app-context";
import { Loader2, Wallet, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WatchAdsPage() {
  const { user, loading, claimAdPoints } = useAppContext();
  const router = useRouter();

  const [adType, setAdType] = useState<"normal" | "adult">("normal");
  const [isWatching, setIsWatching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);

  // --- CONFIG ---
  const AD_DURATION = 60; // 1 minute
  const NORMAL_AD_URL =
    "https://consumeairlinercalligraphy.com/u1c6psiym1?key=243807878f61d15ee4a2a3ea0a674ed2";
  const ADULT_AD_URL =
    "https://consumeairlinercalligraphy.com/b6iwu8pm?key=a2c4d468351cd225d98f30a245e9f467";
  const REWARD_NORMAL = 0.005;
  const REWARD_ADULT = 0.05;

  // --- Verify login ---
  useEffect(() => {
    if (!loading && (!user || user.type !== "user")) {
      router.push("/login-user");
    }
  }, [user, loading, router]);

  // --- Countdown timer ---
  useEffect(() => {
    if (!isWatching) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isWatching]);

  // --- Start watching ---
  const startWatching = (type: "normal" | "adult") => {
    setAdType(type);
    setIsWatching(true);
    setTimeLeft(AD_DURATION);

    // Fullscreen
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
  };

  // --- Claim points ---
  const handleClaimPoints = async () => {
    setIsClaiming(true);
    const reward = adType === "adult" ? REWARD_ADULT : REWARD_NORMAL;
    await claimAdPoints(reward);
    setIsClaiming(false);
    setIsWatching(false);
    setTimeLeft(0);

    if (document.fullscreenElement) document.exitFullscreen();
    router.push("/");
  };

  const canClaim = timeLeft === 0 && isWatching;
  const adUrl = adType === "adult" ? ADULT_AD_URL : NORMAL_AD_URL;
  const reward = adType === "adult" ? REWARD_ADULT : REWARD_NORMAL;

  // --- Redirect if not logged in ---
  if (loading || !user || user.type !== "user") {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  // --- Fullscreen watching mode with overlay ---
  if (isWatching) {
    return (
      <div className="fixed inset-0 z-50">
        <iframe
          src={adUrl}
          title="Ad"
          className="w-full h-full border-none"
          allow="autoplay"
        />

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 backdrop-blur-sm p-8 rounded-lg flex flex-col items-center">
            {timeLeft > 0 ? (
              <p className="text-6xl font-bold text-yellow-400 mb-4">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </p>
            ) : (
              <p className="text-green-400 mb-4 text-2xl font-semibold">✅ Finished watching!</p>
            )}

            <Button
              onClick={handleClaimPoints}
              disabled={!canClaim || isClaiming}
              size="lg"
              className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full"
            >
              {isClaiming ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Wallet className="h-5 w-5 mr-2" />
              )}
              {canClaim ? `Claim ${reward} UPs` : <><Lock className="mr-2 h-5 w-5" /> Locked</>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Selection screen ---
  return (
    <div className="container mx-auto py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Watch Ads & Earn Unite Points</h1>
      <p className="text-muted-foreground mb-8">
        Choose your ad type below. The app will go fullscreen while you watch.
      </p>

      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <Button className="w-full" onClick={() => startWatching("normal")} size="lg">
          Watch Normal Ads (Earn {REWARD_NORMAL} UPs)
        </Button>
        <Button variant="destructive" className="w-full" onClick={() => startWatching("adult")} size="lg">
          Watch Adult Ads (Earn {REWARD_ADULT} UPs)
        </Button>
      </div>
    </div>
  );
}
