# Project Flowcharts

Berikut adalah flowchart detail untuk setiap menu yang tersedia dalam aplikasi Classroom Companion, dikategorikan berdasarkan role pengguna.

## 1. Flowchart Guru (Teacher)

### Overview Alur Utama
```mermaid
graph TD
    TeacherLogin[Login Guru] --> Layout[Teacher Layout]
    Layout --> Dashboard[Dashboard]
    Layout --> Courses[Courses]
    Layout --> Calendar[Calendar]
    Layout --> Attendance[Attendance]
    Layout --> Assignments[Assignments]
    Layout --> Exams[Exams]
    Layout --> QBank[Question Bank]
    Layout --> Materials[Materials]
    Layout --> ReportCards[Report Cards]
    Layout --> Announcements[Announcements]
    Layout --> Analytics[Analytics]
    Layout --> Students[Students]
    Layout --> Settings["Settings/Profile"]
```

### Detail Per Menu

#### Courses (Manajemen Kursus)
```mermaid
graph LR
    Nav["Menu: Courses"] --> List[List Kursus]
    List --> Create[Buat Kursus]
    List --> Detail[Detail Kursus]
    Detail --> Edit[Edit Kursus]
    Detail --> Materials[Materi Kursus]
    Detail --> Students[Siswa Terdaftar]
    Detail --> Session[Sesi Absensi]
```

#### Exams (Manajemen Ujian)
```mermaid
graph TD
    Nav["Menu: Exams"] --> List[List Ujian]
    List --> Create[Buat Ujian Baru]
    List --> Edit[Edit Ujian]
    List --> Grade[Nilai Ujian]
    Grade --> StudentList[List Pengumpulan Siswa]
    StudentList --> GradingForm[Form Penilaian]
```

#### Assignments (Manajemen Tugas)
```mermaid
graph TD
    Nav["Menu: Assignments"] --> List[List Tugas]
    List --> Create[Buat Tugas Baru]
    List --> Edit[Edit Tugas]
    List --> Submissions[Lihat Pengumpulan]
    Submissions --> Grading[Beri Nilai]
```

#### Question Bank (Bank Soal)
```mermaid
graph LR
    Nav["Menu: Question Bank"] --> List[List Soal]
    List --> Create[Buat Soal Baru]
    List --> Import[Import Soal]
```

#### Materials (Materi Pembelajaran)
```mermaid
graph LR
    Nav["Menu: Materials"] --> List[Perpustakaan Materi]
    List --> Upload[Upload Materi Baru]
    List --> Detail[Preview Materi]
```

#### Report Cards (Rapor Siswa)
```mermaid
graph LR
    Nav["Menu: Report Cards"] --> List[List Rapor]
    List --> Generate[Generate Rapor]
    List --> Detail[Detail Rapor Siswa]
    Detail --> Print["Cetak/Download"]
```

#### Attendance (Absensi)
```mermaid
graph LR
    Nav["Menu: Attendance"] --> Overview[Overview Absensi]
    Overview --> History[Riwayat Absensi]
    Overview --> Manage[Kelola Sesi Absensi]
```

#### Analytics (Analistik)
```mermaid
graph TD
    Nav["Menu: Analytics"] --> Dashboard[Dashboard Analistik]
    Dashboard --> StudentPerformance[Performa Siswa]
    Dashboard --> ClassComparison[Perbandingan Kelas]
```

#### Students (Daftar Siswa)
```mermaid
graph LR
    Nav["Menu: Students"] --> List[Daftar Semua Siswa]
    List --> Detail[Profil Siswa]
    List --> AcademicRecord[Rekaman Akademik]
```

#### Announcements (Pengumuman)
```mermaid
graph LR
    Nav["Menu: Announcements"] --> List[List Pengumuman]
    List --> Create[Buat Pengumuman Baru]
```

#### Calendar (Kalender)
```mermaid
graph LR
    Nav["Menu: Calendar"] --> View[Tampilan Kalender]
    View --> EventDetail[Detail Agenda]
    View --> AddEvent[Tambah Agenda]
```

---

## 2. Flowchart Siswa (Student)

