
"use client";

import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Share2 } from "lucide-react";
import Image from "next/image";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from "react-hot-toast";

export default function CourseViewer({ courseId }: { courseId: string }) {
    const { user, courses, purchasedCourses, loading } = useAppContext();
    const router = useRouter();
    const courseContentRef = useRef<HTMLDivElement>(null);

    const [course, setCourse] = useState<Course | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (loading) return;

        const foundCourse = courses.find(c => c.id === courseId);

        if (foundCourse) {
            setCourse(foundCourse);
            
            // Check for admin access first
            if (user?.email === 'polokopule91@gmail.com') {
                setIsAuthorized(true);
                return;
            }

            if (user?.type === 'user') {
                const isPurchased = purchasedCourses.some(pc => pc.id === courseId);
                if (isPurchased || foundCourse.creator === user.uid) {
                    setIsAuthorized(true);
                } else {
                     toast.error("You have not purchased this course.");
                    router.push('/courses');
                }
            } else if (user?.type === 'business') {
                toast.error("Business accounts cannot view course content.");
                router.push('/');
            } else if (!user) {
                toast.error("You must be logged in to view courses.");
                router.push('/login-user');
            }
        } else if (!loading) {
             toast.error("The course you are looking for does not exist.");
            router.push('/courses');
        }
    }, [courseId, courses, purchasedCourses, user, router, loading]);

    const handleDownloadPDF = async () => {
        if (!courseContentRef.current || !course) return;

        setIsDownloading(true);
        const toastId = toast.loading("Preparing PDF...");

        const content = courseContentRef.current;

        try {
            const canvas = await html2canvas(content, {
                scale: 2, 
                useCORS: true, 
                logging: false,
                backgroundColor: window.getComputedStyle(document.body).backgroundColor === 'rgb(250, 250, 250)' ? '#ffffff' : '#09090b',
                onclone: (document) => {
                    // This might be necessary if images aren't loading
                    // For now, useCORS should handle it for most cases
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${course.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);

            toast.success("Download Started!", { id: toastId });
        } catch (error) {
            console.error("PDF Generation Error: ", error);
            toast.error("Could not generate PDF. Please try again.", { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleShare = () => {
        if (!course) return;
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("Course link copied to clipboard!");
        }, () => {
            toast.error("Could not copy link.");
        });
    };

    if (loading || !course) {
        return <div className="container mx-auto py-8"><p>Loading course...</p></div>;
    }

    if (!isAuthorized) {
        // This handles the case where auth check is done but user is not authorized.
        // It prevents a flash of content.
         return <div className="container mx-auto py-8"><p>Loading course...</p></div>;
    }


    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card>
                 <div ref={courseContentRef} className="bg-background text-foreground p-6">
                    <div className="relative aspect-video mb-6">
                        <Image
                            src={course.imageUrl}
                            alt={course.title}
                            fill
                            className="object-cover rounded-lg"
                            priority
                        />
                    </div>
                    <CardHeader className="p-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-3xl font-headline">{course.title}</CardTitle>
                                <CardDescription>By {course.creatorName}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-6">
                        <div className="prose dark:prose-invert max-w-none prose-lg prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-headings:text-foreground" dangerouslySetInnerHTML={{ __html: course.content }} />
                    </CardContent>
                 </div>
                 <div className="p-6 pt-0 flex flex-wrap gap-4">
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
                     <Button onClick={handleShare} variant="outline">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                    </Button>
                 </div>
            </Card>
        </div>
    );
}
