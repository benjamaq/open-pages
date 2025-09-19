# Clear Browser Data for Testing New Accounts

## Issue
When testing new account creation, you might see pre-filled data from previous accounts because localStorage data persists across different user sessions.

## Quick Fix - Clear Browser Data

### Option 1: Browser Dev Tools (Recommended)
1. Open browser dev tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → `http://localhost:3009`
4. **Clear all** localStorage entries that start with `biostackr_`

### Option 2: Incognito/Private Window
- Test new accounts in incognito/private browsing mode
- This ensures clean localStorage for each test

### Option 3: Clear Specific Keys (Console)
Open browser console and run:
```javascript
// Clear all Biostackr localStorage data
Object.keys(localStorage)
  .filter(key => key.startsWith('biostackr_'))
  .forEach(key => localStorage.removeItem(key))

console.log('Cleared all Biostackr localStorage data')
```

## What Was Fixed

### 1. **User-Specific localStorage Keys**
- ✅ Changed from `biostackr_last_daily_checkin` 
- ✅ To `biostackr_last_daily_checkin_${userId}`
- ✅ Now each user has their own data

### 2. **Removed Hardcoded Defaults**
- ✅ **Energy Level**: 7 → 1 (new users start at minimum)
- ✅ **Streak**: "7-day streak" → "0-day streak"
- ✅ **Food Data**: Removed hardcoded meals (Oatmeal, Salmon, etc.)

### 3. **Fixed Missing Modules**
- ✅ **Supplements Card**: Now always shows (even when empty)
- ✅ **Protocols Card**: Now always shows (even when empty)  
- ✅ **Uploads Card**: Now always shows (even when empty)

### 4. **Clean New Account Experience**
- ✅ **Energy**: Starts at 1/10
- ✅ **Mood**: No pre-filled mood
- ✅ **Streak**: Starts at 0 days
- ✅ **Food**: Empty meal sections
- ✅ **All modules visible**: Supplements, Protocols, Movement, Mindfulness, Food, Uploads

## Testing New Accounts
After clearing browser data, new accounts should show:
- Empty dashboard with all module cards visible
- Energy level at 1/10 with no mood
- 0-day streak
- Empty food sections with "Quick Add" buttons
- Empty supplements/protocols with "Add your first..." prompts
