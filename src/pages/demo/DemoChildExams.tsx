import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Award, TrendingUp, Eye } from 'lucide-react';
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
import { demoStudents, demoExams } from '@/data/demoData';

export default function DemoChildExams() {
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

    const exams = demoExams.slice(0, 4);

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
                        {t('parent.examsFor')} {child.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.viewAllExamResults')} (Demo)
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
                            {t('parent.totalExams')}
                        </CardTitle>
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{exams.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.averagePercentage')}
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">82.5%</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('parent.gradedExams')}
                        </CardTitle>
                        <Award className="w-4 h-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">3</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('parent.examResults')}</CardTitle>
                    <CardDescription>
                        {t('parent.examsListDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('parent.examsTitle')}</TableHead>
                                    <TableHead>{t('common.course')}</TableHead>
                                    <TableHead className="text-center">{t('parent.duration')}</TableHead>
                                    <TableHead className="text-center">{t('parent.points')}</TableHead>
                                    <TableHead className="text-right">{t('parent.score')}</TableHead>
                                    <TableHead className="text-right">{t('parent.percentage')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exams.map((exam, index) => (
                                    <TableRow key={exam.id}>
                                        <TableCell className="font-medium">{exam.title}</TableCell>
                                        <TableCell>{exam.course_title}</TableCell>
                                        <TableCell className="text-center">{exam.duration} {t('parent.minutes')}</TableCell>
                                        <TableCell className="text-center">{exam.total_points}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {index === 3 ? '-' : `${Math.round(exam.total_points * (0.75 + index * 0.05))}`}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            {index === 3 ? '-' : `${Math.round((0.75 + index * 0.05) * 100)}%`}
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
