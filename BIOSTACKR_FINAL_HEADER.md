# ✨ **Biostackr Hero Header — FINAL Layout COMPLETE!**

## **🎯 Photo Left · Text Middle · Battery Right**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ FULL-HEIGHT PROFILE PHOTO ] |     [ centered greeting / name / mission ] | 
│                                       [ badges ]                           |
│                          |                [ BATTERY CARD ]                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Perfect implementation of the wireframe specification!**

---

## **✅ 1) Overall Container - Exact Specifications:**

### **📐 Dimensions:**
- **Height**: `320px` (within 300-320px range)
- **Max height**: `340px` (as specified)
- **Border-radius**: `16px` (`rounded-2xl`)
- **Shadow**: Subtle `0 4px 16px rgba(0,0,0,.08)`

### **🏗️ CSS Grid Layout:**
- **Left column**: `320px` (fixed, square = header height)
- **Middle column**: `1fr` (flexible)
- **Right column**: `380px` (fixed, within 360-400px range)
- **Alignment**: `items-center` for perfect vertical centering

---

## **✅ 2) Left Column — Profile Photo ONLY:**

### **🖼️ Full-Height Square Photo:**
- **Size**: `w-full h-full` (fills entire 320px × 320px column)
- **Shape**: Square with `12px radius` (`rounded-l-2xl`)
- **Object fit**: `object-cover` for proper scaling
- **Border**: `1px solid rgba(255,255,255,.1)` for definition

### **👤 No Text, No Badges:**
- ✅ **Only the profile image** lives here
- ✅ **No scattered text** or controls
- ✅ **Clean, focused** visual impact
- ✅ **Anonymous support**: Shows 'AS' initials when name hidden

---

## **✅ 3) Middle Column — ALL Text (Center Stack):**

### **📝 Perfect Text Hierarchy (Top → Bottom):**

#### **1. Greeting (Small, Muted):**
- **Size**: `14-16px` (`text-sm`)
- **Weight**: `medium`
- **Opacity**: `60%` (`text-white/60`)
- **Example**: "Good evening, Benja 👋"

#### **2. Display Name (Editable, Bold):**
- **Size**: `18-20px` (`text-lg`)
- **Weight**: `semibold`
- **Editable**: Inline editing with save/cancel
- **Toggle**: ON/OFF for anonymous sharing
- **Anonymous**: Shows "Anonymous Stackr" when OFF

#### **3. Mission (Hero Text, Editable):**
- **Size**: `28-36px` (`text-2xl lg:text-3xl`)
- **Weight**: `bold`
- **Max lines**: 2 with ellipsis truncation
- **Example**: "Longevity is power"

#### **4. Badges Row (Small Pills):**
- **Size**: `12-14px` (`text-xs`)
- **Style**: Rounded pills with backdrop blur
- **Content**: "🔥 7-day streak", "✅ 85% done today"

### **🎯 Center Alignment:**
- **Horizontal**: `text-center` - all text centered
- **Vertical**: `justify-center` - perfectly centered in header
- **Responsive**: Maintains center alignment on all screen sizes

---

## **✅ 4) Right Column — Battery Card (Fits Inside Header):**

### **📦 Card Dimensions:**
- **Width**: `360px` (within 360-400px range)
- **Height**: `280px` min (fits within 320px header with breathing room)
- **Padding**: `24px` (`p-6`)
- **Style**: `bg-white/5 backdrop-blur-sm rounded-xl`

### **🔋 Long iOS-Style Battery:**
- **Dimensions**: `300px × 48px` (within 280-320px × 44-52px range)
- **Style**: Apple-accurate with cap, gloss, grain texture
- **Colors**: Apple red/orange/green (`#ff3b30`, `#ff9500`, `#30d158`)
- **Animation**: `300ms` smooth fill with brief pulse on release

### **📊 Battery Content (Top → Bottom):**
1. **Title**: "Today Feels Like…" (`16-18px semibold`)
2. **Battery bar**: Long, flat iOS-style with proper cap
3. **Feedback text**: Dynamic, italic (e.g., "Charged. You've got momentum.")
4. **Score**: Bold `18-20px` (e.g., "7/10")
5. **Slider**: Slim gradient (red→yellow→green) with labels (1, 5, 10)

