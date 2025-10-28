
"use client";

import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Share2, Star, ThumbsUp, Copy } from "lucide-react";
import Image from "next/image";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

function StarRating({ rating, onRatingChange, disabled }: { rating: number, onRatingChange: (rating: number) => void, disabled: boolean }) {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={ratingValue}
                        className={`transition-colors text-amber-400 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => !disabled && onRatingChange(ratingValue)}
                        onMouseEnter={() => !disabled && setHover(ratingValue)}
                        onMouseLeave={() => !disabled && setHover(0)}
                    >
                        <Star className={`h-6 w-6 ${(ratingValue <= (hover || rating)) ? 'fill-current' : 'fill-transparent'}`} />
                    </button>
                );
            })}
        </div>
    );
}

function CourseViewerSkeleton() {
    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card>
                <div className="p-6">
                    <Skeleton className="relative aspect-video mb-6 rounded-lg" />
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/4 mb-6" />
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
            </Card>
        </div>
    )
}

function CourseContentViewer({ htmlContent }: { htmlContent: string }) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            const codeBlocks = contentRef.current.querySelectorAll('pre');
            codeBlocks.forEach(block => {
                const wrapper = document.createElement('div');
                wrapper.className = 'relative group';

                const copyButton = document.createElement('button');
                copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
                copyButton.className = 'absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity';
                
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(block.innerText);
                    toast.success("Code copied to clipboard!");
                };
                
                block.parentNode?.insertBefore(wrapper, block);
                wrapper.appendChild(block);
                wrapper.appendChild(copyButton);
            });
        }
    }, [htmlContent]);

    return (
        <div 
            ref={contentRef}
            className="prose dark:prose-invert max-w-none prose-lg prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-headings:text-foreground" 
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
    );
}

export default function CourseViewer({ courseId }: { courseId: string }) {
    const { user, courses, purchasedCourses, loading, rateCourse } = useAppContext();
    const router = useRouter();
    const courseContentRef = useRef<HTMLDivElement>(null);

    const [course, setCourse] = useState<Course | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [isRating, setIsRating] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        if (loading) return;

        const foundCourse = courses.find(c => c.id === courseId);
        
        if (foundCourse) {
            setCourse(foundCourse);
            
            if (user?.email === 'polokopule91@gmail.com') {
                setIsAuthorized(true);
                setIsPurchased(true);
            } else if (user?.type === 'user') {
                const purchased = purchasedCourses.some(pc => pc.id === courseId);
                setIsPurchased(purchased);
                if (purchased || foundCourse.creator === user.uid) {
                    setIsAuthorized(true);
                } else if (foundCourse.status !== 'approved') {
                    toast.error("This course is not available for viewing.");
                    router.push('/courses');
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

        setInitialLoading(false);

    }, [courseId, courses, purchasedCourses, user, router, loading]);

    useEffect(() => {
        if (course && user && course.ratings && course.ratings[user.uid]) {
            setUserRating(course.ratings[user.uid]);
        }
    }, [course, user]);

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
    
    const handleRatingChange = async (newRating: number) => {
        if (!course || !user) return;
        setIsRating(true);
        setUserRating(newRating); // Optimistic update
        await rateCourse(course.id, newRating);
        setIsRating(false);
    }

    if (initialLoading || !course || !isAuthorized) {
        return <CourseViewerSkeleton />;
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
                       <CourseContentViewer htmlContent={course.content} />
                    </CardContent>
                 </div>
                 {isPurchased && (
                    <CardContent>
                         <div className="mt-6 border-t pt-6">
                            <h3 className="text-lg font-semibold mb-2">Rate this course</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <StarRating rating={userRating} onRatingChange={handleRatingChange} disabled={isRating} />
                                {userRating > 0 && !isRating && <p className="text-sm text-green-600 flex items-center gap-1"><ThumbsUp className="h-4 w-4"/> Thanks for your feedback!</p>}
                                {isRating && <Loader2 className="h-5 w-5 animate-spin" />}
                            </div>
                        </div>
                    </CardContent>
                 )}
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
