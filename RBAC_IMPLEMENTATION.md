# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for TripConnect. The system includes user management capabilities across web, mobile, and backend platforms.

## Features Implemented

### Backend (Node.js/Express/Prisma)

#### Controllers
- **`userController.ts`** - Handles all user management operations
  - `getUsers()` - Fetch all users with statistics
  - `getUser(id)` - Get single user details
  - `updateUserRole(id, role)` - Update user role (USER/ADMIN)
  - `updateUser(id, data)` - Update user profile information
  - `deleteUser(id)` - Delete user account
  - `getUserStats()` - Get user statistics (total, admin, regular, recent)

#### Routes
- **`/api/users`** - User management endpoints (Admin only)
  - `GET /` - List all users
  - `GET /stats` - Get user statistics
  - `GET /:id` - Get user by ID
  - `PUT /:id/role` - Update user role
  - `PUT /:id` - Update user profile
  - `DELETE /:id` - Delete user

#### Security Features
- All routes require authentication
- All routes require ADMIN role via `requireAdmin` middleware
- Users cannot delete themselves
- Users cannot demote themselves from admin
- Email and username uniqueness validation
- Cascade deletion of related data

### Frontend (React/TypeScript)

#### Pages
- **`Users.tsx`** - Main user management page
  - User statistics dashboard (Total, Admins, Regular, Recent)
  - User listing with search and filters
  - Role management (promote/demote)
  - User editing (name, email, username, role)
  - User deletion with confirmation
  - Activity tracking (contacts, groups, messages)
  - Network error handling with DelightfulError component

#### Navigation
- Added "Users" link to sidebar (admin-only)
- Uses `UsersIcon` from Heroicons
- Protected by `AdminRoute` component
- Only visible to admin users

#### API Services
- **`userService`** in `services/index.ts`
  - `getAll()` - Fetch all users
  - `getById(id)` - Get user details
  - `updateRole(id, role)` - Update role
  - `update(id, data)` - Update profile
  - `delete(id)` - Delete user
  - `getStats()` - Get statistics

### Mobile (React Native/TypeScript)

#### Screens
- **`UsersScreen.tsx`** - User list with statistics
  - Statistics cards (Total, Admins, Users, Recent)
  - User cards with avatars and role badges
  - Quick actions (toggle role, delete)
  - Pull-to-refresh support
  - Network error handling
  
- **`UserDetailScreen.tsx`** - Detailed user view
  - User profile information
  - Activity statistics grid
  - Account details (joined date, last updated)
  - Role management actions
  - Delete user functionality

#### Navigation
- Added "Users" tab to bottom navigation (admin-only)
- Uses `account-cog` icon
- Navigation stack includes Users and UserDetail screens
- Conditional rendering based on admin status

#### API Services
- Extended `apiService` in `api.ts`
  - `getUsers()` - List all users
  - `getUser(id)` - Get user details
  - `updateUserRole(id, role)` - Change role
  - `updateUser(id, data)` - Update profile
  - `deleteUser(id)` - Remove user
  - `getUserStats()` - Fetch statistics

## User Roles

### USER (Default)
- Can access:
  - Dashboard
  - Groups (view, create, manage own groups)
  - Messages (within groups)
  - Expenses (within groups)
  - Itinerary (within groups)

### ADMIN
- All USER permissions, plus:
  - Contacts management (full CRUD)
  - Tags management (full CRUD)
  - Lists management (full CRUD)
  - User management (view, edit, delete, role changes)
  - Group management (all groups, not just own)

## Access Control Flow

```
User Request
    ↓
Authentication Middleware (checks JWT token)
    ↓
Authorization Middleware (checks role)
    ↓
Admin Required? → Yes → Check if role === 'ADMIN'
    ↓                           ↓
    No                      Yes → Allow
    ↓                           ↓
Allow                       No → 403 Forbidden
```

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  firstName String
  lastName  String
  avatar    String?
  role      Role     @default(USER)  // USER or ADMIN
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations...
}

