# AWS S3 Image Upload Guide

## Overview

This application now includes comprehensive AWS S3 image upload functionality. Users can upload images (avatars, covers, etc.) directly to S3 using presigned URLs.

## Architecture

The upload system uses **presigned URLs** for security and performance:

1. Client requests a presigned URL from the backend
2. Backend generates a temporary upload URL (expires in 1 hour)
3. Client uploads the file directly to S3 using the presigned URL
4. Client updates their profile with the public URL

## API Endpoints

### 1. Generate Presigned URL for General Upload

**Endpoint:** `POST /upload/presigned-url`

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "resource": "uploads", // "uploads" | "products" | "categories" | "avatars"
  "entityId": "123", // Optional: user ID, product ID, etc.
  "fileName": "my-image.jpg", // Required: file name with extension
  "contentType": "image/jpeg", // Optional: MIME type
  "variant": "original" // Optional: "original" | "thumb-256" | "large-1024"
}
```

**Response:**

```json
{
  "ok": true,
  "presignedUrl": "https://s3.amazonaws.com/...",
  "bucket": "your-bucket-name",
  "key": "dev/app/uploads/123/original-abc123.jpg",
  "publicUrl": "https://your-cdn.com/dev/app/uploads/123/original-abc123.jpg",
  "contentType": "image/jpeg",
  "expiresIn": 3600
}
```

### 2. Generate Presigned URL for Image Upload (Validated)

**Endpoint:** `POST /upload/image/presigned-url`

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "resource": "avatars", // Resource type
  "entityId": "123", // Optional: defaults to current user ID
  "fileName": "avatar.png", // Must be valid image extension
  "contentType": "image/png" // Optional
}
```

**Allowed Image Extensions:** jpg, jpeg, png, gif, webp, bmp, svg

**Response:** Same as general upload endpoint

## Usage Examples

### Frontend: Upload Avatar

```typescript
// Step 1: Request presigned URL
const response = await fetch('/upload/image/presigned-url', {
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

const { presignedUrl, publicUrl } = await response.json()

// Step 2: Upload file to S3
await fetch(presignedUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': file.type,
  },
  body: file,
})

// Step 3: Update profile with public URL
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

### Frontend: React Hook Example

```typescript
import { useState } from 'react'

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = async (file: File, resource: string = 'avatars') => {
    setUploading(true)
    setError(null)

    try {
      // Get presigned URL
      const presignResponse = await fetch('/upload/image/presigned-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource,
          fileName: file.name,
          contentType: file.type,
        }),
      })

      if (!presignResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { presignedUrl, publicUrl } = await presignResponse.json()

      // Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      return publicUrl
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  return { uploadImage, uploading, error }
}
```

### cURL Example

```bash
# Step 1: Get presigned URL
curl -X POST http://localhost:3000/upload/image/presigned-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "avatars",
    "fileName": "avatar.jpg",
    "contentType": "image/jpeg"
  }'

# Step 2: Upload to S3 (use the presignedUrl from step 1)
curl -X PUT "PRESIGNED_URL_FROM_STEP_1" \
  -H "Content-Type: image/jpeg" \
  --data-binary @avatar.jpg

# Step 3: Update profile
curl -X PATCH http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profileImage": "PUBLIC_URL_FROM_STEP_1"
  }'
```

## Resource Types

- **uploads**: General uploads
- **avatars**: User profile images
- **products**: Product images
- **categories**: Category images

## S3 Key Structure

Keys are automatically generated with this structure:

```
{environment}/{tenant}/{resource}/{entityId}/{variant}-{uuid}.{ext}
```

Example:

```
dev/app/avatars/123/original-abc12345.jpg
prod/app/products/456/thumb-256-def67890.png
```

## Environment Variables

Make sure these are configured in your `.env` file:

```env
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Optional: CloudFront domain for CDN
CF_DOMAIN=your-cdn-domain.cloudfront.net
```

## Security Features

1. **Authentication Required**: All upload endpoints require JWT authentication
2. **Presigned URLs**: Temporary URLs that expire after 1 hour
3. **File Type Validation**: Image endpoint only allows image file extensions
4. **User Scoping**: Files are automatically scoped to the authenticated user

## File Size Limits

- Maximum file size is controlled by your S3 bucket configuration
- Recommended client-side limit: 5MB for images
- Consider implementing client-side image compression before upload

## Best Practices

1. **Compress images** before uploading to reduce storage costs
2. **Use WebP format** when possible for better compression
3. **Implement progress indicators** for better UX
4. **Handle errors gracefully** with retry logic
5. **Validate file types** on the client side before requesting presigned URL

## Troubleshooting

### "Invalid image file extension" Error

- Ensure the file has a valid image extension (jpg, jpeg, png, gif, webp, bmp, svg)
- Check that the fileName includes the extension

### Upload to S3 Fails

- Verify the presigned URL hasn't expired (1 hour limit)
- Ensure the Content-Type header matches what was specified
- Check your AWS credentials and bucket permissions

### Public URL Not Working

- Verify your S3 bucket allows public read access
- Check CloudFront distribution if using CDN
- Ensure the key path is correct

## Support

For issues or questions, please contact the development team or check the API documentation at `/api-docs`.
