# V4 Pages

This folder contains the new v4 pages for the platform. These are placeholder pages that can be accessed for testing and development purposes.

## Pages

### 1. CandidateApplicationDetailPage.jsx
- **Route**: `/v4/employer/candidate-application/:applicationId`
- **Purpose**: Allows employers to view detailed information about a candidate's application
- **Features**:
  - Candidate profile display
  - Application details and cover letter
  - Document viewer for resume/portfolio
  - Job information sidebar
  - Application status management
  - Communication tools

### 2. JobApplicationPage.jsx
- **Route**: `/v4/candidate/applications`
- **Purpose**: Allows job seekers to view and manage their job applications
- **Features**:
  - Application statistics dashboard
  - Search and filter functionality
  - Application status tracking
  - Quick actions based on application status
  - Match score display

## Access

To access these pages:
- Candidate Application Detail: Navigate to `/v4/employer/candidate-application/123` (replace 123 with any application ID)
- Job Applications: Navigate to `/v4/candidate/applications`

## Notes

- These are placeholder pages with mock data
- All pages include proper authentication via ProtectedRoute
- Pages are styled with Tailwind CSS and use Lucide React icons
- All pages display a "V4 Preview" badge to indicate they are part of the v4 development
