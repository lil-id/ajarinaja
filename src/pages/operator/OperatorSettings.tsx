import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
 * Operator Settings page.
 * 
 * Configuration options for the operator (academic staff) account.
 * Features:
 * - Security settings (Change password)
 * - Account management
 * 
 * @returns {JSX.Element} The rendered Settings page.
 */
const OperatorSettings = () => {
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
            // Sign out and redirect
            await supabase.auth.signOut();
            toast.success(t('toast.accountDeleted'));
            navigate('/');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('common.error'));
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
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('common.error'));
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

export default OperatorSettings;
