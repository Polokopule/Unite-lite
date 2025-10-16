
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/contexts/app-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Megaphone, Save, Loader2 } from "lucide-react";
import { Ad } from "@/lib/types";
import toast from "react-hot-toast";

export default function EditAdPage() {
  const { user, ads, updateAd, loading } = useAppContext();
  const router = useRouter();
  const params = useParams();

  const [ad, setAd] = useState<Ad | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    const adId = params.id as string;
    const foundAd = ads.find(a => a.id === adId);

    if (foundAd) {
      if (user && user.uid === foundAd.creator) {
        setAd(foundAd);
        setCampaignName(foundAd.campaignName);
        setContent(foundAd.content);
        setIsAuthorized(true);
      } else {
        toast.error('You are not the creator of this ad campaign.');
        router.push('/dashboard');
      }
    } else if(!loading) {
      toast.error('This ad campaign does not exist.');
      router.push('/dashboard');
    }
  }, [user, loading, ads, params.id, router]);

  const handleSave = async () => {
    if (!ad || !campaignName || !content) {
      toast.error("Please fill out all fields.");
      return;
    }
    
    setIsSaving(true);
    const success = await updateAd(ad.id, { campaignName, content });
    setIsSaving(false);

    if(success) {
      router.push('/dashboard');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };
  
  if (loading || !ad || !isAuthorized) {
    return <div className="container mx-auto py-8"><p>Loading editor...</p></div>;
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Megaphone className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline">Edit Ad Campaign</CardTitle>
                <CardDescription>Update your campaign details.</CardDescription>
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={!campaignName || !content || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
