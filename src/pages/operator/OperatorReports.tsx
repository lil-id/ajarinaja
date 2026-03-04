/**
 * @fileoverview Operator Reports Page
 * @description School-wide academic reports and analytics for the operator.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSchoolStats } from '@/hooks/useSchoolStats';
import { useAllCourses } from '@/hooks/useAllCourses';
import { useSchoolStudents } from '@/hooks/useSchoolStudents';
import { BarChart3, BookOpen, GraduationCap, TrendingUp, Users, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const OperatorReports = () => {
    const { t } = useTranslation();
    const { stats, isLoading: statsLoading } = useSchoolStats();
    const { courses, isLoading: coursesLoading } = useAllCourses();
    const { students, isLoading: studentsLoading } = useSchoolStudents();

    const isLoading = statsLoading || coursesLoading || studentsLoading;

    // Top courses by enrollment
    const topCourses = [...courses]
        .sort((a, b) => b.enrollment_count - a.enrollment_count)
        .slice(0, 5);

    // Teacher distribution
    const teacherCourseCounts = courses.reduce((acc, c) => {
        const key = c.teacher_name || c.teacher_id;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topTeachers = Object.entries(teacherCourseCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('operator.reports.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('operator.reports.description')}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950">
                            <GraduationCap className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-muted-foreground">{t('operator.stats.totalTeachers')}</p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger type="button" className="cursor-help">
                                            <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] text-center">
                                            <p>{t('operator.statsTooltips.totalTeachers')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            {isLoading ? <Skeleton className="h-7 w-10 mt-1" /> : (
                                <p className="text-2xl font-bold">{stats?.totalTeachers ?? 0}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950">
                            <Users className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-muted-foreground">{t('operator.stats.totalStudents')}</p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger type="button" className="cursor-help">
                                            <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] text-center">
                                            <p>{t('operator.statsTooltips.totalStudents')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            {isLoading ? <Skeleton className="h-7 w-10 mt-1" /> : (
                                <p className="text-2xl font-bold">{stats?.totalStudents ?? 0}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-muted-foreground">{t('operator.stats.totalEnrollments')}</p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger type="button" className="cursor-help">
                                            <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] text-center">
                                            <p>{t('operator.statsTooltips.totalEnrollments')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            {isLoading ? <Skeleton className="h-7 w-10 mt-1" /> : (
                                <p className="text-2xl font-bold">{stats?.totalEnrollments ?? 0}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Courses by Enrollment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            {t('operator.reports.topCourses')}
                        </CardTitle>
                        <CardDescription>{t('operator.reports.topCoursesDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {coursesLoading ? (
                            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : topCourses.length === 0 ? (
                            <p className="text-muted-foreground text-center py-6">{t('operator.courses.noCoursesFound')}</p>
                        ) : (
                            <div className="space-y-3">
                                {topCourses.map((course, idx) => (
                                    <div key={course.id} className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{course.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{course.teacher_name}</p>
                                        </div>
                                        <Badge variant="secondary">{course.enrollment_count} siswa</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Teachers by Course Count */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            {t('operator.reports.topTeachers')}
                        </CardTitle>
                        <CardDescription>{t('operator.reports.topTeachersDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {coursesLoading ? (
                            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : topTeachers.length === 0 ? (
                            <p className="text-muted-foreground text-center py-6">{t('operator.students.noStudentsFound')}</p>
                        ) : (
                            <div className="space-y-3">
                                {topTeachers.map(([name, count], idx) => (
                                    <div key={name} className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                                        <p className="flex-1 font-medium truncate">{name}</p>
                                        <Badge variant="outline">{count} {t('operator.reports.courses')}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OperatorReports;
