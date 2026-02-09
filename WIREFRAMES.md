# UI Wireframes (Whimsical Style)

Berikut adalah wireframe Low-Fidelity (Lo-Fi) dalam format teks/ASCII untuk mensimulasikan tampilan *blueprint* ala Whimsical. Fokus pada tata letak dan hierarki informasi.

## 1. Guru (Teacher)

### A. Teacher Dashboard
*Overview kelas dan aktivitas terkini.*

```text
+-----------------------------------------------------------------------+
|  [Logo]  Dashboard   Courses   Exams   Students   Reports    (Avatar) |
+-----------------------------------------------------------------------+
|                                                                       |
|  Welcome back, Mr. Anderson!                                          |
|                                                                       |
|  [ STATS ROW ]                                                        |
|  +------------------+  +------------------+  +------------------+     |
|  |  TOTAL STUDENTS  |  |  ACTIVE COURSES  |  |  UPCOMING EXAMS  |     |
|  |       120        |  |        5         |  |        3         |     |
|  +------------------+  +------------------+  +------------------+     |
|                                                                       |
|  [ QUICK ACTIONS ]                                                    |
|  [+ Create Course]  [+ New Exam]  [+ Announcement]                    |
|                                                                       |
|  +---------------------------------------+  +-----------------------+ |
|  |  Teaching Schedule (Today)            |  |  Recent Activity      | |
|  |---------------------------------------|  |-----------------------| |
|  |  08:00 - Math 101 (Room A)            |  |  • Andi submitted Quiz| |
|  |  10:00 - Physics 2 (Lab)              |  |  • Budi joined Class  | |
|  |  13:00 - Consultation                 |  |  • System Update      | |
|  +---------------------------------------+  +-----------------------+ |
|                                                                       |
+-----------------------------------------------------------------------+
```

### B. Course Detail Management
*Halaman pengelolaan satu mata pelajaran.*

```text
+-----------------------------------------------------------------------+
|  < Back to Courses    |  PHYSICS 101 - Class A              [Settings]|
+-----------------------------------------------------------------------+
|                                                                       |
|  [ STREAM ]   [ CLASSWORK ]   [ PEOPLE ]   [ GRADES ]                 |
|  ^ Selected                                                           |
|                                                                       |
|  +---------------------+                                              |
|  |  [+ Create] v       |                                              |
|  +---------------------+                                              |
|                                                                       |
|  [ SECTION: INTRODUCTION ] -----------------------------------------  |
|  | [Doc]  Syllabus & Rules                          (Posted 2d ago) | |
|  | [Vid]  Welcome Video                             (Posted 2d ago) | |
|  -------------------------------------------------------------------  |
|                                                                       |
|  [ SECTION: WEEK 1 - MECHANICS ] -----------------------------------  |
|  | [Mat]  Newton's Laws Presentation                (Posted yesterday)|
|  | [Asg]  Assignment 1: Force Diagrams              (Due Tomorrow)  | |
|  | [Qiz]  Quiz 1: Basic Concepts                    (Draft)         | |
|  -------------------------------------------------------------------  |
|                                                                       |
+-----------------------------------------------------------------------+
```

### C. Grading Interface (Split View)
*Menilai tugas siswa dengan tampilan split.*

```text
+-----------------------------------------------------------------------+
|  < Back | Assignment 1: Force Diagrams |  30/32 Graded      [Publish] |
+-----------------------------------------------------------------------+
|  Student List       |  Submission Preview                             |
|  [Search......]     |                                                 |
|                     |  +-------------------------------------------+  |
|  [ ] Andi (Late)    |  |                                           |  |
|      Score: --/100  |  |  [ PDF PREVIEW / IMAGE VIEWER ]           |  |
|                     |  |  "Newton's First Law states that..."      |  |
|  [x] Budi (Done)    |  |                                           |  |
|      Score: 85/100  |  |  (Diagram.png)                            |  |
|      > SELECTED     |  |                                           |  |
|                     |  +-------------------------------------------+  |
|  [ ] Citra (Miss)   |                                                 |
|      Score: --/100  |  [ GRADE & FEEDBACK ]                           |
|                     |  Score: [ 85 ] / 100                            |
|                     |  Feedback:                                      |
|                     |  [ Great job on the diagram! Please check... ]  |
|                     |                                                 |
|                     |              [Return File]   [Save Grade]       |
+---------------------+-------------------------------------------------+
```

