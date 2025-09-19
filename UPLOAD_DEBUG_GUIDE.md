# Profile Photo Upload Debug Guide

## Issue: Profile photo upload not working

## Likely Causes & Solutions:

### 1. **Missing Environment Variables** (Most Likely)
The upload requires Supabase credentials to work. Create a `.env.local` file in the project root:

```bash
# Required Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Open Pages
```

### 2. **Test the Upload API**
After setting up environment variables, test the API:

```bash
# Test if API is accessible
curl -X GET http://localhost:3000/api/upload

# Test upload with a small image
curl -X POST http://localhost:3000/api/upload \
  -F "file=@public/next.svg" \
  -F "type=avatar"
```

### 3. **Check Browser Console**
When testing upload in the browser:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Try uploading a photo
4. Look for error messages

### 4. **Common Error Messages & Solutions**

#### "Server configuration error: Missing Supabase credentials"
- **Solution**: Set up `.env.local` file with proper Supabase credentials

#### "Unauthorized" (401 error)
- **Solution**: User not logged in or session expired

#### "Storage access failed" 
- **Solution**: Check Supabase project settings and RLS policies

#### "Network error during upload"
- **Solution**: Check if server is running on port 3000

### 5. **Test Mode Available**
A test endpoint is available at `/api/test-upload` that doesn't require Supabase:

```bash
curl -X POST http://localhost:3000/api/test-upload \
  -F "file=@public/next.svg" \
  -F "type=avatar"
```

### 6. **Debug Steps**
1. **Start server**: `npm run dev`
2. **Check API**: Visit `http://localhost:3000/api/upload` in browser
3. **Check console**: Look for detailed error messages
4. **Test with small file**: Try uploading a very small image first
5. **Check network tab**: See if request is being made and what response comes back

### 7. **Quick Fix for Testing**
To temporarily use test mode, modify `SettingsClient.tsx` line 318:
```typescript
// Change from:
xhr.open('POST', '/api/upload')

// To:
xhr.open('POST', '/api/test-upload')
```

This will allow testing the frontend functionality without Supabase setup.
