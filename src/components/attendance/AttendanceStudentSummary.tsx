import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCourseAttendanceStats } from '@/hooks/useAttendanceSessions';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface AttendanceStudentSummaryProps {
    courseId: string;
    classId?: string;
    filterRange?: { from: Date | undefined; to: Date | undefined };
}

export function AttendanceStudentSummary({ courseId, classId, filterRange }: AttendanceStudentSummaryProps) {
    const { t } = useTranslation();
    const { data: stats, isLoading } = useCourseAttendanceStats(courseId, classId, filterRange);

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!stats || stats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="text-muted-foreground">{t('courses.noStudentsEnrolled')}</div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        {t('attendance.studentSummary') || 'Student Summary'}
                    </CardTitle>
                    <CardDescription>
                        {filterRange?.from && filterRange?.to
                            ? `${format(filterRange.from, 'PP')} - ${format(filterRange.to, 'PP')}`
                            : (t('attendance.summaryDescription') || 'Overview of attendance for all students.')}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('auth.name')}</TableHead>
                            <TableHead className="text-center text-green-600">{t('attendance.status.present')}</TableHead>
                            <TableHead className="text-center text-yellow-600">{t('attendance.status.late')}</TableHead>
                            <TableHead className="text-center text-blue-600">{t('attendance.status.excused')}</TableHead>
                            <TableHead className="text-center text-red-600">{t('attendance.status.absent')}</TableHead>
                            <TableHead className="text-right font-bold">%</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.map((student: { id: string; name: string; email: string; present: number; late: number; excused: number; sick: number; absent: number; attendancePercentage: number }) => (
                            <TableRow key={student.id}>
                                <TableCell>
                                    <div className="font-medium">{student.name}</div>
                                    <div className="text-xs text-muted-foreground">{student.email}</div>
                                </TableCell>
                                <TableCell className="text-center font-mono">{student.present}</TableCell>
                                <TableCell className="text-center font-mono">{student.late}</TableCell>
                                <TableCell className="text-center font-mono">{student.excused}</TableCell>
                                <TableCell className="text-center font-mono">{student.absent}</TableCell>
                                <TableCell className="text-right font-bold">
                                    <span className={
                                        student.attendancePercentage < 75 ? 'text-red-500' :
                                            student.attendancePercentage < 85 ? 'text-yellow-500' : 'text-green-500'
                                    }>
                                        {student.attendancePercentage.toFixed(1)}%
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Helper to calculate percentages
// (Already part of hook return)
