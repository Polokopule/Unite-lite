
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, PlusCircle, Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";

export default function CreateGroupPage() {
  const { user, createGroup, loading } = useAppContext();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [groupImageUrl, setGroupImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      toast.error('You must be logged in to create a group.');
      router.push('/login-user');
    }
  }, [user, loading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImage(file);
      setGroupImageUrl(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!name || !description) {
      toast.error("Please provide a name and description for your group.");
      return;
    }
    
    setIsCreating(true);
    const newGroupId = await createGroup({ name, description, pin, photoFile: groupImage });
    setIsCreating(false);

    if(newGroupId) {
      router.push(`/groups/${newGroupId}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };
  
  if (loading || !user) {
    return <div className="container mx-auto py-8"><p>Redirecting...</p></div>;
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline">Create a New Group</CardTitle>
                <CardDescription>Bring people together to chat and collaborate.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>Group Avatar (Optional)</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        {groupImageUrl ? <AvatarImage src={groupImageUrl} alt="Group preview"/> : <AvatarFallback><Users/></AvatarFallback>}
                    </Avatar>
                     <Input id="group-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <Button type="button" variant="outline" asChild>
                      <Label htmlFor="group-image" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                      </Label>
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g., Study Buddies"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">Group PIN (Optional)</Label>
              <Input
                id="pin"
                type="text"
                placeholder="Set a PIN to make this group private"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
               <p className="text-xs text-muted-foreground">Leave this blank for a public group that anyone can join.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={!name || !description || isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              {isCreating ? 'Creating...' : 'Create Group'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
