import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';

export default function DemoOperatorPeriods() {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'id' ? idLocale : enUS;

    const periods = [
        {
            id: '1',
            name: '2024/2025 Semester 1',
            is_active: true,
            academic_year: '2024/2025',
            semester: 1,
            start_date: '2024-07-15',
            end_date: '2024-12-20'
        },
        {
            id: '2',
            name: '2023/2024 Semester 2',
            is_active: false,
            academic_year: '2023/2024',
            semester: 2,
            start_date: '2024-01-08',
            end_date: '2024-06-14'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('operator.periods.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('operator.periods.description')} (Demo)</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-fit">
                        <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
                    </Badge>
                    <Button disabled>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('operator.periods.createPeriod')}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        {t('operator.periods.listTitle')} ({periods.length})
                    </CardTitle>
                    <CardDescription>{t('operator.periods.listDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {periods.map(period => (
                            <div key={period.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{period.name}</p>
                                        {period.is_active && (
                                            <Badge variant="secondary">{t('reportCards.periodActive')}</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {format(new Date(period.start_date), 'd MMM yyyy', { locale: dateLocale })} —{' '}
                                        {format(new Date(period.end_date), 'd MMM yyyy', { locale: dateLocale })}
                                    </p>
                                </div>
                                {!period.is_active && (
                                    <Button variant="outline" size="sm" disabled>
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        {t('reportCards.setActive')}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
