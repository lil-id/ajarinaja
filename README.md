# AjarinAja - Complete Learning Management System

**AjarinAja** is a comprehensive, modern Learning Management System (LMS) designed for educational institutions, schools, and independent educators. It provides a complete platform for managing courses, assignments, exams, student progress tracking, and analytics—all in one place.

## 🎯 Project Overview

AjarinAja is a full-stack web application that streamlines educational workflows and enhances the learning experience for both teachers and students. The platform features:

- **Role-based access** for Teachers and Students
- **Course management** with rich multimedia content
- **Exam creation** with auto-grading capabilities
- **Assignment tracking** and submission management
- **Real-time analytics** and performance insights
- **Gamification** with badges and achievements
- **Multi-language support** (English & Indonesian)
- **Demo mode** for exploring platform features

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.4+
- **Routing**: React Router DOM 6.30+
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS 3.4+ with custom animations
- **State Management**: TanStack Query (React Query) v5
- **Form Handling**: React Hook Form 7.61+ with Zod validation
- **Internationalization**: i18next & react-i18next
- **Charts**: Recharts 2.15+
- **Drag & Drop**: @dnd-kit libraries
- **PDF Generation**: jsPDF with autotable plugin
- **Math Rendering**: KaTeX & react-katex

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for file uploads
- **Row-Level Security**: Comprehensive RLS policies

### Development Tools
- **Linting**: ESLint 9.32+ with TypeScript support
- **TypeScript**: v5.8+
- **Package Manager**: npm/bun
- **PostCSS**: For CSS processing

## 📁 Project Structure

```
classroom-companion/
├── public/                      # Static assets
├── src/
│   ├── assets/                  # Images and media files
│   ├── components/              # Reusable UI components (65+ components)
│   │   ├── ui/                  # shadcn/ui base components (49 components)
│   │   ├── AvatarUpload.tsx     # Profile avatar management
│   │   ├── CoursePreviewModal.tsx
│   │   ├── DemoTour.tsx         # Interactive demo tour
│   │   ├── FormulaInput.tsx     # Math formula editor
│   │   ├── MaterialViewer.tsx   # PDF/video viewer
│   │   ├── NotificationBell.tsx
│   │   ├── ProtectedRoute.tsx   # Route authentication
│   │   └── ...
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── DemoContext.tsx      # Demo mode state
│   ├── data/                    # Static data and constants
│   ├── hooks/                   # Custom React hooks (38 hooks)
│   │   ├── useAcademicPeriods.ts
│   │   ├── useAnnouncements.ts
│   │   ├── useAssignments.ts
│   │   ├── useAtRiskStudents.ts
│   │   ├── useBadges.ts
│   │   ├── useCalendarEvents.ts
│   │   ├── useCourseMaterials.ts
│   │   ├── useCourses.ts
│   │   ├── useEnrollments.ts
│   │   ├── useExams.ts
│   │   ├── useNotifications.ts
│   │   ├── useQuestionBank.ts
│   │   ├── useReportCards.ts
│   │   └── ...
│   ├── i18n/                    # Internationalization config
│   ├── integrations/            # Third-party integrations
│   │   └── supabase/            # Supabase client and types
│   ├── layouts/                 # Layout components
│   │   ├── TeacherLayout.tsx    # Teacher dashboard layout
│   │   ├── StudentLayout.tsx    # Student dashboard layout
│   │   └── DemoLayout.tsx       # Demo mode layout
│   ├── lib/                     # Utility functions
│   ├── pages/                   # Page components (69 pages)
│   │   ├── teacher/             # Teacher-specific pages (19 pages)
│   │   ├── student/             # Student-specific pages (18 pages)
│   │   ├── demo/                # Demo mode pages (30 pages)
│   │   ├── Index.tsx            # Landing page
│   │   ├── Login.tsx
│   │   ├── PublicCourses.tsx
│   │   └── ...
│   ├── types/                   # TypeScript type definitions
│   ├── App.tsx                  # Main application component
│   ├── index.css                # Global styles
│   └── main.tsx                 # Application entry point
├── supabase/
│   ├── migrations/              # Database migrations (29 files)
│   └── config.toml              # Supabase configuration
├── .env                         # Environment variables
├── components.json              # shadcn/ui configuration
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite configuration
```

## 🗄️ Database Schema

The application uses **Supabase PostgreSQL** with **20+ tables** organized into functional groups:

### Core Tables
- **profiles**: User profile information (name, avatar, bio, language preference)
- **user_roles**: Role assignments (teacher/student) with enum type
- **courses**: Course information (title, description, status, teacher)
- **enrollments**: Student-course relationships with enrollment dates
- **course_materials**: Learning materials (PDFs, videos, documents)

