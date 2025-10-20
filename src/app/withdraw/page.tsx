
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const POINTS_TO_ZAR_RATE = 0.10; // 1 UP = 0.10 ZAR (10 cents)
const MIN_WITHDRAWAL_MPESA = 100;
const MIN_WITHDRAWAL_SKRILL = 1000;

export default function WithdrawPage() {
    const { user, loading, requestWithdrawal } = useAppContext();
    const router = useRouter();

    const [withdrawalAmount, setWithdrawalAmount] = useState(MIN_WITHDRAWAL_MPESA);
    const [isRequesting, setIsRequesting] = useState(false);
    const [method, setMethod] = useState<'Mpesa' | 'Skrill'>('Mpesa');
    const [paymentDetail, setPaymentDetail] = useState("");

    useEffect(() => {
        if (!loading && (!user || user.type !== 'user')) {
            router.push('/login-user');
        }
    }, [user, loading, router]);
    
    const handleRequestWithdrawal = async () => {
        const minAmount = method === 'Mpesa' ? MIN_WITHDRAWAL_MPESA : MIN_WITHDRAWAL_SKRILL;
        if (withdrawalAmount < minAmount) {
            toast.error(`Minimum withdrawal for ${method} is ${minAmount} UPs.`);
            return;
        }
        if (withdrawalAmount > user!.points) {
            toast.error("You cannot withdraw more points than you have.");
            return;
        }
        if (!paymentDetail.trim()) {
            toast.error(`Please provide your ${method === 'Mpesa' ? 'phone number' : 'Skrill email'}.`);
            return;
        }
        
        setIsRequesting(true);
        await requestWithdrawal(withdrawalAmount, method, paymentDetail);
        setIsRequesting(false);
        setWithdrawalAmount(method === 'Mpesa' ? MIN_WITHDRAWAL_MPESA : MIN_WITHDRAWAL_SKRILL);
        setPaymentDetail("");
    }
    
    const withdrawalHistory = user?.withdrawalRequests ? Object.values(user.withdrawalRequests).sort((a,b) => b.requestedAt - a.requestedAt) : [];

    if (loading || !user) {
        return <div className="container mx-auto py-8"><p>Loading...</p></div>;
    }
    
    const zarAmount = withdrawalAmount * POINTS_TO_ZAR_RATE;
    const minWithdrawal = method === 'Mpesa' ? MIN_WITHDRAWAL_MPESA : MIN_WITHDRAWAL_SKRILL;

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
                            <CardDescription>Select a withdrawal method and enter your details. Your request will be reviewed by an admin.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs value={method} onValueChange={(value) => setMethod(value as 'Mpesa' | 'Skrill')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="Mpesa">M-Pesa</TabsTrigger>
                                    <TabsTrigger value="Skrill">Skrill</TabsTrigger>
                                </TabsList>
                                <TabsContent value="Mpesa" className="space-y-4 pt-4">
                                     <WithdrawalForm 
                                        method="Mpesa"
                                        minAmount={MIN_WITHDRAWAL_MPESA}
                                        userPoints={user.points}
                                        withdrawalAmount={withdrawalAmount}
                                        setWithdrawalAmount={setWithdrawalAmount}
                                        paymentDetail={paymentDetail}
                                        setPaymentDetail={setPaymentDetail}
                                        zarAmount={zarAmount}
                                    />
                                </TabsContent>
                                <TabsContent value="Skrill" className="space-y-4 pt-4">
                                     <WithdrawalForm 
                                        method="Skrill"
                                        minAmount={MIN_WITHDRAWAL_SKRILL}
                                        userPoints={user.points}
                                        withdrawalAmount={withdrawalAmount}
                                        setWithdrawalAmount={setWithdrawalAmount}
                                        paymentDetail={paymentDetail}
                                        setPaymentDetail={setPaymentDetail}
                                        zarAmount={zarAmount}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                        <CardFooter>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={isRequesting || user.points < minWithdrawal || withdrawalAmount < minWithdrawal || withdrawalAmount > user.points || !paymentDetail}>
                                        {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Request Withdrawal
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Withdrawal Request</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You are about to request a withdrawal of {withdrawalAmount} UPs (R{zarAmount.toFixed(2)}) via {method}. This amount will be deducted from your balance and held until the request is processed.
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
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawalHistory.length > 0 ? withdrawalHistory.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell>{format(new Date(req.requestedAt), "PPP")}</TableCell>
                                            <TableCell>{req.points.toFixed(3)}</TableCell>
                                            <TableCell>R {req.amountZAR.toFixed(2)}</TableCell>
                                            <TableCell>{req.method}</TableCell>
                                            <TableCell>
                                                 <Badge variant={req.status === 'approved' ? 'default' : req.status === 'pending' ? 'secondary' : 'destructive'}>
                                                    {req.status}
                                                 </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">No withdrawal history.</TableCell>
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
                           <p>2. Once you have enough UPs for your chosen method, you can request a withdrawal.</p>
                           <p>3. Our team will review your request. Upon approval, we will send payment to the details you provided.</p>
                           <p>4. Payments are processed manually.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function WithdrawalForm({ method, minAmount, userPoints, withdrawalAmount, setWithdrawalAmount, paymentDetail, setPaymentDetail, zarAmount }: {
    method: 'Mpesa' | 'Skrill',
    minAmount: number,
    userPoints: number,
    withdrawalAmount: number,
    setWithdrawalAmount: (amount: number) => void,
    paymentDetail: string,
    setPaymentDetail: (detail: string) => void,
    zarAmount: number
}) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`${method}-points`}>UPs to Withdraw</Label>
                    <Input 
                        id={`${method}-points`}
                        type="number"
                        min={minAmount}
                        max={userPoints}
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
             <div className="space-y-2">
                <Label htmlFor={`${method}-detail`}>{method === 'Mpesa' ? 'M-Pesa Phone Number' : 'Skrill Email'}</Label>
                <Input
                    id={`${method}-detail`}
                    type={method === 'Mpesa' ? 'tel' : 'email'}
                    value={paymentDetail}
                    onChange={(e) => setPaymentDetail(e.target.value)}
                    placeholder={method === 'Mpesa' ? 'e.g., 0712345678' : 'e.g., you@example.com'}
                />
            </div>
            <div className="text-xs text-muted-foreground">
                Minimum withdrawal for {method} is {minAmount} UPs. Conversion Rate: 1 UP = R{POINTS_TO_ZAR_RATE.toFixed(2)} ZAR.
            </div>
        </div>
    )
}
