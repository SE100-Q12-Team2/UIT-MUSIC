# User Module - UIT Music Streaming System

## 📁 Module Structure

```
user/
├── user.module.ts       # Module definition
├── user.controller.ts   # REST API endpoints
├── user.service.ts      # Business logic
├── user.repo.ts         # Database operations
├── user.model.ts        # Zod schemas & types
├── user.dto.ts          # Data Transfer Objects
└── user.error.ts        # Custom exceptions
```

## 🎯 Implemented Features

### 1. **Get Users List** (GET /users)

- ✅ Pagination support (page, limit)
- ✅ Filter by role (Listener, Label, Admin)
- ✅ Filter by status (Active, Inactive, Suspended, Banned)
- ✅ Search by email or full name
- ✅ Public endpoint (no auth required)
- ✅ Ordered by creation date (newest first)

**Query Parameters:**

```typescript
{
  page?: number = 1
  limit?: number = 10
  role?: 'Listener' | 'Label' | 'Admin'
  status?: 'Active' | 'Inactive' | 'Suspended' | 'Banned'
  search?: string
}
```

### 2. **Get User by ID** (GET /users/:id)

- ✅ Get user basic information
- ✅ Public endpoint
- ✅ Exclude sensitive data
- ✅ 404 if user not found

**Response:**

```typescript
{
  ;(id, email, fullName, dateOfBirth, gender, accountStatus, roleId, createdAt, updatedAt)
}
```

### 3. **Get User Detail** (GET /users/:id/detail)

- ✅ Get user with role information
- ✅ Admin only access
- ✅ Include role permissions
- ✅ JWT authentication required

**Response:**

```typescript
{
  ...UserData,
  role: {
    id, name, description
  }
}
```

### 4. **Update User** (PATCH /users/:id)

- ✅ Update basic user information
- ✅ Admin only access
- ✅ Partial updates supported
- ✅ Clear cache after update

**Updatable Fields:**

```typescript
{
  fullName?: string
  dateOfBirth?: Date
  gender?: 'Male' | 'Female' | 'Other'
}
```

### 5. **Update User Status** (PATCH /users/:id/status)

- ✅ Change account status
- ✅ Admin only access
- ✅ Supports: Active, Inactive, Suspended, Banned
- ✅ Clear cache after update

### 6. **Update User Role** (PATCH /users/:id/role)

- ✅ Change user role
- ✅ Admin only access
- ✅ Validate roleId exists
- ✅ Clear cache after update

### 7. **Delete User** (DELETE /users/:id)

- ✅ Soft delete (set deletedAt timestamp)
- ✅ Admin only access
- ✅ Prevent self-deletion
- ✅ Clear cache after deletion
- ✅ Track deleter (deletedById)

### 8. **Get User Statistics** (GET /users/:id/statistics)

- ✅ Total playlists created
- ✅ Total favorites
- ✅ Total follows
- ✅ Total listening hours
- ✅ Active subscription status
- ✅ Admin only access

**Response:**

```typescript
{
  totalPlaylists: number
  totalFavorites: number
  totalFollows: number
  totalListeningHours: number
  activeSubscription: boolean
}
```

## 🔐 Security & Authorization

### Authentication Types

- **None**: Public endpoints (getUsers, getUserById)
- **Bearer**: Protected endpoints (Admin only)

### Role-Based Access

- **Admin**: Full access to all endpoints
- **Public**: Read-only access to basic user info

### Protected Operations

- Prevent self-deletion
- Admin-only modifications
- Soft delete preserves data integrity

## 📊 Data Models

### User Schema