### Assessment Tables
- **exams**: Exam metadata (duration, points, status, passing grade)
- **questions**: Exam questions (MCQ, multiple-select, essay, fill-in-blank)
- **exam_submissions**: Student exam submissions and scores
- **question_bank**: Reusable question library across exams
- **assignments**: Assignment details, deadlines, and rubrics
- **assignment_questions**: Assignment question content
- **assignment_submissions**: Student assignment submissions with file uploads

### Analytics & Tracking
- **notifications**: User notifications system with real-time updates
- **badges**: Achievement badges (First Course, Perfect Score, etc.)
- **user_badges**: User badge awards with timestamps
- **announcements**: Course announcements to enrolled students
- **calendar_events**: Scheduled events and deadlines
- **academic_periods**: Semester/term management
- **report_cards**: Student report cards with teacher comments
- **report_card_items**: Individual grade items per subject
- **at_risk_students**: Students needing intervention
- **at_risk_settings**: Risk detection criteria and thresholds
- **progress_tracking**: Student progress data over time

### Attendance System
- **attendance_sessions**: Attendance tracking sessions
- **attendance_records**: Individual student attendance records

### Security Features
- **Row-Level Security (RLS)** policies on all tables for database-level authorization
- **Helper functions**: `has_role()`, `is_enrolled()`, `owns_course()` for reusable policy logic
- **Triggers**: Auto-update timestamps, user profile creation on signup, notification creation
- **Realtime subscriptions** enabled for live updates (<100ms latency)

> 📚 **For detailed schema documentation**, see [ARCHITECTURE.md](./ARCHITECTURE.md) - Phase 2: Backend Architecture

## 🚀 Features

### For Teachers 👨‍🏫
- **Course Builder**: Create courses with videos, PDFs, and rich content
- **Smart Exam Creator**: MCQ, multiple-select, essay & fill-in-blank questions with question bank
- **Auto-Grading**: Instant grading for MCQ exams with customizable rubric-based scoring
- **Assignment Management**: Create, assign, and grade assignments with file uploads
- **Performance Analytics**: Track class averages, student performance, and trends
- **At-Risk Detection**: Identify struggling students automatically with configurable thresholds
- **Question Bank**: Reusable question library with categories and difficulty levels
- **Attendance Tracking**: PIN-based attendance system with session management and reports
- **Schedule Management**: Calendar view for deadlines, exams, and events
- **Announcement System**: Broadcast updates to enrolled students with real-time notifications
- **Report Cards**: Generate comprehensive semester reports with customizable grading scales
- **PDF Export**: Export grades, analytics, and attendance reports

### For Students 🎓
- **Course Discovery**: Browse and enroll in available courses with course previews
- **Learning Materials**: Access videos and PDFs in-platform with built-in viewers
- **Exam Taking**: Clean, distraction-free exam interface with timer
- **Assignment Submission**: Submit assignments with multiple file uploads
- **Progress Tracking**: Visual analytics of grades, performance trends, and class ranking
- **Notifications**: Real-time alerts for grades, announcements, and upcoming deadlines
- **Badges**: Earn achievement badges for milestones (First Course, Perfect Score, etc.)
- **Attendance**: Check-in via PIN code entry
- **Calendar View**: Track upcoming exams, assignments, and events
- **Report Cards**: View semester grades, teacher feedback, and detailed performance breakdown

### For Parents 👨‍👩‍👧‍👦
- **Child Dashboard**: Monitor each child's academic progress at a glance
- **Attendance Tracking**: View child's attendance history and status
- **Assignment Monitoring**: Track assignment submissions and grades
- **Exam Results**: Review exam scores and performance trends
- **Pairing Code Linking**: Securely link to your child's account via pairing code
- **Notifications**: Stay updated on your child's academic activities

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, professional interface with dark mode support
- **Responsive**: Mobile-first design works on all devices
- **Animations**: Smooth transitions and scroll animations
- **Accessibility**: ARIA labels and keyboard navigation
- **Toast Notifications**: Non-intrusive user feedback
- **Loading States**: Skeleton loaders and progress indicators
- **Form Validation**: Real-time validation with helpful error messages

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** 18+ and npm (or Bun runtime)
- **Supabase** account and project

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd classroom-companion
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key
```

4. **Run database migrations**

Navigate to your Supabase project dashboard and run the migrations from the `supabase/migrations` folder in chronological order, or use the Supabase CLI:

```bash
supabase db push
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```bash
npm run build
```

This generates optimized production files in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📖 Documentation

