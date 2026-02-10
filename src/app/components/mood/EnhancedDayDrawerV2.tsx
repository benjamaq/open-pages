'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getGreeting } from '@/lib/utils/greetings';
import { ChevronDown } from 'lucide-react';
import { saveDailyEntry, type SaveDailyEntryInput } from '@/lib/db/mood';
import { CHIP_CATALOG, getChipsByCategory } from '@/lib/constants/chip-catalog';
import { useFirstCheckIn } from '@/hooks/useFirstCheckIn';
import { generateFirstInsight } from '@/app/actions/generate-first-insight';
import { generateAndSaveElliMessage } from '@/app/actions/generate-elli-message';
import PostCheckinModal from '@/components/onboarding/post-checkin-modal';
import EnableRemindersModal from '@/components/onboarding/EnableRemindersModal';
import SafeType from '@/components/elli/SafeType';
import { TypingIndicator } from '@/components/elli/TypingIndicator';
import { trackEvent } from '@/lib/analytics';

type EnhancedDayDrawerV2Props = {
  isOpen: boolean;
  onClose: () => void;
  date: string; // 'YYYY-MM-DD'
  userId: string;
  userName?: string; // Optional: User's display name for Elli's personalization
  isFirstCheckIn?: boolean; // Flag for onboarding flow
  isOnboarding?: boolean; // NEW: If true, we're in orchestrated onboarding flow
  onOnboardingComplete?: (data: any) => void; // NEW: Callback for orchestrator
  todayItems?: {
    supplements: any[];
    protocols: any[];
    movement: any[];
    mindfulness: any[];
    food: any[];
    gear: any[];
  };
  initialData?: {
    mood?: number | null;
    energy?: number | null;
    sleep_quality?: number | null;
    pain?: number | null;
    sleep_hours?: number | null;
    night_wakes?: number | null;
    tags?: string[] | null;
    journal?: string | null;
    actions_snapshot?: any;
  } | null;
};

