import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  GraduationCap,
  HelpCircle
} from 'lucide-react';
import { useReportCards } from '@/hooks/useReportCards';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Student Report Cards page.
 * 
 * Overview of student's academic performance history.
 * Features:
 * - List of issued report cards
 * - Performance trend chart across semesters
 * - Key statistics (Latest average, best grade)
 * 
 * @returns {JSX.Element} The rendered Report Cards page.
 */
const StudentReportCards = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { myReportCards, isLoading } = useReportCards();

  // Prepare chart data
  const chartData = [...myReportCards]
    .reverse()
    .map(rc => ({
      name: rc.period?.name?.replace('Semester', 'Sem.') || '-',
      average: rc.overall_average || 0,
    }));

  // Calculate stats
  const latestAverage = myReportCards[0]?.overall_average || 0;
  const previousAverage = myReportCards[1]?.overall_average || 0;
  const trend = latestAverage - previousAverage;
  const bestGrade = Math.max(...myReportCards.map(rc => rc.overall_average || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('reportCards.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('reportCards.myReportCards')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">{t('reportCards.average')}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('reportCards.tooltipAverage')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold">{latestAverage.toFixed(1)}</p>
                {trend !== 0 && (
                  <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? '+' : ''}{trend.toFixed(1)} {t('time.daysAgo', { count: 0 }).replace('0 days ago', '')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/20">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">{t('reportCards.highestReportCardGrade')}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('reportCards.tooltipHighestGrade')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold">{bestGrade.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">{t('reportCards.totalReportCards')}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-center">{t('reportCards.tooltipTotalReports')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold">{myReportCards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('reportCards.performanceTrend')}
            </CardTitle>
            <CardDescription>{t('reportCards.gradeDistribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value.toFixed(1), t('reportCards.average')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Cards List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('reportCards.reportCardList')}
          </CardTitle>
          <CardDescription>{t('reportCards.viewHistory')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : myReportCards.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('reportCards.noReportCardsStudent')}</h3>
              <p className="text-muted-foreground">
                {t('reportCards.waitForTeacher')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReportCards.map((reportCard) => (
                <div
                  key={reportCard.id}
                  className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/student/report-cards/${reportCard.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{reportCard.period?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {reportCard.total_courses} {t('reportCards.subjectsCount')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t('reportCards.average')}</p>
                      <p className="text-2xl font-bold text-primary">
                        {reportCard.overall_average?.toFixed(1) || '-'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentReportCards;
