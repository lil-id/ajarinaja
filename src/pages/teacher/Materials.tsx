import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTeacherCourses } from '@/hooks/useCourses';
import {
  useCourseMaterials,
  useUploadMaterial,
  useAddVideoMaterial,
  useDeleteMaterial,
  extractYouTubeId,
  getYouTubeThumbnail
} from '@/hooks/useCourseMaterials';
import { FileText, Plus, Trash2, Loader2, Upload, File, Video, FileImage, Youtube, Link, Eye, ChevronDown, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MaterialViewer } from '@/components/MaterialViewer';

/**
 * Helper to determine icon based on file type.
 */
const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Teacher Course Materials page.
 * 
 * Dashboard for managing course resources.
 * Features:
 * - Upload files (PDF, Docs, Images, etc.)
 * - Add YouTube video links
 * - Organize materials by course
 * - Preview materials
 * - Delete materials
 * 
 * @returns {JSX.Element} The rendered Materials page.
 */
const TeacherMaterials = () => {
  const { t } = useTranslation();
  const { courses } = useTeacherCourses();
  const courseIds = courses.map(c => c.id);

  const { materials, isLoading } = useCourseMaterials();
  const teacherMaterials = materials.filter(m => courseIds.includes(m.course_id));

  const uploadMaterial = useUploadMaterial();
  const addVideoMaterial = useAddVideoMaterial();
  const deleteMaterial = useDeleteMaterial();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'video'>('file');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingMaterial, setViewingMaterial] = useState<typeof teacherMaterials[0] | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  // Apply course filter
  const filteredMaterials = selectedCourseFilter === 'all'
    ? teacherMaterials
    : teacherMaterials.filter(m => m.course_id === selectedCourseFilter);

  // Group materials by course
  const materialsByCourse = filteredMaterials.reduce((acc, material) => {
    if (!acc[material.course_id]) {
      acc[material.course_id] = [];
    }
    acc[material.course_id].push(material);
    return acc;
  }, {} as Record<string, typeof filteredMaterials>);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCourses(new Set(Object.keys(materialsByCourse)));
  };

  const collapseAll = () => {
    setExpandedCourses(new Set());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(t('materials.fileSizeMustBeLess'));
        return;
      }
      setSelectedFile(file);
      if (!form.title) {
        setForm({ ...form, title: file.name.split('.')[0] });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedCourse || !form.title.trim()) {
      toast.error(t('materials.fillRequiredFields'));
      return;
    }

    if (uploadType === 'file' && !selectedFile) {
      toast.error(t('materials.pleaseSelectFile'));
      return;
    }

    if (uploadType === 'video') {
      if (!form.videoUrl.trim()) {
        toast.error(t('materials.pleaseEnterYoutubeUrl'));
        return;
      }
      const videoId = extractYouTubeId(form.videoUrl);
      if (!videoId) {
        toast.error(t('materials.invalidYoutubeUrl'));
        return;
      }
    }

    try {
      if (uploadType === 'file' && selectedFile) {
        await uploadMaterial.mutateAsync({
          courseId: selectedCourse,
          title: form.title,
          description: form.description || undefined,
          file: selectedFile,
        });
      } else {
        await addVideoMaterial.mutateAsync({
          courseId: selectedCourse,
          title: form.title,
          description: form.description || undefined,
          videoUrl: form.videoUrl,
        });
      }
      setForm({ title: '', description: '', videoUrl: '' });
      setSelectedCourse('');
      setSelectedFile(null);
      setUploadType('file');
      setIsDialogOpen(false);
      toast.success(uploadType === 'file' ? t('toast.materialUploaded') : t('toast.videoAdded'));
    } catch (error) {
      toast.error(t('toast.failedToAddMaterial'));
    }
  };

  const handleDelete = async (id: string, filePath: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMaterial.mutateAsync({ id, filePath });
      toast.success(t('toast.materialDeleted'));
    } catch (error) {
      toast.error(t('toast.failedToDeleteMaterial'));
    }
  };

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || t('materials.unknownCourse');
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
          <h1 className="text-3xl font-bold text-foreground">{t('materials.courseMaterials')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('materials.uploadFilesOrVideos')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" disabled={courses.length === 0}>
              <Plus className="w-4 h-4" />
              {t('materials.addMaterial')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('materials.addCourseMaterial')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'file' | 'video')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="gap-2">
                    <Upload className="w-4 h-4" />
                    {t('materials.uploadFile')}
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2">
                    <Youtube className="w-4 h-4" />
                    {t('materials.youtubeVideo')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label>{t('materials.selectCourse')}</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('materials.chooseCourse')} />
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

              {uploadType === 'file' ? (
                <div className="space-y-2">
                  <Label>{t('materials.file')}</Label>
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
                          {t('materials.clickToUpload')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('materials.supportedFormats')}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t('materials.youtubeUrl')}</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  {form.videoUrl && extractYouTubeId(form.videoUrl) && (
                    <div className="mt-2 rounded-lg overflow-hidden border">
                      <img
                        src={getYouTubeThumbnail(extractYouTubeId(form.videoUrl)!)}
                        alt="Video thumbnail"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('materials.supportsYoutube')}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('materials.titleLabel')}</Label>
                <Input
                  placeholder={t('materials.materialTitlePlaceholder')}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('materials.descriptionOptional')}</Label>
                <Textarea
                  placeholder={t('materials.briefDescription')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  maxLength={500}
                />
              </div>

              <Button
                onClick={handleUpload}
                className="w-full"
                disabled={uploadMaterial.isPending || addVideoMaterial.isPending}
              >
                {(uploadMaterial.isPending || addVideoMaterial.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {uploadType === 'file' ? t('materials.uploadMaterialBtn') : t('materials.addVideo')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {t('materials.createCourseFirst')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      {teacherMaterials.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('materials.filterByCourse')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('materials.allCourses')}</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {filteredMaterials.length} {filteredMaterials.length !== 1 ? t('materials.materials_plural') : t('materials.material')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              {t('materials.expandAll')}
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              {t('materials.collapseAll')}
            </Button>
          </div>
        </div>
      )}

      {/* Materials List */}
      {courses.length > 0 && teacherMaterials.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('materials.noMaterialsYet')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('materials.uploadFilesForStudents')}
            </p>
            <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              {t('materials.addMaterial')}
            </Button>
          </CardContent>
        </Card>
      ) : filteredMaterials.length === 0 && teacherMaterials.length > 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('materials.noMaterialsFound')}</h3>
            <p className="text-muted-foreground text-center">
              {t('materials.noMaterialsMatchFilter')}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setSelectedCourseFilter('all')}>
              {t('materials.clearFilter')}
            </Button>
          </CardContent>
        </Card>
      ) : teacherMaterials.length > 0 && (
        <div className="space-y-4">
          {Object.entries(materialsByCourse).map(([courseId, courseMaterials]) => {
            const isExpanded = expandedCourses.has(courseId);

            return (
              <Collapsible
                key={courseId}
                open={isExpanded}
                onOpenChange={() => toggleCourse(courseId)}
              >
                <Card className="border-0 shadow-card overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{getCourseTitle(courseId)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {courseMaterials.length} {courseMaterials.length !== 1 ? t('materials.materials_plural') : t('materials.material')}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                          }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3">
                      {courseMaterials.map((material, index) => {
                        const isVideo = !!material.video_url;
                        const videoId = isVideo ? extractYouTubeId(material.video_url!) : null;
                        const FileIcon = isVideo ? Youtube : getFileIcon(material.file_type);

                        return (
                          <div
                            key={material.id}
                            className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors animate-slide-up cursor-pointer"
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => setViewingMaterial(material)}
                          >
                            {isVideo && videoId ? (
                              <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                <img
                                  src={getYouTubeThumbnail(videoId)}
                                  alt={material.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileIcon className="w-6 h-6 text-secondary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground">{material.title}</h3>
                                    {isVideo && (
                                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1">
                                        <Youtube className="w-3 h-3" />
                                        YouTube
                                      </Badge>
                                    )}
                                  </div>
                                  {material.description && (
                                    <p className="text-sm text-muted-foreground">{material.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    {!isVideo && material.file_name && (
                                      <>
                                        <span>{material.file_name}</span>
                                        <span>{formatFileSize(material.file_size)}</span>
                                      </>
                                    )}
                                    <span>{format(new Date(material.created_at), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingMaterial(material);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={(e) => handleDelete(material.id, material.file_path, e)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      <MaterialViewer
        isOpen={!!viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        material={viewingMaterial}
      />
    </div>
  );
};

export default TeacherMaterials;