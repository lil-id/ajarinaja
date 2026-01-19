import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { useCourseMaterials, extractYouTubeId, getYouTubeThumbnail } from '@/hooks/useCourseMaterials';
import { FileText, Loader2, File, Video, FileImage, Download, Youtube, Play, Eye, ChevronDown, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MaterialViewer } from '@/components/MaterialViewer';

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StudentMaterials = () => {
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { materials, isLoading: materialsLoading } = useCourseMaterials();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<typeof materials[0] | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const isLoading = enrollmentsLoading || coursesLoading || materialsLoading;

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
  
  const myMaterials = materials.filter(m => enrolledCourseIds.includes(m.course_id));

  // Apply course filter
  const filteredMaterials = selectedCourseFilter === 'all' 
    ? myMaterials 
    : myMaterials.filter(m => m.course_id === selectedCourseFilter);

  const materialsByCourse = filteredMaterials.reduce((acc, material) => {
    if (!acc[material.course_id]) {
      acc[material.course_id] = [];
    }
    acc[material.course_id].push(material);
    return acc;
  }, {} as Record<string, typeof filteredMaterials>);

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || 'Unknown Course';
  };

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

  const handleViewMaterial = (material: typeof materials[0]) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(filePath);
      
      if (error) {
        console.error('Download error:', error);
        toast.error('Failed to download material');
        return;
      }
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download material');
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Materials</h1>
          <p className="text-muted-foreground mt-1">
            Access lesson materials and videos from your courses
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      {myMaterials.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {enrolledCourses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      )}

      {myMaterials.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No materials available</h3>
            <p className="text-muted-foreground text-center">
              {enrolledCourseIds.length === 0 
                ? 'Enroll in courses to access their materials'
                : 'Your teachers haven\'t uploaded any materials yet'}
            </p>
          </CardContent>
        </Card>
      ) : filteredMaterials.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No materials found</h3>
            <p className="text-muted-foreground text-center">
              No materials match your current filter
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setSelectedCourseFilter('all')}>
              Clear Filter
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                            {courseMaterials.length} material{courseMaterials.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
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
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {isVideo && videoId ? (
                              <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black relative group cursor-pointer"
                                onClick={() => handleViewMaterial(material)}
                              >
                                <img 
                                  src={getYouTubeThumbnail(videoId)} 
                                  alt={material.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                                  <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-secondary/20 transition-colors"
                                onClick={() => handleViewMaterial(material)}
                              >
                                <FileIcon className="w-5 h-5 text-secondary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate">{material.title}</h3>
                                {isVideo && (
                                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-xs">
                                    <Youtube className="w-3 h-3 mr-1" />
                                    Video
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {!isVideo && material.file_name && (
                                  <>
                                    <span>{material.file_name}</span>
                                    {material.file_size && <span>{formatFileSize(material.file_size)}</span>}
                                  </>
                                )}
                                <span>{format(new Date(material.created_at), 'MMM d')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isVideo ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleViewMaterial(material)}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Watch
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewMaterial(material)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  {material.file_path && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleDownload(material.file_path!, material.file_name || 'download')}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </Button>
                                  )}
                                </>
                              )}
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
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        material={selectedMaterial}
      />
    </div>
  );
};

export default StudentMaterials;