For comprehensive technical documentation:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Complete technical architecture documentation (3,050+ lines)
  - **Phase 1**: Frontend Architecture - Components, hooks, routing, state management
  - **Phase 2**: Backend Architecture - Database schema, RLS policies, storage, real-time
  - **Phase 3**: Developer Guide - Workflows, troubleshooting, migrations, best practices

## 📝 Usage Guide

### Creating a Teacher Account
1. Navigate to the login page
2. Sign up with email and password
3. Select "Teacher" as your role
4. Verify your email (if email verification is enabled)

### Creating a Student Account
1. Navigate to the login page
2. Sign up with email and password
3. Select "Student" as your role
4. Verify your email (if email verification is enabled)

### Demo Mode
Try the platform without creating an account:
- Visit the homepage and click "Try Demo"
- Choose Teacher or Student perspective
- Explore all features with sample data

## 🔐 Authentication & Authorization

### Authentication Flow
- **Supabase Auth** handles user authentication
- Email/password authentication with session management
- Sessions persist in `localStorage`
- Auto-refresh tokens for seamless experience

### Authorization Levels
- **Public Routes**: Landing page, login, public courses
- **Protected Routes**: Use `ProtectedRoute` component
- **Teacher Routes**: Require `requiredRole="teacher"`
- **Student Routes**: Require `requiredRole="student"`
- **Demo Routes**: Accessible without authentication

## 🌐 Internationalization (i18n)

The platform supports multiple languages using `i18next`:
- **English** (default)
- **Indonesian** (Bahasa Indonesia)

Language switching is available via the `LanguageSwitcher` component in the navigation.

## 🔄 Application Flow

### Teacher Workflow
1. **Login** → Teacher Dashboard
2. **Create Course** → Add materials, set status
3. **Create Exam/Assignment** → Design questions, set deadlines
4. **Publish** → Make available to enrolled students
5. **Monitor** → View submissions and analytics
6. **Grade** → Auto-graded MCQs, manual essay grading
7. **Reports** → Generate report cards and exports

### Student Workflow
1. **Login** → Student Dashboard
2. **Browse Courses** → Explore and enroll
3. **Access Materials** → Watch videos, read PDFs
4. **Take Exams** → Complete within time limit
5. **Submit Assignments** → Upload files and answers
6. **View Results** → Check grades and feedback
7. **Track Progress** → Monitor performance analytics

## 🚢 Deployment

### Recommended Platforms
- **Vercel**: Zero-config deployment for Vite apps
- **Netlify**: Automatic builds from Git
- **Cloudflare Pages**: Global CDN distribution
- **Supabase Hosting**: Integrated with Supabase backend

### Deployment Steps (Vercel Example)
1. Push code to GitHub repository
2. Import project in Vercel
3. Add environment variables (VITE_SUPABASE_*)
4. Deploy

### Environment Variables
Ensure these are set in your deployment platform:
```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Style
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** configuration (via ESLint)
- Component-based architecture
- Custom hooks for data fetching and state management

### Adding New Features

For detailed workflow guides, see [ARCHITECTURE.md - Developer Guide](./ARCHITECTURE.md#developer-guide):

1. **Adding a Page**: Component → Route → Navigation → Hook
2. **Adding a Table**: Migration → RLS policies → Types → Hook
3. **Adding Notifications**: Database trigger → Real-time subscription
4. **Adding Forms**: Zod schema → React Hook Form → Validation

Quick steps:
1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Create custom hooks in `src/hooks/`
4. Update routes in `src/App.tsx`
5. Add database migrations in `supabase/migrations/`
6. Regenerate TypeScript types

## 📊 Key Technologies Explained

### shadcn/ui
Provides 49+ pre-built, accessible UI components based on Radix UI primitives. Components include:
- Buttons, Inputs, Forms
- Dialogs, Modals, Sheets
- Tables, Cards, Badges
- Charts, Progress bars
- Dropdown menus, Tooltips
- And much more...

### TanStack Query (React Query)
Handles server state management:
- Automatic caching and refetching
- Optimistic updates
- Background synchronization
- Built-in loading and error states

### Supabase
Provides backend infrastructure:
- PostgreSQL database
- Real-time subscriptions
- Authentication
- File storage
- Row-Level Security

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before getting started.

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

## 📞 Support & Contact

For full demo or institutional inquiries:
- **WhatsApp**: +62 822-9367-5164
- **Website**: Visit the landing page for more information

## 🎓 Credits

Built with modern web technologies and best practices to deliver a world-class learning management system for educators and institutions.

---

**Made with ❤️ for Education**