### Overview Alur Utama
```mermaid
graph TD
    StudentLogin[Login Siswa] --> Layout[Student Layout]
    Layout --> Dashboard[Dashboard]
    Layout --> MyCourses[My Courses]
    Layout --> Explore[Explore Courses]
    Layout --> Calendar[Calendar]
    Layout --> Attendance[Attendance]
    Layout --> Assignments[Assignments]
    Layout --> Exams[Exams]
    Layout --> Materials[Materials]
    Layout --> ReportCards[Report Cards]
    Layout --> Badges[Badges]
    Layout --> Analytics[Analytics]
    Layout --> Notifications[Notifications]
    Layout --> Settings["Settings/Profile"]
```

### Detail Per Menu

#### My Courses (Kursus Saya)
```mermaid
graph LR
    Nav["Menu: My Courses"] --> List[List Kursus Saya]
    List --> Detail[Detail Kursus]
    Detail --> Content[Materi Pelajaran]
```

#### Explore Courses (Cari Kursus)
```mermaid
graph LR
    Nav["Menu: Explore"] --> List[Katalog Kursus]
    List --> Detail[Preview Kursus]
    Detail --> Enroll[Daftar Kursus]
```

#### Exams (Ujian)
```mermaid
graph LR
    Nav["Menu: Exams"] --> List[List Ujian Tersedia]
    List --> Take[Kerjakan Ujian]
    Take --> Submit[Kumpulkan Jawaban]
    List --> Results["Lihat Hasil/Nilai"]
```

#### Assignments (Tugas)
```mermaid
graph LR
    Nav["Menu: Assignments"] --> List[List Tugas]
    List --> Detail[Detail Tugas]
    Detail --> Submit["Upload/Kerjakan Tugas"]
    Detail --> Feedback[Lihat Feedback Guru]
```

#### Materials (Materi)
```mermaid
graph LR
    Nav["Menu: Materials"] --> List[Akses Materi Belajar]
    List --> Download["Download/View Materi"]
```

#### Report Cards (Laporan Hasil Belajar)
```mermaid
graph LR
    Nav["Menu: Report Cards"] --> List[List Rapor]
    List --> Detail[Lihat Detail Nilai]
    Detail --> Download[Download PDF]
```

#### Badges (Pencapaian)
```mermaid
graph LR
    Nav["Menu: Badges"] --> Collection[Koleksi Lencana]
    Collection --> Detail[Detail Pencapaian]
```

#### Analytics (Analistik Belajar)
```mermaid
graph LR
    Nav["Menu: Analytics"] --> Overview[Progress Belajar]
    Overview --> Grades[Grafik Nilai]
    Overview --> Activity[Aktivitas Belajar]
```

#### Attendance (Kehadiran)
```mermaid
graph LR
    Nav["Menu: Attendance"] --> History[Riwayat Kehadiran]
    History --> Statistics[Statistik Kehadiran]
```

#### Calendar (Jadwal)
```mermaid
graph LR
    Nav["Menu: Calendar"] --> View[Lihat Jadwal]
    View --> ExamDates[Jadwal Ujian]
    View --> DueDates[Tenggat Tugas]
```

---

## 3. Flowchart Orang Tua (Parent)

### Overview Alur Utama
```mermaid
graph TD
    ParentLogin[Login Orang Tua] --> Layout[Parent Layout]
    Layout --> Dashboard[Dashboard]
    Layout --> AddChild[Add Child]
    Layout --> Notifications[Notifications]
    Layout --> Settings["Settings/Profile"]
    Dashboard --> ChildDetail[Detail Anak]
```

### Detail Per Menu

#### Children Overview (Dashboard Anak)
```mermaid
graph TD
    Nav["Menu: Dashboard"] --> ChildList[List Anak]
    ChildList --> ChildDetail[Dashboard Anak]
    ChildDetail --> ChildAttendance[Lihat Absensi]
    ChildDetail --> ChildAssignments[Lihat Tugas]
    ChildDetail --> ChildExams[Lihat Nilai Ujian]
    ChildDetail --> ChildCourses[Lihat Kursus]
```

#### Add Child (Tambah Anak)
```mermaid
graph LR
    Nav["Menu: Add Child"] --> Search["Cari Siswa (Kode/ID)"]
    Search --> Link[Hubungkan Akun]
```

#### Notifications (Notifikasi)
```mermaid
graph LR
    Nav["Menu: Notifications"] --> List[Inbox Notifikasi]
    List --> MarkRead[Tandai Dibaca]
```
