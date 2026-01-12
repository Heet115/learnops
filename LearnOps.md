# LearnOps - Complete Features & Functionality

## 1. Authentication & Authorization

- Clerk-based authentication (admin-only user creation)
- Role-based access control (RBAC): Admin, HOD, Professor, Student
- Session management with role metadata
- Middleware-protected routes
- Webhook sync for Clerk user events (create, update, delete)
- Role-based route protection (admin/hod/professor/student routes)
- Unauthorized page redirect

## 2. Admin Features

### User Management

- Create users (all roles) via Clerk + MongoDB sync
- Update user details and roles
- Deactivate/reactivate users (soft delete with Clerk ban)
- Permanently delete users
- Bulk operations: deactivate, reactivate, delete
- User statistics dashboard (total users, by role)
- Recent users list

### Academic Structure Management

- Departments: CRUD with HOD assignment
- Courses: CRUD with auto-generated semesters (diploma/UG/PG types)
- Semesters: CRUD with date ranges
- Subjects: CRUD with credits
- Classes/Sections: CRUD with academic year
- Subject Offerings: Assign professors to subjects for specific classes
- Class Coordinators: Assign professors as class coordinators
- Bulk operations for all entities (delete, toggle status)

### Student Management

- Student profile creation with detailed info (identity, contact, academic, address)
- Assign students to classes
- Change student class assignments
- Bulk import students via CSV/Excel
- Profile update request review (approve/reject with comments)
- Notify students on request status

### Audit Trail

- Activity logging for all actions (26+ action types)
- View audit logs with filtering
- Entity-specific activity timeline

### Admin Dashboard

- Total users count (students, professors, HODs)
- Academic stats (departments, courses, subjects, classes)
- Activity stats (ALAs, submissions)
- Recent users list

## 3. HOD Features

### Department Oversight

- View department structure
- Monitor classes and subjects
- Track professors in department
- View courses and classes in department

### Analytics Dashboard

- Submission trends (30-day chart with submitted/graded)
- Professor activity/grading stats (graded vs pending per professor)
- Submissions by class (students, submitted, graded, pending)
- Subject completion rates (ALAs count, completion percentage)
- Submission heatmap (day of week × hour matrix)
- ALA status overview (upcoming deadlines, submission counts)

### HOD Dashboard Stats

- Professor count in department
- Subject count
- Pending submissions
- Overall completion rate

## 4. Professor Features

### ALA (Active Learning Activity) Management

- Create ALAs with:
  - Title, description, deadline
  - Max marks, file type restrictions
  - Max file size (up to 30MB)
  - Individual or group submission mode
  - Group formation type (student/professor)
  - Max group size
  - Late submission support with penalty percentage
  - Late deadline configuration
- Update/delete ALAs
- Lock/unlock submissions
- Bulk operations: lock, unlock, delete
- Add/remove resources (documents, links)
- Upload resources to Cloudinary
- Auto-notify students when ALA created

### Submission Management

- View all submissions (filter by status: all/submitted/graded/rejected)
- View submissions per ALA
- Grade submissions with marks and feedback
- Automatic late penalty calculation (adjustedMarks)
- Reject submissions with reason
- Grading statistics (pending, graded, rejected counts)
- Download submissions as ZIP

### Group Management (for group ALAs)

- Create groups and assign students (professor-formed)
- Assign group leaders
- Update/delete groups
- View group compositions
- Lock groups after submission

### Student View

- View students in assigned classes

### Professor Dashboard

- Active ALAs count
- Student count in classes
- Pending submissions count
- Graded this month count
- Recent submissions list
- Assigned subjects list

### Calendar View

- View ALAs by date range
- Deadline events
- Late deadline events
- Subject/class info per event

## 5. Student Features

### Dashboard

- View assigned ALAs with deadlines
- Submission status tracking (pending, due soon, submitted, overdue)
- Upcoming deadlines view (next 7 days)
- Recent grades list

### Submissions

- Submit files (PDF, DOCX, PPT, ZIP - max 30MB)
- Submit links with titles
- Update submissions before deadline
- Late submission support (with penalty indicator)
- View submission history
- View grades and feedback (marks, adjustedMarks, feedback)
- Submission status: submitted → graded/rejected

### Group Collaboration

