import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ClipboardList, CheckCircle2, Clock, Eye } from 'lucide-react';
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
import { demoStudents, demoAssignments } from '@/data/demoData';
import { format } from 'date-fns';

export default function DemoChildAssignments() {
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

    const assignments = demoAssignments.slice(0, 5);

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
                        {t('parent.assignmentsFor')} {child.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.viewAllAssignments')} (Demo)
                    </p>
                </div>
            </div>

            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
            </Badge>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.totalAssignments')}
                        </CardTitle>
                        <ClipboardList className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignments.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.completed')}
                        </CardTitle>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">4</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.averageScore')}
                        </CardTitle>
                        <div className="text-sm font-bold text-primary">88/100</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">88</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('parent.allAssignments')}</CardTitle>
                    <CardDescription>
                        {t('parent.assignmentsDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('parent.assigmentTitle')}</TableHead>
                                    <TableHead>{t('common.course')}</TableHead>
                                    <TableHead>{t('parent.dueDate')}</TableHead>
                                    <TableHead>{t('common.status')}</TableHead>
                                    <TableHead className="text-right">{t('parent.score')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.map((assignment, index) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell className="font-medium">{assignment.title}</TableCell>
                                        <TableCell>{assignment.course_title}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={index === 0 ? "outline" : "secondary"}>
                                                {index === 0 ? t('parent.pending') : t('parent.completed')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {index === 0 ? '-' : `${80 + index * 3}/${assignment.max_points}`}
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
