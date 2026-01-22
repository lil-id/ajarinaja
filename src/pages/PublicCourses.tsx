import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  BookOpen,
  Users,
  FileText,
  Video,
  Search,
  ArrowLeft,
  Clock,
  ArrowUpDown,
  Filter,
  Eye,
  Play,
  File,
  ChevronRight,
  Sparkles,
  Award,
  BarChart3,
  Lock,
} from "lucide-react";
import { demoCourses, demoMaterials, demoExams, demoAssignments } from "@/data/demoData";
import { sharedStats } from "@/data/sharedStats";

// Import course thumbnails
import mathematicsThumbnail from "@/assets/course-thumbnails/mathematics.jpg";
import physicsThumbnail from "@/assets/course-thumbnails/physics.jpg";
import chemistryThumbnail from "@/assets/course-thumbnails/chemistry.jpg";
import biologyThumbnail from "@/assets/course-thumbnails/biology.jpg";
import historyThumbnail from "@/assets/course-thumbnails/history.jpg";
import englishThumbnail from "@/assets/course-thumbnails/english.jpg";
import indonesianThumbnail from "@/assets/course-thumbnails/indonesian.jpg";
import computerScienceThumbnail from "@/assets/course-thumbnails/computer-science.jpg";

// Subject thumbnail mapping
/**
 * Mapping of subject names to their respective thumbnail image paths.
 * @type {Record<string, string>}
 */
const subjectThumbnails: Record<string, string> = {
  'mathematics': mathematicsThumbnail,
  'physics': physicsThumbnail,
  'chemistry': chemistryThumbnail,
  'biology': biologyThumbnail,
  'history': historyThumbnail,
  'english': englishThumbnail,
  'indonesian': indonesianThumbnail,
  'computer-science': computerScienceThumbnail,
};

type SortOption = "newest" | "oldest" | "most-students" | "alphabetical";
type SubjectFilter = "all" | "mathematics" | "physics" | "chemistry" | "biology" | "history" | "english" | "indonesian" | "computer-science";

/**
 * Public Courses page component.
 * 
 * Displays a catalog of available published courses visible to everyone (including non-logged-in users).
 * Features:
 * - Search functionality (by title/description)
 * - Filtering by subject
 * - Sorting (newest, oldest, popularity, alphabetical)
 * - Course detail view (when a course is selected)
 * - Navigation to demo or sign up
 * 
 * Uses dummy data from `demoData.ts` for display purposes.
 * 
 * @returns {JSX.Element} The rendered Public Courses page.
 */
