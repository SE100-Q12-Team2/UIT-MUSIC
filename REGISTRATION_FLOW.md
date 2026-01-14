# Registration Flow - Company & Individual Label Support

## Overview
The registration system has been enhanced to support multiple user types during sign-up:
- **Listener**: Regular users who stream music
- **Label**: Record labels or artists who can upload music
  - **Individual Artist**: Solo artists who upload their own music
  - **Company Label**: Companies that can manage multiple artists

## Backend Changes

### 1. Auth Schema (`auth.model.ts`)
Added new fields to `RegisterBodySchema`:
```typescript
{
  role: z.enum(['Listener', 'Label']).default('Listener'),
  labelType: z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
  labelName: z.string().min(1).max(255).optional()
}
```

**Validation Rules:**
- If `role` is 'Label', both `labelType` and `labelName` are required
- If `role` is 'Listener', `labelType` and `labelName` are ignored

### 2. Auth Repository (`auth.repo.ts`)
- Updated `createUser()` to exclude new fields from user creation
- Added `createRecordLabel()` method to automatically create label entry

```typescript
async createRecordLabel(data: { 
  userId: number; 
  labelName: string; 
  labelType: 'INDIVIDUAL' | 'COMPANY' 
})
```

### 3. Shared Role Repository (`shared-role.repo.ts`)
- Added `getLabelRoleId()` method to fetch Label role ID

### 4. Auth Service (`auth.service.ts`)
Updated `register()` flow:
1. Validate OTP code
2. Determine role ID (Listener or Label)
3. Create user with selected role
4. If role is 'Label', automatically create RecordLabel entry

## Frontend Changes

### 1. Auth Types (`auth.types.ts`)
```typescript
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  code: string;
  role?: 'Listener' | 'Label';
  labelType?: 'INDIVIDUAL' | 'COMPANY';
  labelName?: string;
}
```

### 2. Auth Schema (`auth.schema.ts`)
- Added `role`, `labelType`, `labelName` to `signUpFormSchema`
- Added conditional validation: labelType and labelName required when role is 'Label'

### 3. Signup Form Hook (`useSignupForm.ts`)
- Updated default values to include new fields
- Updated `onSubmit` to send role, labelType, and labelName to API

### 4. Signup Page (`SignUpPage.tsx`)
Enhanced UI with:
- **Role Selection**: Radio buttons for "Listener" or "Record Label / Artist"
- **Conditional Fields**: When "Label" is selected, show:
  - Label/Artist Name input field
  - Label Type radio buttons: "Individual Artist" or "Company / Label"

## User Flow

### Listener Registration
1. User fills in: Full Name, Email, Password
2. User selects "Listener" role (default)
3. User receives and enters OTP code
4. User clicks "Sign Up"
5. System creates User account with Listener role

### Individual Artist Registration
1. User fills in: Full Name, Email, Password
2. User selects "Record Label / Artist" role
3. User enters Label/Artist Name
4. User selects "Individual Artist" label type
5. User receives and enters OTP code
6. User clicks "Sign Up"
7. System creates:
   - User account with Label role
   - RecordLabel entry with type INDIVIDUAL

### Company Label Registration
1. User fills in: Full Name, Email, Password
2. User selects "Record Label / Artist" role
3. User enters Company/Label Name
4. User selects "Company / Label" label type
5. User receives and enters OTP code
6. User clicks "Sign Up"
7. System creates:
   - User account with Label role
   - RecordLabel entry with type COMPANY

## Database Schema

### User Table
- Has `roleId` foreign key to Role table
- Role can be: Listener, Label, or Admin

### RecordLabel Table
- Has `userId` unique foreign key to User table (one-to-one)
- Has `labelType` enum: INDIVIDUAL or COMPANY
- Has `labelName` varchar(255)
- Has `parentLabelId` for artist-company relationship

## API Endpoint

### POST /auth/register
**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "code": "123456",
  "role": "Label",
  "labelType": "COMPANY",
  "labelName": "Acme Records"
}
```

**Response:**
```json
{
  "id": 123,
  "email": "john@example.com",
  "fullName": "John Doe",
  "roleId": 2,
  "accountStatus": "Active",
  "createdAt": "2026-01-14T10:30:00Z",
  "updatedAt": "2026-01-14T10:30:00Z"
}
```

## Benefits

1. **Streamlined Onboarding**: Users can register with correct role from the start
2. **Automatic Label Creation**: No need for separate label setup step
3. **Clear User Intent**: System knows user purpose from registration
4. **Better UX**: Company labels can immediately start managing artists

## Next Steps

After registration:
- **Individual Artists**: Can go to Label Dashboard and start uploading songs
- **Company Labels**: Can go to Artists Management page to add artists to their roster
- **Listeners**: Can browse and play music

## Testing

To test the new registration flow:

1. **Test Listener Registration**:
   - Leave role as default "Listener"
   - Complete registration
   - Verify no RecordLabel is created

2. **Test Individual Artist Registration**:
   - Select "Record Label / Artist"
   - Enter artist name
   - Select "Individual Artist"
   - Complete registration
   - Verify RecordLabel with type INDIVIDUAL is created

3. **Test Company Registration**:
   - Select "Record Label / Artist"
   - Enter company name
   - Select "Company / Label"
   - Complete registration
   - Verify RecordLabel with type COMPANY is created

4. **Test Validation**:
   - Try submitting with "Label" role but no label name (should fail)
   - Try submitting with "Label" role but no label type (should fail)
