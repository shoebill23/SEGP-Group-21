# Authentication System Implementation Guide

## Overview
A complete authentication and session management system has been implemented for the Algae International Berhad Monitoring Dashboard. The system manages user login, role-based access control, and session persistence.

## Architecture

### Core Components

#### 1. **AuthContext** (`src/contexts/AuthContext.tsx`)
- Manages global authentication state
- Provides `useAuth()` hook for components
- Handles user session initialization from localStorage
- Implements login/logout functionality
- Mock user database for development/testing

**Mock Users:**
- Admin: `admin@algae.com` / `admin123`
- Manager: `manager@algae.com` / `manager123`
- Worker: `worker@algae.com` / `worker123`

#### 2. **Login Page** (`src/pages/Login.tsx`)
- Clean, professional login interface matching dashboard design
- Email and password input fields
- Show/Hide password toggle
- Error message display
- Loading state during authentication
- Displays demo credentials for testing
- Styled with Tailwind CSS and shadcn/ui components

#### 3. **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
- Route protection component
- Checks authentication status
- Redirects unauthenticated users to login
- Enforces role-based access control
- Shows loading state during auth checks

#### 4. **AccessDenied Page** (`src/pages/AccessDenied.tsx`)
- Shown when user lacks permissions
- Displays current user role
- Provides navigation options
- Consistent with dashboard styling

#### 5. **Role Permissions** (`src/lib/rolePermissions.ts`)
- Centralized permission configuration
- Permission matrix for each role
- Helper functions for access control
- `hasAccessToRoute()` - Check route access
- `getAccessibleRoutes()` - Get all accessible routes for a role
- `isAdmin()` - Check admin status
- `isManagerOrAbove()` - Check manager or higher status

### Permission Matrix

| Route | Worker | Manager | Admin |
|-------|--------|---------|-------|
| `/` (Dashboard) | ✓ | ✓ | ✓ |
| `/sensors` | ✓ | ✓ | ✓ |
| `/alerts` | ✓ | ✓ | ✓ |
| `/simulation` | ✗ | ✓ | ✓ |
| `/users` | ✗ | ✗ | ✓ |

## Implementation Details

### Session Persistence
- User data stored in localStorage under `auth_user` key
- Session automatically restored on page refresh
- Invalid sessions are cleared
- Uses JSON serialization

### Updated Components

#### App.tsx
- Wrapped with `AuthProvider`
- Routes organized into protected and public sections
- Dashboard layout uses authenticated user data
- Conditional route rendering based on user role

#### AppHeader.tsx
- Removed role testing switcher
- Added user profile dropdown menu with logout
- Displays current username and role
- Logout button clears session and redirects to login

#### AppSidebar.tsx
- Filters menu items based on authenticated user role
- Types updated to use `UserRole` from AuthContext
- Maintains existing visual styling

## Usage

### For Users
1. Navigate to login page at `/login`
2. Enter email and password
3. Dashboard loads with role-appropriate features
4. Click user profile to access logout
5. After logout, redirected to login page

### For Developers

#### Using the useAuth Hook
```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Not logged in</div>;
  }
  
  return <div>Welcome, {user?.name}!</div>;
}
```

#### Checking Permissions
```typescript
import { hasAccessToRoute, isAdmin } from "@/lib/rolePermissions";

if (hasAccessToRoute(user.role, "/users")) {
  // User can access /users page
}

if (isAdmin(user.role)) {
  // User is admin
}
```

#### Protecting Routes
```typescript
import { ProtectedRoute } from "@/components/ProtectedRoute";

<Route path="/admin-only" element={<ProtectedRoute requiredRole="Admin"><AdminPage /></ProtectedRoute>} />
```

## Integration with Backend

To connect to a real backend, update the `login` method in `AuthContext.tsx`:

```typescript
const login = async (email: string, password: string): Promise<void> => {
  setIsLoading(true);
  try {
    // Replace mock logic with actual API call
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    const user = data.user;
    
    setUser(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
  } catch (error) {
    setUser(null);
    localStorage.removeItem('auth_user');
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

## Security Considerations

### Current Implementation (Development)
- Mock authentication with hardcoded users
- Session stored as plain JSON in localStorage
- No encryption of stored data

### For Production
- Implement JWT token-based authentication
- Use secure HTTP-only cookies
- Add CSRF protection
- Implement token refresh mechanism
- Add rate limiting on login attempts
- Encrypt sensitive data in localStorage
- Use HTTPS only
- Implement proper error handling without exposing sensitive info
- Add audit logging for authentication events

## File Structure
```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── components/
│   ├── ProtectedRoute.tsx       # Route protection wrapper
│   ├── AppHeader.tsx            # Updated with logout
│   └── AppSidebar.tsx           # Updated with auth context
├── pages/
│   ├── Login.tsx                # Login page
│   └── AccessDenied.tsx         # Access denied page
├── lib/
│   └── rolePermissions.ts       # Permission utilities
└── App.tsx                      # Updated with auth flow
```

## Testing the System

1. **Test Login Flow:**
   - Navigate to http://localhost:5173/login
   - Enter demo credentials
   - Verify dashboard loads

2. **Test Role-Based Access:**
   - Login as Worker - should not see Simulation or Users pages
   - Login as Manager - should see Simulation but not Users
   - Login as Admin - should see all pages

3. **Test Session Persistence:**
   - Login to application
   - Refresh page
   - Verify still logged in

4. **Test Logout:**
   - Click user profile dropdown
   - Click Sign Out
   - Verify redirected to login
   - Verify localStorage cleared

5. **Test Access Control:**
   - Login as Worker
   - Try to access /users or /simulation directly in URL
   - Verify redirected to /access-denied

## Future Enhancements

- Add password reset functionality
- Implement multi-factor authentication
- Add session timeout with warning
- Implement remember me functionality
- Add user profile edit page
- Add audit logging
- Implement role-based API access tokens
- Add social login / OAuth integration
