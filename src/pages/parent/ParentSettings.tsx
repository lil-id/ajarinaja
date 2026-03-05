import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield, Loader2, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { authApi } from '@/features/auth/api/auth.api.backend';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

/**
 * Parent Settings page.
 * 
 * Configuration options for the parent account.
 * Features:
 * - Security settings (Change password)
 * - Notification preferences
 * - Privacy settings
 * 
 * @returns {JSX.Element} The rendered Settings page.
 */
const ParentSettings = () => {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const updateProfile = useUpdateProfile();

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        if (profile?.phone_number) {
            setPhoneNumber(profile.phone_number);
        }
    }, [profile?.phone_number]);

    const handleSaveContact = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile.mutate({ phone_number: phoneNumber.trim() || null });
    };

    const hasContactChanges = (profile?.phone_number || '') !== phoneNumber;

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
            const { error } = await authApi.updateUser({
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

            {/* Contact Info Section */}
            <Card className="border-0 shadow-card">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-primary" />
                        <CardTitle>{t('profile.contactInformation')}</CardTitle>
                    </div>
                    <CardDescription>{t('profile.contactInfoDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveContact} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">{t('profile.emergencyPhoneNumber')}</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder={t('profile.phoneNumberPlaceholder')}
                                maxLength={20}
                            />
                            <p className="text-xs text-muted-foreground">{t('profile.emergencyPhoneNumberDesc')}</p>
                        </div>
                        <Button
                            type="submit"
                            disabled={updateProfile.isPending || !hasContactChanges}
                        >
                            {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {t('profile.saveChanges')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

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

            {/* Notifications */}
            <Card className="border-0 shadow-card">
                <CardHeader>
                    <CardTitle>{t('parent.notificationSettingsTitle')}</CardTitle>
                    <CardDescription>{t('parent.notificationSettingsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{t('parent.emailNotificationsLabel')}</Label>
                            <p className="text-sm text-muted-foreground">{t('parent.emailNotificationsDesc')}</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ParentSettings;