---

## 2. Siswa (Student)

### A. Student Dashboard
*Pusat aktivitas belajar siswa.*

```text
+-----------------------------------------------------------------------+
|  [Logo]   My Learning   Calendar   Badges   (Avatar)   [Notif Badge]  |
+-----------------------------------------------------------------------+
|                                                                       |
|  [ PROGRESS CHART ]             [ UPCOMING TASKS ]                    |
|  +-----------------------+      +----------------------------------+  |
|  | Week 4 Performance    |      | [!] Math Homework     (Due Today)|  |
|  |  _   _      _         |      | [!] Physics Quiz      (Tomorrow) |  |
|  |_/ \_/ \____/ \_       |      |     History Reading   (Friday)   |  |
|  |  90% Attendance       |      +----------------------------------+  |
|  +-----------------------+                                            |
|                                                                       |
|  [ MY COURSES ]                                                       |
|  +-----------+  +-----------+  +-----------+  +-----------+           |
|  | PHYSICS 1 |  |  MATH 2   |  |  ART 101  |  | HISTORY   |           |
|  | [Resume>] |  | [Resume>] |  | [Resume>] |  | [Resume>] |           |
|  | Progr: 40%|  | Progr: 75%|  | Progr: 10%|  | Progr: 90%|           |
|  +-----------+  +-----------+  +-----------+  +-----------+           |
|                                                                       |
+-----------------------------------------------------------------------+
```

### B. Course Player (Lesson View)
*Halaman saat siswa membuka materi pelajaran.*

```text
+-----------------------------------------------------------------------+
|  < Back to Course  |  Week 1: Mechanics - Newton's Laws               |
+-----------------------------------------------------------------------+
|  Table of Contents |  Content Area                                    |
|                    |                                                  |
|  1. Introduction   |  +--------------------------------------------+  |
|     (Completed)    |  |                                            |  |
|                    |  |       [ VIDEO PLAYER COMPONENT ]           |  |
|  2. Newton's Laws  |  |          (    |>    )                      |  |
|     > CURRENT      |  |                                            |  |
|                    |  +--------------------------------------------+  |
|  3. Quiz 1         |                                                  |
|     (Locked)       |  # Newton's First Law                            |
|                    |  An object at rest stays at rest...              |
|                    |  ...                                             |
|                    |                                                  |
|                    |  [Mark as Complete]      [Next Lesson >]         |
|                    |                                                  |
|                    |  ----------------------------------------------  |
|                    |  Activity / Comments (3)                         |
|                    |  [User1]: I don't understand the third law...    |
+--------------------+--------------------------------------------------+
```

---

## 3. Orang Tua (Parent)

### A. Children Overview (Dashboard)
*Memantau status belajar anak.*

```text
+-----------------------------------------------------------------------+
|  Parent Portal        Dashboard    Notifications    Settings    (User)|
+-----------------------------------------------------------------------+
|                                                                       |
|  [+ Add Child]                                                        |
|                                                                       |
|  [ CHILD CARD 1 ]                    [ CHILD CARD 2 ]                 |
|  +-------------------------------+   +-----------------------------+  |
|  |  (Photo)   **ANDI**           |   |  (Photo)  **SITI**          |  |
|  |  Class: 10A                   |   |  Class: 5B                  |  |
|  |  School: SMA 1                |   |  School: SD 2               |  |
|  |                               |   |                             |  |
|  |  [ATTENDANCE]  [AVG GRADE]    |   |  [ATTENDANCE]  [AVG GRADE]  |  |
|  |  [|||||95%]     [ A- ]        |   |  [|||  80%]     [ B+ ]      |  |
|  |                               |   |                             |  |
|  |  Latest Updates:              |   |  Latest Updates:            |  |
|  |  • Absent on Physics (Today)  |   |  • New Assignment Posted    |  |
|  |  • Math Exam: 90/100          |   |  • Field Trip Notice        |  |
|  |                               |   |                             |  |
|  |  [View Full Report >]         |   |  [View Full Report >]       |  |
|  +-------------------------------+   +-----------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```
