
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/contexts/app-context";
import { Ad, Course, Post as PostType, WithdrawalRequest, User as UserType } from "@/lib/types";
import { ArrowRight, BookCopy, Eye, PlusCircle, ShoppingBag, Pencil, Trash2, Loader2, Save, Check, X, Banknote, UserX, Shield, UserCheck, Megaphone, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-10 w-24" />
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-44" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function DashboardPage() {
  const { user, loading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="container mx-auto py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  const isAdmin = user.email === 'polokopule91@gmail.com';
  
  const getDefaultTab = () => {
    if(isAdmin) return "admin_courses";
    if(user.type === 'user') return "my_courses";
    if(user.type === 'business') return "my_ads";
    return "my_courses"; // Fallback
  }
  
  const defaultTab = getDefaultTab();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold font-headline mb-2">
        Dashboard
      </h1>
      <p className="text-muted-foreground mb-8">Manage your content and activity on Unite.</p>
      
      <Tabs defaultValue={defaultTab} className="w-full">
         <TabsList>
            {isAdmin && <>
                <TabsTrigger value="admin_courses"><BookOpen className="h-5 w-5 mr-2" />Approvals</TabsTrigger>
                <TabsTrigger value="admin_withdrawals"><Banknote className="h-5 w-5 mr-2" />Withdrawals</TabsTrigger>
                <TabsTrigger value="admin_users"><Shield className="h-5 w-5 mr-2" />Users</TabsTrigger>
                <TabsTrigger value="admin_all_courses"><BookCopy className="h-5 w-5 mr-2" />All Courses</TabsTrigger>
            </>}
            {user.type === 'user' && <TabsTrigger value="my_courses"><BookOpen className="h-5 w-5 mr-2" />My Courses</TabsTrigger> }
            {user.type === 'business' && <TabsTrigger value="my_ads"><Megaphone className="h-5 w-5 mr-2" />My Ads</TabsTrigger>}
        </TabsList>
        
        {isAdmin && (
            <>
            <TabsContent value="admin_courses">
                <AdminCourseReviewDashboard />
            </TabsContent>
            <TabsContent value="admin_withdrawals">
                <AdminWithdrawalsDashboard />
            </TabsContent>
            <TabsContent value="admin_users">
                <AdminUsersDashboard />
            </TabsContent>
             <TabsContent value="admin_all_courses">
                <AdminAllCoursesDashboard />
            </TabsContent>
            </>
        )}
        
        {user.type === 'user' && 
            <TabsContent value="my_courses">
                <UserCoursesDashboard />
            </TabsContent>
        }

        {user.type === 'business' &&
            <TabsContent value="my_ads">
                <BusinessDashboard />
            </TabsContent>
        }
      </Tabs>
    </div>
  );
}

