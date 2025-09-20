# 14-Day Pro Trial System Setup Guide

## 🚀 **Overview**
All users now get a 14-day Pro trial automatically when they sign up. This gives them unlimited access to all Pro features before hitting free tier limits.

## 📋 **Setup Steps**

### **1. Database Setup**
Run these SQL scripts in your Supabase SQL Editor in order:

```sql
-- Step 1: Set up trial system infrastructure
-- File: database/trial-system.sql
```

```sql
-- Step 2: Give existing users a trial
-- File: database/give-existing-users-trial.sql
```

### **2. What Users Will See**

#### **🎉 New Users (First 3 days)**
- **Welcome notification**: "🎉 Welcome to your Pro trial! You have X days to explore unlimited supplements..."
- **Trial badge**: Blue badge showing "X days left in Pro trial"
- **Unlimited access**: No restrictions on supplements, protocols, or files

#### **⚠️ Trial Expiring (Last 3 days)**
- **Warning notification**: "Pro trial expiring in X days - Upgrade now to keep all features"
- **Orange badge**: "X days left in Pro trial" (orange warning color)
- **Upgrade prompts**: Prominent upgrade buttons throughout the UI

#### **📊 Approaching Limits (80% of free tier)**
- **Limit warning**: "You're using 8/10 supplements, 4/5 protocols - Upgrade to Pro for unlimited!"
- **Preventive messaging**: Shows before users hit actual limits

#### **💳 Post-Trial (Free tier)**
- **Limit enforcement**: New additions blocked beyond free limits
- **Existing items preserved**: Nothing gets deleted
- **Clear upgrade path**: Easy access to pricing page

## 🎨 **UI Components Added**

### **TrialStatusBadge**
- Shows trial status in profile header
- Blue for active trial, orange for expiring
- Only visible to free tier users

### **TrialNotification**
- Full-width notifications at top of dashboard
- Welcome message for new users
- Expiration warnings for ending trials
- Dismissible (remembers user preference)

### **LimitChecker**
- Warns when approaching free tier limits (80% usage)
- Shows current usage vs limits
- Prominent upgrade call-to-action

### **Updated TierManagement**
- Shows trial status in subscription management
- "Pro Trial Active (X days left)" badge
- Clear upgrade path to Pro

## 🔧 **API Endpoints**

### **`/api/trial-status`**
Returns current trial status:
```json
{
  "isInTrial": true,
  "daysRemaining": 7,
  "trialStartedAt": "2024-01-15T10:00:00Z",
  "trialEndedAt": null
}
```

### **`/api/usage-status`**
Returns current usage vs limits:
```json
{
  "stackItems": 8,
  "protocols": 4,
  "uploads": 2,
  "stackItemsLimit": 10,
  "protocolsLimit": 5,
  "uploadsLimit": 3,
  "currentTier": "free"
}
```

## 📈 **User Experience Flow**

### **Day 1-3: Welcome Phase**
1. User signs up → Automatic 14-day trial starts
2. Welcome notification appears
3. Trial badge shows in header
4. Full Pro features unlocked

### **Day 4-11: Active Trial**
1. Trial badge continues to show
2. Full Pro features remain active
3. Subtle upgrade prompts available

### **Day 12-14: Expiration Warning**
1. Orange warning notifications appear
2. Trial badge turns orange
3. Prominent upgrade buttons
4. Daily reminders about expiration

### **Day 15+: Post-Trial**
1. Trial badge disappears
2. Free tier limits enforced
3. Existing content preserved
4. Clear upgrade messaging

## 🎯 **Conversion Strategy**

### **Graceful Degradation**
- **No content loss**: Existing items stay even after trial
- **Soft limits**: Warnings before hard blocks
- **Clear value**: Users see Pro benefits during trial

### **Multiple Touchpoints**
- **Dashboard notifications**: Persistent but dismissible
- **Profile badges**: Always visible status
- **Limit warnings**: Contextual and helpful
- **Tier management**: Clear upgrade path

### **Psychological Triggers**
- **FOMO**: "Only X days left"
- **Value demonstration**: Full Pro features during trial
- **Ease of upgrade**: One-click to pricing page
- **No pressure**: Dismissible notifications

## 🚀 **Ready to Launch!**

The trial system is now fully implemented and ready to use. Users will automatically get Pro access for 14 days, giving them a taste of the full experience before any limitations kick in.

**Next Steps:**
1. Run the SQL scripts in Supabase
2. Test with a new user account
3. Monitor conversion rates
4. Adjust messaging based on user feedback

The system is designed to be user-friendly while maximizing conversion opportunities! 🎉
