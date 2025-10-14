# Daily Check-In Symptom Tracking Upgrade - Implementation Brief

## Project Context & Current State

**BioStackr Platform Overview:**
BioStackr is a health tracking platform that connects supplements, medications, and protocols with mood, sleep, and pain tracking. We've recently completed a comprehensive demo profile setup including Emma's chronic pain recovery journey, showcasing the platform's capabilities for health tracking and pattern recognition.

**Current Daily Check-In State:**
- 3 sliders: Mood (0-10), Pain (0-10), Sleep (0-10)
- Simple "Notes" text field
- Basic functionality works but lacks structured symptom tracking

**Target Upgrade Goal:**
Transform the basic notes field into a comprehensive symptom tracking system that appeals to people with chronic pain, ADHD, perimenopause, and other chronic conditions.

## Implementation Specification

### New Daily Check-In Structure

**Keep Existing:**
- 3 sliders: Mood, Pain, Sleep (0-10 scale)
- Core functionality and data structure

**Replace/Enhance:**
- Replace blank notes field with structured symptom tracking
- Add optional free-text notes at bottom

### UI Layout Design

**Collapsed State (Default):**
```
Today's Check-In
━━━━━━━━━━━━━━━━
Mood:     [━━━━○━━] 6/10
Pain:     [━━━━━○━] 7/10  
Sleep:    [━━○━━━━] 4/10

[+ Track symptoms]  ← Collapsible button
```

**Expanded State:**
```
Symptoms today (optional)
━━━━━━━━━━━━━━━━

[Brain fog] [Fatigue] [Headache] [Muscle pain] 
[Joint pain] [Anxiety] [Irritability] [Nausea]
[Hot flashes] [Nerve pain] [Stiffness] [Racing thoughts]
[Overwhelm] [Low mood] [Inflammation]

[+ Add custom symptom]

━━━━━━━━━━━━━━━━
Where's your pain? (if pain > 0)
[Head] [Neck] [Back] [Joints] [Full body] [Other]

━━━━━━━━━━━━━━━━
Notes (optional)
[Text field for free-form notes]
```

### Core Symptom List (15 + Custom)

**Physical Symptoms:**
- Headache
- Muscle pain
- Joint pain
- Nerve pain (tingling, burning)
- Stiffness
- Inflammation/Swelling
- Nausea/Digestive issues
- Hot flashes
- Fatigue

**Mental/Cognitive:**
- Brain fog
- Racing thoughts

**Emotional:**
- Anxiety
- Irritability
- Low mood
- Overwhelm

**Custom:**
- + Add custom symptom (user can type their own)

### Pain Location Options
**Display Logic:** Only show if pain slider > 0
**Options:**
- Head
- Neck
- Back
- Joints
- Full body
- Other

### Recommended Implementation: Tag-Style Buttons

**Why Tag-Style:**
- Most scannable and least overwhelming
- No clicking to expand individual items
- Natural wrap behavior
- Multi-select enabled

**Visual Design:**
- **Unselected:** Light gray background, dark text
- **Selected:** Accent color background, white text
- **Behavior:** Click to toggle on/off, multiple selections allowed

**Code Pattern:**
```jsx
<div className="symptom-tags">
  {symptoms.map(symptom => (
    <button 
      className={`tag ${selected ? 'active' : ''}`}
      onClick={() => toggleSymptom(symptom)}
    >
      {symptom.name}
    </button>
  ))}
</div>
```

### Behavior & Interaction Details

**Collapsible Section:**
- Default state: Collapsed (shows only "+ Track symptoms" button)
- Click to expand/collapse
- Remember user's preference (if they always expand it, keep it expanded)

**Selection Behavior:**
- Multi-select (can choose multiple symptoms)
- Toggle on/off with click
- No limit on number of selections

**Custom Symptom:**
- Click "+ Add custom symptom"
- Shows text input field
- After typing, adds to their symptom list
- Saves custom symptoms to user profile for future quick-access

### Data Structure

**New Data Format:**
```json
{
  "date": "2025-10-10",
  "mood": 6,
  "pain": 7,
  "sleep": 4,
  "symptoms": ["brain_fog", "fatigue", "headache"],
  "pain_locations": ["head", "neck"],
  "custom_symptoms": ["sensitive to light"],
  "notes": "Tried new supplement today"
}
```

### Copy-Paste Ready Code Arrays