function AdminCourseReviewDashboard() {
    const { courses, updateCourse } = useAppContext();
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const handleApprove = async (courseId: string) => {
        await updateCourse(courseId, { status: 'approved' });
    };

    const handleReject = async () => {
        if (!selectedCourse) return;
        await updateCourse(selectedCourse.id, { status: 'rejected', rejectionReason: rejectionReason });
        setSelectedCourse(null);
        setRejectionReason("");
    };
    
    const pendingCourses = courses.filter(c => c.status === 'pending');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Course Approvals</CardTitle>
                <CardDescription>Review courses submitted by users before they are published.</CardDescription>
            </CardHeader>
            <CardContent>
                {pendingCourses.length > 0 ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course</TableHead>
                                <TableHead>Creator</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingCourses.map(course => (
                                <TableRow key={course.id}>
                                    <TableCell>
                                        <Link href={`/courses/${course.id}`} className="font-medium hover:underline" target="_blank">{course.title}</Link>
                                    </TableCell>
                                    <TableCell>{course.creatorName}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="outline" onClick={() => handleApprove(course.id)}>Approve</Button>
                                                </AlertDialogTrigger>
                                             </AlertDialog>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="destructive" onClick={() => setSelectedCourse(course)}>Reject</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Reject Course: "{selectedCourse?.title}"?</AlertDialogTitle>
                                                        <AlertDialogDescription>Please provide a reason for rejection. This will be shown to the course creator.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <Input
                                                        placeholder="Reason for rejection..."
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                    />
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={() => setSelectedCourse(null)}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleReject}>Confirm Rejection</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No courses are pending review.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AdminAllCoursesDashboard() {
    const { courses, deleteCourse } = useAppContext();
    const [deletingId, setDeletingId] = useState<string|null>(null);

    const handleDeleteCourse = async (courseId: string) => {
        setDeletingId(courseId);
        await deleteCourse(courseId, true); // force delete as admin
        setDeletingId(null);
    }
    
    return (
         <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>Manage all courses on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
                <ul className="space-y-2">
                    {courses.map(course => (
                        <li key={course.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                                <p className="font-medium">{course.title}</p>
                                <p className="text-xs text-muted-foreground">By {course.creatorName}</p>
                            </div>
                             <Badge variant={course.status === 'approved' ? 'default' : course.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">{course.status}</Badge>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button variant="outline" size="icon" asChild>
                                    <Link href={`/courses/${course.id}`}><Eye className="h-4 w-4" /></Link>
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={deletingId === course.id}>
                                            {deletingId === course.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will permanently delete the course "{course.title}" by {course.creatorName}. This cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No courses have been created yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
    );
}

function AdminUsersDashboard() {
    const { allUsers, toggleUserBan } = useAppContext();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield /> User Management</CardTitle>
                <CardDescription>View, ban, and unban users.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allUsers.filter(u => u.email !== 'polokopule91@gmail.com').map(user => (
                            <TableRow key={user.uid}>
                                <TableCell>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </TableCell>
                                <TableCell className="capitalize">{user.type}</TableCell>
                                <TableCell>
                                    <Badge variant={user.banned ? 'destructive' : 'default'}>
                                        {user.banned ? 'Banned' : 'Active'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant={user.banned ? 'secondary' : 'destructive'} size="sm">
                                                {user.banned ? <UserCheck className="mr-2 h-4 w-4"/> : <UserX className="mr-2 h-4 w-4"/>}
                                                {user.banned ? 'Unban' : 'Ban'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    You are about to {user.banned ? 'unban' : 'ban'} the user {user.name}. 
                                                    {user.banned ? ' They will be able to log in again.' : ' They will no longer be able to log in.'}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => toggleUserBan(user.uid, !user.banned)}>
                                                    Confirm
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    )
}

function AdminWithdrawalsDashboard() {
    const { allUsers, approveWithdrawal, rejectWithdrawal } = useAppContext();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const allRequests: WithdrawalRequest[] = useMemo(() => {
        return allUsers
            .filter(u => u.withdrawalRequests)
            .flatMap(u => Object.values(u.withdrawalRequests!))
            .sort((a, b) => b.requestedAt - a.requestedAt);
    }, [allUsers]);

    const handleApprove = async (request: WithdrawalRequest) => {
        setProcessingId(request.id);
        await approveWithdrawal(request);
        setProcessingId(null);
    };

    const handleReject = async (request: WithdrawalRequest) => {
        setProcessingId(request.id);
        await rejectWithdrawal(request);
        setProcessingId(null);
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Banknote /> Withdrawal Requests</CardTitle>
                <CardDescription>Review and process user withdrawal requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Points/Amount</TableHead>
                            <TableHead>Method/Details</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allRequests.length > 0 ? allRequests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell>
                                    <div className="font-medium">{req.userName}</div>
                                    <div className="text-sm text-muted-foreground">{req.userEmail}</div>
                                </TableCell>
                                <TableCell>{format(new Date(req.requestedAt), "PPP p")}</TableCell>
                                 <TableCell>
                                    <div>{req.points.toFixed(3)} UPs</div>
                                    <div className="text-sm text-muted-foreground">R {req.amountZAR.toFixed(2)}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{req.method}</div>
                                    <div className="text-sm text-muted-foreground">{req.paymentDetail}</div>
                                </TableCell>
                                <TableCell>
                                     <Badge variant={req.status === 'approved' ? 'default' : req.status === 'pending' ? 'secondary' : 'destructive'}>
                                        {req.status}
                                     </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {req.status === 'pending' && (
                                        <div className="flex gap-2 justify-end">
                                            <Button 
                                                size="icon" 
                                                variant="outline" 
                                                onClick={() => handleApprove(req)}
                                                disabled={processingId === req.id}
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 text-green-600"/>}
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="destructive"
                                                onClick={() => handleReject(req)}
                                                disabled={processingId === req.id}
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>}
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No pending withdrawal requests.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function UserCoursesDashboard() {
    const { user, courses, deleteCourse } = useAppContext();
    const [deletingId, setDeletingId] = useState<string|null>(null);
    
    if (!user) return null;

    const purchasedCourseDetails = useMemo(() => {
        const purchasedIds = user.purchasedCourses ? Object.keys(user.purchasedCourses) : [];
        return courses.filter(course => purchasedIds.includes(course.id));
    }, [user.purchasedCourses, courses]);
    
    const createdCourses = courses.filter(course => course.creator === user.uid);

    const handleDeleteCourse = async (courseId: string) => {
      setDeletingId(courseId);
      await deleteCourse(courseId);
      setDeletingId(null);
    }

  return (
    <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>My Created Courses</CardTitle>
            <CardDescription>The courses you have created.</CardDescription>
          </CardHeader>
          <CardContent>
            {createdCourses.length > 0 ? (
                <ul className="space-y-2">
                    {createdCourses.map(course => (
                        <li key={course.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                                <span className="font-medium">{course.title}</span>
                                {course.status === 'rejected' && (
                                    <p className="text-xs text-destructive">Rejected: {course.rejectionReason}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={course.status === 'approved' ? 'default' : course.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">{course.status}</Badge>
                                <Button variant="outline" size="icon" asChild>
                                    <Link href={`/courses/edit/${course.id}`}><Pencil className="h-4 w-4" /></Link>
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={deletingId === course.id}>
                                            {deletingId === course.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete "{course.title}". This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't created any courses yet.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/courses/create">Create your first course <ArrowRight className="h-4 w-4 ml-2"/></Link>
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      <Card>
          <CardHeader>
            <CardTitle>My Purchased Courses</CardTitle>
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
                             <Button asChild variant="ghost" size="sm">
                                <Link href={`/courses/${course.id}`}>View Course</Link>
                            </Button>
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
  );
}

function BusinessDashboard() {
    const { user, ads, deleteAd } = useAppContext();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    if(!user) return null;

    const userAds = ads.filter(ad => ad.creator === user.uid);
    const totalViews = userAds.reduce((sum, ad) => sum + ad.views, 0);
    
    const handleDeleteAd = async (adId: string) => {
        setDeletingId(adId);
        await deleteAd(adId);
        setDeletingId(null);
    }

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
            {userAds.length > 0 ? (
                <ul className="space-y-2">
                    {userAds.map(ad => (
                        <li key={ad.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                           <div className="flex-1">
                             <p className="font-semibold">{ad.campaignName}</p>
                             <p className="text-sm text-muted-foreground">{ad.content}</p>
                           </div>
                           <div className="flex items-center gap-4 mx-4">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <Eye className="h-5 w-5 text-primary"/>
                                    <span>{ad.views}</span>
                                </div>
                           </div>
                           <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" asChild>
                                    <Link href={`/create-ad/edit/${ad.id}`}><Pencil className="h-4 w-4" /></Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={deletingId === ad.id}>
                                            {deletingId === ad.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the "{ad.campaignName}" campaign. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteAd(ad.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
            {userAds.length > 0 && (
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
