import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Eye, Lock, Unlock, PlayCircle } from 'lucide-react';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAttendanceSessions, useCloseSession } from '@/hooks/useAttendanceSessions';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AttendanceSessionsTableProps {
    courseId: string;
}

export function AttendanceSessionsTable({ courseId }: AttendanceSessionsTableProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: sessions, isLoading } = useAttendanceSessions(courseId);
    const closeSession = useCloseSession();

    const handleCloseSession = async (sessionId: string) => {
        try {
            await closeSession.mutateAsync(sessionId);
            toast({
                title: t('attendance.sessionClosed'),
                description: t('attendance.sessionClosedDescription'),
            });
        } catch (error) {
            toast({
                title: t('common.error'),
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return <div className="text-center py-4">{t('common.loading')}</div>;
    }

    if (!sessions || sessions.length === 0) {
        return (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">{t('attendance.noSessionsYet')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                    {t('attendance.startFirstSession')}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>{t('attendance.sessionDate')}</TableHead>
                        <TableHead>{t('attendance.sessionTopic')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('attendance.present')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => (
                        <TableRow key={session.id}>
                            <TableCell className="font-medium">
                                {session.session_number}
                            </TableCell>
                            <TableCell>
                                {format(new Date(session.session_date), 'MMM d, yyyy')}
                                <div className="text-xs text-muted-foreground">
                                    {session.open_time ? format(new Date(session.open_time), 'HH:mm') : '-'}
                                </div>
                            </TableCell>
                            <TableCell>
                                {session.topic || <span className="text-muted-foreground italic">{t('common.noDescription')}</span>}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {session.status === 'open' && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                    )}
                                    <Badge variant={
                                        session.status === 'open' ? 'success' :
                                            session.status === 'scheduled' ? 'outline' : 'secondary'
                                    }>
                                        {t(`attendance.status.${session.status}`)}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{session.present_count}</span>
                                    <span className="text-muted-foreground">/ {session.total_students}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => navigate(`/teacher/courses/${courseId}/attendance/${session.id}`)}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            {t('common.viewDetails')}
                                        </DropdownMenuItem>
                                        {session.status === 'open' && (
                                            <DropdownMenuItem
                                                onClick={() => handleCloseSession(session.id)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Lock className="mr-2 h-4 w-4" />
                                                {t('common.close')}
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
