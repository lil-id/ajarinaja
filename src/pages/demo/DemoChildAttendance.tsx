import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, CalendarDays, Percent, Eye } from 'lucide-react';
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
import { demoStudents, demoCourses } from '@/data/demoData';

const statusConfig = {
    present: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Present' },
    absent: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Absent' },
    excused: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Excused' },
    late: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Late' },
};

export default function DemoChildAttendance() {
    const { t } = useTranslation();
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();

    const child = demoStudents.find(c => c.id === childId);

    if (!child) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">{t('parent.childNotFound')}</h2>
                <Button onClick={() => navigate('/demo/parent')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.goBack')}
                </Button>
            </div>
        );
    }

    // Generate demo attendance records
    const attendanceRecords = demoCourses.filter(c => c.status === 'published').slice(0, 3).flatMap((course, courseIdx) => {
        return [
            {
                id: `demo-att-${courseIdx}-1`,
                session_date: new Date(Date.now() - 86400000 * 1).toISOString(),
                created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
                course_title: course.title,
                course_code: `CS${100 + courseIdx}`,
                session_title: 'Morning Session',
                status: 'present',
                excuse_note: null
            },
            {
                id: `demo-att-${courseIdx}-2`,
                session_date: new Date(Date.now() - 86400000 * 3).toISOString(),
                created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
                course_title: course.title,
                course_code: `CS${100 + courseIdx}`,
                session_title: 'Afternoon Session',
                status: courseIdx === 1 ? 'absent' : 'present',
                excuse_note: courseIdx === 1 ? 'Sakit' : null
            }
        ];
    });

    const summary = {
        total: attendanceRecords.length,
        present: attendanceRecords.filter(r => r.status === 'present').length,
        absent: attendanceRecords.filter(r => r.status === 'absent').length,
        excused: attendanceRecords.filter(r => r.status === 'excused').length,
        percentage: Math.round((attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/demo/parent/children/${childId}`)}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">
                        {t('parent.attendanceFor')} {child.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.viewAllAttendanceRecords')} (Demo)
                    </p>
                </div>
            </div>

            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
            </Badge>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.totalSessions')}
                        </CardTitle>
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">
                            {t('parent.present')}
                        </CardTitle>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.present}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">
                            {t('parent.absent')}
                        </CardTitle>
                        <XCircle className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600">
                            {t('parent.excused')}
                        </CardTitle>
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary.excused}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.attendanceRate')}
                        </CardTitle>
                        <Percent className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.percentage}%</div>
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
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('common.date')}</TableHead>
                                    <TableHead>{t('parent.time')}</TableHead>
                                    <TableHead>{t('common.course')}</TableHead>
                                    <TableHead>{t('parent.session')}</TableHead>
                                    <TableHead>{t('common.status')}</TableHead>
                                    <TableHead>{t('parent.note')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceRecords.map((record) => {
                                    const config = statusConfig[record.status as keyof typeof statusConfig];
                                    const Icon = config.icon;

                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">
                                                {new Date(record.session_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                                <Badge className={`${config.bg} ${config.color} border-0 hover:bg-transparent`}>
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
                </CardContent>
            </Card>
        </div>
    );
}
