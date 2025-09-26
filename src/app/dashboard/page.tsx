"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/contexts/app-context";
import { Ad, Course } from "@/lib/types";
import { ArrowRight, BookCopy, Eye, PlusCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, purchasedCourses, courses, ads } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold font-headline mb-2">
        Welcome back, {user.email.split('@')[0]}!
      </h1>
      <p className="text-muted-foreground mb-8">Here's a summary of your activity on AdEd.</p>

      {user.type === 'user' ? <UserDashboard courses={courses} purchasedCourses={purchasedCourses} /> : <BusinessDashboard ads={ads.filter(ad => ad.creator === user.email)} />}
    </div>
  );
}

function UserDashboard({ courses, purchasedCourses }: { courses: Course[], purchasedCourses: { id: string; title: string }[] }) {
    const purchasedCourseDetails = purchasedCourses.map(pc => courses.find(c => c.id === pc.id)).filter(Boolean) as Course[];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>The courses you have purchased.</CardDescription>
          </CardHeader>
          <CardContent>
            {purchasedCourseDetails.length > 0 ? (
                <ul className="space-y-4">
                    {purchasedCourseDetails.map(course => (
                        <li key={course.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-4">
                               <BookCopy className="h-5 w-5 text-primary"/>
                                <span className="font-medium">{course.title}</span>
                            </div>
                            <Button variant="ghost" size="sm">View Course</Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't purchased any courses yet.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/courses">Browse Courses <ArrowRight className="h-4 w-4 ml-2"/></Link>
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                 <Button asChild size="lg">
                    <Link href="/courses"><ShoppingBag className="mr-2 h-4 w-4"/>Browse Marketplace</Link>
                </Button>
                 <Button asChild size="lg" variant="secondary">
                    <Link href="/courses/create"><PlusCircle className="mr-2 h-4 w-4"/>Create a New Course</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BusinessDashboard({ ads }: { ads: Ad[] }) {
    const totalViews = ads.reduce((sum, ad) => sum + ad.views, 0);

  return (
     <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>My Ad Campaigns</CardTitle>
                <CardDescription>A list of your active and past ad campaigns.</CardDescription>
            </div>
            <Button asChild>
                <Link href="/create-ad"><PlusCircle className="mr-2 h-4 w-4"/>New Campaign</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ads.length > 0 ? (
                <ul className="space-y-2">
                    {ads.map(ad => (
                        <li key={ad.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                           <div>
                             <p className="font-semibold">{ad.campaignName}</p>
                             <p className="text-sm text-muted-foreground">{ad.content}</p>
                           </div>
                           <div className="flex items-center gap-2 text-lg font-semibold">
                                <Eye className="h-5 w-5 text-primary"/>
                                <span>{ad.views}</span>
                           </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't created any ad campaigns.</p>
                     <Button asChild variant="link" className="mt-2">
                        <Link href="/create-ad">Create your first ad <ArrowRight className="h-4 w-4 ml-2"/></Link>
                    </Button>
                </div>
            )}
            {ads.length > 0 && (
                <>
                <Separator className="my-6"/>
                <div className="flex justify-end items-center gap-4">
                    <p className="font-bold text-lg">Total Views:</p>
                    <p className="font-bold text-2xl text-primary">{totalViews}</p>
                </div>
                </>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
