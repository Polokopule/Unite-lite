
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/app-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CreditCard, Image as ImageIcon, Upload, Loader2, Save, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { Course } from "@/lib/types";
import toast from "react-hot-toast";
import QuillEditor from "@/components/quill-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EditCoursePage() {
  const { user, courses, updateCourse, loading } = useAppContext();
  const router = useRouter();
  const params = useParams();

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const courseId = params.id as string;
    const foundCourse = courses.find(c => c.id === courseId);

    if (foundCourse) {
        if (user && user.uid === foundCourse.creator) {
            setCourse(foundCourse);
            setTitle(foundCourse.title);
            setContent(foundCourse.content);
            setPrice(foundCourse.price);
            setCoverImageUrl(foundCourse.imageUrl);
            setIsAuthorized(true);
        } else {
             toast.error('You are not the creator of this course.');
             router.push('/dashboard');
        }
    } else if(!loading) {
         toast.error('This course does not exist.');
         router.push('/dashboard');
    }

  }, [user, loading, courses, params.id, router]);
  
  const handleCoverImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };


  const handleSave = async () => {
    if (!course || !title || !content || price < 0 || !coverImageUrl) {
        toast.error("Please fill out all fields.");
        return;
    }
    
    setIsSaving(true);
    const success = await updateCourse(course.id, { 
      title, 
      content, 
      price, 
      imageUrl: coverImageUrl,
      status: 'pending' // Resubmit for review
    }, coverImageFile);
    setIsSaving(false);

    if(success) {
        router.push('/dashboard');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };
  
  if (loading || !course || !isAuthorized) {
      return <div className="container mx-auto py-8"><p>Loading editor...</p></div>
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-4xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
             <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl font-headline">Edit Course</CardTitle>
                    <CardDescription>Update the details of your course. Changes will be resubmitted for review.</CardDescription>
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
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload New</TabsTrigger>
                      <TabsTrigger value="url">From URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="pt-4">
                      <Input id="cover-image" type="file" accept="image/*" onChange={handleCoverImageFileChange} />
                  </TabsContent>
                  <TabsContent value="url" className="pt-4">
                      <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground"/>
                          <Input 
                              id="cover-image-url" 
                              type="url" 
                              placeholder="https://example.com/image.png"
                              value={coverImageUrl}
                              onChange={(e) => {
                                  setCoverImageUrl(e.target.value);
                                  setCoverImageFile(null);
                              }}
                          />
                      </div>
                  </TabsContent>
              </Tabs>
                {coverImageUrl && (
                    <div className="mt-4 w-full aspect-video border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                        <Image src={coverImageUrl} alt="Cover preview" width={192} height={108} className="object-cover w-full h-full rounded-md" />
                    </div>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Course Content</Label>
              <QuillEditor value={content} onChange={setContent} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (in points)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                placeholder="e.g., 100"
                value={price >= 0 ? price : ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
               <p className="text-xs text-muted-foreground">Set to 0 to make the course free.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={!title || !content || price < 0 || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving ? 'Resubmitting...' : 'Resubmit for Review'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
