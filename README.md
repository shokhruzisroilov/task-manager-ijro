# Trello Clone Frontend

A modern, minimalist project management application built with React, TypeScript, and Vite. This application provides a comprehensive interface for organizing work through workspaces, boards, columns, and cards with full support for collaboration, file attachments, comments, and labels.

## Features

- 🔐 **User Authentication** - Secure registration, login, and email verification
- 🏢 **Workspace Management** - Organize projects into logical groups with role-based access
- 📋 **Board Management** - Create and manage boards with customizable columns
- 🎯 **Card Management** - Track tasks with descriptions, due dates, members, labels, and attachments
- 🖱️ **Drag and Drop** - Intuitive card and column reordering with keyboard alternatives
- 👥 **Collaboration** - Assign members, add comments, and manage permissions
- 🏷️ **Labels** - Categorize cards with colored labels
- 📎 **Resumable File Upload** - Upload large files with pause/resume support
- ⚡ **Real-time Updates** - Optimistic UI updates with automatic conflict resolution
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ♿ **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- 🎨 **Minimalist Design** - Clean, distraction-free interface

## Tech Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing with protected routes
- **Zustand** - Lightweight state management
- **React Query** - Server state synchronization and caching
- **Axios** - HTTP client with interceptors
- **React DnD** - Drag and drop functionality
- **Vitest** - Unit and property-based testing
- **Playwright** - End-to-end testing
- **Fast-check** - Property-based testing library

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Backend API** - The Spring Boot backend must be running (default: `http://localhost:8080`)

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration (see [Environment Variables](#environment-variables) section).

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

The dev server includes:
- Hot Module Replacement (HMR) for instant updates
- Proxy configuration for API requests to avoid CORS issues
- Source maps for debugging

### Building

Build for production:
```bash
npm run build
```

This will:
1. Run TypeScript compiler to check types
2. Create an optimized production build in the `dist/` directory
3. Minify and bundle all assets
4. Generate source maps

Preview the production build locally:
```bash
npm run preview
```

### Testing

Run all unit and property-based tests:
```bash
npm run test
```

Run tests in watch mode during development:
```bash
npm run test:watch
```

Run tests with UI:
```bash
npm run test:ui
```

Run end-to-end tests:
```bash
npm run test:e2e
```

Run E2E tests in UI mode:
```bash
npm run test:e2e:ui
```

Run E2E tests on specific browsers:
```bash
npm run test:e2e:chrome   # Chromium only
npm run test:e2e:firefox  # Firefox only
npm run test:e2e:webkit   # WebKit (Safari) only
```

### Code Quality

Run ESLint to check for code issues:
```bash
npm run lint
```

Format code with Prettier:
```bash
npm run format
```

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # API client and endpoints
│   │   ├── client.ts          # Axios instance with interceptors
│   │   ├── errorHandler.ts   # API error handling
│   │   └── endpoints/         # API endpoint definitions
│   │       ├── auth.ts        # Authentication endpoints
│   │       ├── workspaces.ts  # Workspace endpoints
│   │       ├── boards.ts      # Board endpoints
│   │       ├── cards.ts       # Card endpoints
│   │       ├── columns.ts     # Column endpoints
│   │       ├── labels.ts      # Label endpoints
│   │       ├── comments.ts    # Comment endpoints
│   │       └── attachments.ts # Attachment endpoints
│   ├── components/            # React components
│   │   ├── common/           # Reusable components
│   │   │   ├── Button/       # Button component
│   │   │   ├── Input/        # Input component
│   │   │   ├── Modal/        # Modal component
│   │   │   ├── Dropdown/     # Dropdown component
│   │   │   ├── Avatar/       # Avatar component
│   │   │   ├── Toast/        # Toast notification
│   │   │   └── ...
│   │   ├── auth/             # Authentication components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── workspace/        # Workspace-specific components
│   │   │   ├── WorkspaceList.tsx
│   │   │   ├── WorkspaceCard.tsx
│   │   │   ├── CreateWorkspaceModal.tsx
│   │   │   └── WorkspaceMemberManager.tsx
│   │   ├── board/            # Board-specific components
│   │   │   ├── BoardList.tsx
│   │   │   ├── BoardCard.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── ColumnList.tsx
│   │   │   └── BoardMemberManager.tsx
│   │   ├── card/             # Card-specific components
│   │   │   ├── Card.tsx
│   │   │   ├── CardModal.tsx
│   │   │   ├── CardMembers.tsx
│   │   │   ├── CardComments.tsx
│   │   │   ├── AttachmentList.tsx
│   │   │   └── FileUploadButton.tsx
│   │   ├── label/            # Label components
│   │   │   ├── Label.tsx
│   │   │   ├── LabelManager.tsx
│   │   │   └── CreateLabelModal.tsx
│   │   └── layout/           # Layout components
│   │       ├── Sidebar.tsx
│   │       └── Breadcrumbs.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useWorkspaces.ts  # Workspace data hooks
│   │   ├── useBoards.ts      # Board data hooks
│   │   ├── useCards.ts       # Card data hooks
│   │   ├── useColumns.ts     # Column data hooks
│   │   ├── useLabels.ts      # Label data hooks
│   │   ├── useComments.ts    # Comment data hooks
│   │   ├── useAttachments.ts # Attachment data hooks
│   │   ├── useDragAndDrop.ts # Drag and drop logic
│   │   ├── useKeyboardShortcuts.ts # Keyboard shortcuts
│   │   ├── useMediaQuery.ts  # Responsive design
│   │   └── useFocusTrap.ts   # Accessibility
│   ├── pages/                # Page components
│   │   ├── Auth/             # Authentication pages
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── EmailVerification.tsx
│   │   ├── Workspaces/       # Workspace pages
│   │   │   ├── WorkspacesPage.tsx
│   │   │   └── WorkspaceBoardsPage.tsx
│   │   ├── Board/            # Board page
│   │   │   └── BoardView.tsx
│   │   └── NotFound/         # 404 page
│   ├── services/             # Business logic services
│   │   └── upload.service.ts # Resumable upload service
│   ├── store/                # State management (Zustand)
│   │   ├── auth.store.ts     # Authentication state
│   │   └── ui.store.ts       # UI state (sidebar, modals, toasts)
│   ├── types/                # TypeScript type definitions
│   │   ├── models.ts         # Domain models
│   │   ├── api.ts            # API request/response types
│   │   └── ui.ts             # UI-specific types
│   ├── utils/                # Utility functions
│   │   ├── validation.ts     # Form validation
│   │   ├── errorUtils.ts     # Error handling utilities
│   │   ├── colorContrast.ts  # Accessibility utilities
│   │   └── conflictHandler.ts # Conflict resolution
│   ├── styles/               # Global styles
│   │   ├── globals.css       # Global CSS
│   │   └── animations.css    # Animation definitions
│   ├── App.tsx               # Root component
│   └── main.tsx              # Application entry point
├── e2e/                      # End-to-end tests
├── public/                   # Static assets
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
├── vitest.config.ts          # Vitest configuration
└── playwright.config.ts      # Playwright configuration
```

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

### API Configuration

```bash
# Backend API base URL
VITE_API_BASE_URL=http://localhost:8080/api
```

**Description**: The base URL for the backend API. All API requests will be prefixed with this URL.

**Default**: `http://localhost:8080/api`

**Production**: Update this to your production API URL (e.g., `https://api.yourdomain.com/api`)

### Upload Configuration

```bash
# Upload chunk size in bytes (default: 1MB)
VITE_UPLOAD_CHUNK_SIZE=1048576

# Maximum file size in bytes (default: 100MB)
VITE_MAX_FILE_SIZE=104857600
```

**VITE_UPLOAD_CHUNK_SIZE**: Size of each chunk when uploading files. Smaller chunks are more resilient to network interruptions but require more requests.

**VITE_MAX_FILE_SIZE**: Maximum allowed file size for uploads. Files larger than this will be rejected.

### Application Configuration

```bash
# Application name displayed in the UI
VITE_APP_NAME=Trello Clone
```

**VITE_APP_NAME**: The application name displayed in the browser tab and UI.

## Component Usage

### Common Components

#### Button

```tsx
import { Button } from '@/components/common';

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>

// Variants: primary, secondary, danger, ghost
// Sizes: sm, md, lg
```

#### Input

```tsx
import { Input } from '@/components/common';

<Input
  type="text"
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  placeholder="Enter your email"
/>
```

#### Modal

```tsx
import { Modal } from '@/components/common';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Create Workspace"
>
  {/* Modal content */}
</Modal>
```

#### Toast

```tsx
import { useUIStore } from '@/store';

const addToast = useUIStore((state) => state.addToast);

addToast({
  message: 'Workspace created successfully',
  type: 'success',
  duration: 3000
});
```

### Custom Hooks

#### useWorkspaces

```tsx
import { useWorkspaces, useCreateWorkspace } from '@/hooks';

function WorkspaceList() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  const handleCreate = async (name: string) => {
    await createWorkspace.mutateAsync({ name });
  };

  // ...
}
```

#### useDragAndDrop

```tsx
import { useDragAndDrop } from '@/hooks';

function BoardView() {
  const { handleCardDrop, handleColumnDrop } = useDragAndDrop(boardId);

  // Use in drag and drop handlers
}
```

#### useKeyboardShortcuts

```tsx
import { useKeyboardShortcuts } from '@/hooks';

function App() {
  useKeyboardShortcuts({
    'ctrl+k': () => openSearch(),
    'escape': () => closeModal(),
  });
}
```

## API Integration

### API Client

The application uses Axios with interceptors for API communication:

```typescript
// Request interceptor adds JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (unauthorized) - redirect to login
    // Handle other errors - show toast notification
    return Promise.reject(error);
  }
);
```

### API Endpoints

All API endpoints are defined in `src/api/endpoints/`:

```typescript
// Example: Create a workspace
import { workspacesApi } from '@/api/endpoints';

const workspace = await workspacesApi.create({
  name: 'My Workspace',
  description: 'Project workspace'
});
```

### Error Handling

API errors are automatically handled by the error handler:

- **400 Bad Request**: Shows field-specific validation errors
- **401 Unauthorized**: Redirects to login page
- **403 Forbidden**: Shows permission error
- **404 Not Found**: Shows resource not found error
- **409 Conflict**: Shows conflict error with refresh option
- **500+ Server Error**: Shows generic server error

### React Query Integration

The application uses React Query for server state management:

```typescript
// Queries are cached and automatically refetched
const { data, isLoading, error } = useWorkspaces();

// Mutations include optimistic updates
const createWorkspace = useCreateWorkspace();
await createWorkspace.mutateAsync({ name: 'New Workspace' });
```

**Benefits**:
- Automatic caching and background refetching
- Optimistic updates for better UX
- Automatic error handling and retry logic
- Request deduplication

## State Management

### Authentication State (Zustand)

```typescript
import { useAuthStore } from '@/store';

const { user, token, login, logout } = useAuthStore();

// Login
await login(email, password);

// Logout
logout();

// Check authentication
const isAuthenticated = !!token;
```

### UI State (Zustand)

```typescript
import { useUIStore } from '@/store';

const {
  sidebarOpen,
  toggleSidebar,
  addToast,
  openModal,
  closeModal
} = useUIStore();

// Toggle sidebar
toggleSidebar();

// Show toast
addToast({
  message: 'Success!',
  type: 'success',
  duration: 3000
});

// Open modal
openModal('createWorkspace');
```

## Accessibility

The application is built with accessibility in mind:

- **Keyboard Navigation**: All functionality is accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: WCAG AA compliant color contrast ratios
- **Keyboard Shortcuts**:
  - `Ctrl+K`: Open search
  - `Escape`: Close modals/dialogs
  - `Tab`: Navigate between elements
  - Arrow keys: Navigate cards and columns

## Performance Optimization

- **Code Splitting**: Routes and heavy components are lazy-loaded
- **Memoization**: Expensive components use React.memo
- **Virtual Scrolling**: Large lists use virtual scrolling
- **Optimistic Updates**: UI updates immediately before API confirmation
- **Request Caching**: React Query caches API responses
- **Image Optimization**: Images are optimized and lazy-loaded

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues

If you see "Network error" messages:

1. Verify the backend API is running at `http://localhost:8080`
2. Check the `VITE_API_BASE_URL` in your `.env` file
3. Ensure CORS is properly configured on the backend

### Build Errors

If you encounter TypeScript errors during build:

1. Run `npm install` to ensure all dependencies are installed
2. Delete `node_modules` and `package-lock.json`, then run `npm install` again
3. Check that your Node.js version is 18 or higher

### Upload Issues

If file uploads fail:

1. Check the `VITE_MAX_FILE_SIZE` setting
2. Verify the backend upload endpoint is working
3. Check browser console for specific error messages

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Run `npm run lint` and `npm run format` before committing
4. Ensure all tests pass with `npm run test`

## License

MIT
