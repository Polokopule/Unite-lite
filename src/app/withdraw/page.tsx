
"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, Wallet, History, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const POINTS_TO_ZAR_RATE = 0.10; // 1 UP = 0.10 ZAR (10 cents)
const MIN_WITHDRAWAL_POINTS = 100;

export default function WithdrawPage() {
    const { user, loading, requestWithdrawal } = useAppContext();
    const router = useRouter();

    const [withdrawalAmount, setWithdrawalAmount] = useState(MIN_WITHDRAWAL_POINTS);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        if (!loading && (!user || user.type !== 'user')) {
            router.push('/login-user');
        }
    }, [user, loading, router]);
    
    const handleRequestWithdrawal = async () => {
        if (withdrawalAmount < MIN_WITHDRAWAL_POINTS) {
            toast.error(`Minimum withdrawal is ${MIN_WITHDRAWAL_POINTS} UPs.`);
            return;
        }
        if (withdrawalAmount > user!.points) {
            toast.error("You cannot withdraw more points than you have.");
            return;
        }
        
        setIsRequesting(true);
        await requestWithdrawal(withdrawalAmount);
        setIsRequesting(false);
        setWithdrawalAmount(MIN_WITHDRAWAL_POINTS);
    }
    
    const withdrawalHistory = user?.withdrawalRequests ? Object.values(user.withdrawalRequests).sort((a,b) => b.requestedAt - a.requestedAt) : [];

    if (loading || !user) {
        return <div className="container mx-auto py-8"><p>Loading...</p></div>;
    }
    
    const zarAmount = withdrawalAmount * POINTS_TO_ZAR_RATE;

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold font-headline mb-2">Withdraw Earnings</h1>
            <p className="text-muted-foreground mb-8">Convert your Unite Points (UPs) into ZAR.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Banknote />
                                Request a Withdrawal
                            </CardTitle>
                            <CardDescription>Minimum withdrawal is {MIN_WITHDRAWAL_POINTS} UPs. Your request will be reviewed by an admin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="points">UPs to Withdraw</Label>
                                    <Input 
                                        id="points"
                                        type="number"
                                        min={MIN_WITHDRAWAL_POINTS}
                                        max={user.points}
                                        value={withdrawalAmount}
                                        onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Equivalent ZAR</Label>
                                    <Input
                                        value={`R ${zarAmount.toFixed(2)}`}
                                        readOnly
                                        className="font-bold bg-muted"
                                    />
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Conversion Rate: 1 UP = R{POINTS_TO_ZAR_RATE.toFixed(2)} ZAR.
                            </div>
                        </CardContent>
                        <CardFooter>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={isRequesting || user.points < MIN_WITHDRAWAL_POINTS || withdrawalAmount < MIN_WITHDRAWAL_POINTS || withdrawalAmount > user.points}>
                                        {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Request Withdrawal
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Withdrawal Request</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You are about to request a withdrawal of {withdrawalAmount} UPs (R{zarAmount.toFixed(2)}). This amount will be deducted from your balance and held until the request is processed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRequestWithdrawal}>Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History />Withdrawal History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Points (UPs)</TableHead>
                                        <TableHead>Amount (ZAR)</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawalHistory.length > 0 ? withdrawalHistory.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell>{format(new Date(req.requestedAt), "PPP")}</TableCell>
                                            <TableCell>{req.points.toFixed(3)}</TableCell>
                                            <TableCell>R {req.amountZAR.toFixed(2)}</TableCell>
                                            <TableCell>
                                                 <Badge variant={req.status === 'approved' ? 'default' : req.status === 'pending' ? 'secondary' : 'destructive'}>
                                                    {req.status}
                                                 </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">No withdrawal history.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wallet /> Your Balance</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-4xl font-bold">{user.points.toFixed(3)}</p>
                            <p className="text-muted-foreground">Unite Points (UPs)</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><DollarSign /> How it works</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                           <p>1. Earn UPs by watching ads on the "Earn Points" page.</p>
                           <p>2. Once you have at least {MIN_WITHDRAWAL_POINTS} UPs, you can request a withdrawal.</p>
                           <p>3. Our team will review your request. Upon approval, we will contact you via email ({user.email}) to arrange payment.</p>
                           <p>4. Payments are processed manually.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