const PublicCourses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("all");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Get published courses only
  const publishedCourses = demoCourses.filter(course => course.status === "published");

  // Get subject from course data (use subject field or derive from title)
  /**
   * Determines the subject category of a course based on its explicit subject field or title keywords.
   * 
   * @param {typeof demoCourses[0]} course - The course object.
   * @returns {string} The determined subject slug.
   */
  const getSubject = (course: typeof demoCourses[0]): string => {
    if (course.subject) return course.subject.toLowerCase().replace(/\s+/g, '-');
    const lowerTitle = course.title.toLowerCase();
    if (lowerTitle.includes("math") || lowerTitle.includes("algebra") || lowerTitle.includes("calculus")) return "mathematics";
    if (lowerTitle.includes("physics")) return "physics";
    if (lowerTitle.includes("chemistry")) return "chemistry";
    if (lowerTitle.includes("biology")) return "biology";
    if (lowerTitle.includes("history")) return "history";
    if (lowerTitle.includes("english") || lowerTitle.includes("literature")) return "english";
    if (lowerTitle.includes("indonesian") || lowerTitle.includes("bahasa")) return "indonesian";
    if (lowerTitle.includes("computer") || lowerTitle.includes("programming")) return "computer-science";
    return "other";
  };

  // Get display name for subject
  /**
   * Converts a subject slug into a human-readable display name.
   * 
   * @param {string} subject - The subject slug.
   * @returns {string} The display name.
   */
  const getSubjectDisplayName = (subject: string): string => {
    const displayNames: Record<string, string> = {
      'mathematics': 'Mathematics',
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'biology': 'Biology',
      'history': 'History',
      'english': 'English',
      'indonesian': 'Indonesian',
      'computer-science': 'Computer Science',
      'other': 'Other',
    };
    return displayNames[subject] || subject.charAt(0).toUpperCase() + subject.slice(1);
  };

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let courses = [...publishedCourses];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      courses = courses.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      );
    }

    // Apply subject filter
    if (subjectFilter !== "all") {
      courses = courses.filter(course => getSubject(course) === subjectFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        courses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        courses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "most-students":
        courses.sort((a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0));
        break;
      case "alphabetical":
        courses.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return courses;
  }, [publishedCourses, searchQuery, sortBy, subjectFilter]);

  // Get materials for a course
  /**
   * Retrieves materials associated with a specific course.
   * @param {string} courseId - The ID of the course.
   * @returns {Array} List of materials.
   */
  const getCourseMaterials = (courseId: string) => {
    return demoMaterials.filter(m => m.course_id === courseId);
  };

  // Get exams for a course
  /**
   * Retrieves published exams associated with a specific course.
   * @param {string} courseId - The ID of the course.
   * @returns {Array} List of published exams.
   */
  const getCourseExams = (courseId: string) => {
    return demoExams.filter(e => e.course_id === courseId && e.status === "published");
  };

  // Get assignments for a course
  /**
   * Retrieves published assignments associated with a specific course.
   * @param {string} courseId - The ID of the course.
   * @returns {Array} List of published assignments.
   */
  const getCourseAssignments = (courseId: string) => {
    return demoAssignments.filter(a => a.course_id === courseId && a.status === "published");
  };

  /**
   * Returns an appropriate icon component based on the material type.
   * @param {typeof demoMaterials[0]} material - The material object.
   * @returns {JSX.Element} The corresponding icon.
   */
  const getMaterialIcon = (material: typeof demoMaterials[0]) => {
    if (material.video_url) return <Video className="w-4 h-4 text-red-500" />;
    if (material.file_type?.includes("pdf")) return <File className="w-4 h-4 text-orange-500" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const selectedCourseData = selectedCourse ? publishedCourses.find(c => c.id === selectedCourse) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AjarinAja</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/courses" className="text-foreground font-medium transition-colors">
              Courses
            </Link>
            <Link to="/#for-teachers" className="text-muted-foreground hover:text-foreground transition-colors">
              For Teachers
            </Link>
            <Link to="/#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" disabled className="opacity-50 cursor-not-allowed">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto max-w-7xl relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Explore Our Course Catalog
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
              Discover Quality{" "}
              <span className="text-gradient">Learning Content</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse courses from our certified educators. Preview materials and see what you'll learn before enrolling.
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center px-6 py-3 bg-card rounded-2xl shadow-card">
              <div className="text-2xl font-bold text-foreground">{sharedStats.publishedCoursesCount}</div>
              <div className="text-sm text-muted-foreground">Published Courses</div>
            </div>
            <div className="text-center px-6 py-3 bg-card rounded-2xl shadow-card">
              <div className="text-2xl font-bold text-foreground">
                {sharedStats.activeStudents}
              </div>
              <div className="text-sm text-muted-foreground">Active Students</div>
            </div>
            <div className="text-center px-6 py-3 bg-card rounded-2xl shadow-card">
              <div className="text-2xl font-bold text-foreground">
                {sharedStats.totalMaterials}
              </div>
              <div className="text-sm text-muted-foreground">Learning Materials</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Search and Filters */}
          <div className="bg-card rounded-2xl shadow-card p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search courses by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex gap-3">
                <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v as SubjectFilter)}>
                  <SelectTrigger className="w-[180px] h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="indonesian">Indonesian</SelectItem>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[180px] h-12">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="most-students">Most Students</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-3">
                Showing {filteredCourses.length} result{filteredCourses.length !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
            )}
          </div>

          {/* Course Grid / Detail View */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course List */}
            <div className={`${selectedCourse ? "lg:col-span-1" : "lg:col-span-3"}`}>
              {filteredCourses.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No courses found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </Card>
              ) : (
                <div className={`grid gap-6 ${selectedCourse ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                  {filteredCourses.map((course) => {
                    const materials = getCourseMaterials(course.id);
                    const exams = getCourseExams(course.id);
                    const assignments = getCourseAssignments(course.id);
                    const isSelected = selectedCourse === course.id;

                    return (
                      <Card
                        key={course.id}
                        className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isSelected ? "ring-2 ring-primary shadow-lg" : ""
                          }`}
                        onClick={() => setSelectedCourse(isSelected ? null : course.id)}
                      >
                        <div className="relative h-40 rounded-t-xl overflow-hidden">
                          <img
                            src={subjectThumbnails[getSubject(course)] || mathematicsThumbnail}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-500/90 text-white">
                              Published
                            </Badge>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-4">
                            <Badge variant="secondary" className="text-xs">
                              {getSubjectDisplayName(getSubject(course))}
                            </Badge>
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {course.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {course.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {course.enrolled_count} students
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {materials.length} materials
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Created {new Date(course.created_at).toLocaleDateString()}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">by {course.teacher_name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="group-hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourse(course.id);
                              }}
                            >
                              View Details
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Course Detail Panel */}
            {selectedCourseData && (
              <div className="lg:col-span-2 space-y-6">
                <Card className="overflow-hidden">
                  <div className="relative h-48">
                    <img
                      src={subjectThumbnails[getSubject(selectedCourseData)] || mathematicsThumbnail}
                      alt={selectedCourseData.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <Badge variant="secondary" className="mb-2">
                        {getSubjectDisplayName(getSubject(selectedCourseData))}
                      </Badge>
                      <h2 className="text-2xl font-bold text-foreground">
                        {selectedCourseData.title}
                      </h2>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-6">{selectedCourseData.description}</p>

                    {/* Course Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-muted/50 rounded-xl">
                        <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-xl font-bold">{selectedCourseData.enrolled_count}</div>
                        <div className="text-xs text-muted-foreground">Students</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-xl">
                        <FileText className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-xl font-bold">{getCourseMaterials(selectedCourseData.id).length}</div>
                        <div className="text-xs text-muted-foreground">Materials</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-xl">
                        <BarChart3 className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                        <div className="text-xl font-bold">{getCourseExams(selectedCourseData.id).length}</div>
                        <div className="text-xs text-muted-foreground">Exams</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-xl">
                        <Award className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <div className="text-xl font-bold">{getCourseAssignments(selectedCourseData.id).length}</div>
                        <div className="text-xs text-muted-foreground">Assignments</div>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{selectedCourseData.teacher_name}</div>
                        <div className="text-sm text-muted-foreground">Course Instructor</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">Want to enroll in this course?</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Sign up or login to enroll and access all course content, submit assignments, and take exams.
                          </p>
                          <div className="flex gap-3">
                            <Button variant="outline" size="sm" onClick={() => navigate("/demo/student")}>
                              <Eye className="w-4 h-4 mr-2" />
                              Try Demo
                            </Button>
                            <Button variant="hero" size="sm" disabled className="opacity-50">
                              Sign Up to Enroll
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Materials Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Course Materials
                    </CardTitle>
                    <CardDescription>
                      Preview the learning materials included in this course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getCourseMaterials(selectedCourseData.id).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No materials available yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getCourseMaterials(selectedCourseData.id).map((material, index) => (
                          <div
                            key={material.id}
                            className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center shadow-sm">
                              {getMaterialIcon(material)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">{material.title}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {material.description}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {material.video_url ? "Video" : "Document"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Assessments Preview */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="w-5 h-5 text-orange-500" />
                        Exams
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getCourseExams(selectedCourseData.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No exams yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {getCourseExams(selectedCourseData.id).map((exam) => (
                            <li key={exam.id} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-orange-500 rounded-full" />
                              <span className="truncate">{exam.title}</span>
                              <span className="text-muted-foreground ml-auto shrink-0">{exam.duration} min</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Award className="w-5 h-5 text-green-500" />
                        Assignments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getCourseAssignments(selectedCourseData.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No assignments yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {getCourseAssignments(selectedCourseData.id).map((assignment) => (
                            <li key={assignment.id} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="truncate">{assignment.title}</span>
                              <span className="text-muted-foreground ml-auto shrink-0">{assignment.max_points} pts</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of students already learning on AjarinAja
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" onClick={() => navigate("/demo/student")}>
              <Eye className="w-4 h-4 mr-2" />
              Try Student Demo
            </Button>
            <Button variant="hero" size="lg" onClick={() => navigate("/")}>
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicCourses;
