
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/contexts/app-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Loader2, Upload, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Group } from "@/lib/types";
import toast from "react-hot-toast";

export default function EditGroupPage() {
  const { user, groups, updateGroup, loading } = useAppContext();
  const router = useRouter();
  const params = useParams();
  
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [groupImageUrl, setGroupImageUrl] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    const foundGroup = groups.find(g => g.id === groupId);
    if (foundGroup) {
      if (user && user.uid === foundGroup.creatorUid) {
        setGroup(foundGroup);
        setName(foundGroup.name);
        setDescription(foundGroup.description);
        setGroupImageUrl(foundGroup.photoURL || null);
        setIsAuthorized(true);
      } else {
        toast.error('You are not the creator of this group.');
        router.push(`/groups/${groupId}`);
      }
    } else if (!loading) {
      toast.error('Group not found');
      router.push('/groups');
    }
  }, [user, loading, groups, groupId, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImage(file);
      setGroupImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name || !description) {
      toast.error("Missing Information");
      return;
    }
    
    setIsSaving(true);
    const success = await updateGroup(groupId, { name, description }, groupImage);
    setIsSaving(false);

    if (success) {
      router.push(`/groups/${groupId}`);
    }
  };
  
  if (loading || !group || !isAuthorized) {
    return <div className="container mx-auto py-8"><p>Loading editor...</p></div>;
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Edit Group</CardTitle>
            <CardDescription>Update your group's details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>Group Avatar</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        {groupImageUrl ? <AvatarImage src={groupImageUrl} alt="Group preview"/> : <AvatarFallback><Users/></AvatarFallback>}
                    </Avatar>
                     <Input id="group-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <Button type="button" variant="outline" asChild>
                      <Label htmlFor="group-image" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Change Image
                      </Label>
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