enum Role {
  USER
  ADMIN
}
```

## API Endpoints Summary

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | /api/users | List all users | Yes | ADMIN |
| GET | /api/users/stats | Get statistics | Yes | ADMIN |
| GET | /api/users/:id | Get user details | Yes | ADMIN |
| PUT | /api/users/:id/role | Update user role | Yes | ADMIN |
| PUT | /api/users/:id | Update user profile | Yes | ADMIN |
| DELETE | /api/users/:id | Delete user | Yes | ADMIN |

## Usage Examples

### Promoting a User to Admin (Backend)
```typescript
PUT /api/users/{userId}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "ADMIN"
}
```

### Getting User Statistics (Frontend)
```typescript
import { userService } from '../services';

const stats = await userService.getStats();
// Returns: { totalUsers, adminUsers, regularUsers, recentUsers }
```

### Deleting a User (Mobile)
```typescript
import { apiService } from '../services/api';

await apiService.deleteUser(userId);
// Cascades deletion to contacts, groups, messages, etc.
```

## Security Considerations

1. **Self-Protection**
   - Users cannot delete themselves
   - Users cannot demote themselves from admin
   - Prevents accidental lockout

2. **Validation**
   - Email uniqueness enforced
   - Username uniqueness enforced
   - Role enum validation (only USER or ADMIN)

3. **Cascade Deletion**
   - When a user is deleted, all related data is removed:
     - Contacts created by user
     - Trip groups created by user
     - Messages sent by user
     - Group memberships

4. **Error Handling**
   - Network errors handled gracefully
   - User-friendly error messages
   - 403 errors handled silently (redirects handled by route guards)

## UI/UX Features

### Frontend
- Statistics dashboard with color-coded cards
- Role badges with icons (shield for admin, user icon for regular)
- Inline editing modals
- Confirmation dialogs for destructive actions
- Activity tracking (contacts, groups, messages count)
- Responsive table design
- "You" indicator for current user

### Mobile
- Statistics cards with icons
- Swipeable user cards
- Pull-to-refresh functionality
- Role toggle with confirmation alerts
- Material icons throughout
- Native alert dialogs
- Activity statistics grid

## Testing the Implementation

### As an Admin:
1. Login with admin credentials
2. Navigate to "Users" page/tab
3. View user statistics
4. Edit user information
5. Promote/demote users
6. Delete users (except yourself)

### As a Regular User:
1. Login with regular user credentials
2. Verify "Users" page/tab is not visible
3. Direct navigation to `/users` should redirect (web) or not be accessible (mobile)

## Future Enhancements

1. **Additional Roles**
   - Add MODERATOR role
   - Add VIEWER role (read-only)

2. **Granular Permissions**
   - Per-feature permissions
   - Custom permission sets

3. **Audit Logging**
   - Track role changes
   - Log user deletions
   - Monitor admin actions

4. **Bulk Operations**
   - Bulk role updates
   - Bulk user imports
   - Batch deletions

5. **User Search & Filters**
   - Search by name, email, username
   - Filter by role
   - Sort by join date, activity

## Files Modified/Created

### Backend
- ✅ `backend/src/controllers/userController.ts` (new)
- ✅ `backend/src/routes/users.ts` (new)
- ✅ `backend/src/server.ts` (modified - added route)

### Frontend
- ✅ `frontend/src/pages/Users.tsx` (new)
- ✅ `frontend/src/services/index.ts` (modified - added userService)
- ✅ `frontend/src/types/index.ts` (modified - added _count to User)
- ✅ `frontend/src/App.tsx` (modified - added route)
- ✅ `frontend/src/components/Layout.tsx` (modified - added nav item)

### Mobile
- ✅ `mobile/src/screens/users/UsersScreen.tsx` (new)
- ✅ `mobile/src/screens/users/UserDetailScreen.tsx` (new)
- ✅ `mobile/src/services/api.ts` (modified - added user methods)
- ✅ `mobile/src/types/index.ts` (modified - added UserStats, _count)
- ✅ `mobile/src/navigation/MainNavigator.tsx` (modified - added stack & tab)

## Conclusion

The RBAC system is now fully implemented across all platforms with comprehensive user management capabilities. Admin users can manage all aspects of user accounts including viewing, editing, role management, and deletion. The system includes proper security measures, error handling, and user-friendly interfaces.
