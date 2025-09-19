# 🚀 Affiliate Feature Prototype

**Isolated development environment for BioStackr affiliate functionality**

## 📁 Directory Structure

```
affiliate-prototype/
├── components/           # React components
│   ├── AffiliateFields.tsx    # Form fields for adding affiliate links
│   └── BuyButton.tsx          # Buy button for public profiles
├── types/               # TypeScript type definitions
│   └── affiliate.ts           # Affiliate-related types
├── utils/               # Utility functions
│   └── validation.ts          # URL validation logic
├── demo/                # Interactive HTML demos
│   ├── form-demo.html         # Test the form fields
│   └── button-demo.html       # Test the buy buttons
├── migrations/          # Database changes
│   └── 001-add-buy-link.sql   # Add buy_link column
└── README.md           # This file
```

## 🧪 Testing the Components

### 1. Form Demo
Open `demo/form-demo.html` in your browser to test:
- ✅ Pro vs Free user experience
- ✅ URL validation
- ✅ Form integration
- ✅ Real-time preview

### 2. Button Demo  
Open `demo/button-demo.html` in your browser to test:
- ✅ Different button styles
- ✅ Button sizes
- ✅ Public profile preview
- ✅ Compliance features

## 🎯 Integration Plan

### Phase 1: Database (Test First!)
1. **Test on staging database:**
   ```sql
   -- Run this in your Supabase SQL editor
   \i affiliate-prototype/migrations/001-add-buy-link.sql
   ```

2. **Verify the column exists:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'stack_items' AND column_name = 'buy_link';
   ```

### Phase 2: Component Integration
1. **Copy tested components to main app:**
   ```bash
   cp affiliate-prototype/components/* ../src/components/
   cp affiliate-prototype/types/* ../src/types/
   cp affiliate-prototype/utils/* ../src/lib/utils/
   ```

2. **Update supplement form** (`src/components/AddStackItemForm.tsx`):
   ```tsx
   import { AffiliateFields } from './AffiliateFields';
   
   // Add to form state
   const [buyLink, setBuyLink] = useState('');
   
   // Add to form JSX
   <AffiliateFields 
     buyLink={buyLink}
     setBuyLink={setBuyLink}
     isPro={profile?.plan === 'pro'}
   />
   ```

3. **Update public profile** (`src/components/SupplementsSection.tsx`):
   ```tsx
   import { BuyButton } from './BuyButton';
   
   // Add to supplement card
   <BuyButton buyLink={supplement.buy_link} />
   ```

### Phase 3: API Updates
1. **Update create/update actions** (`src/lib/actions/stack.ts`):
   ```typescript
   // Add buy_link to insert/update operations
   const { data, error } = await supabase
     .from('stack_items')
     .insert([{
       ...existing_fields,
       buy_link: sanitizeAffiliateUrl(buyLink)
     }]);
   ```

## ✅ Success Criteria

Before integration, verify:
- [ ] Form demo works perfectly
- [ ] Button demo shows all styles
- [ ] URL validation catches bad URLs
- [ ] Pro/Free experience is clear
- [ ] Database migration runs without errors
- [ ] Components match your app's design system

## 🔒 Compliance Checklist

- [x] All links have `rel="nofollow sponsored noopener"`
- [x] Links open in new tab
- [x] URL validation prevents malicious links
- [ ] Add disclosure text to public profiles
- [ ] Test with real affiliate URLs

## 🎨 Design Decisions

### Simplified Approach
- **Single field:** Just `buy_link` (not retailer name + URL)
- **Generic button:** "→ Buy this item" (not branded)
- **Optional disclosure:** Can be added later
- **Pro-gated:** Free users see upgrade prompt

### Future Enhancements
- Retailer name field
- Branded buttons ("Buy at Amazon")
- "Shop my stack" section
- Click tracking
- Multi-retailer support

## 🚨 Safety Notes

1. **Never run migrations on production first**
2. **Test all components thoroughly in demos**
3. **Backup your database before any changes**
4. **Use staging environment for integration testing**
5. **Keep this prototype until integration is complete**

## 📞 Next Steps

1. **Test the demos** - Open HTML files in browser
2. **Refine the components** - Adjust styling/behavior
3. **Run database migration** - On staging first!
4. **Integrate one form at a time** - Start with supplements
5. **Test thoroughly** - Both form and public profile
6. **Deploy gradually** - Feature flag if possible

---

**This prototype is completely isolated from your main app - it's safe to experiment!** 🧪
