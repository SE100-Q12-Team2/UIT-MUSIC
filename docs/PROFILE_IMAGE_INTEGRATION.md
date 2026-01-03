# Profile Image Upload Integration Example

## Overview

This document shows how the profile service can integrate with the new image upload functionality.

## Option 1: Client Handles Upload (Recommended)

The client is responsible for:

1. Getting the presigned URL
2. Uploading to S3
3. Updating the profile with the public URL

### Client Flow

```typescript
// 1. User selects an image
const file = event.target.files[0]

// 2. Request presigned URL
const presignRes = await fetch('/upload/image/presigned-url', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    resource: 'avatars',
    fileName: file.name,
    contentType: file.type,
  }),
})

const { presignedUrl, publicUrl } = await presignRes.json()

// 3. Upload directly to S3
await fetch(presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file,
})

// 4. Update profile
await fetch('/profile', {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    profileImage: publicUrl,
  }),
})
```

## Option 2: Server-Side Upload

If you need to process the image on the server (resize, validate, etc.), you can extend the profile service:

### Add to profile.service.ts

```typescript
import { UploadService } from 'src/routes/upload/upload.service'

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService, // Inject UploadService
  ) {}

  async uploadProfileImage(userId: number, fileName: string) {
    // Generate presigned URL
    const uploadData = await this.uploadService.generateImageUploadUrl({ resource: 'avatars', fileName }, userId)

    // Return the presigned URL to client
    return uploadData
  }

  async updateProfileImage(userId: number, publicUrl: string) {
    // Validate the URL is from our S3 bucket
    if (!publicUrl.includes(envConfig.S3_BUCKET_NAME)) {
      throw new BadRequestException('Invalid image URL')
    }

    // Update user profile
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: publicUrl },
    })
  }
}
```

### Add to profile.controller.ts

```typescript
@Post('avatar/presign')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Get presigned URL for avatar upload' })
uploadAvatar(
  @ActiveUser('userId') userId: number,
  @Body() body: { fileName: string }
) {
  return this.profileService.uploadProfileImage(userId, body.fileName)
}
```

## Current Profile Update Endpoint

The existing `PATCH /profile` endpoint already supports updating `profileImage`:

```typescript
// Request
PATCH /profile
{
  "profileImage": "https://your-bucket.s3.amazonaws.com/dev/app/avatars/123/original-abc123.jpg"
}

// Response
{
  "id": 123,
  "email": "user@example.com",
  "fullName": "John Doe",
  "profileImage": "https://your-bucket.s3.amazonaws.com/dev/app/avatars/123/original-abc123.jpg",
  ...
}
```

## Complete React Component Example

```typescript
import React, { useState } from 'react'
import { useImageUpload } from './hooks/useImageUpload'

export function AvatarUpload({ currentImage, onSuccess }) {
  const { uploadImage, uploading, error } = useImageUpload()
  const [preview, setPreview] = useState(currentImage)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, GIF, or WebP')
      return
    }

    try {
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      // Upload to S3
      const publicUrl = await uploadImage(file, 'avatars')

      // Update profile
      const response = await fetch('/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileImage: publicUrl })
      })

      if (response.ok) {
        onSuccess?.(publicUrl)
        alert('Avatar updated successfully!')
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload avatar')
    }
  }

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {preview ? (
          <img src={preview} alt="Avatar" />
        ) : (
          <div className="placeholder">No image</div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {uploading && <p>Uploading...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

## Migration Notes

If you have existing profile images stored elsewhere:

1. Keep the old images accessible during migration
2. Update the `profileImage` field to accept both old and new URLs
3. Add a migration script to move existing images to S3
4. Gradually phase out the old storage system

## Security Considerations

1. **Always validate on the server**: Even though we validate on upload, always verify the URL before saving to database
2. **Sanitize URLs**: Ensure URLs don't contain malicious content
3. **Rate limiting**: Consider adding rate limits to prevent abuse
4. **File size limits**: Implement both client and S3 bucket size limits
5. **Virus scanning**: For production, consider integrating antivirus scanning

## Performance Tips

1. **Use WebP format**: Better compression, smaller file sizes
2. **Compress before upload**: Use client-side libraries like `browser-image-compression`
3. **Generate thumbnails**: Create multiple sizes for different use cases
4. **Use CloudFront**: Enable CDN for faster delivery
5. **Lazy loading**: Load images only when needed

## Testing

```bash
# Test presigned URL generation
curl -X POST http://localhost:3000/upload/image/presigned-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resource":"avatars","fileName":"test.jpg"}'

# Test profile update
curl -X PATCH http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileImage":"https://your-bucket.s3.amazonaws.com/test.jpg"}'
```
