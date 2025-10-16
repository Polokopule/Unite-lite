
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from "@/contexts/app-context";
import { Ad } from "@/lib/types";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function WatchAdsPage() {
  const { user, ads, watchAd, loading } = useAppContext();
  const router = useRouter();
  
  const [watchingAd, setWatchingAd] = useState<Ad | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.type !== 'user')) {
      toast.error('You must be logged in as a user to watch ads.');
      router.push('/login-user');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (watchingAd) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            handleAdWatched();
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [watchingAd]);

  const handleWatchClick = (ad: Ad) => {
    setWatchingAd(ad);
  };
  
  const handleAdWatched = () => {
    if (watchingAd) {
      watchAd(watchingAd.id);
    }
    setWatchingAd(null);
    setProgress(0);
  };
  
  if (loading || !user || user.type !== 'user') {
    return <div className="container mx-auto py-8"><p>Redirecting...</p></div>
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold font-headline">Watch Ads & Earn Points</h1>
        <p className="text-muted-foreground mb-8">Watch a short ad to earn points for your next course.</p>

        {ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <Card key={ad.id}>
                <CardHeader>
                  <CardTitle>{ad.campaignName}</CardTitle>
                  <CardDescription>An ad from one of our partners.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="italic">"{ad.content}"</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleWatchClick(ad)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Watch Ad (3s)
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No Ads Available</h2>
            <p className="text-muted-foreground mt-2">There are no ads to watch right now. Check back soon!</p>
          </div>
        )}
      </div>

      <Dialog open={!!watchingAd} onOpenChange={(open) => !open && setWatchingAd(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{watchingAd?.campaignName}</DialogTitle>
            <DialogDescription>
              {watchingAd?.content}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <p className="text-sm text-center text-muted-foreground mb-2">Watching ad...</p>
             <Progress value={progress} />
          </div>
           <DialogFooter>
             <p className="text-xs text-muted-foreground">You will earn 10 points upon completion.</p>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
