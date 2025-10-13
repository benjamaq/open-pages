# Elli Condition Capture Implementation

## 🎯 Overview
Added a personalized condition capture feature to the post-check-in modal, introducing "Elli" - BioStackr's empathetic AI assistant.

## ✅ What Was Implemented

### 1. **Database Schema** (`database/add-condition-fields.sql`)
Added three new columns to the `profiles` table:
- `condition_primary`: User's selected condition (e.g., "Chronic pain", "Fibromyalgia")
- `condition_details`: Optional free-text details about their condition
- `condition_provided_at`: Timestamp when condition was provided

### 2. **Database Functions** (`src/lib/db/userCondition.ts`)
Created server-side functions for condition management:
- `saveUserCondition()`: Saves user's condition to their profile
- `getUserCondition()`: Retrieves user's condition data
- `getUsersWithConditionCount()`: Gets count of users with similar conditions for community stats

### 3. **Updated Post-Check-In Modal** (`src/components/onboarding/post-checkin-modal.tsx`)
Complete redesign with Elli's personality:

#### **Elli's Welcome Message**
- 💙 Warm, empathetic introduction
- Pain-aware messaging based on user's first check-in
- Typing animation (1.5 second delay with bouncing dots)
- Personalized messages:
  - Pain >= 7: "That's brutal, and I'm sorry you're going through this..."
  - Pain 4-6: "Managing, but not easy..."
  - Pain 1-3: "I'll watch what's different..."

#### **Condition Capture Section**
- **Quick-select buttons** (7 conditions):
  - Chronic pain
  - Fibromyalgia
  - CFS / ME
  - Autoimmune condition
  - ADHD
  - Perimenopause
  - Other / Not sure

- **Optional details field**: Free-text input (200 char limit)
- **Skip option**: Users can skip without providing condition
- **Visual feedback**: Selected button highlights in purple
- **Non-blocking**: If save fails, user flow continues

#### **Updated Footer**
- "Now let's add what you're taking so I can watch for patterns."
- "Tomorrow takes 10 seconds. Same 3 sliders."
- Button text: "Add What You're Taking →"

### 4. **Updated Components**
Updated to pass `userName` to Elli for personalization:
- `EnhancedDayDrawerV2`: Added optional `userName` prop
- `DashboardClient`: Passes `profile.display_name`
- `OnboardingModal`: Passes `userProfile.display_name`

## 🎨 Design Highlights

### Visual Flow
```
┌─────────────────────────────────────────┐
│           💙 Elli Avatar                │
│                                         │
│      Hi [UserName], I'm Elli 💙        │
│                                         │
│   [Typing animation or message]        │
├─────────────────────────────────────────┤
│ Mind if I ask - what brings you here?  │
│                                         │
│  [Chronic pain] [Fibromyalgia]        │
│  [CFS / ME]     [Autoimmune]          │
│  [ADHD]         [Perimenopause]       │
│  [Other / Not sure]                   │
│                                         │
│  Want to add more details? (optional)  │
│  [_____________________________]       │
│                                         │
│         [Skip for now]                  │
├─────────────────────────────────────────┤
│ [Timeline, Pain Insight, Community]    │
│                                         │
│     Now let's add what you're taking   │
│     so I can watch for patterns.       │
│                                         │
│    [Add What You're Taking →]          │
└─────────────────────────────────────────┘
```

### Color Scheme
- **Elli's color**: 💙 Blue (#6366F1 indigo gradient)
- **Selected condition**: Purple (#A855F7)
- **Typography**: Warm, conversational tone
- **Spacing**: Generous padding for easy tap targets

## 📊 User Flow

1. **User completes first check-in**
2. **Elli appears with typing animation** (1.5s)
3. **Personalized welcome based on pain level**
4. **Condition question appears** with quick-select buttons
5. **User selects condition** (optional)
6. **User adds details** (optional)
7. **OR skips entirely**
8. **Condition saved to profile** (if provided)
9. **User proceeds to "Add Supplement"** step

## 🔧 Technical Notes

- **Non-blocking saves**: If condition save fails, user flow continues
- **Graceful fallbacks**: Default userName is "User" if not provided
- **Server-side security**: All database operations use server-side functions
- **Type-safe**: Full TypeScript types for all new interfaces
- **Responsive**: Works on mobile and desktop

## 🚀 Next Steps

To enable this feature:

1. **Run database migration**:
   ```sql
   -- Execute in Supabase SQL Editor
   \i database/add-condition-fields.sql
   ```

2. **Test the flow**:
   - Create a new account
   - Complete first check-in
   - Verify Elli appears with typing animation
   - Select a condition
   - Check that condition is saved to profile

3. **Future AI Integration**:
   - Use `condition_primary` to personalize Elli's insights
   - Filter community stats by condition
   - Generate condition-specific recommendations
   - Build condition-based cohorts for pattern detection

## 📝 Files Changed

- ✅ `database/add-condition-fields.sql` (new)
- ✅ `src/lib/db/userCondition.ts` (new)
- ✅ `src/components/onboarding/post-checkin-modal.tsx` (updated)
- ✅ `src/app/components/mood/EnhancedDayDrawerV2.tsx` (updated)
- ✅ `src/app/dash/DashboardClient.tsx` (updated)
- ✅ `src/components/OnboardingModal.tsx` (updated)

## 🎯 Success Metrics to Track

- **Condition capture rate**: % of users who select a condition
- **Skip rate**: % of users who click "Skip for now"
- **Detail completion rate**: % who add optional details
- **Most common conditions**: Which buttons are clicked most
- **Time to complete**: How long users spend on this step

---

**Status**: ✅ Implementation complete, ready for database migration and testing

