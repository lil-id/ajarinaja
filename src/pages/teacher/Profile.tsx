import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';

const TeacherProfile = () => {
  const { profile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information
        </p>
      </div>

      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-secondary text-secondary-foreground text-2xl">
                  {profile?.name?.charAt(0) || 'T'}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center shadow-md">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground">Teacher</p>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  defaultValue={profile?.name?.split(' ')[0]} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  defaultValue={profile?.name?.split(' ').slice(1).join(' ')} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue={profile?.email} 
                disabled
              />
            </div>
          </div>

          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherProfile;
