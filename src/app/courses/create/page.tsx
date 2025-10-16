
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CreditCard, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { Editor, EditorProvider } from 'react-simple-wysiwyg';
import toast from "react-hot-toast";

function RichTextEditor({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  return (
    <EditorProvider>
        <Editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            containerProps={{ style: { resize: 'vertical', minHeight: '200px', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' } }}
        />
    </EditorProvider>
  );
}


export default function CreateCoursePage() {
  const { user, addCourse, loading } = useAppContext();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState(0);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.type !== 'user')) {
      toast.error('You must be logged in as a user to create a course.');
      router.push('/login-user');
    }
  }, [user, loading, router]);
  
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };

  const handlePublish = async () => {
    if (!title || !content || price <= 0 || !coverImage) {
        toast.error("Please fill out all fields and upload a cover image.");
        return;
    }
    
    setIsPublishing(true);
    const success = await addCourse({ title, content, price, coverImage });
    setIsPublishing(false);

    if(success) {
        router.push('/dashboard');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submission is handled by AlertDialog
  };
  
  if (loading || !user || user.type !== 'user') {
      return <div className="container mx-auto py-8"><p>Redirecting...</p></div>
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-4xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
             <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl font-headline">Create a New Course</CardTitle>
                    <CardDescription>Share your knowledge with the Unite community.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Python"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-4">
                    <div className="w-48 h-27 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                       {coverImageUrl ? (
                         <Image src={coverImageUrl} alt="Cover preview" width={192} height={108} className="object-cover rounded-md" />
                       ) : (
                         <ImageIcon className="h-10 w-10 text-muted-foreground" />
                       )}
                    </div>
                    <Input id="cover-image" type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                    <Button type="button" variant="outline" asChild>
                      <Label htmlFor="cover-image" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                      </Label>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Recommended aspect ratio: 16:9</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Course Content</Label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (in points)</Label>
              <Input
                id="price"
                type="number"
                min="1"
                placeholder="e.g., 100"
                value={price > 0 ? price : ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" className="w-full sm:w-auto" disabled={!title || !content || !coverImage || price <= 0 || isPublishing}>
                  {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  {isPublishing ? 'Publishing...' : 'Publish Course'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm & Publish</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to publish the course "{title}". Are you sure you want to proceed? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePublish}>Yes, Publish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