```javascript
const coreSymptoms = [
  { id: 'brain_fog', label: 'Brain fog', category: 'cognitive' },
  { id: 'fatigue', label: 'Fatigue', category: 'physical' },
  { id: 'headache', label: 'Headache', category: 'physical' },
  { id: 'muscle_pain', label: 'Muscle pain', category: 'physical' },
  { id: 'joint_pain', label: 'Joint pain', category: 'physical' },
  { id: 'anxiety', label: 'Anxiety', category: 'emotional' },
  { id: 'irritability', label: 'Irritability', category: 'emotional' },
  { id: 'nausea', label: 'Nausea', category: 'physical' },
  { id: 'hot_flashes', label: 'Hot flashes', category: 'physical' },
  { id: 'nerve_pain', label: 'Nerve pain', category: 'physical' },
  { id: 'stiffness', label: 'Stiffness', category: 'physical' },
  { id: 'racing_thoughts', label: 'Racing thoughts', category: 'cognitive' },
  { id: 'overwhelm', label: 'Overwhelm', category: 'emotional' },
  { id: 'low_mood', label: 'Low mood', category: 'emotional' },
  { id: 'inflammation', label: 'Inflammation', category: 'physical' }
];

const painLocations = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'back', label: 'Back' },
  { id: 'joints', label: 'Joints' },
  { id: 'full_body', label: 'Full body' },
  { id: 'other', label: 'Other' }
];
```

## Implementation Priority

### Phase 1 (MVP - Ship This Week)
- [ ] Add collapsible symptom section
- [ ] 15 core symptoms as tags/checkboxes
- [ ] Pain location (if pain > 0)
- [ ] Keep optional notes field
- [ ] Basic multi-select functionality

### Phase 2 (Next Week)
- [ ] Custom symptom input
- [ ] Remember user's expand/collapse preference
- [ ] Save custom symptoms to user profile

### Phase 3 (Future)
- [ ] Smart suggestions based on usage patterns
- [ ] Pre-populate common symptoms for each user
- [ ] Condition-specific symptom sets

## Key Principle

**Fast by default, detailed if they want it.**

- Basic check-in: 3 sliders = 10 seconds
- With symptoms: 3 sliders + 3-5 taps = 30 seconds max
- Full detail: 3 sliders + symptoms + location + notes = 60 seconds

**Never force depth. Always allow it.**

## Technical Requirements

### Mobile Considerations
- Tag layout: Wrap naturally, don't force columns
- Touch-friendly sizing (min 44x44px tap target)
- Adequate spacing between tags (8-12px)
- Large, easy-to-tap expand/collapse button
- Smooth animation when expanding

### Accessibility
- Keyboard navigation (tab through symptoms, space to select)
- Screen reader friendly labels
- Sufficient color contrast for selected/unselected states
- Focus indicators on interactive elements

### Testing Checklist
- [ ] Can complete check-in in under 30 seconds (without symptoms)
- [ ] Can add 3-5 symptoms in under 20 seconds
- [ ] Works on mobile (tags don't break layout)
- [ ] Selected symptoms save correctly
- [ ] Pain location only shows when pain > 0
- [ ] Custom symptom input works and saves
- [ ] Collapse/expand works smoothly
- [ ] Data structure supports future insights/correlations

## Copy/Text Content

**Button Text:**
- Collapsed: "+ Track symptoms" or "+ Add details"
- Expanded: "− Hide symptoms" (optional)

**Section Headers:**
- "Symptoms today (optional)"
- "Where's your pain?" (conditional)
- "Notes (optional)"

**Helper Text (Optional):**
- Near symptoms: "Select all that apply"
- Near pain location: "You can select multiple areas"

## Current Project Files Context

**Key Files to Modify:**
- Daily check-in component (likely in `src/components/` or `src/app/`)
- Database schema for daily entries (add symptoms arrays)
- Any existing mood tracking components

**Recent Work Completed:**
- Emma's chronic pain profile with complete data
- Landing page text updates
- Mood tracking with CHIP_CATALOG integration
- Public profile functionality

## Next Steps

1. **Start with Phase 1 MVP implementation**
2. **Focus on the collapsible symptom section first**
3. **Ensure backward compatibility with existing data**
4. **Test thoroughly on mobile devices**
5. **Consider the user experience for chronic pain sufferers**

## Success Metrics

- Users can complete detailed check-ins in under 60 seconds
- Symptom tracking increases engagement with daily check-ins
- Data structure supports future pattern recognition features
- Maintains simplicity for users who want basic tracking only

---

**Ready to implement. This brief contains everything needed to upgrade the daily check-in system from basic notes to comprehensive symptom tracking.**



