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
    const { user, courses, purchasedCourses } = useAppContext();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const courseContentRef = useRef<HTMLDivElement>(null);

    const [course, setCourse] = useState<Course | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const courseId = params.id as string;
        const foundCourse = courses.find(c => c.id === courseId);

        if (foundCourse) {
            setCourse(foundCourse);
            const isPurchased = purchasedCourses.some(pc => pc.id === courseId);
            if (user?.type === 'user' && isPurchased) {
                setIsAuthorized(true);
            } else {
                 toast({
                    variant: "destructive",
                    title: "Unauthorized",
                    description: "You have not purchased this course.",
                });
                router.push('/courses');
            }
        } else {
             toast({
                variant: "destructive",
                title: "Course not found",
                description: "The course you are looking for does not exist.",
            });
            router.push('/courses');
        }
    }, [params.id, courses, purchasedCourses, user, router, toast]);

    const handleDownloadPDF = async () => {
        if (!courseContentRef.current || !course) return;

        setIsDownloading(true);
        toast({ title: "Preparing PDF...", description: "Please wait while we generate your download." });

        const content = courseContentRef.current;

        try {
            const canvas = await html2canvas(content, {
                scale: 2, // Increase scale for better quality
                useCORS: true, 
                logging: false
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

    if (!isAuthorized || !course) {
        return <div className="container mx-auto py-8"><p>Loading course...</p></div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card>
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
                            <CardDescription>By {course.creator}</CardDescription>
                        </div>
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
                </CardHeader>
                <CardContent>
                    <div ref={courseContentRef} className="prose dark:prose-invert max-w-none">
                        <div className="p-8 bg-background" dangerouslySetInnerHTML={{ __html: course.content }} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
