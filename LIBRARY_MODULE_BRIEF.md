# BioStackr Library Module - Development Brief

## Project Context
- **Framework**: Next.js 15.5.3 (App Router) with Supabase backend
- **Goal**: Replace basic "Files & Labs" with comprehensive "Library" module
- **Status**: Database foundation complete, need UI components and integration

## What's Already Built ✅

### Database Schema (COMPLETED)
- `database/library-schema.sql` - Complete table structure with RLS policies
- `database/library-storage-setup.sql` - Supabase storage bucket configuration
- `src/lib/actions/library.ts` - Full CRUD server actions

### Key Features Implemented:
- **Categories**: lab, assessment, training_plan, nutrition, wearable_report, mindfulness, recovery, other
- **Privacy**: Private by default, public toggle, download permissions
- **Featured Plans**: Single "Current Plan" badge for training plans
- **File Support**: PDF, images, CSV, DOCX with 20MB limit
- **Security**: Proper RLS policies, signed URLs for public access

## What Needs Building 🚧

### 1. Dashboard Integration
- Replace current "Files & Labs" card with "Library" module
- File upload with drag-and-drop
- Category detection and form prefill
- Grid/list view toggle

### 2. Core Components Needed
- `LibraryCard.tsx` - Individual item display
- `LibraryGrid.tsx` - Grid layout with filters
- `LibraryUploadForm.tsx` - Add/edit form with category selection
- `LibraryViewer.tsx` - Modal/standalone file viewer

### 3. Public Profile Integration
- Library section with category filters
- Featured "Current Plan" display
- Modal viewer with deep linking
- Signed URL proxy endpoints

### 4. Advanced Features
- PDF preview (react-pdf)
- Thumbnail generation
- Category filtering
- Search functionality

## Technical Specifications

### File Structure
```
src/components/library/
├── LibraryCard.tsx
├── LibraryGrid.tsx  
├── LibraryUploadForm.tsx
└── LibraryViewer.tsx

src/app/api/library/
├── [id]/preview/route.ts
└── [id]/download/route.ts
```

### Data Flow
1. **Upload**: File → Supabase Storage → Database record → UI update
2. **Public Access**: Request → RLS check → Signed URL → File delivery
3. **Privacy**: All files private by default, explicit public toggle required

## User Experience Goals
- **Dashboard**: "Library" replaces "Files & Labs" with modern upload UX
- **Public Profile**: Optional "Library" section with category filtering
- **Featured Plans**: Prominent "Current Plan" badge for training programs
- **Mobile**: Full responsive design with touch-friendly interactions

## Next Steps Priority
1. Build basic LibraryCard and LibraryGrid components
2. Create upload form with category selection
3. Replace dashboard "Files & Labs" with new Library module
4. Add public profile Library section
5. Implement modal viewer and deep linking

## Key Decisions Made
- Private by default for user trust
- Single featured training plan to avoid clutter
- Category-based organization for intuitive browsing
- Signed URLs for security without direct storage access
- "Library" terminology (not "Files & Labs") for premium feel
