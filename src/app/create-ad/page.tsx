
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Megaphone, CreditCard, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CreateAdPage() {
  const { user, createAd, loading } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [campaignName, setCampaignName] = useState("");
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.type !== 'business')) {
      toast({ variant: 'destructive', title: 'Unauthorized', description: 'You must be logged in as a business to create an ad.'});
      router.push('/login-business');
    }
  }, [user, loading, router, toast]);

  const handlePublish = async () => {
    if (!campaignName || !content) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields.",
      });
      return;
    }
    
    setIsPublishing(true);
    const success = await createAd({ campaignName, content });
    setIsPublishing(false);

    if(success) {
      toast({
        title: "Ad Campaign Created!",
        description: `Your campaign "${campaignName}" is now live.`
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "You may not have enough points to pay for the ad campaign.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The actual submission is handled by the AlertDialog action
  };
  
  if (loading || !user || user.type !== 'business') {
    return <div className="container mx-auto py-8"><p>Redirecting...</p></div>;
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Megaphone className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline">Create an Ad Campaign</CardTitle>
                <CardDescription>Promote your business to learners on AdEd.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                placeholder="e.g., Summer Sale 2024"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Ad Content</Label>
              <Textarea
                id="content"
                placeholder="A short, catchy phrase for your ad (max 100 chars)."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div className="p-4 bg-muted rounded-lg border">
                <p className="font-semibold">Pricing</p>
                <p className="text-sm text-muted-foreground">Each ad campaign costs <span className="font-bold text-primary">50 points</span> to publish. Points can be earned based on ad views.</p>
            </div>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" className="w-full sm:w-auto" disabled={!campaignName || !content || isPublishing}>
                  {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  {isPublishing ? 'Publishing...' : 'Proceed to Payment'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will deduct 50 points from your account to publish the ad campaign "{campaignName}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePublish}>Pay 50 Points & Publish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
