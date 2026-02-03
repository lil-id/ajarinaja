import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInSeconds } from 'date-fns';
import { Clock, MapPin, Loader2, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useStudentActiveSessions, useStudentCheckIn } from '@/hooks/useStudentAttendance';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface StudentLiveSessionWidgetProps {
    courseId: string | undefined;
}

export function StudentLiveSessionWidget({ courseId }: StudentLiveSessionWidgetProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [pin, setPin] = useState('');
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [checkInSuccess, setCheckInSuccess] = useState(false);

    // Fetch active sessions (which already filters out checked-in ones)
    const { data: activeSessions, isLoading } = useStudentActiveSessions();
    const session = activeSessions?.find((s: any) => s.course_id === courseId);

    // Check-in mutation
    const checkInMutation = useStudentCheckIn();

    // Timer Logic
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
            } else {
                setTimeLeft(diff);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [session]);

    // Format time left
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const progressPercent = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 100;

    const handleCheckIn = async () => {
        if (!session || !user) return;

        setIsCheckingIn(true);
        try {
            await checkInMutation.mutateAsync({
                sessionId: session.id,
                studentId: user.id,
                pin: pin,
                // We could add geolocation here later
            });

            setCheckInSuccess(true);
            toast({
                title: t('attendance.checkInSuccess'),
                description: t('attendance.youAreMarkedPresent'),
            });

            // Allow success state to show for a moment
            setTimeout(() => {
                setCheckInSuccess(false);
                setPin('');
            }, 3000);

        } catch (error: any) {
            console.error('Check-in failed:', error);
            toast({
                title: t('attendance.checkInFailed'),
                description: error.message || t('common.error'),
                variant: 'destructive',
            });
        } finally {
            setIsCheckingIn(false);
        }
    };

    if (isLoading || !courseId) return null;
    if (!session) return null; // No active session

    if (checkInSuccess) {
        return (
            <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 mb-6 animate-in fade-in zoom-in duration-300">
                <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                        {t('attendance.attendanceRecorded')}
                    </h3>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                        {session.topic || t('attendance.session')} • {new Date().toLocaleTimeString()}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4 border-l-blue-500 shadow-md relative overflow-hidden bg-gradient-to-r from-background to-blue-50/20 dark:to-blue-900/10 mb-6">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Clock className="w-24 h-24" />
            </div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                {t('attendance.checkInOpen')}
                            </span>
                        </div>
                        <CardTitle className="text-lg">
                            {t('attendance.markYourAttendance')}
                        </CardTitle>
                        <CardDescription>
                            {session.topic || session.course.title}
                        </CardDescription>
                    </div>

                    <div className="text-right">
                        <div className={cn(
                            "text-2xl font-bold font-mono transition-colors",
                            timeLeft < 60 ? "text-rose-500 animate-pulse" : "text-primary"
                        )}>
                            {timeString}
                        </div>
                        <p className="text-xs text-muted-foreground">{t('attendance.timeLeft')}</p>
                    </div>
                </div>
                <Progress value={progressPercent} className="h-1 mt-2" />
            </CardHeader>

            <CardContent>
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('attendance.enterPin') || "Enter PIN"}
                                className="pl-9 font-mono tracking-widest text-lg"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.toUpperCase())}
                                maxLength={6}
                                disabled={isCheckingIn}
                            />
                        </div>
                        <Button
                            onClick={handleCheckIn}
                            disabled={!pin || isCheckingIn || timeLeft === 0}
                            className="w-32"
                        >
                            {isCheckingIn ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                t('attendance.checkIn') || "Check In"
                            )}
                        </Button>
                    </div>
                    {timeLeft === 0 && (
                        <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 dark:bg-rose-900/20 p-2 rounded">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{t('attendance.sessionExpired')}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
