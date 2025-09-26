"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/app-context";
import Image from "next/image";
import { CheckCircle, PlusCircle, ShoppingBag, Wallet, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function CoursesPage() {
  const { courses, user, purchaseCourse, purchasedCourses } = useAppContext();
  const { toast } = useToast();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (courseId: string, title: string) => {
    setPurchasingId(courseId);
    const success = await purchaseCourse(courseId);
    setPurchasingId(null);
    if (success) {
      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased "${title}".`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "You may not have enough points or already own this course.",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Course Marketplace</h1>
            <p className="text-muted-foreground">Browse and purchase courses using your points.</p>
        </div>
        {user?.type === 'user' && (
            <Button asChild className="mt-4 sm:mt-0">
                <Link href="/courses/create"><PlusCircle className="h-4 w-4 mr-2"/>Create Course</Link>
            </Button>
        )}
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isPurchased = purchasedCourses.some(pc => pc.id === course.id);
            const isPurchasing = purchasingId === course.id;
            const excerpt = course.content.replace(/<[^>]+>/g, '').substring(0, 100) + '...';

            return (
              <Card key={course.id} className="flex flex-col">
                <div className="relative aspect-video">
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    data-ai-hint={course.imageHint}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{excerpt}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">Created by: {course.creator}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <div className="font-bold text-lg flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-accent"/>
                        <span>{course.price}</span>
                    </div>
                  {user?.type === 'user' ? (
                     isPurchased ? (
                        <Badge variant="secondary" className="border-green-500 text-green-600">
                           <CheckCircle className="h-4 w-4 mr-2"/> Purchased
                        </Badge>
                     ) : (
                        <Button onClick={() => handlePurchase(course.id, course.title)} disabled={isPurchasing}>
                            {isPurchasing ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <ShoppingBag className="h-4 w-4 mr-2"/>}
                            {isPurchasing ? 'Purchasing...' : 'Purchase'}
                        </Button>
                     )
                  ) : (
                    <Button disabled><ShoppingBag className="h-4 w-4 mr-2"/> Purchase</Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No Courses Available</h2>
            <p className="text-muted-foreground mt-2">Check back later or be the first to create one!</p>
        </div>
      )}
    </div>
  );
}
