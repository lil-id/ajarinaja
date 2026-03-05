import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStudentActiveSessions, useStudentCheckIn } from '@/hooks/useStudentAttendance';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function StudentActiveSessionWidget() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { data: sessions, isLoading } = useStudentActiveSessions();
    const checkIn = useStudentCheckIn();
    const [pins, setPins] = useState<Record<string, string>>({}); // Map session_id -> pin

    const handlePinChange = (sessionId: string, value: string) => {
        setPins(prev => ({ ...prev, [sessionId]: value }));
    };

    const handleCheckIn = async (sessionId: string) => {
        if (!user) return;
        try {
            const result = await checkIn.mutateAsync({
                sessionId,
                studentId: user.id,
                pin: pins[sessionId] || undefined,
            });

            if (result.success) {
                toast.success(t('attendance.checkInSuccess') || 'Check-in successful!');
                setPins(prev => {
                    const next = { ...prev };
                    delete next[sessionId];
                    return next;
                });
            } else {
                toast.error(t('attendance.checkInFailed') || 'Check-in failed');
            }
        } catch (error: any) {
            toast.error(error.message || t('common.error'));
        }
    };

    if (isLoading) {
        return <div className="py-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!sessions || sessions.length === 0) {
        // Option: return null to hide widget if empty? Or show "No active sessions".
        // User might prefer seeing nothing if nothing is active to avoid clutter.
        // But for "transparansi", maybe showing "No active sessions" is good awareness.
        // Let's return null to keep dashboard clean, or a small placeholder.
        return null;
    }

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">{t('attendance.widget.title')}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session: any) => {
                    // Determine status based on time (Client side estimation for transparency display)
                    const now = new Date();
                    const graceEnd = new Date(session.grace_end_time);
                    const closeTime = new Date(session.close_time);

                    let timeStatus = 'present';
                    if (now > closeTime) timeStatus = 'closed';
                    else if (now > graceEnd) timeStatus = 'late';

                    // Color coding
                    const borderColor = timeStatus === 'present' ? 'border-l-green-500' : (timeStatus === 'late' ? 'border-l-yellow-500' : 'border-l-red-500');

                    return (
                        <Card key={session.id} className={`border-l-4 ${borderColor} shadow-sm`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-bold flex justify-between items-start">
                                    <span>{session.course?.title}</span>
                                    {timeStatus === 'late' && <Badge variant="destructive" className="text-xs bg-yellow-100 text-yellow-800">Late</Badge>}
                                </CardTitle>
                                <CardDescription className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span>{t('attendance.widget.presentUntil')}:</span>
                                        <span className="font-mono text-green-600 font-medium">{format(graceEnd, 'HH:mm')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('attendance.widget.lateUntil')}:</span>
                                        <span className="font-mono text-yellow-600 font-medium">{format(closeTime, 'HH:mm')}</span>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">{t('attendance.enterPin')}</label>
                                        <Input
                                            value={pins[session.id] || ''}
                                            onChange={(e) => handlePinChange(session.id, e.target.value)}
                                            placeholder="PIN"
                                            className="uppercase text-center tracking-widest"
                                            maxLength={6}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => handleCheckIn(session.id)}
                                        className="w-full"
                                        disabled={checkIn.isPending}
                                        size="sm"
                                    >
                                        {checkIn.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle2 className="w-3 h-3 mr-2" />}
                                        {t('attendance.widget.checkInNow')}
                                    </Button>

                                    <div className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Status depends on check-in time</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
