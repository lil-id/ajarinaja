import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Upload, Video, FileText, Download, Trash2, 
  Lock, AlertCircle, Youtube, File, Image
} from 'lucide-react';
import { demoCourses, demoMaterials } from '@/data/demoData';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DemoTeacherMaterials() {
  const [selectedCourse, setSelectedCourse] = useState<string>(demoCourses[0]?.id || '');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'video'>('file');
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<string>('');

  const publishedCourses = demoCourses.filter(c => c.status === 'published');
  const courseMaterials = demoMaterials.filter(m => m.course_id === selectedCourse);

  const handleSave = () => {
    toast.info('Save is disabled in demo mode. This is a preview experience!', {
      action: {
        label: 'Contact Us',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file.name);
      toast.success(`File "${file.name}" selected (demo only)`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setSelectedFile('');
  };

  const getFileIcon = (material: typeof demoMaterials[0]) => {
    if (material.video_url) return <Video className="h-5 w-5 text-red-500" />;
    if (material.file_type?.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    if (material.file_type?.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Course Materials</h1>
          <p className="text-muted-foreground">Upload and manage learning materials</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadOpen} onOpenChange={(open) => { setIsUploadOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent size="lg">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Upload Course Material</DialogTitle>
                  <div className="flex items-center gap-2 text-sm bg-amber-500/10 px-3 py-1 rounded-full">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700">Demo Mode</span>
                  </div>
                </div>
              </DialogHeader>

              <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'file' | 'video')} className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <Upload className="h-4 w-4 mr-2" />
                    File Upload
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Youtube className="h-4 w-4 mr-2" />
                    Video Link
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course</label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {publishedCourses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                      placeholder="Enter material title" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea 
                      placeholder="Describe this material..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <TabsContent value="file" className="mt-0">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <p className="font-medium text-secondary">{selectedFile}</p>
                          <Button variant="outline" size="sm" onClick={() => setSelectedFile('')}>
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium mb-1">Drag and drop your file here</p>
                          <p className="text-xs text-muted-foreground mb-3">PDF, DOC, PPT, or images up to 50MB</p>
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm" asChild>
                              <span>Browse Files</span>
                            </Button>
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={handleFileSelect}
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="mt-0 space-y-2">
                    <label className="text-sm font-medium">YouTube URL</label>
                    <Input 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a YouTube video URL to embed it in your course
                    </p>
                  </TabsContent>

                  {/* Demo Notice */}
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      <strong>Demo Mode:</strong> File upload is disabled. Contact us for full access!
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="flex-1">
                      <Lock className="h-4 w-4 mr-2" />
                      Upload (Demo)
                    </Button>
                  </div>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Course Filter */}
      <div className="flex gap-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {publishedCourses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {demoCourses.find(c => c.id === selectedCourse)?.title || 'Course'} Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courseMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No materials uploaded yet</p>
              <p className="text-sm">Click "Upload Material" to add content</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseMaterials.map(material => (
                <div 
                  key={material.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      {getFileIcon(material)}
                    </div>
                    <div>
                      <p className="font-medium">{material.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {material.video_url ? (
                          <Badge variant="secondary">Video</Badge>
                        ) : (
                          <Badge variant="outline">{material.file_name}</Badge>
                        )}
                        <span>•</span>
                        <span>{format(new Date(material.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleSave}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleSave}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
