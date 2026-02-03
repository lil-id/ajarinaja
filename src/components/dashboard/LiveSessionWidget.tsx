import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInSeconds } from 'date-fns';
import { Clock, Users, XCircle, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
    useActiveTeacherSession,
    useCloseSession
} from '@/hooks/useAttendanceSessions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function LiveSessionWidget() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState(0);

    const { data: session, isLoading } = useActiveTeacherSession();
    const closeSession = useCloseSession();

    // Update countdown timer
    useEffect(() => {
        if (!session || !session.close_time || !session.open_time) return;

        const end = new Date(session.close_time);
        const start = new Date(session.open_time);
        const totalSeconds = differenceInSeconds(end, start);
        setTotalDuration(totalSeconds);

        const updateTimer = () => {
            const now = new Date();
            const diff = differenceInSeconds(end, now);

            if (diff <= 0) {
                setTimeLeft(0);
                setProgress(100);
            } else {
                setTimeLeft(diff);
                const elapsed = totalSeconds - diff;
                setProgress((elapsed / totalSeconds) * 100);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [session]);

    const copyPIN = () => {
        // We need the decrypted PIN which is only available if we store it securely or decrypt it.
        // However, the backend only returns `pin_hash` usually for security.
        // Wait, the session object has `pin_encrypted`. 
        // In our simplified implementation, we stored it as simple base64 (not secure for real prod, but ok for MVP).
        // Let's decode it.
        if (session?.pin_encrypted) {
            try {
                const pin = atob(session.pin_encrypted);
                navigator.clipboard.writeText(pin);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast({
                    title: t('attendance.pinCopied'),
                });
            } catch (e) {
                console.error('Failed to decode PIN');
            }
        }
    };

    const handleCloseSession = async () => {
        if (!session) return;
        try {
            await closeSession.mutateAsync(session.id);
            toast({
                title: t('common.success'),
                description: t('attendance.sessionClosed'),
            });
        } catch (error) {
            toast({
                title: t('common.error'),
                description: t('attendance.sessionCloseFailed'),
                variant: 'destructive',
            });
        }
    };

    if (isLoading) return null; // Don't show skeleton to save space, or maybe small spinner
    if (!session) return null; // No active session

    // Check if session is expired (time is up)
    const now = new Date();
    // Use a small buffer (e.g., 1 second) or strict check? Strict is fine.
    // We check against close_time.
    const isExpired = session.close_time && now >= new Date(session.close_time);

    if (isExpired) return null;

    // Format time left
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Decoded PIN for display
    const displayPIN = session.pin_encrypted ? atob(session.pin_encrypted) : '??????';

    return (
        <Card className="border-l-4 border-l-green-500 shadow-sm relative overflow-hidden bg-gradient-to-r from-background to-green-50/20 dark:to-green-900/10">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Clock className="w-24 h-24" />
            </div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                                {t('attendance.sessionActive')}
                            </span>
                        </div>
                        <CardTitle className="text-lg">
                            {session.course.title}
                        </CardTitle>
                        {session.topic && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {session.topic}
                            </p>
                        )}
                    </div>

                    <div className="text-right">
                        <div className="text-2xl font-bold font-mono text-primary">
                            {timeString}
                        </div>
                        <p className="text-xs text-muted-foreground">{t('attendance.closesAt')} {new Date(session.close_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* PIN Display */}
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            {t('attendance.attendancePIN')}
                        </span>
                        <div
                            className="flex items-center gap-2 bg-muted/50 p-2 rounded-md border border-dashed border-primary/30 cursor-pointer hover:bg-muted transition-colors group"
                            onClick={copyPIN}
                        >
                            <span className="text-xl font-bold font-mono tracking-widest flex-1 text-center">
                                {displayPIN}
                            </span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-50 group-hover:opacity-100">
                                {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            {t('attendance.present')}
                        </span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold">
                                {session.present_count}
                            </span>
                            <span className="text-sm text-muted-foreground mb-1">
                                / {session.total_students}
                            </span>
                        </div>
                        <Progress value={(session.present_count / (session.total_students || 1)) * 100} className="h-1.5" />
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-dashed">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            {t('attendance.status.late')}: {session.late_count}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {session.total_students} Total
                        </span>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2">
                                <XCircle className="w-4 h-4 mr-1.5" />
                                {t('common.close')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('attendance.closeSessionConfirmTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('attendance.closeSessionConfirmDesc')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCloseSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {t('attendance.closeSessionConfirmAction')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}
