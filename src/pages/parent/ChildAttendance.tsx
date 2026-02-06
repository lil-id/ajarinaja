/**
 * @fileoverview Child Attendance Page
 * @description Detailed view of child's attendance records
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useParentChildren } from '@/hooks/useParentChildren';
import { useChildAttendance } from '@/hooks/useChildAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const statusConfig = {
    present: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Present' },
    absent: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Absent' },
    excused: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Excused' },
    late: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Late' },
};

export default function ChildAttendance() {
    const { t } = useTranslation();
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();

    const { children, isLoading: isLoadingChildren } = useParentChildren();
    const { attendanceRecords, summary, isLoading } = useChildAttendance(childId);

    const child = children.find(c => c.user_id === childId);

    if (isLoadingChildren || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!child) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">{t('parent.childNotFound')}</h2>
                <Button onClick={() => navigate('/parent')}>
                    {t('common.goBack')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/parent/children/${childId}`)}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">
                        {t('parent.attendanceFor')} {child.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.viewAllAttendanceRecords')}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.totalSessions')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-green-600">
                            {t('parent.present')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.present}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-red-600">
                            {t('parent.absent')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-blue-600">
                            {t('parent.excused')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary.excused}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.attendanceRate')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.percentage}%</div>
                        <Progress value={summary.percentage} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Records Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('parent.attendanceHistory')}</CardTitle>
                    <CardDescription>
                        {t('parent.allAttendanceRecordsDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {attendanceRecords.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {t('parent.noAttendanceRecords')}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('common.date')}</TableHead>
                                        <TableHead>{t('common.course')}</TableHead>
                                        <TableHead>{t('parent.session')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead>{t('parent.note')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceRecords.map((record: any) => {
                                        const config = statusConfig[record.status as keyof typeof statusConfig];
                                        const Icon = config.icon;

                                        return (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    {new Date(record.session_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{record.course_title}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {record.course_code}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{record.session_title}</TableCell>
                                                <TableCell>
                                                    <Badge className={`${config.bg} ${config.color} border-0`}>
                                                        <Icon className="w-3 h-3 mr-1" />
                                                        {t(`attendance.${record.status}`)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {record.excuse_note || '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
