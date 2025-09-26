
"use client";

import { useAppContext } from "@/contexts/app-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function CourseViewerPage() {
    const { user, courses, purchasedCourses, loading } = useAppContext();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const courseContentRef = useRef<HTMLDivElement>(null);

    const [course, setCourse] = useState<Course | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (loading) return;

        const courseId = params.id as string;
        const foundCourse = courses.find(c => c.id === courseId);

        if (foundCourse) {
            setCourse(foundCourse);
            if (user?.type === 'user') {
                const isPurchased = purchasedCourses.some(pc => pc.id === courseId);
                // Also allow the creator to view their own course
                if (isPurchased || foundCourse.creator === user.uid) {
                    setIsAuthorized(true);
                } else {
                     toast({
                        variant: "destructive",
                        title: "Unauthorized",
                        description: "You have not purchased this course.",
                    });
                    router.push('/courses');
                }
            } else if (user?.type === 'business') {
                // Businesses can't view courses
                 toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Business accounts cannot view course content.",
                });
                router.push('/');
            } else {
                 // Not logged in
                toast({
                    variant: "destructive",
                    title: "Please Log In",
                    description: "You must be logged in to view courses.",
                });
                router.push('/login-user');
            }
        } else {
             toast({
                variant: "destructive",
                title: "Course not found",
                description: "The course you are looking for does not exist.",
            });
            router.push('/courses');
        }
    }, [params.id, courses, purchasedCourses, user, router, toast, loading]);

    const handleDownloadPDF = async () => {
        if (!courseContentRef.current || !course) return;

        setIsDownloading(true);
        toast({ title: "Preparing PDF...", description: "Please wait while we generate your download." });

        const content = courseContentRef.current;

        try {
            const canvas = await html2canvas(content, {
                scale: 2, 
                useCORS: true, 
                logging: false,
                backgroundColor: null, // Use background from the element
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${course.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);

            toast({ title: "Download Started!", description: "Your course PDF is being downloaded." });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ variant: 'destructive', title: "PDF Generation Failed", description: "Could not generate PDF. Please try again." });
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading || !isAuthorized || !course) {
        return <div className="container mx-auto py-8"><p>Loading course...</p></div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card>
                 <div ref={courseContentRef} className="bg-background text-foreground">
                    <div className="relative aspect-video">
                        <Image
                            src={course.imageUrl}
                            alt={course.title}
                            fill
                            className="object-cover rounded-t-lg"
                            priority
                        />
                    </div>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-3xl font-headline">{course.title}</CardTitle>
                                <CardDescription>By {course.creatorName}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: course.content }} />
                    </CardContent>
                 </div>
                 {/* Action buttons outside the PDF capture area */}
                 <div className="p-6 pt-0">
                    <Button onClick={handleDownloadPDF} disabled={isDownloading}>
                        {isDownloading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download as PDF
                            </>
                        )}
                    </Button>
                 </div>
            </Card>
        </div>
    );
}
