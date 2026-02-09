/**
 * @fileoverview Child Exams Page
 * @description Detailed view of child's exam results
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy, Target, TrendingUp, Loader2 } from 'lucide-react';
import { useParentChildren } from '@/hooks/useParentChildren';
import { useChildExams } from '@/hooks/useChildExams';
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

export default function ChildExams() {
    const { t } = useTranslation();
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();

    const { children, isLoading: isLoadingChildren } = useParentChildren();
    const { exams, summary, isLoading } = useChildExams(childId);

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
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.goBack')}
                </Button>
            </div>
        );
    }

    const getScoreBadgeColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-500/10 text-green-600 border-green-200';
        if (percentage >= 60) return 'bg-blue-500/10 text-blue-600 border-blue-200';
        if (percentage >= 40) return 'bg-orange-500/10 text-orange-600 border-orange-200';
        return 'bg-red-500/10 text-red-600 border-red-200';
    };

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
                        {t('parent.examsFor')} {child.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.viewAllExamResults')}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.totalExams')}
                        </CardTitle>
                        <Target className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('parent.availableExams')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.completed')}
                        </CardTitle>
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.graded}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('parent.gradedExams')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.averageScore')}
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.averageScore}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('parent.points')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.averagePercentage')}
                        </CardTitle>
                        <Target className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.averagePercentage}%</div>
                        <Progress value={summary.averagePercentage} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Exams Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('parent.examResults')}</CardTitle>
                    <CardDescription>
                        {t('parent.examsListDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {exams.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {t('parent.noExams')}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('common.title')}</TableHead>
                                        <TableHead>{t('common.course')}</TableHead>
                                        <TableHead>{t('parent.duration')}</TableHead>
                                        <TableHead className="text-right">{t('parent.score')}</TableHead>
                                        <TableHead className="text-right">{t('parent.percentage')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exams.map((exam: any) => (
                                        <TableRow key={exam.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{exam.title}</p>
                                                    {exam.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {exam.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{exam.course_title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {exam.course_code}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {exam.duration} {t('parent.minutes')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {exam.score !== null ? (
                                                    <div>
                                                        <p className="font-bold">{exam.score}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            / {exam.total_points}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        {exam.submission_status === 'missed' ? t('parent.missed') : t('parent.notTaken')}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {exam.percentage !== null ? (
                                                    <Badge className={getScoreBadgeColor(exam.percentage)}>
                                                        {exam.percentage}%
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
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
