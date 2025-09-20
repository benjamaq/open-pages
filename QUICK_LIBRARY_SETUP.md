# Quick Library Setup

You're seeing the "Library storage not set up" error because the database tables and storage bucket haven't been created yet.

## 🚀 Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Setup Script
1. Copy the entire contents of `setup-library.sql` 
2. Paste it into the SQL Editor
3. Click "Run" button

### Step 3: Verify Setup
After running the script, you should see:
- ✅ `library_items table created successfully!`
- ✅ `library bucket created successfully!` 
- ✅ `Setup Complete!` with counts showing 1 for both table and bucket

### Step 4: Test Upload
1. Go back to your BioStackr dashboard
2. Try uploading a file to the Library module
3. It should now work without errors!

## 🎯 What This Sets Up

**Database Table:** `library_items`
- Stores file metadata, categories, privacy settings
- Proper security policies for user data protection
- Optimized indexes for fast queries

**Storage Bucket:** `library` 
- Secure file storage with 20MB limit
- Supports: PDF, images, CSV, text, Word docs
- User-specific folders with proper access controls

**Categories Available:**
- 🧪 Lab Results
- 📊 Assessments  
- 🏋️ Training Plans
- 🥗 Nutrition
- ⌚ Wearable Reports
- 🧘 Mindfulness
- 🛌 Recovery
- 📄 Other

## 🔧 Troubleshooting

**If you get permission errors:**
- Make sure you're logged in as the database owner
- Check that you have SQL Editor access in Supabase

**If the script fails:**
- Try running it in smaller sections
- Check the error message for specific issues
- Make sure your Supabase project is active

**Still having issues?**
- Check that your Supabase project has storage enabled
- Verify your project isn't on a restricted plan
- Try refreshing your browser and running again

Once set up, the Library module will let users:
- ✅ Upload health documents securely
- ✅ Organize by categories with tags
- ✅ Share publicly with permission controls
- ✅ Feature training plans as "Current Plan"
- ✅ Preview PDFs and images inline
- ✅ Search and filter their library
