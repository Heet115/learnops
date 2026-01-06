LearnOps - Complete Features & Functionality
1. Authentication & Authorization
Clerk-based authentication (admin-only user creation)
Role-based access control (RBAC): Admin, HOD, Professor, Student
Session management with role metadata
Middleware-protected routes
Webhook sync for Clerk user events
2. Admin Features
User Management

Create users (all roles) via Clerk + MongoDB sync
Update user details and roles
Deactivate/reactivate users (soft delete with Clerk ban)
Permanently delete users
Bulk operations: deactivate, reactivate, delete
User statistics dashboard
Academic Structure Management

Departments: CRUD with HOD assignment
Courses: CRUD with auto-generated semesters
Semesters: CRUD with date ranges
Subjects: CRUD with credits
Classes/Sections: CRUD with academic year
Subject Offerings: Assign professors to subjects for specific classes
Class Coordinators: Assign professors as class coordinators
Bulk operations for all entities (delete, toggle status)
Student Management

Student profile creation with detailed info
Assign students to classes
Change student class assignments
Bulk import students via CSV/Excel
Profile update request review (approve/reject)
Audit Trail

Activity logging for all actions
View audit logs with filtering
3. HOD Features
Department Oversight

View department structure
Monitor classes and subjects
Track professors in department
Analytics Dashboard

Submission trends (30-day chart)
Professor activity/grading stats
Submissions by class
Subject completion rates
Submission heatmap (day/hour)
ALA status overview
4. Professor Features
ALA (Active Learning Activity) Management

Create ALAs with:
Title, description, deadline
Max marks, file type restrictions
Max file size (up to 30MB)
Individual or group submission mode
Group formation type (student/professor)
Max group size
Update/delete ALAs
Lock/unlock submissions
Bulk operations: lock, unlock, delete
Add/remove resources (documents, links)
Upload resources to Cloudinary
Submission Management

View all submissions (filter by status)
View submissions per ALA
Grade submissions with marks and feedback
Reject submissions with reason
Grading statistics
Group Management (for group ALAs)

Create groups and assign students
Update/delete groups
View group compositions
Student View

View students in assigned classes
5. Student Features
Dashboard

View assigned ALAs with deadlines
Submission status tracking
Upcoming deadlines view
Submissions

Submit files (PDF, DOCX, PPT, ZIP)
Submit links
Update submissions before deadline
View submission history
View grades and feedback
Group Collaboration

Create groups (student-formed)
Invite classmates
Accept/decline group invitations
Leave groups
View pending invitations
Profile

View personal profile (read-only)
Request profile updates
Track update request status
Grades

View all grades
Grade history
Timeline/Activity

Activity timeline view
6. Notification System
Real-time notifications via SSE (Server-Sent Events)
Notification types:
New ALA posted
Deadline reminders (configurable: 6-72 hours)
Submission graded
Submission rejected
System notifications
Mark as read (single/all)
Delete notifications
Notification preferences per type
Cron job for deadline reminders
7. File Management
Cloudinary integration for file storage
File upload with type validation
File size limits (30MB max)
Automatic cleanup on deletion
Support for: PDF, DOCX, PPT, ZIP
8. Activity Logging
Comprehensive audit trail
Tracks: user actions, entity changes
Activity feed components
Dashboard activity view
9. UI/UX Features
Dark/light mode toggle
Responsive sidebar navigation
Role-based navigation menus
Loading states and skeletons
Toast notifications (Sonner)
Data tables with:
Filtering
Sorting
Pagination
Bulk selection
Export functionality
Empty states with illustrations
Confirmation dialogs
Form validation with Zod
10. API Routes
File upload endpoint
File deletion endpoint
Notification SSE stream
Clerk webhook handler
Cron endpoint for deadline reminders
11. Data Models (16 collections)
User, Department, Course, Semester
Subject, Class, SubjectOffering
ALA, Submission, Group
Notification, NotificationPreferences
Activity, StudentProfile
ProfileUpdateRequest, ClassCoordinator