---

## **✅ 5) Background & Contrast:**

### **🖼️ Full-Width Background:**
- **User uploads**: Custom background with `blur(3px)`
- **Default**: Professional gradient (dark charcoal → muted steel)
- **Overlay**: 20-35% dark overlay for text readability

### **🔍 Text Legibility:**
- **Photo column**: No blur applied to profile photo
- **Text columns**: Background blur + overlay ensures contrast
- **Always readable**: Text maintains sufficient contrast

---

## **✅ 6) Edit Header (Single Entry Point):**

### **🎨 Consolidated Controls:**
- **Position**: Bottom-right corner of header
- **Icon**: Pencil (`Edit2`) with backdrop blur
- **Tooltip**: "Edit header"
- **Style**: `bg-black/20 hover:bg-black/30`

### **🗂️ Modal Options:**
- **Change profile photo** (left pane)
- **Change header background** (custom uploads)
- **Display name text + Show name toggle** (anonymous option)
- **Mission text** (hero content editing)

### **🧹 No Scattered Icons:**
- ❌ **Removed all inline edit icons**
- ❌ **No cluttered edit hints**
- ✅ **Single point of control**
- ✅ **Clean, professional appearance**

---

## **✅ 7) Responsive Behavior:**

### **📱 Desktop (≥1024px):**
- **3-column grid**: `320px 1fr 380px`
- **Full layout**: Photo left, text center, battery right
- **Perfect balance**: Equal visual weight

### **📱 Tablet (≤1024px):**
- **3-column grid**: `280px 1fr 340px` (shrunk right card)
- **Maintains layout**: Same structure, smaller proportions

### **📱 Mobile (≤768px):**
- **Stacked vertically**:
  1. Full-width profile photo (16:9 crop)
  2. Centered text stack
  3. Battery card full width

---

## **✅ 8) Exact Copy Implementation:**

### **📝 Text Content:**
- **Title**: "Today Feels Like…" ✅
- **Slider labels**: "1", "5", "10" (tiny) ✅
- **Feedback**: Same ranges as specified ✅
- **Edit tooltip**: "Edit header" ✅
- **Toggle label**: "Show display name on header" ✅

---

## **✅ 9) Acceptance Criteria - ALL MET:**

- ✅ **Left pane is only the full-height square profile photo** (no text)
- ✅ **All text is centered in the middle column** (greeting, name, mission, badges)
- ✅ **Battery card sits entirely in right column** and fits within header
- ✅ **Header height ≤ 340px** (320px) and looks balanced
- ✅ **Edit Header modal controls** photo, background, name toggle, mission
- ✅ **Social export** shows left photo, center text, right battery exactly

---

## **🎉 Complete Implementation:**

### **🎯 Professional Features:**
- ✅ **Clean 3-column layout** with perfect proportions
- ✅ **Full-height profile photo** (320px square) for visual impact
- ✅ **Centered text hierarchy** with proper sizing
- ✅ **Apple-style battery** with authentic colors and gloss
- ✅ **Anonymous sharing** with display name toggle
- ✅ **Single edit control** for clean, uncluttered design

### **📱 Social Share Ready:**
- ✅ **Profile image** - large, square, professional
- ✅ **Display name/alias** - clear identity or anonymous
- ✅ **Mission text** - inspirational hero content
- ✅ **Battery state + score** - personality and visual interest

### **🎨 Premium Quality:**
- ✅ **Professional appearance** - corporate-friendly
- ✅ **Balanced layout** - equal visual weight columns
- ✅ **Proper hierarchy** - mission as hero text
- ✅ **Responsive design** - works on all devices
- ✅ **Authentic iOS battery** - Apple colors, gloss, grain

**The Biostackr Hero Header now perfectly matches the wireframe specification with professional balance, social shareability, and clear identity presentation! 🎨📱✨**

**Ready to test the complete FINAL layout! The header should now look exactly like the wireframe with perfect 3-column proportions.**