```typescript
{
  id: number
  email: string (email format)
  fullName: string (1-255 chars)
  dateOfBirth?: Date
  gender?: 'Male' | 'Female' | 'Other'
  accountStatus: 'Active' | 'Inactive' | 'Suspended' | 'Banned'
  roleId: number
  createdById?: number
  updatedById?: number
  deletedById?: number
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Account Statuses

- **Active**: Normal user account
- **Inactive**: Temporarily disabled
- **Suspended**: Under review/violation
- **Banned**: Permanently disabled

### User Roles

- **Listener**: Regular user (stream music)
- **Label**: Record label (upload content)
- **Admin**: System administrator

## 🔄 Cache Strategy

- Cache key pattern: `user:{userId}`
- Invalidation on:
  - User update
  - Status change
  - Role change
  - User deletion

## 🚨 Error Handling

### Custom Exceptions

- `UserNotFoundException`: User ID not found
- `CannotDeleteSelfException`: Attempting self-deletion
- `InvalidUserStatusException`: Invalid status value
- `InvalidUserRoleException`: Invalid role assignment

### HTTP Status Codes

- `200`: Success
- `404`: User not found
- `403`: Forbidden (self-deletion, unauthorized)
- `422`: Unprocessable entity (validation error)

## 📝 API Endpoints Summary

| Method | Endpoint              | Auth   | Role   | Description                 |
| ------ | --------------------- | ------ | ------ | --------------------------- |
| GET    | /users                | None   | Public | Get users list with filters |
| GET    | /users/:id            | None   | Public | Get user basic info         |
| GET    | /users/:id/detail     | Bearer | Admin  | Get user with role details  |
| PATCH  | /users/:id            | Bearer | Admin  | Update user info            |
| PATCH  | /users/:id/status     | Bearer | Admin  | Update account status       |
| PATCH  | /users/:id/role       | Bearer | Admin  | Update user role            |
| DELETE | /users/:id            | Bearer | Admin  | Delete user (soft)          |
| GET    | /users/:id/statistics | Bearer | Admin  | Get user statistics         |

## 🔗 Dependencies

### Internal Services

- `UserRepository`: Database operations
- `PrismaService`: Database client
- `CACHE_MANAGER`: Redis caching

### External Packages

- `@nestjs/common`: NestJS core
- `@nestjs/cache-manager`: Caching
- `nestjs-zod`: Zod integration
- `cache-manager`: Cache interface
- `@prisma/client`: Prisma ORM

## 🎨 Code Quality Features

1. ✅ **Type Safety**: Full TypeScript with Zod schemas
2. ✅ **Separation of Concerns**: Controller → Service → Repository
3. ✅ **Error Handling**: Try-catch with specific exceptions
4. ✅ **Validation**: Automatic request validation via Zod
5. ✅ **Caching**: Redis integration for performance
6. ✅ **Audit Trail**: Track who created/updated/deleted
7. ✅ **Soft Delete**: Preserve data with deletedAt
8. ✅ **Search & Filters**: Advanced query capabilities
9. ✅ **Statistics**: Comprehensive user metrics

## 🧪 Testing Recommendations

### Unit Tests

- [ ] Get users with various filters
- [ ] Update user with valid/invalid data
- [ ] Delete user authorization checks
- [ ] Self-deletion prevention
- [ ] Cache invalidation
- [ ] Statistics calculation

### Integration Tests

- [ ] Full CRUD workflow
- [ ] Role-based access scenarios
- [ ] Error handling flows
- [ ] Pagination edge cases
- [ ] Search functionality

## 📈 Future Enhancements

1. **Email Notifications**: On status/role changes
2. **Bulk Operations**: Bulk user import/export
3. **Advanced Analytics**: Detailed listening patterns
4. **User Preferences**: Customizable settings
5. **Activity Logs**: Track all user actions
6. **2FA Support**: Two-factor authentication
7. **Profile Pictures**: Avatar upload/management
8. **Social Features**: Followers, friends, etc.

## 📚 Related Modules

- `auth`: Authentication & registration
- `role`: Role management
- `permission`: Permission management
- `profile`: User self-service profile updates
- `playlist`: User playlists
- `favorite`: User favorites
- `follow`: User following system

---

**Status**: ✅ Production Ready
**Last Updated**: November 11, 2025
**Project**: UIT Music Streaming System
