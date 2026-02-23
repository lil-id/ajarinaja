# Code Audit: Attendance & Question Bank Features
Date: 2026-02-22

## Summary
- **Files reviewed:** 8+ (Hooks and Pages)
- **Issues found:** 7 (3 critical, 3 major, 1 minor)
- **Test coverage:** 0% (No tests found in codebase)

## Critical Issues
Issues that must be fixed before deployment.
- [ ] **I/O Isolation Violation** — All hooks ([useStudentAttendance.ts](file:///home/renjerpink/Documents/Pemrograman/JS/classroom-companion/src/hooks/useStudentAttendance.ts), [useQuestionBank.ts](file:///home/renjerpink/Documents/Pemrograman/JS/classroom-companion/src/hooks/useQuestionBank.ts), etc.) import `supabase` directly. Violates Rule 1 of Architectural Patterns.
- [ ] **Pure Business Logic Violation** — Filtering and aggregation logic is embedded within hooks and queries (e.g., [useStudentActiveSessions](file:///home/renjerpink/Documents/Pemrograman/JS/classroom-companion/src/hooks/useStudentAttendance.ts#L115)). Violates Rule 2 of Architectural Patterns.
- [ ] **Weak Typing & Implicit Any** — `lint` reports 250+ errors, primarily `no-explicit-any`. Many queries use `as any` casting, making the code fragile.

## Major Issues
Issues that should be fixed in the near term.
- [ ] **Inconsistent/Duplicate Hooks** — `useStudentCheckIn` is defined twice with different parameter signatures in [useStudentAttendance.ts](file:///home/renjerpink/Documents/Pemrograman/JS/classroom-companion/src/hooks/useStudentAttendance.ts#L48) and [useAttendanceSessions.ts](file:///home/renjerpink/Documents/Pemrograman/JS/classroom-companion/src/hooks/useAttendanceSessions.ts#L362).
- [ ] **Missing Logging** — No operation entry points (Check-in, Session Creation, Question Saving) include the mandatory 3-point logging. Violates Logging and Observability Mandate.
- [ ] **Race Condition in Usage Counter** — `useIncrementQuestionUsage` in [useQuestionBank.ts](file:///home/renjerpink/Documents/Pemrograman/JS/classroom-companion/src/hooks/useQuestionBank.ts#L181) uses a Fetch-then-Update pattern which is not atomic.

## Minor Issues
Style, naming, or minor improvements.
- [ ] **Large Component Complexity** — [QuestionBank.tsx](file:///home/renjerpink/Documents/Pemrograman/JS/classroom-companion/src/pages/teacher/QuestionBank.tsx) is >600 lines; dialog and form logic should be extracted.
- [ ] **Missing Pagination** — Question bank fetches all items at once, which will degrade performance as the bank grows.

## Verification Results
- Lint: **FAIL** (273 problems found)
- Tests: **N/A** (No test suite found)
- Build (Type Check): **PASS**
- Coverage: **0%**
