# Actionable "What's Next?" Card - Complete ✅

## Overview
Completely redesigned the post-onboarding card from passive checkboxes to **actionable buttons** that guide users to specific features.

---

## What Changed

### Before (Checkboxes):
- ❌ Static checkboxes that didn't do anything
- ❌ User had to figure out where to go
- ❌ Just informational, not helpful
- ❌ All items shown even if completed

### After (Action Buttons):
- ✅ **Clickable buttons** that navigate to features
- ✅ **Clear instructions** in subtext
- ✅ **Smart hiding** - completed items disappear
- ✅ **Auto-dismiss** when all actions done

---

## Card Features

### Design:
- **Clean white card** with subtle border and shadow
- **Icon circles** with indigo/purple backgrounds
- **Hover effects** on each button
- **Bottom dismiss link** ("I'll explore on my own")

### Actions:

#### 1. **Add More to Your Stack**
- **Icon**: Plus icon in indigo circle
- **Action**: Scrolls to supplements section
- **Subtext**: "Build out your supplements, medications, and protocols"
- **Always shows** (user only has 1 item from onboarding)

#### 2. **Explore Your Heatmap**
- **Icon**: TrendingUp icon in indigo circle
- **Action**: Scrolls to Mood Tracker, expands heatmap
- **Subtext**: "Click any day to see patterns in your mood, sleep, and pain"
- **Always shows**

#### 3. **Make a Journal Entry**
- **Icon**: 📝 emoji
- **Action**: Navigates to `/dash/journal`
- **Subtext**: "Go to Journal & Notes in the top navigation bar"
- **Always shows**

#### 4. **Complete Your Profile** (conditional)
- **Icon**: Sparkles icon in purple circle
- **Action**: Navigates to `/dash/settings`
- **Subtext**: "Share your journey with doctors, friends, or your community"
- **Only shows if**: `profile_created === false`

---

## Smart Behavior

### Action Completion:
1. User clicks an action button
2. Action is marked complete in localStorage: `action_[actionName]`
3. Button **disappears** from the card
4. If all actions complete → **card auto-dismisses**

### Manual Dismissal:
- User clicks "I'll explore on my own"
- Card dismisses forever
- Stored in: `localStorage.whatsNextDismissed`

### Visibility Logic:
```javascript
// Show card IF:
1. onboarding_completed === true
2. whatsNextDismissed !== 'true'
3. At least 1 action is visible

// Hide card IF:
1. Onboarding not complete
2. Manually dismissed
3. All actions completed
```

---

## Navigation Targets

### Add Stack Button:
```javascript
const supplementsSection = document.querySelector('[data-section="supplements"]')
supplementsSection.scrollIntoView({ behavior: 'smooth' })
```

### Heatmap Button:
```javascript
const moodSection = document.querySelector('[data-tour="heatmap"]')
moodSection.scrollIntoView({ behavior: 'smooth' })
localStorage.setItem('heatmapExplored', 'true')
```

### Journal Button:
```javascript
window.location.href = '/dash/journal'
```

### Profile Button:
```javascript
window.location.href = '/dash/settings'
```

---

## Files Modified

1. **`src/components/WhatsNextCard.tsx`**
   - Complete redesign from checkboxes to buttons
   - Added navigation logic for each action
   - Smart visibility based on completion
   - Auto-dismiss when all done

2. **`src/app/dash/DashboardClient.tsx`**
   - Added `data-section="supplements"` to supplements card
   - WhatsNextCard already imported and rendered at top

---

## User Flow Example

### User completes onboarding:
1. Lands on dashboard
2. Sees card at top with 4 action buttons

### User clicks "Add More to Your Stack":
3. Page smoothly scrolls to supplements section
4. "Add Stack" button disappears from card
5. Card now shows 3 remaining actions

### User clicks "Explore Your Heatmap":
6. Page scrolls to Mood Tracker
7. Heatmap is marked as explored
8. "Heatmap" button disappears
9. Card now shows 2 remaining actions

### User clicks "Make a Journal Entry":
10. Navigates to `/dash/journal`
11. User creates journal entry
12. Returns to dashboard
13. "Journal" button disappears
14. Card now shows 1 remaining action (if profile incomplete)

### If profile already complete:
15. Card auto-dismisses (all actions done)

### If profile incomplete:
16. "Complete Your Profile" button remains
17. User clicks → navigates to settings
18. After completing profile, card auto-dismisses

---

## Design Principles

### ✅ Action-Oriented
- Every item is a clickable button
- Takes user directly to the feature
- No guessing where to go

### ✅ Progressive Disclosure
- Items disappear as completed
- Reduces cognitive load
- Celebrates progress

### ✅ Respectful
- Can be dismissed anytime
- Doesn't nag or re-appear
- "I'll explore on my own" option

### ✅ Helpful
- Clear descriptions of WHY to do each thing
- Direct navigation to features
- Reduces friction

---

## Testing Checklist

- [ ] Card shows after completing onboarding
- [ ] "Add Stack" button scrolls to supplements
- [ ] "Heatmap" button scrolls to mood tracker
- [ ] "Journal" button navigates to journal page
- [ ] "Profile" button only shows if profile incomplete
- [ ] "Profile" button navigates to settings
- [ ] Clicked buttons disappear from card
- [ ] Card auto-dismisses when all actions done
- [ ] "I'll explore on my own" dismisses card forever
- [ ] Card doesn't show after dismissal

---

**Status**: ✅ COMPLETE - Actionable, helpful, and non-intrusive