export default function EnhancedDayDrawerV2({ isOpen, onClose, date, userId, userName = '', isFirstCheckIn = false, isOnboarding = false, onOnboardingComplete, todayItems, initialData }: EnhancedDayDrawerV2Props) {
  const mountedRef = useRef<boolean>(false);
  const [formData, setFormData] = useState<SaveDailyEntryInput>({
    localDate: date,
    mood: null,
    sleep_quality: null,
    pain: null,
    tags: null,
    journal: null
  });

  // Post-check-in modal state
  const [showPostCheckinModal, setShowPostCheckinModal] = useState(false);
  const [postCheckinData, setPostCheckinData] = useState<any>(null);
  const [showReminderPrompt, setShowReminderPrompt] = useState(false);
  const [showSuccessConfirm, setShowSuccessConfirm] = useState(false);
  
  // Elli welcome message state
  const [showElliTyping, setShowElliTyping] = useState(false);
  const [showElliMessage, setShowElliMessage] = useState(false);
  
  // Check if this is the user's first check-in (use hook only if not explicitly passed as prop)
  const { isFirstCheckIn: isFirstCheckInFromHook, loading: firstCheckInLoading } = useFirstCheckIn(userId);
  const isActuallyFirstCheckIn = isFirstCheckIn || isFirstCheckInFromHook;

  // 🎭 DEBUG: State Check
  console.log("🎭 EnhancedDrawerV2 State Check:", { 
    isLoaded: true, 
    formDataKeys: Object.keys(formData), 
    isOpen: isOpen,
    date: date,
    userId: userId
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [hasMovedSliders, setHasMovedSliders] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeSnapshot, setIncludeSnapshot] = useState(true);
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [selectedWearable, setSelectedWearable] = useState<string>('');
  const [wearables, setWearables] = useState({
    recovery_score: null as number | null,
    sleep_score: null as number | null
  });

  // SIMPLE BioStackr check-in state (mood, energy, focus, noise, supplement intake)
  const [simpleMood, setSimpleMood] = useState<number>(3)
  const [simpleEnergy, setSimpleEnergy] = useState<number>(3)
  const [simpleFocus, setSimpleFocus] = useState<number>(3)
  const [noiseAlcohol, setNoiseAlcohol] = useState<boolean>(false)
  const [noiseTravel, setNoiseTravel] = useState<boolean>(false)
  const [noisePoorSleep, setNoisePoorSleep] = useState<boolean>(false)
  const [noiseStress, setNoiseStress] = useState<boolean>(false)
  const [activeSupps, setActiveSupps] = useState<Array<{ id: string; name: string }>>([])
  const [selectedSupps, setSelectedSupps] = useState<Record<string, boolean>>({})

  // Load active supplements for today’s intake checklist
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!isOpen) return
      try {
        const r = await fetch('/api/supplements', { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        if (cancelled) return
        const rows = Array.isArray(j) ? j : []
        const mapped = rows
          .filter((row: any) => row?.is_active !== false)
          .map((row: any) => ({
            id: String(row?.id ?? row?.supplement_id ?? ''),
            name: String(row?.name ?? row?.label ?? row?.canonical_name ?? 'Supplement')
          }))
          .filter((r: any) => r.id)
        setActiveSupps(mapped)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [isOpen])

  const handleSimpleToggleSupp = (id: string) => {
    setSelectedSupps(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSimpleSave = async () => {
    try {
      setIsSaving(true)
      setSaveMessage('')
      const tags: string[] = []
      if (noiseAlcohol) tags.push('alcohol')
      if (noiseTravel) tags.push('travel')
      if (noisePoorSleep) tags.push('poor_sleep')
      if (noiseStress) tags.push('high_stress')
      const supplement_intake: Record<string, boolean> = {}
      Object.entries(selectedSupps).forEach(([k, v]) => { if (v) supplement_intake[k] = true })

      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: simpleMood,
          energy: simpleEnergy,
          focus: simpleFocus,
          tags,
          supplement_intake
        })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setSaveMessage(`❌ ${j?.error || 'Failed to save'}`)
        setIsSaving(false)
        return
      }
      setSaveMessage('✅ Check-in saved!')
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('progress:refresh'))
        }
      } catch {}
      // Brief success overlay (reuse existing state)
      try { setShowSuccessConfirm(true) } catch {}
      setTimeout(() => {
        try { setShowSuccessConfirm(false); } catch {}
        safeClose()
      }, 1200)
    } catch (e) {
      setSaveMessage('❌ Failed to save check-in')
    } finally {
      setIsSaving(false)
    }
  }

  // Draft persistence key (per user + date)
  const draftKey = typeof window !== 'undefined' ? `checkinDraft-${userId}-${date}` : '';

  // Context chips state (6-8 total limit)
  const [selectedContextChips, setSelectedContextChips] = useState<string[]>([]);
  const [showMoreContext, setShowMoreContext] = useState(false);
  // Custom context inputs per section
  const [showCustomNutritionInput, setShowCustomNutritionInput] = useState(false);
  const [customNutritionInput, setCustomNutritionInput] = useState('');
  const [showCustomLifestyleInput, setShowCustomLifestyleInput] = useState(false);
  const [customLifestyleInput, setCustomLifestyleInput] = useState('');
  const [showCustomEnvironmentInput, setShowCustomEnvironmentInput] = useState(false);
  const [customEnvironmentInput, setCustomEnvironmentInput] = useState('');
  // Section-specific custom chip lists (display values)
  const [customLifestyleChips, setCustomLifestyleChips] = useState<string[]>([]);
  const [customEnvironmentChips, setCustomEnvironmentChips] = useState<string[]>([]);
  const [customNutritionChips, setCustomNutritionChips] = useState<string[]>([]);
  const [customIllnessChips, setCustomIllnessChips] = useState<string[]>([]);
  const [showCustomIllnessInput, setShowCustomIllnessInput] = useState(false);
  const [customIllnessInput, setCustomIllnessInput] = useState('');
  
  // Symptom tracking state (5 limit)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedPainLocations, setSelectedPainLocations] = useState<string[]>([]);
  const [selectedPainTypes, setSelectedPainTypes] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [customSymptomInput, setCustomSymptomInput] = useState('');
  const [showCustomSymptomInput, setShowCustomSymptomInput] = useState(false);
  const [showMoreSymptoms, setShowMoreSymptoms] = useState(false);
  // Custom pain location/type inputs and lists
  const [customPainLocationsList, setCustomPainLocationsList] = useState<string[]>([]);
  const [customPainLocationInput, setCustomPainLocationInput] = useState('');
  const [showCustomPainLocationInput, setShowCustomPainLocationInput] = useState(false);
  const [customPainTypesList, setCustomPainTypesList] = useState<string[]>([]);
  const [customPainTypeInput, setCustomPainTypeInput] = useState('');
  const [showCustomPainTypeInput, setShowCustomPainTypeInput] = useState(false);

  // Collapsible section states
  // Collapse Today's Vibe by default (both first and subsequent check-ins)
  const [isVibeSectionOpen, setIsVibeSectionOpen] = useState(false);
  const [isContextSectionOpen, setIsContextSectionOpen] = useState(false);
  const [isSymptomsSectionOpen, setIsSymptomsSectionOpen] = useState(false);
  const [showLifeFactorsInfo, setShowLifeFactorsInfo] = useState(false);
  const [showSymptomsInfo, setShowSymptomsInfo] = useState(false);
  const [isNotesSectionOpen, setIsNotesSectionOpen] = useState(false);

  // Handle Elli welcome typing animation for first check-in (onboarding only)
  useEffect(() => {
    if (isOpen && isOnboarding && isActuallyFirstCheckIn) {
      setShowElliTyping(true);
      setShowElliMessage(false);
      
      const timer = setTimeout(() => {
        setShowElliTyping(false);
        setShowElliMessage(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isOnboarding, isActuallyFirstCheckIn]);

  // Ensure collapsible sections start closed whenever a new day opens the drawer
  useEffect(() => {
    mountedRef.current = true;
    if (isOpen) {
      setIsVibeSectionOpen(false);
      setIsContextSectionOpen(false);
      setIsSymptomsSectionOpen(false);
      setIsNotesSectionOpen(false);
    }
    return () => { mountedRef.current = false };
  }, [isOpen, date]);

  // Core symptoms from the brief
  const coreSymptoms = [
    'headache', 'fatigue', 'nausea', 'dizziness', 'brain-fog', 'anxiety', 
    'depression', 'irritability', 'joint-pain', 'muscle-pain', 'stomach-pain', 
    'bloating', 'constipation', 'diarrhea', 'insomnia', 'night-sweats'
  ];

  // Pain locations from the brief
  const painLocations = [
    'head', 'neck', 'shoulders', 'back', 'chest', 'arms', 'hands', 
    'stomach', 'hips', 'legs', 'feet', 'joints'
  ];

  // Pain types
  const painTypes = ['dull', 'sharp', 'nerve', 'stiffness', 'ache'];

  // Contextual Triggers (refined categories - removed scheduled items)
  const contextCategories = {
    lifestyle: [
      '😴 Late to bed', '🍷 Alcohol', '⚠️ High stress', '💼 Work deadline',
      '👥 Social event', '✈️ Travel', '🩸 Period', '🥚 Ovulation',
      '💤 Poor sleep', '🌙 Stayed up late', '🧘 Meditation', '📱 Screen time'
    ],
    nutrition: [
      '🍔 Heavy meal', '🚫 Skipped meal', '💧 Dehydrated', '☕ Too much caffeine',
      '🍰 High sugar', '🌾 Gluten', '🥛 Dairy', '🍕 Fast food',
      '🥗 Ate clean', '💊 Missed supps', '🍺 Hangover', '🥤 Low hydration'
    ],
    illness: [
      '🤧 Cold/Flu', '🤕 Migraine', '🦠 Infection', '🌡️ Fever',
      '🤢 Nausea', '🤮 Vomiting', '😷 Allergies', '🌸 Hay fever',
      '💊 Flare-up', '🩹 Injury', '😵 Dizzy', '🥶 Chills'
    ],
    environment: [
      '🌧️ Weather change', '🥵 Too hot', '🥶 Too cold', '💨 High humidity',
      '🌅 Daylight change', '🌕 Full moon', '🏙️ City pollution', '🏔️ High altitude',
      '🏡 New environment', '🛏️ Different bed', '🔊 Loud noise', '😶‍🌫️ Poor air quality'
    ]
  };

  // Mapping between display format (emoji + text) and slug format for CHIP_CATALOG
  const contextDisplayToSlug: Record<string, string> = {
    '😴 Late to bed': 'late_bed',
    '🍷 Alcohol': 'alcohol_last_night', 
    '⚠️ High stress': 'high_stress',
    '💼 Work deadline': 'big_deadline',
    '👥 Social event': 'social_event',
    '✈️ Travel': 'travel_day',
    '🩸 Period': 'pms_pmdd',
    '🥚 Ovulation': 'ovulation_window',
    '💤 Poor sleep': 'poor_sleep',
    '🌙 Stayed up late': 'late_bed',
    '🧘 Meditation': 'meditation',
    '📱 Screen time': 'overloaded',
    '🍔 Heavy meal': 'high_carb',
    '🚫 Skipped meal': 'fasting',
    '💧 Dehydrated': 'dehydrated',
    '☕ Too much caffeine': 'too_much_caffeine',
    '🍰 High sugar': 'high_carb',
    '🌾 Gluten': 'new_food',
    '🥛 Dairy': 'new_food',
    '🍕 Fast food': 'gi_upset',
    '🥗 Ate clean': 'low_carb',
    '💊 Missed supps': 'missed_dose',
    '🍺 Hangover': 'hangover',
    '🥤 Low hydration': 'dehydrated',
    '🤧 Cold/Flu': 'getting_sick',
    '🤕 Migraine': 'migraine',
    '🦠 Infection': 'getting_sick',
    '🌡️ Fever': 'fever_chills',
    '🤢 Nausea': 'gi_upset',
    '🤮 Vomiting': 'gi_upset',
    '😷 Allergies': 'allergies_high',
    '🌸 Hay fever': 'allergies_high',
    '💊 Flare-up': 'injury_flare',
    '🩹 Injury': 'injury_flare',
    '😵 Dizzy': 'fever_chills',
    '🥶 Chills': 'fever_chills',
    '🌧️ Weather change': 'weather_change',
    '🥵 Too hot': 'too_hot',
    '🥶 Too cold': 'cold_snap',
    '💨 High humidity': 'bad_air',
    '🌅 Daylight change': 'travel_day',
    '🌕 Full moon': 'bad_air',
    '🏙️ City pollution': 'bad_air',
    '🏔️ High altitude': 'high_altitude',
    '🏡 New environment': 'travel_day',
    '🛏️ Different bed': 'travel_day',
    '🔊 Loud noise': 'bad_air',
    '😶‍🌫️ Poor air quality': 'bad_air'
  };

  // Reverse mapping: slug to display format
  const contextSlugToDisplay: Record<string, string> = Object.fromEntries(
    Object.entries(contextDisplayToSlug).map(([display, slug]) => [slug, display])
  );

  // 🎯 Readiness Score Calculation (Mood 20%, Sleep 40%, Pain 40%)
  const readinessScore = useMemo(() => {
    const mood = formData.mood ?? 5;
    const sleep = formData.sleep_quality ?? 5;
    const pain = formData.pain ?? 5;
    
    // Pain is inverted (0 = best, 10 = worst), so we convert it
    const painInverted = 10 - pain;
    
    // Calculate weighted score
    const score = (mood * 0.2) + (sleep * 0.4) + (painInverted * 0.4);
    
    // Convert to percentage 0-100
    return Math.round(((score / 10) * 100));
  }, [formData.mood, formData.sleep_quality, formData.pain]);

  // Meta (color, emoji, message) for readiness percent
  const readinessMeta = useMemo(() => {
    const pct = readinessScore || 0;
    if (pct >= 80) return {
      colorClass: 'text-[#22c55e]',
      emoji: '☀️',
      message: 'Optimal capacity. Great day to tackle what matters most.'
    };
    if (pct >= 50) return {
      colorClass: 'text-[#f59e0b]',
      emoji: '⛵',
      message: 'Balanced energy. Listen to your body and move thoughtfully today.'
    };
    return {
      colorClass: 'text-[#ef4444]',
      emoji: '🏖️',
      message: 'Recovery focus. Prioritize rest and essential tasks only.'
    };
  }, [readinessScore]);

  // Get color and label for readiness score
  const getReadinessDisplay = (score: number) => {
    if (score >= 8) return { color: 'text-green-600', bg: 'bg-green-50', label: 'Excellent', emoji: '🚀' };
    if (score >= 6.5) return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Good', emoji: '✨' };
    if (score >= 5) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Moderate', emoji: '😐' };
    if (score >= 3.5) return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Low', emoji: '⚠️' };
    return { color: 'text-red-600', bg: 'bg-red-50', label: 'Rest Day', emoji: '🛌' };
  };

  // Symptom tracking functions
  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const togglePainLocation = (location: string) => {
    setSelectedPainLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const togglePainType = (type: string) => {
    setSelectedPainTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleContextChip = (chip: string) => {
    setSelectedContextChips(prev => 
      prev.includes(chip) 
        ? prev.filter(c => c !== chip)
        : prev.length < 8 
          ? [...prev, chip]
          : prev // Don't add if at limit
    );
  };

  const toSlug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  const addCustomContextChip = async (raw: string, section: 'nutrition' | 'lifestyle' | 'environment' | 'illness') => {
    const display = raw.trim()
    if (!display) return
    console.log('🔧 Custom tag added:', display, 'in section:', section)
    setSelectedContextChips(prev => (prev.includes(display) ? prev : [...prev, display]))
    // Track in section-specific list so it renders alongside presets
    if (section === 'lifestyle') {
      setCustomLifestyleChips(prev => (prev.includes(display) ? prev : [...prev, display]))
    } else if (section === 'environment') {
      setCustomEnvironmentChips(prev => (prev.includes(display) ? prev : [...prev, display]))
    } else if (section === 'nutrition') {
      setCustomNutritionChips(prev => (prev.includes(display) ? prev : [...prev, display]))
    } else if (section === 'illness') {
      setCustomIllnessChips(prev => (prev.includes(display) ? prev : [...prev, display]))
    }
    // Persist optional section metadata for future grouping
    try {
      await fetch('/api/user-tags/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: toSlug(display), section })
      })
    } catch {}
  }

  const handleAddCustomSymptom = () => {
    if (customSymptomInput.trim()) {
      setCustomSymptoms(prev => [...prev, customSymptomInput.trim()]);
      setCustomSymptomInput('');
      setShowCustomSymptomInput(false);
    }
  };

  const removeCustomSymptom = (symptom: string) => {
    setCustomSymptoms(prev => prev.filter(s => s !== symptom));
  };

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      const newFormData = {
        localDate: date,
        mood: initialData.mood,
        sleep_quality: initialData.sleep_quality,
        pain: initialData.pain,
        tags: initialData.tags,
        journal: initialData.journal
      };
      setFormData(newFormData);
      
      // Separate expressive mood chips from contextual chips
      const allTags = initialData.tags || [];
      console.log('🔍 Loading initial data - allTags:', allTags);
      
      const expressiveMoodChips = allTags.filter(tag => {
        const chip = CHIP_CATALOG.find(c => c.slug === tag);
        console.log(`🔍 Checking tag "${tag}":`, {
          found: !!chip,
          category: chip?.category,
          label: chip?.label,
          isExpressive: chip?.category?.startsWith('expressive')
        });
        return chip?.category?.startsWith('expressive');
      });
      const contextualChips = allTags.filter(tag => {
        const chip = CHIP_CATALOG.find(c => c.slug === tag);
        return chip?.category && !chip.category.startsWith('expressive');
      });
      
      console.log('🔍 Expressive mood chips found:', expressiveMoodChips);
      console.log('🔍 Contextual chips found:', contextualChips);
      
      setSelectedTags(expressiveMoodChips);
      
      // Convert contextual chip slugs back to display format
      const contextChipsFromSlugs = contextualChips.map(slug => contextSlugToDisplay[slug] || slug);
      setSelectedContextChips(contextChipsFromSlugs);
      
      setShowAdvanced(false);
      setSnapshotData(initialData.actions_snapshot);
    } else {
      // Default sliders to mid-point (5) when starting a new check-in
      const newFormData = {
        localDate: date,
        mood: 5,
        sleep_quality: 5,
        pain: 5,
        tags: null,
        journal: null
      };
      setFormData(newFormData);
      setSelectedTags([]);
      setShowAdvanced(false);
      setSnapshotData(null);
    }
    setSaveMessage('');
  }, [date, initialData]);

  // Preselect yesterday's tags when starting a new check-in (no initialData.tags and no draft)
  useEffect(() => {
    const shouldPrefill = isOpen
      && (!initialData || !Array.isArray(initialData.tags) || initialData.tags.length === 0)
      && selectedTags.length === 0
      && selectedContextChips.length === 0
    if (!shouldPrefill) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/entries/latest-tags', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        const prev: string[] = Array.isArray(json?.previous_tags) ? json.previous_tags : []
        if (!prev.length) return
        // Split into expressive mood chips vs contextual chips
        const expressive: string[] = []
        const contextual: string[] = []
        prev.forEach((slug) => {
          const chip = CHIP_CATALOG.find(c => c.slug === slug)
          if (chip?.category?.startsWith('expressive')) {
            if (!expressive.includes(slug)) expressive.push(slug)
          } else {
            const display = contextSlugToDisplay[slug] || slug
            if (!contextual.includes(display)) contextual.push(display)
          }
        })
        if (!cancelled && expressive.length > 0) setSelectedTags(expressive.slice(0, 4))
        if (!cancelled && contextual.length > 0) setSelectedContextChips(contextual)
      } catch {}
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Load draft from localStorage when opening (after initialData processing)
  useEffect(() => {
    if (!isOpen || !draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const d = JSON.parse(saved);
        if (d?.formData) setFormData((prev) => ({ ...prev, ...d.formData }));
        if (Array.isArray(d?.selectedTags)) setSelectedTags(d.selectedTags);
        if (Array.isArray(d?.selectedContextChips)) setSelectedContextChips(d.selectedContextChips);
        if (Array.isArray(d?.selectedSymptoms)) setSelectedSymptoms(d.selectedSymptoms);
        if (Array.isArray(d?.selectedPainLocations)) setSelectedPainLocations(d.selectedPainLocations);
        if (Array.isArray(d?.selectedPainTypes)) setSelectedPainTypes(d.selectedPainTypes);
        if (Array.isArray(d?.customSymptoms)) setCustomSymptoms(d.customSymptoms);
      }
    } catch {}
  }, [isOpen, draftKey]);

  // Persist draft to localStorage while editing (for the day session)
  useEffect(() => {
    if (!isOpen || !draftKey) return;
    try {
      const payload = {
        formData,
        selectedTags,
        selectedContextChips,
        selectedSymptoms,
        selectedPainLocations,
        selectedPainTypes,
        customSymptoms
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch {}
  }, [isOpen, draftKey, formData, selectedTags, selectedContextChips, selectedSymptoms, selectedPainLocations, selectedPainTypes, customSymptoms]);

  // Load snapshot data
  useEffect(() => {
    if (isOpen && includeSnapshot) {
      loadSnapshotData();
    }
  }, [isOpen, includeSnapshot, date, todayItems]);

  const loadSnapshotData = async () => {
    try {
      if (!todayItems) {
        setSnapshotData(null);
        return;
      }

      // Build snapshot data from todayItems
      const snapshot = {
        supplements_taken_count: todayItems.supplements.length,
        meds_taken_count: todayItems.supplements.filter(item => 
          item.name?.toLowerCase().includes('medication') || 
          item.name?.toLowerCase().includes('prescription')
        ).length,
        movement_minutes: todayItems.movement.reduce((total, item) => total + (parseInt(item.dose) || 0), 0),
        mindfulness_minutes: todayItems.mindfulness.reduce((total, item) => total + (parseInt(item.dose) || 0), 0),
        protocols_active: todayItems.protocols.length,
        supplements: todayItems.supplements.map(item => ({
          name: item.name,
          dose: item.dose || '1',
          unit: 'unit'
        })),
        meds: todayItems.supplements.filter(item => 
          item.name?.toLowerCase().includes('medication') || 
          item.name?.toLowerCase().includes('prescription')
        ).map(item => ({
          name: item.name,
          dose: item.dose || '1',
          unit: 'unit'
        })),
        activity: todayItems.movement.map(item => ({
          name: item.name,
          duration_min: parseInt(item.dose) || 0
        })),
        mindfulness: todayItems.mindfulness.map(item => ({
          name: item.name,
          duration_min: parseInt(item.dose) || 0
        })),
        protocols: todayItems.protocols.map(item => ({
          name: item.name,
          frequency: item.frequency || 'daily'
        }))
      };

      setSnapshotData(snapshot);
    } catch (error) {
      console.error('Error loading snapshot data:', error);
    }
  };

  // Handle save function
  const safeClose = () => { try { if (mountedRef.current && typeof onClose === 'function') onClose(); } catch {} };
  const handleSave = async () => {
    console.log('🔍 SAVE BUTTON CLICKED!');
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Get ALL scheduled items for the date, not just completed ones
      const targetDate = date || new Date().toLocaleDateString('sv-SE'); // Use passed date or today
      
      // For now, skip the scheduled items API and just save mood data
      // This will fix the save error immediately
      let allScheduledItems: any[] = [];

      // Clear pain-related data if pain = 0
      const currentPain = formData.pain || 0;
      const shouldClearPainData = currentPain === 0;

      // Convert context chips from display format to slug format for database storage
      const contextChipsAsSlugs = selectedContextChips.map(chip => contextDisplayToSlug[chip] || toSlug(chip));
      
      // Combine expressive mood chips (selectedTags) with contextual chips (selectedContextChips) and dedupe
      const allTags = Array.from(new Set([...selectedTags, ...contextChipsAsSlugs]));
      
      console.log('🔍 Saving - selectedTags (expressive mood chips):', selectedTags);
      console.log('🔍 Saving - contextChipsAsSlugs (contextual chips):', contextChipsAsSlugs);
      console.log('🔍 Saving - allTags combined:', allTags);
      console.log('🔍 Saving - selectedTags details:', selectedTags.map(tag => {
        const chip = CHIP_CATALOG.find(c => c.slug === tag);
        return {
          slug: tag,
          label: chip?.label,
          category: chip?.category
        };
      }));
      
      const savePayload = {
        ...formData,
        tags: allTags.length > 0 ? allTags : null, // Include both expressive mood chips and contextual chips (deduped)
        completedItems: allScheduledItems.length > 0 ? allScheduledItems : null,
        wearables: wearables.recovery_score || wearables.sleep_score ? {
          device: selectedWearable,
          ...wearables
        } : null,
        // Add symptom tracking data
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : null,
        pain_locations: shouldClearPainData ? [] : (selectedPainLocations.length > 0 ? selectedPainLocations : null),
        pain_types: shouldClearPainData ? [] : (selectedPainTypes.length > 0 ? selectedPainTypes : null),
        custom_symptoms: customSymptoms.length > 0 ? customSymptoms : null
      };
      
      console.log('=== MOOD TRACKER DEBUG ===');
      console.log('User ID:', userId);
      console.log('Date:', date);
      console.log('localStorage key:', `completedItems-${userId}-${targetDate}`);
      console.log('Raw localStorage value:', localStorage.getItem(`completedItems-${userId}-${targetDate}`));
      console.log('Parsed completed items:', allScheduledItems);
      console.log('=========================');
      
      console.log('🔍 Save payload:', savePayload);
      console.log('🔍 Save payload completedItems (all scheduled):', savePayload.completedItems);
      console.log('🔍 Save payload wearables:', savePayload.wearables);
      console.log('🔍 Selected wearable:', selectedWearable);
      console.log('🔍 Wearables object structure:', JSON.stringify(savePayload.wearables, null, 2));

      let result = await saveDailyEntry(savePayload);
      
      // If auth is stale (common after the app sits idle, esp. incognito),
      // force-refresh the Supabase session on the client and retry once.
      if (!result.ok && /auth/i.test(result.error || '')) {
        try {
          setSaveMessage('Reconnecting…');
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          // Force a session fetch/refresh
          await supabase.auth.getSession();
          await supabase.auth.refreshSession();
          // Retry once
          result = await saveDailyEntry(savePayload);
        } catch (e) {
          console.warn('Auth refresh failed, will show friendly error.', e);
        }
      }

      if (result.ok) {
        setSaveMessage('✅ Check-in saved!');
        console.log('✅ Save successful:', result.data);

        // Track first check-in
        try {
          if (isActuallyFirstCheckIn) {
            const supplementCount = todayItems?.supplements?.length || 0;
            const protocolCount = todayItems?.protocols?.length || 0;
            trackEvent('first_check_in', {
              user_id: userId,
              has_supplements: supplementCount > 0,
              has_protocols: protocolCount > 0
            });
          }
        } catch {}
        
        // If in orchestrated onboarding, pass data to orchestrator
        if (isOnboarding && onOnboardingComplete) {
          console.log('🎯 Onboarding check-in complete, passing data to orchestrator');
          
          onOnboardingComplete({
            mood: formData.mood,
            sleep: formData.sleep_quality,
            pain: formData.pain,
            symptoms: selectedSymptoms,
            pain_locations: selectedPainLocations,
            pain_types: selectedPainTypes,
            custom_symptoms: customSymptoms,
            tags: selectedContextChips,
            journal: formData.journal
          });
          
          return; // Exit early - orchestrator handles the rest
        }
        
        // Generate Elli message after successful save (non-onboarding flow)
        try {
          console.log('💙 Generating Elli message (always replace today on new check-in)...');
          // Always generate a fresh post_checkin message on any same-day check-in
          const tzOffsetMinutes = (() => { try { return new Date().getTimezoneOffset() } catch { return 0 } })()
          await generateAndSaveElliMessage(userId, 'post_checkin', {
            pain: formData.pain || 0,
            mood: formData.mood || 0,
            sleep: formData.sleep_quality || 0
          }, { tzOffsetMinutes });
          
          console.log('💙 Elli message generated successfully');
          // Track a simple pattern detection placeholder if needed
          // Real tracking should happen where patterns are actually computed/shown
          // trackEvent('pattern_detected', { pattern_type: 'supplement', confidence: 'high' })
        } catch (error) {
          console.error('💙 Error generating Elli message:', error);
          // Don't block user flow if Elli fails
        }
        
        // Clear draft after successful save
        try { if (draftKey) localStorage.removeItem(draftKey); } catch {}

        // Immediately refresh dashboard progress (without full reload)
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('progress:refresh'))
          }
        } catch {}

        // Show post-check-in modal ONLY during orchestrated onboarding
        if (isOnboarding && isActuallyFirstCheckIn && !firstCheckInLoading) {
          try {
            const insightData = await generateFirstInsight({
              mood: formData.mood ?? null,
              sleep_quality: formData.sleep_quality ?? null,
              pain: formData.pain ?? null
            });
            
            setPostCheckinData({
              dayOneData: {
                mood: formData.mood ?? null,
                sleep_quality: formData.sleep_quality ?? null,
                pain: formData.pain ?? null,
                symptoms: selectedSymptoms || [],
                pain_locations: selectedPainLocations || [],
                pain_types: selectedPainTypes || [],
                custom_symptoms: customSymptoms || []
              },
              communityStats: insightData.communityStats,
              personalizedInsight: {
                message: insightData.message,
                type: insightData.type
              }
            });
            
            setShowPostCheckinModal(true);
          } catch (error) {
            console.error('Error generating first insight:', error);
            // Fallback to normal close behavior
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        } else {
          // Normal behavior for subsequent check-ins:
          // 1) Show brief success confirmation with new design
          // 2) Offer reminders prompt if applicable, else close
          try {
            setShowSuccessConfirm(true);
          } catch {}
          setTimeout(() => {
            try {
              setShowSuccessConfirm(false);
              if (!mountedRef.current) return;
              const hasShown = localStorage.getItem('pushPromptShown');
              if (!hasShown && isActuallyFirstCheckIn) {
                setShowReminderPrompt(true);
              } else {
                safeClose();
              }
            } catch {
              safeClose();
            }
          }, 1200);
        }
      } else {
        const friendly = /auth/i.test(result.error || '')
          ? '❌ Session expired. Please try again — we just reconnected.'
          : `❌ ${result.error}`;
        setSaveMessage(friendly);
        console.error('❌ Save failed:', result.error);
        console.error('❌ Save payload that failed:', savePayload);
        console.error('❌ All scheduled items:', allScheduledItems);
      }
    } catch (error) {
      console.error('Error saving daily entry:', error);
      setSaveMessage('❌ Failed to save check-in');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyboard);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, handleSave]);

  // Load completed items after client mount to avoid hydration issues
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && date) {
      const targetDate = date || new Date().toLocaleDateString('sv-SE');
      const storageKey = `completedItems-${userId}-${targetDate}`;
      
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('🔍 Loaded completed items on mount:', parsed);
        }
      } catch (error) {
        console.warn('Error loading completed items on mount:', error);
      }
    }
  }, [userId, date]);

  const updateField = (field: keyof SaveDailyEntryInput, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
  };

  const toggleTag = (tag: string) => {
    console.log('🔍 toggleTag called with:', tag);
    setSelectedTags(prev => {
      console.log('🔍 toggleTag - current selectedTags:', prev);
      if (prev.includes(tag)) {
        // Remove tag if already selected
        const newTags = prev.filter(t => t !== tag);
        console.log('🔍 toggleTag - removing tag, new tags:', newTags);
        return newTags;
      } else if (prev.length < 4) {
        // Add tag if under limit
        const newTags = [...prev, tag];
        console.log('🔍 toggleTag - adding tag, new tags:', newTags);
        return newTags;
      } else {
        // Already at limit, don't add
        console.log('🔍 toggleTag - at limit, no change');
        return prev;
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Smart tag suggestions based on current values
  const getSuggestedTags = () => {
    const suggestions: any[] = [];
    
    if (formData.sleep_quality && formData.sleep_quality <= 3) {
      suggestions.push(...getChipsByCategory('sleep'));
    }
    
    if (formData.mood && formData.mood <= 3) {
      suggestions.push(...getChipsByCategory('stress'));
    }
    
    if (formData.pain && formData.pain >= 7) {
      suggestions.push(...getChipsByCategory('pain'));
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  };

  const suggestedTags = getSuggestedTags();
  const otherTags = CHIP_CATALOG.filter(chip => !suggestedTags.some(s => s.slug === chip.slug));

  const hasChanges = () => {
    // Always allow saving - don't check for changes
    return true;
  };

  if (!isOpen) return null;

  // SIMPLE BioStackr Drawer (Mood, Energy, Focus, Supplements, Noise)
  const SIMPLE_MODE = true
  if (SIMPLE_MODE) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Daily Check‑in</h2>
                  <p className="text-xs sm:text-sm text-gray-600">{new Date(date).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-8">
              {/* Sliders */}
              <div className="space-y-6">
                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={simpleMood}
                      onChange={(e) => setSimpleMood(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 min-w-[2rem] text-center">{simpleMood}</span>
                  </div>
                </div>
                {/* Energy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Energy</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={simpleEnergy}
                      onChange={(e) => setSimpleEnergy(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 min-w-[2rem] text-center">{simpleEnergy}</span>
                  </div>
                </div>
                {/* Focus */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Focus</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={simpleFocus}
                      onChange={(e) => setSimpleFocus(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 min-w-[2rem] text-center">{simpleFocus}</span>
                  </div>
                </div>
              </div>

              {/* Supplements taken today */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Which supplements did you take today?</label>
                <div className="space-y-2">
                  {activeSupps.length === 0 && (
                    <div className="text-sm text-gray-500">No active supplements found.</div>
                  )}
                  {activeSupps.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={!!selectedSupps[s.id]}
                        onChange={() => handleSimpleToggleSupp(s.id)}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-gray-800">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Noise factors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Noise factors (optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNoiseAlcohol(v => !v)}
                    className={`px-3 py-2 rounded-lg border text-sm ${noiseAlcohol ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-300'}`}
                  >
                    Alcohol
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoiseTravel(v => !v)}
                    className={`px-3 py-2 rounded-lg border text-sm ${noiseTravel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-300'}`}
                  >
                    Travel
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoisePoorSleep(v => !v)}
                    className={`px-3 py-2 rounded-lg border text-sm ${noisePoorSleep ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-300'}`}
                  >
                    Poor sleep
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoiseStress(v => !v)}
                    className={`px-3 py-2 rounded-lg border text-sm ${noiseStress ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-300'}`}
                  >
                    Stress
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-gray-600">{saveMessage}</div>
                <button
                  onClick={handleSimpleSave}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white shadow hover:shadow-md transition disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Lightweight success confirmation */}
            {showSuccessConfirm && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <h3 className="text-base font-semibold text-gray-900">Check-in saved</h3>
                    <p className="text-sm text-gray-600 mt-1">Thanks — your progress just updated.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0" style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#d1d5db #f3f4f6',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center sm:text-left">
                  {isActuallyFirstCheckIn ? "Let's Get Started! 👋" : 'Daily Check-in'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">{isActuallyFirstCheckIn ? 'Your first check-in' : formatDate(date)}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

        {/* Step 2 intro (no blue box) */}
        {isOnboarding && isActuallyFirstCheckIn && (
          <div className="px-6 pt-6">
            <div className="text-center mb-6 space-y-3">
              <div className="flex items-center justify-center gap-2 mb-4">
                {/* Brand icon */}
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="24" y1="8" x2="24" y2="15" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="24" y1="33" x2="24" y2="40" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="8" y1="24" x2="15" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="33" y1="24" x2="40" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="13" y1="13" x2="18" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="30" y1="30" x2="35" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="35" y1="13" x2="30" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="18" y1="30" x2="13" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M24 18L28 24L24 30L20 24Z" fill="#F4B860"/>
                </svg>
                <p className="text-xl">Hey {userName}</p>
              </div>
              <p className="text-base text-gray-700">Let's see where you're at today.</p>
              <div className="space-y-1 text-base">
                <p><strong>1.</strong> Move the sliders</p>
                <p><strong>2.</strong> Choose life factors and symptoms</p>
              </div>
              {/* Intentionally simplified per onboarding brief */}
            </div>
          </div>
        )}

          {/* Removed old intro block per final brief */}

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Sliders */}
            <div>
              <div className="space-y-6">
                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mood
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.mood || 5}
                      onChange={(e) => {
                        updateField('mood', parseInt(e.target.value));
                        if (!hasMovedSliders) setHasMovedSliders(true);
                      }}
                      className="flex-1 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                      }}
                    />
                    <span className="text-xs text-gray-500 min-w-[4rem] text-center">
                      {formData.mood || 5}/10
                    </span>
                  </div>
                </div>

                {/* Sleep Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sleep Quality
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.sleep_quality || 5}
                      onChange={(e) => {
                        updateField('sleep_quality', parseInt(e.target.value));
                        if (!hasMovedSliders) setHasMovedSliders(true);
                      }}
                      className="flex-1 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                      }}
                    />
                    <span className="text-xs text-gray-500 min-w-[4rem] text-center">
                      {formData.sleep_quality || 5}/10
                    </span>
                  </div>
                </div>

                {/* Pain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pain / Soreness
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formData.pain || 5}
                      onChange={(e) => {
                        updateField('pain', parseInt(e.target.value));
                        if (!hasMovedSliders) setHasMovedSliders(true);
                      }}
                      className="flex-1 h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
                      }}
                    />
                    <span className="text-xs text-gray-500 min-w-[4rem] text-center">
                      {formData.pain || 0}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>

          {/* Removed explainer box per onboarding screen consolidation */}

          {/* 🎯 Readiness Score Display - Standalone */}
            <div className="text-center py-2">
              <div className="flex items-center justify-center space-x-3">
                <span className={`text-3xl font-bold ${readinessMeta.colorClass}`}>
                  {readinessScore}%
                </span>
                <span className="text-2xl">{readinessMeta.emoji}</span>
                <span className="text-sm font-medium text-gray-700 ml-2">Today's Readiness</span>
              </div>
              <div className="mt-1 text-sm text-gray-900 text-center clamp-2-lines-mobile">
                {readinessMeta.message}
              </div>
            </div>

            {/* Life Factors - Collapsible (moved up) */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setIsContextSectionOpen(!isContextSectionOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌍</span>
                  <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">Life Factors</h3>
                  <span className="text-xs text-gray-400 font-normal">Help us find your patterns faster – select what applies</span>
                  {selectedContextChips.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {selectedContextChips.length} selected
                    </span>
                  )}
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${isContextSectionOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {/* Life Factors content - shown when expanded */}
              {isContextSectionOpen && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4">
                  {showLifeFactorsInfo && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm">
                      <p className="text-gray-700">
                        <strong>Life factors help Elli spot patterns.</strong> When you tag "caffeine" or "high stress," Elli can show you how these affect your sleep, mood, and pain over time.
                      </p>
                    </div>
                  )}
                  {/* Lifestyle */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Lifestyle</h4>
                    <div className="flex flex-wrap gap-2">
                      {[...contextCategories.lifestyle, ...customLifestyleChips].map(chip => {
                        const isSelected = selectedContextChips.includes(chip);
                        const isCustom = customLifestyleChips.includes(chip);
                        return (
                          <button
                            key={chip}
                            onClick={() => toggleContextChip(chip)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-800 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            } ${isCustom ? 'ring-1 ring-pink-400' : ''}`}
                          >
                            {isCustom && <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 mr-1.5" />}
                            {chip}
                          </button>
                        );
                      })}
                      {/* Add custom activity tag */}
                      {!showCustomLifestyleInput ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowCustomLifestyleInput(true)}
                            className="px-3 py-1.5 bg-pink-50 border-2 border-dashed border-pink-500 text-pink-600 rounded-full hover:bg-pink-100"
                          >
                            + Add custom
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowLifeFactorsInfo(!showLifeFactorsInfo) }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                            aria-label="About custom life factors"
                          >
                            ℹ️
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={customLifestyleInput}
                            onChange={(e) => setCustomLifestyleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addCustomContextChip(customLifestyleInput, 'lifestyle')
                                setCustomLifestyleInput('')
                                setShowCustomLifestyleInput(false)
                              }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type an activity (e.g. long_run)"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              addCustomContextChip(customLifestyleInput, 'lifestyle')
                              setCustomLifestyleInput('')
                              setShowCustomLifestyleInput(false)
                            }}
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setShowCustomLifestyleInput(false); setCustomLifestyleInput('') }}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Environment */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Environment</h4>
                    <div className="flex flex-wrap gap-2">
                      {[...contextCategories.environment, ...customEnvironmentChips].map(chip => {
                        const isSelected = selectedContextChips.includes(chip);
                        const isCustom = customEnvironmentChips.includes(chip);
                        return (
                          <button
                            key={chip}
                            onClick={() => toggleContextChip(chip)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-800 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            } ${isCustom ? 'ring-1 ring-pink-400' : ''}`}
                          >
                            {isCustom && <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 mr-1.5" />}
                            {chip}
                          </button>
                        );
                      })}
                      {/* Add custom context tag */}
                      {!showCustomEnvironmentInput ? (
                        <button
                          onClick={() => setShowCustomEnvironmentInput(true)}
                          className="px-3 py-1.5 bg-pink-50 border-2 border-dashed border-pink-500 text-pink-600 rounded-full hover:bg-pink-100"
                        >
                          + Add custom
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={customEnvironmentInput}
                            onChange={(e) => setCustomEnvironmentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addCustomContextChip(customEnvironmentInput, 'environment')
                                setCustomEnvironmentInput('')
                                setShowCustomEnvironmentInput(false)
                              }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a context tag (e.g. pollen_high)"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              addCustomContextChip(customEnvironmentInput, 'environment')
                              setCustomEnvironmentInput('')
                              setShowCustomEnvironmentInput(false)
                            }}
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setShowCustomEnvironmentInput(false); setCustomEnvironmentInput('') }}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nutrition */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Nutrition</h4>
                    <div className="flex flex-wrap gap-2">
                      {[...contextCategories.nutrition, ...customNutritionChips].map(chip => {
                        const isSelected = selectedContextChips.includes(chip);
                        const isCustom = customNutritionChips.includes(chip);
                        return (
                          <button
                            key={chip}
                            onClick={() => toggleContextChip(chip)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-800 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            } ${isCustom ? 'ring-1 ring-pink-400' : ''}`}
                          >
                            {isCustom && <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 mr-1.5" />}
                            {chip}
                          </button>
                        );
                      })}
                      {/* Add custom nutrition tag */}
                      {!showCustomNutritionInput ? (
                        <button
                          onClick={() => setShowCustomNutritionInput(true)}
                          className="px-3 py-1.5 bg-pink-50 border-2 border-dashed border-pink-500 text-pink-600 rounded-full hover:bg-pink-100"
                        >
                          + Add custom
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={customNutritionInput}
                            onChange={(e) => setCustomNutritionInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addCustomContextChip(customNutritionInput, 'nutrition')
                                setCustomNutritionInput('')
                                setShowCustomNutritionInput(false)
                              }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a food trigger (e.g. ate_sushi)"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              addCustomContextChip(customNutritionInput, 'nutrition')
                              setCustomNutritionInput('')
                              setShowCustomNutritionInput(false)
                            }}
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setShowCustomNutritionInput(false); setCustomNutritionInput('') }}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Illness / Health */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Illness / Health</h4>
                    <div className="flex flex-wrap gap-2">
                      {[...contextCategories.illness, ...customIllnessChips].map(chip => {
                        const isSelected = selectedContextChips.includes(chip);
                        return (
                          <button
                            key={chip}
                            onClick={() => toggleContextChip(chip)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-800 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                      {/* Add custom illness/health tag */}
                      {!showCustomIllnessInput ? (
                        <button
                          onClick={() => setShowCustomIllnessInput(true)}
                          className="px-3 py-1.5 bg-pink-50 border-2 border-dashed border-pink-500 text-pink-600 rounded-full hover:bg-pink-100"
                        >
                          + Add custom
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={customIllnessInput}
                            onChange={(e) => setCustomIllnessInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addCustomContextChip(customIllnessInput, 'illness')
                                setCustomIllnessInput('')
                                setShowCustomIllnessInput(false)
                              }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a health tag (e.g. sinus_issue)"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              addCustomContextChip(customIllnessInput, 'illness')
                              setCustomIllnessInput('')
                              setShowCustomIllnessInput(false)
                            }}
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setShowCustomIllnessInput(false); setCustomIllnessInput('') }}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Symptoms - Collapsible (second) */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setIsSymptomsSectionOpen(!isSymptomsSectionOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🩺</span>
                  <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">Symptoms</h3>
                  <span className="text-xs text-gray-400 font-normal">Tell us what symptoms you're feeling today</span>
                  {(() => {
                    const totalSelected = selectedSymptoms.length + customSymptoms.length + selectedPainLocations.length + selectedPainTypes.length;
                    return totalSelected > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {totalSelected} selected
                      </span>
                    )
                  })()}
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${isSymptomsSectionOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              {/* Symptoms content - shown when expanded (existing) */}
              {isSymptomsSectionOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                  {showSymptomsInfo && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm">
                      <p className="text-gray-700">
                        <strong>Symptoms help Elli find connections.</strong> Tagging "headache" or "brain fog" lets Elli reveal patterns like: "Headaches after poor sleep" or "Brain fog linked to dairy."
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {coreSymptoms.map(symptom => {
                      const isSelected = selectedSymptoms.includes(symptom);
                      const isDisabled = !isSelected && (selectedSymptoms.length + customSymptoms.length) >= 5;
                      return (
                        <button
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          disabled={isDisabled}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                            selectedSymptoms.includes(symptom)
                              ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-800 shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                  {/* Custom symptoms */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Custom symptoms</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowCustomSymptomInput(!showCustomSymptomInput)}
                          className="px-3 py-1.5 bg-pink-50 border-2 border-dashed border-pink-500 text-pink-600 rounded-full hover:bg-pink-100 text-sm"
                        >
                          {showCustomSymptomInput ? 'Hide' : '+ Add custom'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowSymptomsInfo(!showSymptomsInfo) }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                          aria-label="About custom symptoms"
                        >
                          ℹ️
                        </button>
                      </div>
                    </div>
                    {showCustomSymptomInput && (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={customSymptomInput}
                          onChange={(e) => setCustomSymptomInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Type a symptom..."
                        />
                        <button
                          onClick={handleAddCustomSymptom}
                          className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                    
                    {/* Display custom symptoms */}
                    {customSymptoms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customSymptoms.map((symptom, index) => (
                          <div
                            key={index}
                            className="px-3 py-1.5 text-sm rounded-full border border-gray-300 text-gray-700 bg-gray-50"
                          >
                            <span className="mr-2">{symptom}</span>
                            <button
                              onClick={() => removeCustomSymptom(symptom)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pain details - only show if pain > 0 */}
                  {(formData.pain || 5) > 0 && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      {/* Pain locations */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Where is the pain?</h4>
                        <div className="flex flex-wrap gap-2">
                          {[...painLocations, ...customPainLocationsList].map(location => {
                            const isSelected = selectedPainLocations.includes(location);
                            const isCustom = customPainLocationsList.includes(location);
                            return (
                              <button
                                key={location}
                                onClick={() => togglePainLocation(location)}
                                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-800 shadow-sm'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                } ${isCustom ? 'ring-1 ring-pink-400' : ''}`}
                              >
                                {isCustom && <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 mr-1.5" />}
                                {location}
                              </button>
                            );
                          })}
                          {!showCustomPainLocationInput ? (
                            <button
                              onClick={() => setShowCustomPainLocationInput(true)}
                              className="px-3 py-1.5 bg-pink-50 border-2 border-dashed border-pink-500 text-pink-600 rounded-full hover:bg-pink-100"
                            >
                              + Add custom
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                type="text"
                                value={customPainLocationInput}
                                onChange={(e) => setCustomPainLocationInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const v = customPainLocationInput.trim()
                                    if (v) {
                                      setCustomPainLocationsList(prev => prev.includes(v) ? prev : [...prev, v])
                                      setSelectedPainLocations(prev => prev.includes(v) ? prev : [...prev, v])
                                    }
                                    setCustomPainLocationInput('')
                                    setShowCustomPainLocationInput(false)
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add a location (e.g. jaw, ribs)"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  const v = customPainLocationInput.trim()
                                  if (v) {
                                    setCustomPainLocationsList(prev => prev.includes(v) ? prev : [...prev, v])
                                    setSelectedPainLocations(prev => prev.includes(v) ? prev : [...prev, v])
                                  }
                                  setCustomPainLocationInput('')
                                  setShowCustomPainLocationInput(false)
                                }}
                                className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => { setShowCustomPainLocationInput(false); setCustomPainLocationInput('') }}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pain types */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">What type of pain?</h4>
                        <div className="flex flex-wrap gap-2">
                          {[...painTypes, ...customPainTypesList].map(type => {
                            const isSelected = selectedPainTypes.includes(type);
                            const isCustom = customPainTypesList.includes(type);
                            return (
                              <button
                                key={type}
                                onClick={() => togglePainType(type)}
                                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-800 shadow-sm'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                } ${isCustom ? 'ring-1 ring-pink-400' : ''}`}
                              >
                                {isCustom && <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 mr-1.5" />}
                                {type}
                              </button>
                            );
                          })}
                          {!showCustomPainTypeInput ? (
                            <button
                              onClick={() => setShowCustomPainTypeInput(true)}
                              className="px-3 py-1.5 bg-pink-50 border-2 border-dashed border-pink-500 text-pink-600 rounded-full hover:bg-pink-100"
                            >
                              + Add custom
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                type="text"
                                value={customPainTypeInput}
                                onChange={(e) => setCustomPainTypeInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const v = customPainTypeInput.trim()
                                    if (v) {
                                      setCustomPainTypesList(prev => prev.includes(v) ? prev : [...prev, v])
                                      setSelectedPainTypes(prev => prev.includes(v) ? prev : [...prev, v])
                                    }
                                    setCustomPainTypeInput('')
                                    setShowCustomPainTypeInput(false)
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add a pain type (e.g. burning)"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  const v = customPainTypeInput.trim()
                                  if (v) {
                                    setCustomPainTypesList(prev => prev.includes(v) ? prev : [...prev, v])
                                    setSelectedPainTypes(prev => prev.includes(v) ? prev : [...prev, v])
                                  }
                                  setCustomPainTypeInput('')
                                  setShowCustomPainTypeInput(false)
                                }}
                                className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => { setShowCustomPainTypeInput(false); setCustomPainTypeInput('') }}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                    <textarea
                      value={formData.journal || ''}
                      onChange={(e) => updateField('journal', e.target.value || null)}
                      placeholder="Any quick notes about today?"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      ~200 chars is perfect
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Today's Vibe - Collapsible (third) */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setIsVibeSectionOpen(!isVibeSectionOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">✨</span>
                  <h3 className="text-base font-medium text-gray-900">Today's Vibe</h3>
                  <span className="text-xs text-gray-400 font-normal">How would you describe today? (Optional)</span>
                  {selectedTags.length > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {selectedTags.length} selected
                    </span>
                  )}
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${isVibeSectionOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {/* Vibe content - shown when expanded (existing UI restored here) */}
              {isVibeSectionOpen && (
                <div className="px-4 pb-4 border-t border-gray-100 max-h-96 overflow-y-auto">
                  {/* High Energy */}
                  <div className="mb-4 mt-4">
                    <h4 className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Feeling Great</h4>
                    <div className="flex flex-wrap gap-2">
                      {getChipsByCategory('expressive_high').map(chip => {
                        const isSelected = selectedTags.includes(chip.slug);
                        return (
                          <button
                            key={chip.slug}
                            onClick={() => toggleTag(chip.slug)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-800 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span className="mr-1">{chip.icon}</span>
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Neutral/Steady */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Steady / Managing</h4>
                    <div className="flex flex-wrap gap-2">
                      {getChipsByCategory('expressive_neutral').map(chip => {
                        const isSelected = selectedTags.includes(chip.slug);
                        return (
                          <button
                            key={chip.slug}
                            onClick={() => toggleTag(chip.slug)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 text-blue-800 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span className="mr-1">{chip.icon}</span>
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Low Energy */}
                  <div>
                    <h4 className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">Struggling</h4>
                    <div className="flex flex-wrap gap-2">
                      {getChipsByCategory('expressive_low').map(chip => {
                        const isSelected = selectedTags.includes(chip.slug);
                        return (
                          <button
                            key={chip.slug}
                            onClick={() => toggleTag(chip.slug)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-red-100 to-orange-100 border-red-300 text-red-800 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span className="mr-1">{chip.icon}</span>
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Wearables */}
            <details className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <summary 
                className="cursor-pointer text-base text-gray-700 flex items-center justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <div className="flex items-center space-x-2">
                  <span>Add Wearable Data</span>
                  <span className="text-xs text-gray-400 font-normal">Optional — Manual Entry</span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              
              {showAdvanced && (
                <div className="mt-3 space-y-4">
                  {/* Helper text */}
                  <p className="text-sm text-gray-600">
                    Manually enter your sleep and recovery scores from Whoop, Oura, etc. (Direct device import coming soon)
                  </p>
                  {/* Device Type Selector */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Device Type
                    </label>
                    <select
                      value={selectedWearable}
                      onChange={(e) => setSelectedWearable(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select device...</option>
                      <option value="Whoop">Whoop</option>
                      <option value="Oura">Oura</option>
                      <option value="Superhuman">Superhuman</option>
                      <option value="Apple Watch">Apple Watch</option>
                      <option value="Garmin">Garmin</option>
                      <option value="Fitbit">Fitbit</option>
                      <option value="Samsung Galaxy Watch">Samsung Galaxy Watch</option>
                      <option value="Polar">Polar</option>
                      <option value="Suunto">Suunto</option>
                      <option value="Coros">Coros</option>
                      <option value="Amazfit">Amazfit</option>
                      <option value="Huawei Watch">Huawei Watch</option>
                      <option value="Withings">Withings</option>
                      <option value="Misfit">Misfit</option>
                      <option value="Jawbone">Jawbone</option>
                      <option value="Xiaomi Mi Band">Xiaomi Mi Band</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Recovery Score */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Recovery Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={wearables.recovery_score || ''}
                      onChange={(e) => setWearables(prev => ({ ...prev, recovery_score: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="e.g., 85"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Sleep Score */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Sleep Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={wearables.sleep_score || ''}
                      onChange={(e) => setWearables(prev => ({ ...prev, sleep_score: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="e.g., 78"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </details>


            {/* Save Message */}
            {saveMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                saveMessage.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {saveMessage}
              </div>
            )}


            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!!(isSaving || (isOnboarding && isActuallyFirstCheckIn && !Boolean(hasMovedSliders)))}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isSaving ? (isActuallyFirstCheckIn ? 'Processing...' : 'Saving...') : (isActuallyFirstCheckIn ? 'Next' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightweight success confirmation (new design language) */}
      {showSuccessConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 text-center">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="text-base font-semibold text-gray-900">Check-in saved</h3>
              <p className="text-sm text-gray-600 mt-1">Thanks — your progress just updated.</p>
            </div>
          </div>
        </div>
      )}

          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 24px;
              width: 24px;
              border-radius: 50%;
              background: #ffffff;
              cursor: pointer;
              border: 2px solid #374151;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .slider::-moz-range-thumb {
              height: 24px;
              width: 24px;
              border-radius: 50%;
              background: #ffffff;
              cursor: pointer;
              border: 2px solid #374151;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            /* Hide browser's default summary marker */
            details summary::-webkit-details-marker {
              display: none;
            }

            details summary::marker {
              display: none;
            }
          `}</style>

      {/* Post-Check-in Modal - Shown after first check-in */}
      {showPostCheckinModal && postCheckinData && (
        <PostCheckinModal
          isOpen={showPostCheckinModal}
          onClose={() => {
            setShowPostCheckinModal(false);
            onClose(); // Close the main check-in modal too
          }}
          onContinue={() => {
            setShowPostCheckinModal(false);
            onClose(); // Close the main check-in modal and proceed to next step
          }}
          userId={userId}
          userName={userName}
          dayOneData={postCheckinData.dayOneData}
          communityStats={postCheckinData.communityStats}
          personalizedInsight={postCheckinData.personalizedInsight}
        />
      )}

      {showReminderPrompt && (
        <EnableRemindersModal
          isOpen={showReminderPrompt}
          onClose={() => {
            setShowReminderPrompt(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
