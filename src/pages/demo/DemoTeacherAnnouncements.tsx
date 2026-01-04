import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Megaphone, Trash2, Lock } from 'lucide-react';
import { demoCourses, demoAnnouncements } from '@/data/demoData';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DemoTeacherAnnouncements() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [form, setForm] = useState({ title: '', content: '' });

  const handleCreate = () => {
    toast.info('Save is disabled in demo mode. Contact us for full access!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  const handleDelete = () => {
    toast.info('Delete is disabled in demo mode. Contact us for full access!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Post news and updates to your courses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {demoCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Announcement title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  placeholder="Write your announcement here..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Lock className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-400">Saving is disabled in demo mode</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="flex-1">
                  Post Announcement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {demoAnnouncements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first announcement to notify students about important updates.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {demoAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{announcement.course_title}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
