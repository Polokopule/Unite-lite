
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/app-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CreditCard, Image as ImageIcon, Upload, Loader2, Save } from "lucide-react";
import Image from "next/image";
import { Editor, EditorProvider } from 'react-simple-wysiwyg';
import { Course } from "@/lib/types";
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


export default function EditCoursePage() {
  const { user, courses, updateCourse, loading } = useAppContext();
  const router = useRouter();
  const params = useParams();

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
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
  

  const handleSave = async () => {
    if (!course || !title || !content || price <= 0) {
        toast.error("Please fill out all fields.");
        return;
    }
    
    setIsSaving(true);
    const success = await updateCourse(course.id, { title, content, price, imageUrl: coverImageUrl || '' });
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
                    <CardDescription>Update the details of your course.</CardDescription>
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
                    <div className="w-48 h-27 border rounded-md flex items-center justify-center bg-muted">
                       {coverImageUrl ? (
                         <Image src={coverImageUrl} alt="Cover preview" width={192} height={108} className="object-cover rounded-md" />
                       ) : (
                         <ImageIcon className="h-10 w-10 text-muted-foreground" />
                       )}
                    </div>
                    <p className="text-xs text-muted-foreground">Cover image cannot be changed after creation.</p>
                </div>
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
            <Button type="submit" className="w-full sm:w-auto" disabled={!title || !content || price <= 0 || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
