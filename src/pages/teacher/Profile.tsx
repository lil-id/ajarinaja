import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useTranslation } from 'react-i18next';

const TeacherProfile = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const updateProfile = useUpdateProfile();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.name) {
      const parts = profile.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
    if (profile?.bio) {
      setBio(profile.bio);
    }
  }, [profile?.name, profile?.avatar_url, profile?.bio]);

  const handleSave = () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) return;
    updateProfile.mutate({ name: fullName, bio: bio.trim() || undefined });
  };

  const currentName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const hasChanges = profile?.name !== currentName || (profile?.bio || '') !== bio;
  const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : profile?.name || t('profile.teacher');

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('profile.managePersonalInfo')}
        </p>
      </div>

      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>{t('profile.personalInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar with upload */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              userName={displayName}
              onAvatarChange={setAvatarUrl}
              size="lg"
            />
            <div className="sm:ml-4">
              <h3 className="font-semibold text-foreground">{displayName}</h3>
              <p className="text-sm text-muted-foreground">{t('profile.teacher')}</p>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('profile.firstName')}</Label>
                <Input 
                  id="firstName" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('profile.enterFirstName')}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('profile.lastName')}</Label>
                <Input 
                  id="lastName" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('profile.enterLastName')}
                  maxLength={50}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue={profile?.email} 
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">{t('profile.emailCannotBeChanged')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t('profile.bio')}</Label>
              <Textarea 
                id="bio" 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('profile.bioPlaceholder')}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{t('profile.bioCharCount', { current: bio.length, max: 500 })}</p>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateProfile.isPending || !hasChanges || !firstName.trim()}
          >
            {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('profile.saveChanges')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherProfile;
