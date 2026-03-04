/**
 * @fileoverview Child Dashboard Page
 * @description Simplified dashboard showing child's learning progress in a table format
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Download, ArrowUpDown, Info, CalendarDays, ClipboardList, BookOpen, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useParentChildren } from '@/hooks/useParentChildren';
import { useChildCourses } from '@/hooks/useChildCourses';
import { useChildAttendance } from '@/hooks/useChildAttendance';
import { useChildAssignments } from '@/hooks/useChildAssignments';
import { useChildExams } from '@/hooks/useChildExams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export default function ChildDashboard() {
    const { t } = useTranslation();
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();

    // Sorting and filtering state - MUST be before any conditional returns (Rules of Hooks)
    const [sortOrder, setSortOrder] = useState<'default' | 'highest' | 'lowest'>('default');
    const [selectedSemester, setSelectedSemester] = useState<string>('all');

    const { children, isLoading: isLoadingChildren } = useParentChildren();
    const { courses, isLoading: isLoadingCourses } = useChildCourses(childId);
    const { attendanceRecords, isLoading: isLoadingAttendance } = useChildAttendance(childId);
    const { assignments, isLoading: isLoadingAssignments } = useChildAssignments(childId);
    const { exams, isLoading: isLoadingExams } = useChildExams(childId);

    const child = children.find(c => c.user_id === childId);

    if (isLoadingChildren) {
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
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.goBack')}
                </Button>
            </div>
        );
    }

    const isLoading = isLoadingCourses || isLoadingAttendance || isLoadingAssignments || isLoadingExams;

    // Calculate status based on final grade
    const getStatus = (finalGrade: number): string => {
        if (finalGrade >= 85) return t('parent.remarkExcellent');
        if (finalGrade >= 70) return t('parent.remarkGood');
        if (finalGrade >= 60) return t('parent.remarkFair');
        return t('parent.remarkPoor');
    };

    // Aggregate data by course
    const courseRows: CourseRow[] = courses.map((course: any) => {
        // Calculate attendance for this course
        const courseAttendance = attendanceRecords?.filter(
            (record: any) => record.course_id === course.id
        ) || [];
        const totalSessions = courseAttendance.length;
        const presentSessions = courseAttendance.filter(
            (record: any) => record.status === 'present' || record.status === 'late'
        ).length;
        const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

        // Calculate assignment average for this course
        const courseAssignments = assignments?.filter(
            (assignment: any) => assignment.course_id === course.id && assignment.score !== null
        ) || [];
        const assignmentAvg = courseAssignments.length > 0
            ? Math.round(courseAssignments.reduce((sum: number, a: any) => sum + a.score, 0) / courseAssignments.length)
            : 0;

        // Calculate exam average for this course
        const courseExams = exams?.filter(
            (exam: any) => exam.course_id === course.id && exam.score !== null
        ) || [];
        const examAvg = courseExams.length > 0
            ? Math.round(courseExams.reduce((sum: number, e: any) => sum + e.score, 0) / courseExams.length)
            : 0;

        // Calculate final grade: 40% assignments + 60% exams
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

    // Derive unique period options from courses data
    const semesterOptions: { value: string; label: string }[] = [];
    const seen = new Set<string>();
    courses.forEach((course: any) => {
        if (course.period_id && course.period_name) {
            if (!seen.has(course.period_id)) {
                seen.add(course.period_id);
                semesterOptions.push({
                    value: course.period_id,
                    label: course.period_name,
                });
            }
        }
    });
    // Sort period options by academic_year descending, then semester descending
    semesterOptions.sort((a, b) => b.label.localeCompare(a.label));

    // Sort courses based on selected order
    const sortedCourseRows = [...courseRows]
        .filter((row) => {
            if (selectedSemester === 'all') return true;
            const course = courses.find((c: any) => c.id === row.courseId);
            return course?.period_id === selectedSemester;
        })
        .sort((a, b) => {
            if (sortOrder === 'highest') return b.finalGrade - a.finalGrade;
            if (sortOrder === 'lowest') return a.finalGrade - b.finalGrade;
            return 0;
        });

    // Label for currently selected period (used in PDF)
    const selectedSemesterLabel = selectedSemester === 'all'
        ? t('courses.allSemesters')
        : semesterOptions.find(o => o.value === selectedSemester)?.label ?? selectedSemester;

    // Export to PDF function
    const handleExportPDF = () => {
        const printContent = document.getElementById('performance-table');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const styles = `
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                .student-info { margin-bottom: 20px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .excellent { background-color: #dcfce7; color: #166534; }
                .good { background-color: #dbeafe; color: #1e40af; }
                .fair { background-color: #fef3c7; color: #92400e; }
                .poor { background-color: #fee2e2; color: #991b1b; }
                .no-print { display: none; }
                @media print { body { margin: 0; } }
            </style>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Hasil Belajar - ${child.name}</title>
                ${styles}
            </head>
            <body>
                <h1>${t('parent.coursePerformanceTable')}</h1>
                <div class="student-info">
                    <p><strong>${t('common.name')}:</strong> ${child.name}</p>
                    <p><strong>${t('common.email')}:</strong> ${child.email}</p>
                    <p><strong>${t('common.date')}:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>${t('courses.semester')}:</strong> ${selectedSemesterLabel}</p>
                </div>
                ${printContent.innerHTML}
                <p style="margin-top: 20px; font-size: 12px; color: #666;">
                    <strong>${t('parent.gradeCalculationNote')}:</strong> ${t('parent.gradeCalculationFormula')}
                </p>
            </body>
            </html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/parent')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={child.avatar_url} alt={child.name} />
                        <AvatarFallback className="text-xl">
                            {child.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{child.name}</h1>
                        <p className="text-muted-foreground">{child.email}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('parent.linkedOn')}: {new Date(child.verified_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Grade Calculation Disclaimer */}
            <Alert className='bg-green-100'>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>{t('parent.gradeCalculationNote')}:</strong> {t('parent.gradeCalculationFormula')}
                </AlertDescription>
            </Alert>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/parent/children/${childId}/attendance`)}
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
                    onClick={() => navigate(`/parent/children/${childId}/assignments`)}
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
                    onClick={() => navigate(`/parent/children/${childId}/exams`)}
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
                                {t('parent.overviewDescription')}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder={t('courses.filterBySemester')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('courses.allSemesters')}</SelectItem>
                                    {semesterOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
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
                                onClick={handleExportPDF}
                                disabled={courseRows.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {t('common.exportPDF')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : courseRows.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {t('parent.noCoursesYet')}
                        </p>
                    ) : (
                        <div className="rounded-md border" id="performance-table">
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
                                        <TableHead className="text-center no-print">{t('common.actions')}</TableHead>
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
                                                {row.assignmentAvg > 0 ? row.assignmentAvg : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {row.examAvg > 0 ? row.examAvg : '-'}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {row.finalGrade > 0 ? row.finalGrade : '-'}
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
                                            <TableCell className="text-center no-print">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/parent/children/${childId}/courses`)}
                                                >
                                                    {t('common.viewDetails')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
