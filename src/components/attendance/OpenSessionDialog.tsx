import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Play, Copy, CheckCircle2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCreateSession, useOpenSession } from '@/hooks/useAttendanceSessions';
import { useAttendanceSettings } from '@/hooks/useAttendanceSettings';
import type { AttendanceSession } from '@/types/attendance';

interface OpenSessionDialogProps {
    courseId: string;
    trigger?: React.ReactNode;
}

// Generate alphanumeric PIN without ambiguous characters
function generatePIN(length: number = 6): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // No 0, O, 1, I
    let pin = '';
    for (let i = 0; i < length; i++) {
        pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pin;
}

// Hash PIN using SHA-256
async function hashPIN(pin: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Encrypt PIN for display (simple base64 for now)
function encryptPIN(pin: string): string {
    return btoa(pin);
}

export function OpenSessionDialog({ courseId, trigger }: OpenSessionDialogProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [pin, setPin] = useState<string>('');
    const [sessionOpened, setSessionOpened] = useState(false);
    const [copied, setCopied] = useState(false);

    const { data: settings } = useAttendanceSettings(courseId);
    const createSession = useCreateSession();
    const openSession = useOpenSession();

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            topic: '',
            duration: 15,
            sessionDate: new Date().toISOString().split('T')[0],
        },
    });

    const duration = watch('duration');

    const onSubmit = async (data: any) => {
        try {
            // Get next session number
            const { data: existingSessions } = await supabase
                .from('attendance_sessions')
                .select('session_number')
                .eq('course_id', courseId)
                .order('session_number', { ascending: false })
                .limit(1);

            const nextSessionNumber = existingSessions?.[0]?.session_number
                ? existingSessions[0].session_number + 1
                : 1;

            // Generate PIN
            const generatedPin = generatePIN();
            const pinHash = await hashPIN(generatedPin);
            const pinEncrypted = encryptPIN(generatedPin);

            // Create session
            const newSession = await createSession.mutateAsync({
                course_id: courseId,
                teacher_id: (await supabase.auth.getUser()).data.user?.id,
                session_number: nextSessionNumber,
                topic: data.topic || undefined,
                session_date: data.sessionDate,
                pin_hash: pinHash,
                pin_encrypted: pinEncrypted,
                status: 'scheduled',
            } as Partial<AttendanceSession>);

            // Open session
            await openSession.mutateAsync({
                sessionId: newSession.id,
                duration: data.duration,
            });

            setPin(generatedPin);
            setSessionOpened(true);

            toast({
                title: t('attendance.sessionOpened'),
                description: t('attendance.sessionOpenedDescription'),
            });
        } catch (error) {
            console.error('Error opening session:', error);
            toast({
                title: t('common.error'),
                description: t('attendance.sessionOpenFailed'),
                variant: 'destructive',
            });
        }
    };

    const copyPIN = () => {
        navigator.clipboard.writeText(pin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: t('common.copied'),
            description: t('attendance.pinCopied'),
        });
    };

    const handleClose = () => {
        setOpen(false);
        setPin('');
        setSessionOpened(false);
        setCopied(false);
    };

    // Calculate end time
    const endTime = new Date(Date.now() + duration * 60 * 1000);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Play className="w-4 h-4 mr-2" />
                        {t('attendance.openSession')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('attendance.openSessionTitle')}</DialogTitle>
                    <DialogDescription>
                        {sessionOpened
                            ? t('attendance.sessionActiveDescription')
                            : t('attendance.openSessionDescription')}
                    </DialogDescription>
                </DialogHeader>

                {!sessionOpened ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="session_date">
                                {t('attendance.sessionDate')}
                            </Label>
                            <Input
                                id="session_date"
                                type="date"
                                {...register('sessionDate', { required: true })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="topic">{t('attendance.sessionTopic')}</Label>
                            <Textarea
                                id="topic"
                                placeholder={t('attendance.sessionTopicPlaceholder')}
                                {...register('topic')}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">
                                {t('attendance.sessionDuration')}
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="duration"
                                    type="number"
                                    min="5"
                                    max="120"
                                    {...register('duration', {
                                        required: true,
                                        min: 5,
                                        max: 120,
                                    })}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {t('common.minutes')}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {t('attendance.willCloseAt')} {endTime.toLocaleTimeString()}
                            </p>
                        </div>

                        {settings && (
                            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                                <p>
                                    <strong>{t('attendance.gracePeriod')}:</strong>{' '}
                                    {settings.grace_period_minutes} {t('common.minutes')}
                                </p>
                                <p>
                                    <strong>{t('attendance.lateWindow')}:</strong>{' '}
                                    {settings.late_window_minutes} {t('common.minutes')}
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={createSession.isPending || openSession.isPending}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {createSession.isPending || openSession.isPending
                                    ? t('common.opening')
                                    : t('attendance.openSession')}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {/* Session Active Indicator */}
                        <div className="flex items-center justify-center gap-2 text-green-600">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </div>
                            <span className="font-medium">
                                {t('attendance.sessionActive')}
                            </span>
                        </div>

                        {/* PIN Display */}
                        <div className="space-y-2">
                            <Label>{t('attendance.attendancePIN')}</Label>
                            <div className="relative">
                                <div className="flex items-center justify-center gap-1 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                                    {pin.split('').map((char, i) => (
                                        <span
                                            key={i}
                                            className="text-4xl font-bold font-mono tracking-wider text-primary"
                                        >
                                            {char}
                                        </span>
                                    ))}
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2"
                                    onClick={copyPIN}
                                >
                                    {copied ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-center text-muted-foreground">
                                {t('attendance.sharePINWithStudents')}
                            </p>
                        </div>

                        {/* Session Info */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('attendance.closesAt')}:
                                </span>
                                <span className="font-medium">
                                    {endTime.toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('attendance.gracePeriod')}:
                                </span>
                                <span className="font-medium">
                                    {settings?.grace_period_minutes || 5} {t('common.minutes')}
                                </span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">
                                {t('common.done')}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
