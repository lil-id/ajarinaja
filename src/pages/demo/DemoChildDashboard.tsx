import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, ArrowUpDown, Info, CalendarDays, ClipboardList, BookOpen, ChevronRight, Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { demoStudents, demoCourses, demoExams, demoAssignments } from '@/data/demoData';

interface CourseRow {
    courseId: string;
    courseName: string;
    teacherName: string;
    attendancePercentage: number;
    assignmentAvg: number;
    examAvg: number;
    finalGrade: number;
    status: string;
}

export default function DemoChildDashboard() {
    const { t } = useTranslation();
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();

    const [sortOrder, setSortOrder] = useState<'default' | 'highest' | 'lowest'>('default');

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

    // Calculate status based on final grade
    const getStatus = (finalGrade: number): string => {
        if (finalGrade >= 85) return t('parent.remarkExcellent');
        if (finalGrade >= 70) return t('parent.remarkGood');
        if (finalGrade >= 60) return t('parent.remarkFair');
        return t('parent.remarkPoor');
    };

    // Aggregate demo data by course
    const courseRows: CourseRow[] = demoCourses.filter(c => c.status === 'published').slice(0, 3).map((course) => {
        const attendancePercentage = 85 + Math.floor(Math.random() * 15);
        const assignmentAvg = 75 + Math.floor(Math.random() * 20);
        const examAvg = 70 + Math.floor(Math.random() * 25);
        const finalGrade = Math.round((assignmentAvg * 0.4) + (examAvg * 0.6));

        return {
            courseId: course.id,
            courseName: course.title,
            teacherName: course.teacher_name,
            attendancePercentage,
            assignmentAvg,
            examAvg,
            finalGrade,
            status: getStatus(finalGrade),
        };
    });

    const sortedCourseRows = [...courseRows].sort((a, b) => {
        if (sortOrder === 'highest') return b.finalGrade - a.finalGrade;
        if (sortOrder === 'lowest') return a.finalGrade - b.finalGrade;
        return 0;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/demo/parent')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
                        <AvatarFallback className="text-xl">
                            {child.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{child.name}</h1>
                            <Badge variant="secondary">Demo</Badge>
                        </div>
                        <p className="text-muted-foreground">{child.email}</p>
                    </div>
                </div>
            </div>

            {/* Performance Calculation Alert */}
            <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary/80">
                    <strong>{t('parent.gradeCalculationNote')}:</strong> {t('parent.gradeCalculationFormula')}
                </AlertDescription>
            </Alert>

            {/* Demo Notice */}
            <Alert className="bg-muted">
                <Eye className="h-4 w-4" />
                <AlertDescription>
                    {t('demo.viewOnlyDesc')}
                </AlertDescription>
            </Alert>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/demo/parent/children/${childId}/attendance`)}
                >
                    <CardContent className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CalendarDays className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{t('parent.attendance')}</p>
                                <p className="text-xs text-muted-foreground">{t('common.viewDetails')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/demo/parent/children/${childId}/assignments`)}
                >
                    <CardContent className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{t('parent.assignments')}</p>
                                <p className="text-xs text-muted-foreground">{t('common.viewDetails')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/demo/parent/children/${childId}/exams`)}
                >
                    <CardContent className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{t('parent.exams')}</p>
                                <p className="text-xs text-muted-foreground">{t('common.viewDetails')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>

            {/* Performance Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>{t('parent.coursePerformanceTable')}</CardTitle>
                            <CardDescription>
                                {t('demo.childDashboard')}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={sortOrder} onValueChange={(value: 'default' | 'highest' | 'lowest') => setSortOrder(value)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">{t('parent.sortDefault')}</SelectItem>
                                    <SelectItem value="highest">{t('parent.sortHighest')}</SelectItem>
                                    <SelectItem value="lowest">{t('parent.sortLowest')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {t('common.exportPDF')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">{t('parent.tableNo')}</TableHead>
                                    <TableHead>{t('parent.tableSubject')}</TableHead>
                                    <TableHead>{t('parent.tableTeacher')}</TableHead>
                                    <TableHead className="text-center">{t('parent.tableAttendance')}</TableHead>
                                    <TableHead className="text-center">{t('parent.tableAssignmentAvg')}</TableHead>
                                    <TableHead className="text-center">{t('parent.tableExamAvg')}</TableHead>
                                    <TableHead className="text-center">{t('parent.tableFinalGrade')}</TableHead>
                                    <TableHead>{t('parent.tableRemarks')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedCourseRows.map((row, index) => (
                                    <TableRow key={row.courseId}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell className="font-medium">{row.courseName}</TableCell>
                                        <TableCell>{row.teacherName}</TableCell>
                                        <TableCell className="text-center">
                                            {row.attendancePercentage}%
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.assignmentAvg}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.examAvg}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {row.finalGrade}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-block px-2 py-1 rounded-md text-sm ${row.finalGrade >= 85 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                row.finalGrade >= 70 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                    row.finalGrade >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
