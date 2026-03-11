import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePendingGrading } from '@/hooks/usePendingGrading';
import { Loader2, AlertCircle, ArrowRight, ClipboardList, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function PendingGradingWidget() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data, isLoading } = usePendingGrading();

    const handleNavigate = (item: typeof data.items[0]) => {
        if (item.type === 'assignment') {
            navigate(`/teacher/assignments/${item.id}/submissions`);
        } else {
            navigate(`/teacher/exams/${item.id}/grade`);
        }
    };

    if (isLoading) {
        return (
            <Card className="border-0 shadow-card">
                <CardHeader>
                    <CardTitle className="text-lg">{t('dashboard.pendingGrading')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { total = 0, items = [] } = data || {};

    return (
        <Card className="border-0 shadow-card">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    {t('dashboard.pendingGrading')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {total === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-2">
                            <AlertCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t('dashboard.noPendingGrading')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Total Badge */}
                        <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-primary/10">
                            <span className="text-3xl font-bold text-primary">{total}</span>
                            <span className="text-sm text-muted-foreground">
                                {t('dashboard.submissionsPending')}
                            </span>
                        </div>

                        {/* Items List */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.slice(0, 9).map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleNavigate(item)}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 hover:border-border transition-all cursor-pointer shadow-sm group"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'assignment'
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-secondary/10 text-secondary'
                                            }`}>
                                            {item.type === 'assignment' ? (
                                                <ClipboardList className="w-4 h-4" />
                                            ) : (
                                                <FileText className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {item.course_title} {item.class_name ? `• ${item.class_name}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {item.is_overdue && (
                                            <Badge variant="destructive" className="text-xs">
                                                {t('assignments.ungraded')}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                            {item.pending_count}
                                        </Badge>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {items.length > 0 && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/teacher/assignments')}
                            >
                                {t('dashboard.viewAllGrading')}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
