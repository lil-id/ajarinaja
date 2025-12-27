import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useCourseMaterials, useUploadMaterial, useDeleteMaterial, getMaterialUrl } from '@/hooks/useCourseMaterials';
import { FileText, Plus, Trash2, Loader2, Upload, File, Video, FileImage, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const TeacherMaterials = () => {
  const { courses } = useTeacherCourses();
  const courseIds = courses.map(c => c.id);
  
  const { materials, isLoading } = useCourseMaterials();
  const teacherMaterials = materials.filter(m => courseIds.includes(m.course_id));
  
  const uploadMaterial = useUploadMaterial();
  const deleteMaterial = useDeleteMaterial();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [form, setForm] = useState({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
      if (!form.title) {
        setForm({ ...form, title: file.name.split('.')[0] });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedCourse || !form.title.trim() || !selectedFile) {
      toast.error('Please fill in all required fields and select a file');
      return;
    }

    try {
      await uploadMaterial.mutateAsync({
        courseId: selectedCourse,
        title: form.title,
        description: form.description || undefined,
        file: selectedFile,
      });
      setForm({ title: '', description: '' });
      setSelectedCourse('');
      setSelectedFile(null);
      setIsDialogOpen(false);
      toast.success('Material uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload material');
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    try {
      await deleteMaterial.mutateAsync({ id, filePath });
      toast.success('Material deleted');
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || 'Unknown Course';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Materials</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage lesson materials for your courses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" disabled={courses.length === 0}>
              <Plus className="w-4 h-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Course Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-secondary transition-colors"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="w-5 h-5 text-secondary" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, PPT, Video, Images (max 50MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Material title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Brief description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  maxLength={500}
                />
              </div>
              
              <Button
                onClick={handleUpload}
                className="w-full"
                disabled={uploadMaterial.isPending}
              >
                {uploadMaterial.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Upload Material
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Create a course first before uploading materials.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Materials List */}
      {courses.length > 0 && teacherMaterials.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No materials yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload lesson materials for your students
            </p>
            <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Upload Material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teacherMaterials.map((material, index) => {
            const FileIcon = getFileIcon(material.file_type);
            const fileUrl = getMaterialUrl(material.file_path);
            
            return (
              <Card 
                key={material.id}
                className="border-0 shadow-card animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                            {getCourseTitle(material.course_id)}
                          </span>
                          <h3 className="font-semibold text-foreground mt-2">{material.title}</h3>
                          {material.description && (
                            <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{material.file_name}</span>
                            <span>{formatFileSize(material.file_size)}</span>
                            <span>{format(new Date(material.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(fileUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(material.id, material.file_path)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherMaterials;
