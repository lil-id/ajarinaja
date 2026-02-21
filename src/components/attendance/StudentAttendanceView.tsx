import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStudentAttendance, useStudentCheckIn } from '@/hooks/useStudentAttendance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle2, XCircle, Clock, MapPin, Calendar, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StudentAttendanceViewProps {
    courseId: string;
}

export function StudentAttendanceView({ courseId }: StudentAttendanceViewProps) {
    const { t } = useTranslation();
    const { data, isLoading } = useStudentAttendance(courseId);
    const checkIn = useStudentCheckIn();
    const [pin, setPin] = useState('');

    const handleCheckIn = async (sessionId: string) => {
        if (!data?.userId) {
            toast.error('User information not found');
            return;
        }

        try {
            const result = await checkIn.mutateAsync({
                sessionId,
                studentId: data.userId,
                pin: pin || undefined,
            });

            if (result.success) {
                toast.success(t('attendance.checkInSuccess') || 'Check-in successful!');
                setPin('');
            } else {
                toast.error(t('attendance.checkInFailed') || 'Check-in failed');
            }
        } catch (error: any) {
            toast.error(error.message || t('common.error'));
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!data) return null;

    const { sessions, records, activeSession } = data;

    // Check if I already checked in for the active session
    const activeRecord = activeSession ? records.get(activeSession.id) : null;
    const isCheckedIn = activeRecord && ['present', 'late'].includes(activeRecord.status);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'excused': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'sick': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Active Session Card */}
            {activeSession && !isCheckedIn && (
                <Card className="border-primary/50 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            {t('attendance.activeSession') || 'Active Session'}
                        </CardTitle>
                        <CardDescription>
                            {t('attendance.checkInPrompt') || 'Please check in for today\'s class.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-sm font-medium">
                                    {t('attendance.enterPin') || 'Enter PIN (if required)'}
                                </label>
                                <Input
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="e.g. 123456"
                                    className="text-lg tracking-widest text-center uppercase"
                                    maxLength={6}
                                />
                            </div>
                            <Button
                                onClick={() => handleCheckIn(activeSession.id)}
                                disabled={checkIn.isPending}
                                className="w-full sm:w-auto"
                            >
                                {checkIn.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                {t('attendance.checkIn') || 'Check In'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Attendance History */}
            <Card>
                <CardContent>
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <ClipboardList className="w-12 h-12 text-muted-foreground/50 mb-3" />
                            {t('attendance.noSessionsYet')}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('attendance.session')}</TableHead>
                                    <TableHead>{t('attendance.date') || 'Date'}</TableHead>
                                    <TableHead>{t('attendance.checkInStatus')}</TableHead>
                                    <TableHead>{t('attendance.checkInTime')}</TableHead>
                                    <TableHead>{t('attendance.notes')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((session) => {
                                    const record = records.get(session.id);
                                    // If no record exists yet for a past session, it's implicitly 'absent' usually?
                                    // Or maybe 'pending' if session is still open.
                                    // Logic: if session is closed and no record -> absent.
                                    // If session is open and no record -> pending/absent.

                                    const status = record?.status || (session.status === 'closed' || session.status === 'finalized' ? 'absent' : 'pending');

                                    return (
                                        <TableRow key={session.id}>
                                            <TableCell>
                                                <div className="font-medium">#{session.session_number}</div>
                                                {session.topic && <div className="text-xs text-muted-foreground">{session.topic}</div>}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(session.session_date), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`border-0 ${getStatusColor(status)}`}>
                                                    {t(`attendance.status.${status}`) || status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {record?.check_in_time
                                                    ? format(new Date(record.check_in_time), 'HH:mm')
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate">
                                                {record?.notes || '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
