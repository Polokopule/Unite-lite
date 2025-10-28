
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CreditCard, Image as ImageIcon, Upload, Loader2, Settings, ChevronsUpDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from "next/image";
import toast from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import QuillEditor from "@/components/quill-editor";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CreateCoursePage() {
  const { user, addCourse, loading } = useAppContext();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState(1);
  const [isFree, setIsFree] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isMobile = useIsMobile();

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
    const finalPrice = isFree ? 0 : price;
    if (!title || !content || (finalPrice < 0) || !coverImage) {
        toast.error("Please fill out all fields and upload a cover image.");
        return;
    }
    
    setIsPublishing(true);
    const success = await addCourse({ title, content, price: finalPrice, coverImage });
    setIsPublishing(false);

    if(success) {
        toast.success("Your course has been submitted for review.");
        router.push('/dashboard');
    } else {
        toast.error("Failed to submit course. Please try again.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submission is handled by AlertDialog
  };
  
  if (loading || !user || user.type !== 'user') {
      return <div className="container mx-auto py-8"><p>Redirecting...</p></div>
  }

  const SettingsContent = () => (
     <div className="space-y-6">
        <h2 className="text-lg font-semibold">Course Settings</h2>
        <Separator />
         <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="w-full aspect-video border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
               {coverImageUrl ? (
                 <Image src={coverImageUrl} alt="Cover preview" width={192} height={108} className="object-cover w-full h-full rounded-md" />
               ) : (
                 <ImageIcon className="h-10 w-10 text-muted-foreground" />
               )}
            </div>
            <Input id="cover-image" type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
            <Button type="button" variant="outline" asChild className="w-full">
              <Label htmlFor="cover-image" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
              </Label>
            </Button>
            <p className="text-xs text-muted-foreground">Recommended ratio: 16:9</p>
        </div>
         <Separator />
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="is-free" className="font-medium">Free Course</Label>
                <Switch id="is-free" checked={isFree} onCheckedChange={setIsFree} />
            </div>
            {!isFree && (
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
                        disabled={isFree}
                    />
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen} className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-headline font-bold">Create Course</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {isMobile && (
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-2"/>
                                    Settings
                                    <ChevronsUpDown className="h-4 w-4 ml-2" />
                                </Button>
                            </CollapsibleTrigger>
                        )}
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" size="sm" disabled={!title || !content || !coverImage || (!isFree && price <= 0) || isPublishing}>
                            {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                            {isPublishing ? 'Submitting...' : 'Submit for Review'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Submit for Review</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to submit the course "{title}" for review. An admin will check it before it's published. Are you sure you want to proceed?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handlePublish}>Yes, Submit</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>

            <div className="flex-grow flex flex-col md:flex-row container mx-auto overflow-hidden">
                {/* Main Content & Editor */}
                <div className="flex-grow flex flex-col overflow-y-auto p-4 md:p-6">
                    <Input
                        id="title"
                        placeholder="Course Title"
                        className="text-2xl md:text-3xl font-bold font-headline border-0 shadow-none focus-visible:ring-0 h-auto p-0 mb-6"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    {isMobile && (
                        <CollapsibleContent className="mb-4">
                            <SettingsContent />
                        </CollapsibleContent>
                    )}
                    <div className="flex-grow min-h-[300px]">
                        <QuillEditor value={content} onChange={setContent} />
                    </div>
                </div>
                
                {/* Right Sidebar - Desktop only */}
                {!isMobile && (
                    <aside className="w-80 flex-shrink-0 border-l p-6 space-y-6 overflow-y-auto">
                    <SettingsContent />
                    </aside>
                )}
            </div>
        </Collapsible>
      </form>
    </div>
  );
}
