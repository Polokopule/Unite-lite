
"use client";

import { useAppContext } from "@/contexts/app-context";
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShoppingBag, CheckCircle, Loader2, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

function CourseRating({ ratings }: { ratings: { [key: string]: number } | undefined }) {
    if (!ratings || Object.keys(ratings).length === 0) {
        return <p className="text-sm text-muted-foreground">No ratings yet</p>;
    }

    const ratingValues = Object.values(ratings);
    const averageRating = ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length;
    const ratingCount = ratingValues.length;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold text-base text-foreground">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
        </div>
    );
}

function CourseMarketplaceSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="flex flex-col">
          <Skeleton className="relative aspect-video rounded-t-lg" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="flex-grow space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
          <div className="flex justify-between items-center p-6 pt-0">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-10 w-28" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function CoursesMarketplacePage() {
  const { courses, user, purchaseCourse, loading } = useAppContext();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (course: Course) => {
    setPurchasingId(course.id);
    const success = await purchaseCourse(course);
    if (!success) {
      // Error toast is handled in the context function
    }
    setPurchasingId(null);
  };
  
  const approvedCourses = courses.filter(c => c.status === 'approved' || c.status === undefined);

  return (
    <div className="container mx-auto py-8">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold font-headline">Courses</h2>
                <p className="text-muted-foreground">Browse our marketplace of user-created courses.</p>
            </div>
             {user?.type === 'user' && (
                <Button asChild className="mt-4 sm:mt-0">
                    <Link href="/courses/create"><PlusCircle className="mr-2 h-4 w-4"/>Create Course</Link>
                </Button>
            )}
        </div>

      {loading ? <CourseMarketplaceSkeleton /> :
       approvedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedCourses.map((course) => {
            const isPurchased = user?.purchasedCourses && user.purchasedCourses[course.id];
            const isPurchasing = purchasingId === course.id;
            const excerpt = course.content.replace(/<[^>]+>/g, '').substring(0, 100) + '...';

            return (
              <Card key={course.id} className="flex flex-col">
                 <Link href={`/courses/${course.id}`} className="block">
                    <div className="relative aspect-video">
                    <Image
                        src={course.imageUrl}
                        alt={course.title}
                        data-ai-hint={course.imageHint}
                        fill
                        className="object-cover rounded-t-lg"
                    />
                    </div>
                </Link>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <div className="pt-2">
                    <CourseRating ratings={course.ratings} />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                   <p className="text-sm text-muted-foreground line-clamp-2">{excerpt}</p>
                  <p className="text-sm text-muted-foreground mt-2">By: {course.creatorName}</p>
                </CardContent>
                <div className="flex justify-between items-center p-6 pt-0">
                    <div className="font-bold text-lg flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-accent"/>
                        <span>{course.price}</span>
                    </div>
                  {user?.type === 'user' ? (
                     isPurchased ? (
                         <Link href={`/courses/${course.id}`}>
                            <Badge variant="secondary" className="border-green-500 text-green-600 hover:bg-green-50">
                               <CheckCircle className="h-4 w-4 mr-2"/> View Course
                            </Badge>
                         </Link>
                     ) : (
                        <Button onClick={() => handlePurchase(course)} disabled={isPurchasing}>
                            {isPurchasing ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <ShoppingBag className="h-4 w-4 mr-2"/>}
                            {isPurchasing ? 'Purchasing...' : 'Purchase'}
                        </Button>
                     )
                  ) : user ? null : (
                     <Button onClick={() => toast.error("Please log in as a user to purchase.")}><ShoppingBag className="h-4 w-4 mr-2"/> Purchase</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg mt-8">
            <h2 className="text-xl font-semibold">No Courses Available</h2>
            <p className="text-muted-foreground mt-2">Check back later or be the first to create one!</p>
        </div>
      )}
    </div>
  );
}
