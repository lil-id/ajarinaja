import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, Video, File, FileImage, Download, Play, Eye, Search, 
  Filter, BookOpen, Clock, CheckCircle 
} from 'lucide-react';
import { demoCourses } from '@/data/demoData';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DemoMaterial {
  id: string;
  course_id: string;
  title: string;
  description: string;
  file_type?: string;
  file_name?: string;
  file_size?: number;
  video_url?: string;
  created_at: string;
  viewed?: boolean;
}

// Extended demo materials for better showcase
const extendedDemoMaterials: DemoMaterial[] = [
  {
    id: 'demo-mat-1',
    course_id: 'demo-course-1',
    title: 'Chapter 1: Introduction to Algebra',
    description: 'Learn the basics of algebraic expressions and variables',
    file_type: 'application/pdf',
    file_name: 'chapter1-algebra.pdf',
    file_size: 1850000,
    created_at: '2024-01-16T00:00:00Z',
    viewed: true,
  },
  {
    id: 'demo-mat-2',
    course_id: 'demo-course-1',
    title: 'Video: Solving Linear Equations',
    description: 'Step-by-step guide to solving linear equations',
    video_url: 'https://www.youtube.com/watch?v=LwCRRUa8yTU',
    created_at: '2024-01-18T00:00:00Z',
    viewed: true,
  },
  {
    id: 'demo-mat-3',
    course_id: 'demo-course-2',
    title: "Newton's Laws of Motion",
    description: "Comprehensive notes on Newton's three laws",
    file_type: 'application/pdf',
    file_name: 'newtons-laws.pdf',
    file_size: 3200000,
    created_at: '2024-02-02T00:00:00Z',
    viewed: false,
  },
  {
    id: 'demo-mat-4',
    course_id: 'demo-course-1',
    title: 'Chapter 2: Linear Equations',
    description: 'Advanced techniques for solving linear equations',
    file_type: 'application/pdf',
    file_name: 'chapter2-linear-equations.pdf',
    file_size: 2450000,
    created_at: '2024-01-20T00:00:00Z',
    viewed: true,
  },
  {
    id: 'demo-mat-5',
    course_id: 'demo-course-1',
    title: 'Video: Quadratic Formulas Explained',
    description: 'Understanding the quadratic formula with examples',
    video_url: 'https://www.youtube.com/watch?v=i7idZfS8t8w',
    created_at: '2024-01-25T00:00:00Z',
    viewed: false,
  },
  {
    id: 'demo-mat-6',
    course_id: 'demo-course-2',
    title: 'Lab Manual: Motion Experiments',
    description: 'Complete guide for conducting motion experiments',
    file_type: 'application/pdf',
    file_name: 'lab-manual-motion.pdf',
    file_size: 5200000,
    created_at: '2024-02-05T00:00:00Z',
    viewed: true,
  },
  {
    id: 'demo-mat-7',
    course_id: 'demo-course-2',
    title: 'Video: Understanding Forces',
    description: 'Visual explanation of different types of forces',
    video_url: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
    created_at: '2024-02-08T00:00:00Z',
    viewed: false,
  },
  {
    id: 'demo-mat-8',
    course_id: 'demo-course-1',
    title: 'Practice Problems Set 1',
    description: 'Additional practice problems for exam preparation',
    file_type: 'application/pdf',
    file_name: 'practice-set-1.pdf',
    file_size: 1200000,
    created_at: '2024-01-28T00:00:00Z',
    viewed: true,
  },
];

