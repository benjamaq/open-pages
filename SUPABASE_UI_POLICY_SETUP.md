# 🎛️ **Fix RLS Policies via Supabase Dashboard UI**

## **❌ SQL Permission Issue:**
- Error: "must be owner of table objects"
- **Solution**: Use Supabase Dashboard UI instead of SQL

---

## **🎯 Step-by-Step UI Setup:**

### **1. Go to Storage in Supabase Dashboard**
- Open https://supabase.com/dashboard
- Select your Open Pages project
- Click **"Storage"** in left sidebar

### **2. Set Up Avatars Bucket Policies**

#### **A. Click on "avatars" bucket**
#### **B. Go to "Policies" tab**
#### **C. Click "New Policy"**

**Policy 1: Allow Upload**
- **Policy name**: `Allow authenticated users to upload avatars`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression**: Leave empty
- **WITH CHECK expression**: `bucket_id = 'avatars'`
- Click **"Save policy"**

**Policy 2: Allow Public View**
- Click **"New Policy"** again
- **Policy name**: `Allow public to view avatars`
- **Allowed operation**: `SELECT`
- **Target roles**: `public` (or leave as default)
- **USING expression**: `bucket_id = 'avatars'`
- **WITH CHECK expression**: Leave empty
- Click **"Save policy"**

### **3. Set Up Uploads Bucket Policies**

#### **A. Click on "uploads" bucket**
#### **B. Go to "Policies" tab**
#### **C. Create the same 2 policies:**

**Policy 1: Allow Upload**
- **Policy name**: `Allow authenticated users to upload files`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression**: Leave empty
- **WITH CHECK expression**: `bucket_id = 'uploads'`
- Click **"Save policy"**

**Policy 2: Allow Public View**
- **Policy name**: `Allow public to view uploads`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**: `bucket_id = 'uploads'`
- **WITH CHECK expression**: Leave empty
- Click **"Save policy"**

---

## **🎯 Alternative: Quick Template Method**

**If the UI is confusing, try this:**

### **For each bucket (avatars and uploads):**

1. **Click bucket** → **Policies tab** → **"New Policy"**
2. **Choose template**: "Allow authenticated users to upload"
3. **Modify the template** to match your bucket name
4. **Save**
5. **Create another policy**: "Allow public access for viewing"

---

## **✅ Verify Setup:**

**After creating policies, you should see:**

### **Avatars bucket policies:**
- ✅ `Allow authenticated users to upload avatars` (INSERT)
- ✅ `Allow public to view avatars` (SELECT)

### **Uploads bucket policies:**
- ✅ `Allow authenticated users to upload files` (INSERT)
- ✅ `Allow public to view uploads` (SELECT)

---

## **🧪 Test Upload:**

1. **Go back to your dashboard**
2. **Try uploading** profile photo or background
3. **Should work without RLS errors** ✅

---

## **🚨 If UI Method Doesn't Work:**

**Try this simplified approach:**

### **Disable RLS temporarily:**
1. **Go to Database** → **Tables** in Supabase
2. **Find `objects` table** (in `storage` schema)
3. **Click the table** → **Settings**
4. **Toggle off "Enable RLS"**
5. **Try upload** (should work immediately)

### **⚠️ Security Note:**
- **Disabling RLS** makes all storage public
- **Only for testing** - re-enable RLS after confirming uploads work
- **Then set up policies properly**

---

## **📞 Next Steps:**

**Try the UI method first, then let me know:**
- ✅ **If it works** - uploads should succeed
- ❌ **If still failing** - we'll try the temporary RLS disable method

**The UI policy setup should resolve the permission issue! 🎛️✨**
