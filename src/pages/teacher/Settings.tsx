import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const TeacherSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Notifications */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>{t('settings.notifications')}</CardTitle>
          <CardDescription>{t('settings.notificationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.emailNotifications')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsTeacher')}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.examSubmissions')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.examSubmissionsDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>{t('settings.privacy')}</CardTitle>
          <CardDescription>{t('settings.privacyDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.profileVisibility')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.profileVisibilityDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-0 shadow-card border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">{t('common.dangerZone')}</CardTitle>
          <CardDescription>{t('common.irreversibleActions')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">{t('common.deleteAccount')}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherSettings;