const getFileIcon = (material: DemoMaterial) => {
  if (material.video_url) return Video;
  if (!material.file_type) return File;
  if (material.file_type.startsWith('video/')) return Video;
  if (material.file_type.startsWith('image/')) return FileImage;
  if (material.file_type.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extractYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const DemoStudentMaterials = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<DemoMaterial | null>(null);

  // Student is enrolled in course 1 and 2
  const enrolledCourseIds = ['demo-course-1', 'demo-course-2'];
  const enrolledCourses = demoCourses.filter(c => enrolledCourseIds.includes(c.id));

  // Filter materials
  const filteredMaterials = extendedDemoMaterials.filter(m => {
    if (!enrolledCourseIds.includes(m.course_id)) return false;
    if (courseFilter !== 'all' && m.course_id !== courseFilter) return false;
    if (typeFilter === 'video' && !m.video_url) return false;
    if (typeFilter === 'pdf' && !m.file_type?.includes('pdf')) return false;
    if (typeFilter === 'other' && (m.video_url || m.file_type?.includes('pdf'))) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group materials by course
  const materialsByCourse = enrolledCourses.map(course => ({
    course,
    materials: filteredMaterials.filter(m => m.course_id === course.id),
  })).filter(g => g.materials.length > 0);

  const handleViewMaterial = (material: DemoMaterial) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
  };

  const handleDownload = () => {
    toast.info('Demo Mode: Download is disabled in preview mode. Contact us for the full version!');
  };

  const getCourseTitle = (courseId: string) => {
    return demoCourses.find(c => c.id === courseId)?.title || 'Unknown Course';
  };

  const renderMaterialCard = (material: DemoMaterial) => {
    const FileIcon = getFileIcon(material);
    const isVideo = !!material.video_url;
    
    return (
      <div
        key={material.id}
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${isVideo ? 'bg-red-100' : 'bg-blue-100'}`}>
            <FileIcon className={`h-6 w-6 ${isVideo ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{material.title}</h3>
              {material.viewed && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Viewed
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{material.description}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(material.created_at), 'MMM d, yyyy')}
              </span>
              {material.file_size && (
                <span>{formatFileSize(material.file_size)}</span>
              )}
              <Badge variant="secondary" className="text-xs">
                {isVideo ? 'Video' : material.file_type?.split('/')[1]?.toUpperCase() || 'File'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewMaterial(material)}
          >
            {isVideo ? <Play className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {isVideo ? 'Watch' : 'View'}
          </Button>
          {!isVideo && (
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Course Materials</h1>
        <p className="text-muted-foreground">Access learning materials from your enrolled courses</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {enrolledCourses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{extendedDemoMaterials.filter(m => enrolledCourseIds.includes(m.course_id)).length}</p>
              <p className="text-xs text-muted-foreground">Total Materials</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Video className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{extendedDemoMaterials.filter(m => enrolledCourseIds.includes(m.course_id) && m.video_url).length}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{extendedDemoMaterials.filter(m => enrolledCourseIds.includes(m.course_id) && m.file_type?.includes('pdf')).length}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{extendedDemoMaterials.filter(m => enrolledCourseIds.includes(m.course_id) && m.viewed).length}</p>
              <p className="text-xs text-muted-foreground">Viewed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials by Course */}
      {courseFilter === 'all' ? (
        materialsByCourse.map(({ course, materials }) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" />
                {course.title}
              </CardTitle>
              <CardDescription>{materials.length} materials available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {materials.map(renderMaterialCard)}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary" />
              {getCourseTitle(courseFilter)}
            </CardTitle>
            <CardDescription>{filteredMaterials.length} materials found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {filteredMaterials.map(renderMaterialCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredMaterials.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No materials found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Material Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMaterial && (
                <>
                  {React.createElement(getFileIcon(selectedMaterial), { className: "h-5 w-5 text-secondary" })}
                  {selectedMaterial.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {selectedMaterial?.video_url ? (
              // YouTube video embed
              <div className="aspect-video w-full">
                {extractYouTubeId(selectedMaterial.video_url) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(selectedMaterial.video_url)}?autoplay=0`}
                    title={selectedMaterial.title}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                    <div className="text-center">
                      <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Demo video preview</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        In the full version, videos play directly here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedMaterial?.file_type?.includes('pdf') ? (
              // PDF preview placeholder
              <div className="h-[70vh] bg-muted rounded-lg flex flex-col items-center justify-center">
                <FileText className="h-20 w-20 text-blue-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{selectedMaterial.file_name}</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Demo Mode: PDF preview is simulated. In the full version, 
                  documents are displayed with full navigation and zoom controls.
                </p>
                <div className="flex gap-4">
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                {/* Simulated PDF pages */}
                <div className="mt-8 flex gap-4">
                  {[1, 2, 3].map(page => (
                    <div 
                      key={page}
                      className="w-24 h-32 bg-white border-2 border-gray-200 rounded shadow-sm flex items-center justify-center"
                    >
                      <span className="text-gray-400 text-sm">Page {page}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Generic file preview
              <div className="h-[50vh] bg-muted rounded-lg flex flex-col items-center justify-center">
                <File className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">{selectedMaterial?.file_name || 'File'}</h3>
                <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoStudentMaterials;
