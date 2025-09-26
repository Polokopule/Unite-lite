"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

export default function CreateCoursePage() {
  const { user, addCourse } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (!user || user.type !== 'user') {
      router.push('/login-user');
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || price <= 0) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all fields and set a valid price.",
        });
        return;
    }
    
    const success = addCourse({ title, description, price });
    if(success) {
        toast({
            title: "Course Created!",
            description: `Your course "${title}" is now live in the marketplace.`
        });
        router.push('/courses');
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create the course. Please try again.",
        });
    }
  };
  
  if (!user || user.type !== 'user') {
      return <div className="container mx-auto py-8"><p>Redirecting...</p></div>
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
             <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl font-headline">Create a New Course</CardTitle>
                    <CardDescription>Share your knowledge with the AdEd community.</CardDescription>
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
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn in your course."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
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
            <Button type="submit" className="w-full sm:w-auto">Publish Course</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
