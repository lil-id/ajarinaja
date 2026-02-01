import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAttendanceSession, useUpdateAttendanceManual, useCloseSession } from '@/hooks/useAttendanceSessions';
import { useAttendanceSettings } from '@/hooks/useAttendanceSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, Users, CheckCircle2, XCircle, MoreVertical, Edit, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AttendanceSessionDetail() {
    const { t } = useTranslation();
    const { courseId, sessionId } = useParams<{ courseId: string; sessionId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data, isLoading } = useAttendanceSession(sessionId!);
    const updateAttendance = useUpdateAttendanceManual();
    const closeSession = useCloseSession();
    const { data: settings } = useAttendanceSettings(courseId!);

    const [editRecord, setEditRecord] = useState<{ id: string; name: string; currentStatus: string; notes?: string } | null>(null);
    const [note, setNote] = useState('');

    const handleUpdateStatus = async (status: string) => {
        if (!editRecord) return;

        try {
            await updateAttendance.mutateAsync({
                recordId: editRecord.id,
                newStatus: status,
                notes: note || undefined,
            });
            toast({
                title: t('attendance.statusUpdated'),
                description: t('attendance.statusUpdateSuccess', { student: editRecord.name, status: t(`attendance.status.${status}`) }),
            });
            setEditRecord(null);
            setNote('');
        } catch (error) {
            toast({
                title: t('common.error'),
                description: t('attendance.statusUpdateFailed'),
                variant: 'destructive',
            });
        }
    };

    const handleCloseSession = async () => {
        if (!sessionId) return;
        try {
            await closeSession.mutateAsync(sessionId);
            toast({
                title: t('attendance.sessionClosed'),
            });
        } catch (error) {
            toast({
                title: t('common.error'),
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12">{t('common.loading')}</div>;
    }

    if (!data) {
        return <div className="p-8 text-center">{t('attendance.sessionNotFound')}</div>;
    }

    const { session, records } = data;

    const statuses = ['present', 'late', 'excused', 'sick', 'absent'];

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
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <Button variant="ghost" className="mb-2 pl-0 hover:pl-0" onClick={() => navigate(`/teacher/courses/${courseId}`)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('attendance.backToCourse')}
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {t('attendance.session')} #{session.session_number}
                        <Badge variant={session.status === 'open' ? 'success' : 'secondary'}>
                            {t(`attendance.status.${session.status}`)}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        {session.topic || session.course.title}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(session.session_date), 'EEEE, d MMMM yyyy')}
                        </span>
                        {session.open_time && (
                            <span>
                                Started: {format(new Date(session.open_time), 'HH:mm')}
                            </span>
                        )}
                    </div>
                </div>

                {session.status === 'open' && (
                    <Button variant="destructive" onClick={handleCloseSession}>
                        <Lock className="w-4 h-4 mr-2" />
                        {t('common.close')}
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('attendance.status.present')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{session.present_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('attendance.status.late')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{session.late_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('attendance.status.excused')} / {t('attendance.status.sick')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{session.excused_count + session.sick_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('attendance.status.absent')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{session.absent_count}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Student List */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('attendance.studentList')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('auth.name')}</TableHead>
                                <TableHead>{t('attendance.checkInTime')}</TableHead>
                                <TableHead>{t('common.status')}</TableHead>
                                <TableHead>{t('attendance.notes')}</TableHead>
                                <TableHead className="text-right">{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={record.student.avatar_url || undefined} />
                                                <AvatarFallback>
                                                    {record.student.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{record.student.name}</span>
                                                <span className="text-xs text-muted-foreground">{record.student.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {record.check_in_time
                                            ? format(new Date(record.check_in_time), 'HH:mm:ss')
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(record.status)}`}>
                                            {t(`attendance.status.${record.status}`)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {record.notes || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditRecord({
                                                    id: record.id,
                                                    name: record.student.name,
                                                    currentStatus: record.status,
                                                    notes: record.notes
                                                });
                                                setNote(record.notes || '');
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Status Dialog */}
            <Dialog open={!!editRecord} onOpenChange={(open) => !open && setEditRecord(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('attendance.editStatus')}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('attendance.checkInStatus')}</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {statuses.map((status) => (
                                    <Button
                                        key={status}
                                        variant={editRecord?.currentStatus === status ? "default" : "outline"}
                                        className="justify-start capitalize"
                                        onClick={() => handleUpdateStatus(status)}
                                        disabled={updateAttendance.isPending}
                                    >
                                        {status === editRecord?.currentStatus && <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        {t(`attendance.status.${status}`)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('attendance.notes')}</Label>
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={t('attendance.addNotePlaceholder')}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
