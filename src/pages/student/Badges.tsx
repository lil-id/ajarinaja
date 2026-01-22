import { Card, CardContent } from '@/components/ui/card';
import { useMyBadges } from '@/hooks/useBadges';
import { useTranslation } from 'react-i18next';
import { Loader2, Award, Trophy, Star, TrendingUp, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const BADGE_ICONS: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  'trending-up': TrendingUp,
  zap: Zap,
  award: Award,
};

const BADGE_COLORS: Record<string, string> = {
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  green: 'bg-green-100 text-green-700 border-green-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
};

/**
 * Student Badges page.
 * 
 * Showcase of student achievements.
 * Features:
 * - Grid view of earned badges
 * - Badge details (Reason, Icon, Color)
 * - Source context (Teacher, Course, Exam)
 * 
 * @returns {JSX.Element} The rendered Badges page.
 */
const StudentBadges = () => {
  const { t } = useTranslation();
  const { data: badges = [], isLoading } = useMyBadges();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('badges.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('badges.subtitle')}
        </p>
      </div>

      {badges.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('badges.noBadgesYet')}</h3>
            <p className="text-muted-foreground text-center">
              {t('badges.earnBadges')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((studentBadge: any, index: number) => {
            const badge = studentBadge.badge;
            const BadgeIcon = BADGE_ICONS[badge?.icon || 'award'] || Award;

            return (
              <Card
                key={studentBadge.id}
                className="border-0 shadow-card animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2",
                    BADGE_COLORS[badge?.color || 'gold']
                  )}>
                    <BadgeIcon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-foreground">{badge?.name}</h3>
                  {badge?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                  )}

                  {/* Teacher and Course info */}
                  <div className="mt-3 space-y-1">
                    {studentBadge.teacher_name && (
                      <p className="text-xs text-muted-foreground">
                        {t('badges.from')}: <span className="font-medium text-foreground">{studentBadge.teacher_name}</span>
                      </p>
                    )}
                    {studentBadge.exam?.course?.title && (
                      <p className="text-xs text-muted-foreground">
                        {t('badges.course')}: <span className="font-medium text-foreground">{studentBadge.exam.course.title}</span>
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    {t('badges.awarded')} {format(new Date(studentBadge.awarded_at), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentBadges;