- Create groups (student-formed) with name
- Invite classmates to group
- Accept/decline group invitations
- Leave groups
- View pending invitations
- Group leader can manage members
- Transfer leadership
- Only leader can submit for group

### Profile

- View personal profile (read-only)
- View detailed student profile (identity, contact, academic, address)
- Request profile updates (allowed fields only)
- Track update request status (pending/approved/rejected)
- View review comments

### Grades

- View all grades with subject info
- Grade history with timestamps
- See late penalty applied

### Calendar View

- View deadlines by date range
- Deadline events with status (pending/submitted/graded/overdue/late)
- Late deadline events
- Subject info per event
- Calendar summary (counts by date)
- Upcoming deadlines (next N days)

### Timeline/Activity

- Activity timeline view

## 6. Notification System

- Real-time notifications via SSE (Server-Sent Events)
- Notification types (9 types):
  - `new_ala` - New ALA posted
  - `deadline_reminder` - Upcoming deadline (configurable: 6-72 hours)
  - `submission_graded` - Submission graded
  - `submission_rejected` - Submission rejected
  - `group_invite` - Group invitation received
  - `group_joined` - Member joined group
  - `group_left` - Member left group
  - `announcement` - New announcement
  - `system` - System notifications
- Mark as read (single/all)
- Delete notifications
- Notification preferences per type
- Quiet hours support
- Cron job for deadline reminders
- Push notifications to connected users

## 7. Announcement System

- Role-based creation (admin, HOD, professor)
- Targeted delivery:
  - All users
  - Department-specific
  - Class-specific
  - Subject offering-specific
- Priority levels (low, normal, high, urgent)
- Scheduled publishing (publishAt)
- Expiration dates (expiresAt)
- Publish/unpublish toggle
- Edit/delete announcements
- Target name resolution for display
- Announcements feed for students

## 8. File Management

- Cloudinary integration for file storage
- File upload with type validation (PDF, DOCX, PPT, PPTX, ZIP)
- File size limits (30MB max)
- Automatic cleanup on deletion (Cloudinary resource deletion)
- Support for raw and image resource types
- Public ID extraction from URLs
- Secure URL storage in database

## 9. Activity Logging & Audit Trail

- Comprehensive audit trail (26+ action types)
- Tracks: user actions, entity changes
- Entity types: user, department, course, semester, subject, class, subject_offering, ALA, submission, group
- Activity feed components
- Dashboard activity view
- Entity-specific timeline
- User attribution for all actions

## 10. UI/UX Features

- Dark/light mode toggle
- Responsive sidebar navigation
- Role-based navigation menus
- Loading states and skeletons
- Toast notifications (Sonner)
- Data tables with:
  - Filtering
  - Sorting
  - Pagination
  - Bulk selection (useRowSelection hook)
  - Export functionality
- Empty states with illustrations
- Confirmation dialogs
- Form validation with Zod
- Announcement cards with priority badges
- Switch components for toggles

## 11. API Routes

- `POST /api/upload` - File upload to Cloudinary
- `DELETE /api/upload` - File deletion from Cloudinary
- `GET /api/notifications/stream` - SSE real-time notifications
- `POST /api/webhooks/clerk` - Clerk webhook handler (user sync)
- `POST /api/cron/deadline-reminders` - Scheduled deadline reminders

## 12. Data Models (17 collections)

- User (admin, hod, professor, student roles)
- Department (with HOD assignment)
- Course (diploma/UG/PG types)
- Semester (with date ranges)
- Subject (with credits)
- Class (with academic year)
- SubjectOffering (professor-subject-class assignment)
- ClassCoordinator (professor-class oversight)
- ALA (with late submission support, resources)
- Submission (files, links, grading, late penalty)
- Group (student/professor-formed, with leader)
- Notification (9 types, with metadata)
- NotificationPreferences (per-user settings, quiet hours)
- Activity (audit trail)
- StudentProfile (detailed student info)
- ProfileUpdateRequest (student change requests)
- Announcement (targeted, scheduled, priority)

## 13. Security & Access Control

- Server-side RBAC enforcement
- Middleware route protection
- Clerk webhook verification
- File type and size validation
- Soft deletes (isActive flag)
- User deactivation (not hard delete)
- Role-based action authorization
- Owner/creator checks for updates/deletes
