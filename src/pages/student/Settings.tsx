import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield, Loader2, Eye, EyeOff, Users, Copy, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePairingCode } from '@/hooks/usePairingCode';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
/**
 * Student Settings page.
 * 
 * Application settings and preferences.
 * Features:
 * - Security settings (Change password)
 * - Notification preferences (Email, Exam reminders, Grades)
 * - Account management (Danger zone)
 * 
 * @returns {JSX.Element} The rendered Settings page.
 */
const StudentSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await supabase.auth.signOut();
      toast.success(t('toast.accountDeleted'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || t('toast.errorOccurred'));
      setIsDeletingAccount(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      toast.error(t('toast.passwordTooShort'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('toast.passwordsDoNotMatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success(t('toast.passwordUpdated'));
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || t('toast.errorOccurred'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Security Section */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>{t('settings.security')}</CardTitle>
          </div>
          <CardDescription>{t('settings.securityDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">{t('settings.changePassword')}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.changePasswordDescription')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('settings.confirmNewPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isChangingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('settings.updatePassword')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Parent Access Section */}
      <ParentAccessSection />

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
              <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.examReminders')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.examRemindersDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.gradeNotifications')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.gradeNotificationsDesc')}</p>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeletingAccount}>
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.deleting')}
                  </>
                ) : (
                  t('common.deleteAccount')
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.deleteAccount')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('dialogs.deleteAccountWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('common.deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Parent Access Section Component
 * Manages pairing code for parent access
 */
const ParentAccessSection = () => {
  const { t } = useTranslation();
  const {
    pairingCode,
    connectedParents,
    isLoading,
    copyToClipboard,
    regenerate,
    isRegenerating,
    removeParent
  } = usePairingCode();

  const handleCopyCode = () => {
    copyToClipboard();
  };

  const handleRegenerateCode = () => {
    regenerate();
  };

  const handleRemoveParent = (parentUserId: string) => {
    removeParent(parentUserId);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <CardTitle>{t('settings.parentAccess')}</CardTitle>
        </div>
        <CardDescription>{t('settings.parentAccessDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pairing Code Display */}
        <div>
          <h4 className="font-medium mb-3">{t('settings.pairingCode')}</h4>
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.pairingCodeDesc')}
          </p>

          {pairingCode && (
            <div className="space-y-3">
              {/* Code Display */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg p-4">
                  <p className="text-2xl font-mono font-bold text-center tracking-wider">
                    {pairingCode}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  disabled={isLoading}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {/* Regenerate Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('settings.regenerateCode')}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.regenerateCodeTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.regenerateCodeWarning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerateCode}>
                      {t('settings.regenerateCode')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Connected Parents */}
        <div>
          <h4 className="font-medium mb-3">{t('settings.connectedParents')}</h4>
          {connectedParents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('settings.noParentsConnected')}
            </p>
          ) : (
            <div className="space-y-2">
              {connectedParents.map((parent) => (
                <div
                  key={parent.relationship_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={parent.avatar_url} alt={parent.name} />
                      <AvatarFallback>
                        {parent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{parent.name}</p>
                      <p className="text-sm text-muted-foreground">{parent.email}</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('settings.removeParentTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('settings.removeParentWarning', { name: parent.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveParent(parent.parent_user_id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('common.remove')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSettings;

