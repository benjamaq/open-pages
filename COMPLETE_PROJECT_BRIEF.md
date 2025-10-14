# BioStackr Project - Complete Development Brief

## What is BioStackr?

BioStackr is a comprehensive health tracking and biohacking platform that allows users to:
- Track daily mood, sleep, pain, and other health metrics
- Manage supplement stacks and protocols
- Monitor wearable device data (Oura Ring, Whoop, etc.)
- Share public profiles with doctors, friends, or on social media
- Follow other users' health journeys
- Access a library of supplements, protocols, and health information

**Tech Stack:**
- Next.js 14 (App Router)
- Supabase (PostgreSQL database + Auth)
- TypeScript
- Tailwind CSS
- Resend (email service)
- Vercel (hosting)

## Current Project Status

The platform is **fully functional** with:
- ✅ User authentication and onboarding
- ✅ Daily check-ins and mood tracking
- ✅ Public profile sharing
- ✅ Stack management (supplements, protocols, devices)
- ✅ Library system
- ✅ Email notifications (welcome emails)
- ✅ Follower system
- ✅ Heatmap visualization for mood/sleep/pain data

## The Current Challenge: Demo Accounts

We're trying to create **pre-populated demo accounts** to showcase different health journeys for marketing and user education purposes. These accounts should appear as "real users" with:

1. **Realistic profiles** (names, photos, bios)
2. **Complete supplement stacks** (20+ items)
3. **Historical mood data** (2+ months of daily entries)
4. **Journal entries** (meaningful, authentic content)
5. **Follower relationships** (40+ followers)
6. **Public profiles** that demonstrate the platform's value

## The Specific Problem: Emma's Heatmap

We've been stuck for **HOURS** trying to fix one demo account's heatmap display. Here's the situation:

### What Should Happen
Emma's heatmap should show a **chronic pain recovery journey**:
- **September 1-24**: Red/Orange colors (high pain, mood 2-4, pain 7-9)
- **September 25-29**: Yellow colors (improving, mood 5-8, pain 3-6) 
- **September 30+**: Green colors (recovered, mood 8, pain 2)

### Current State
- ✅ Database has correct data for September 1-29
- ✅ September 29th shows varied colors correctly (mood 7, pain 3, sleep 8)
- ✅ Whoop data displays properly
- ❌ **September 30th and October dates are missing from the heatmap**
- ❌ The heatmap stops at September 29th instead of showing the green progression

### Technical Details

**Database State:**
```sql
-- Emma's profile exists
SELECT * FROM profiles WHERE slug = 'emma-chronic-pain-journey';
-- Returns: Profile with user_id

-- September 1-29 data exists
SELECT COUNT(*) FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-01' AND '2025-09-29';
-- Returns: 29 entries ✅

-- September 30+ data is MISSING
SELECT COUNT(*) FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date >= '2025-09-30';
-- Returns: 0 entries ❌
```

**Application State:**
```typescript
// Terminal logs show:
Mood data loaded: 30 entries
PublicMoodSection rendering with: {
  todayEntry: {
    date: '2025-09-29',  // Last entry
    mood: 7,
    sleep_quality: 8,
    pain: 3,
    // ... correct data
  },
  moodData: 30  // Only 30 entries, missing Sept 30+
}
```

**Key Files:**
- `src/app/biostackr/[slug]/page.tsx` - Server-side data fetching
- `src/lib/db/mood.ts` - `getPublicMoodData` function
- `src/app/components/mood/MonthlyHeatmap.tsx` - Heatmap display
- `src/components/PublicMoodSection.tsx` - Public mood rendering

## What We've Tried (ALL FAILED)

1. **Multiple SQL Scripts** - Created 6+ different scripts to insert September 30+ data
2. **Caching Bypass** - Added `unstable_noStore()`, `dynamic = 'force-dynamic'`, `revalidate = 0`
3. **Server Restarts** - Multiple full restarts with cache clearing
4. **Data Verification** - Confirmed data exists in database with COUNT queries
5. **Function Modifications** - Updated `getPublicMoodData` to fetch 40 days instead of 30
6. **Date Range Fixes** - Attempted to fix date calculations and ranges

## The Core Issue

**The `getPublicMoodData` function is only returning 30 days of data, ending on September 29th.** We need it to:
1. Fetch data that includes September 30th and October dates
2. Display the complete progression from red → yellow → green

## What We Need

### Immediate Fix
1. **Database**: Insert September 30th and October 1-9 with green colors
2. **Application**: Ensure `getPublicMoodData` fetches the extended date range
3. **Display**: Heatmap shows complete progression

### SQL Script Needed
```sql
-- Insert September 30th and October 1-9
-- September 30th: mood=8, pain=2, sleep=8
-- October 1-8: mood=8, pain=2, sleep=8  
-- October 9th: mood=7, pain=3, sleep=8 (with Whoop data)
```

### Expected Result
- September 1-24: Red/Orange (high pain)
- September 25-29: Yellow (improving)
- September 30-October 8: Green (recovered)
- October 9th: Varied (mood 7, pain 3, sleep 8) with Whoop display

## Previous Fixes That Worked

1. **Welcome Email System** - Fully functional with Resend integration
2. **Onboarding Flow** - Multi-step process working correctly
3. **Public Profile Sharing** - Links and follower system working
4. **Mood Tracking** - Daily check-ins and heatmap display working
5. **Whoop Data Integration** - Nested JSONB data displaying correctly
6. **Caching Issues** - Resolved with `unstable_noStore()` implementation

## Environment Setup

**Required Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_MOOD_TRACKING_ENABLED=true
```

**Database Schema:**
- `profiles` table with `slug`, `user_id`, `avatar_url`, etc.
- `daily_entries` table with `user_id`, `local_date`, `mood`, `pain`, `sleep_quality`, `wearables` (JSONB)
- `stack_items` table for supplements/protocols
- `stack_followers` table for follower relationships

## Success Criteria

The fix is successful when:
1. ✅ Emma's heatmap shows September 30th colored green
2. ✅ October 1-9 are all colored green
3. ✅ October 9th shows varied colors (mood 7, pain 3, sleep 8)
4. ✅ Whoop data displays correctly
5. ✅ Complete progression: Red → Yellow → Green

## Time Constraint

**This has consumed an entire day.** We need a definitive solution that works on the first try. No more "try this" suggestions or multiple attempts.

## Request

Please provide:
1. A working SQL script that inserts the missing dates
2. Any necessary code changes to ensure the data displays
3. Clear steps to verify the fix works
4. Explanation of why previous attempts failed

**The goal is to have Emma's demo account showcase the complete chronic pain recovery journey with proper color progression in the heatmap.**




