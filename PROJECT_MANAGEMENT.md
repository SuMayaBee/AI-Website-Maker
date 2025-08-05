# Project Management Feature

This document describes the new project management feature added to the AI Website Builder.

## Overview

The project management system allows users to:
- Automatically save generated projects
- View all their created projects
- Search and filter projects
- Download project files as ZIP
- Delete unwanted projects
- Navigate back to existing projects

## Backend Implementation

### FastAPI Endpoints

- `GET /api/projects` - Get all projects
- `GET /api/projects/{id}` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/{id}` - Update existing project
- `DELETE /api/projects/{id}` - Delete project

### Data Storage

Projects are stored in a simple JSON file (`backend/projects/projects.json`) with the following structure:

```json
{
  "id": "uuid",
  "title": "Project Title",
  "description": "Project description",
  "prompt": "Original user prompt",
  "files": {
    "/App.js": {
      "code": "React component code..."
    }
  },
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00",
  "thumbnail": null
}
```

## Frontend Implementation

### Components

1. **ProjectsView** (`components/custom/ProjectsView.jsx`)
   - Main projects listing page
   - Search and filter functionality
   - Project cards with actions (view, download, delete)

2. **Updated Header** (`components/custom/Header.jsx`)
   - Added navigation links for Home and Projects
   - Active state highlighting

3. **Updated CodeView** (`components/custom/CodeView.jsx`)
   - Auto-saves projects when code is generated
   - Integrates with FastAPI backend

### Routes

- `/projects` - Projects listing page
- `/workspace/[id]` - Existing workspace/project view

## Features

### Auto-Save
- Projects are automatically saved when AI generates code
- Uses project title from AI response or user prompt
- Saves all generated files and metadata

### Project Management
- **View**: Navigate back to workspace with project data
- **Download**: Export all project files as ZIP with package.json
- **Delete**: Remove projects with confirmation
- **Search**: Filter projects by title or description
- **Sort**: Order by date created, updated, or title

### Navigation
- Header navigation between Home and Projects
- Quick access button on Hero page
- Breadcrumb-style navigation

## Usage

1. **Creating Projects**: 
   - Use the main interface to generate code
   - Projects are automatically saved to the backend

2. **Viewing Projects**:
   - Click "Projects" in the header or "View My Projects" on home page
   - Browse, search, and filter your projects

3. **Managing Projects**:
   - Click "View" to open project in workspace
   - Click download icon to export files
   - Click delete icon to remove project

## Technical Details

### File Structure
```
backend/
├── projects/
│   └── projects.json     # Project storage
├── main.py              # FastAPI app with project endpoints
└── ...

components/custom/
├── ProjectsView.jsx     # Projects listing component
├── Header.jsx           # Updated navigation
└── CodeView.jsx         # Updated with auto-save

app/(main)/
├── projects/
│   └── page.js          # Projects page route
└── ...

lib/
└── fastapi-client.js    # Updated with project API calls
```

### Dependencies
- FastAPI backend handles all project CRUD operations
- Frontend uses Next.js routing and React hooks
- JSZip for file downloads
- Lucide React for icons

## Future Enhancements

- Project thumbnails/previews
- Project sharing and collaboration
- Project templates
- Version history
- Cloud storage integration
- Project categories/tags