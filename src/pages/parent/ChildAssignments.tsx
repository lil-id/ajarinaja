/**
 * @fileoverview Child Assignments Page
 * @description Detailed view of child's assignments and submissions
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, Clock, XCircle, FileText, Loader2 } from 'lucide-react';
import { useParentChildren } from '@/hooks/useParentChildren';
import { useChildAssignments } from '@/hooks/useChildAssignments';
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
    graded: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Graded' },
    submitted: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Submitted' },
    pending: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Pending' },
    overdue: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Overdue' },
};

export default function ChildAssignments() {
    const { t } = useTranslation();
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();

    const { children, isLoading: isLoadingChildren } = useParentChildren();
    const { assignments, summary, isLoading } = useChildAssignments(childId);

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
                        {t('parent.assignmentsFor')} {child.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.viewAllAssignments')}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.totalAssignments')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-green-600">
                            {t('parent.completed')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-orange-600">
                            {t('parent.pending')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{summary.pending}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-blue-600">
                            {t('parent.graded')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary.graded}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.averageScore')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.averageScore}</div>
                        <Progress
                            value={summary.averageScore}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Assignments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('parent.allAssignments')}</CardTitle>
                    <CardDescription>
                        {t('parent.assignmentsListDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {assignments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {t('parent.noAssignments')}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('common.title')}</TableHead>
                                        <TableHead>{t('common.course')}</TableHead>
                                        <TableHead>{t('parent.dueDate')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead className="text-right">{t('parent.score')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignments.map((assignment: any) => {
                                        const config = statusConfig[assignment.submission_status as keyof typeof statusConfig];
                                        const Icon = config.icon;

                                        return (
                                            <TableRow key={assignment.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{assignment.title}</p>
                                                        {assignment.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {assignment.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{assignment.course_title}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {assignment.course_code}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p>{new Date(assignment.due_date).toLocaleDateString()}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(assignment.due_date).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${config.bg} ${config.color} border-0`}>
                                                        <Icon className="w-3 h-3 mr-1" />
                                                        {t(`assignments.${assignment.submission_status}`)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {assignment.score !== null ? (
                                                        <div>
                                                            <p className="font-bold">{assignment.score}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                / {assignment.total_points}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
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
