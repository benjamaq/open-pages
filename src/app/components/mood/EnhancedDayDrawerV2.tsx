'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { saveDailyEntry, type SaveDailyEntryInput } from '@/lib/db/mood';
import { CHIP_CATALOG, getChipsByCategory } from '@/lib/constants/chip-catalog';
import { useFirstCheckIn } from '@/hooks/useFirstCheckIn';
import { generateFirstInsight } from '@/app/actions/generate-first-insight';
import PostCheckinModal from '@/components/onboarding/post-checkin-modal';

type EnhancedDayDrawerV2Props = {
  isOpen: boolean;
  onClose: () => void;
  date: string; // 'YYYY-MM-DD'
  userId: string;
  isFirstCheckIn?: boolean; // NEW: Flag for onboarding flow
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

export default function EnhancedDayDrawerV2({ isOpen, onClose, date, userId, isFirstCheckIn = false, todayItems, initialData }: EnhancedDayDrawerV2Props) {
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeSnapshot, setIncludeSnapshot] = useState(true);
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [selectedWearable, setSelectedWearable] = useState<string>('');
  const [wearables, setWearables] = useState({
    recovery_score: null as number | null,
    sleep_score: null as number | null
  });

  // Context chips state (6-8 total limit)
  const [selectedContextChips, setSelectedContextChips] = useState<string[]>([]);
  const [showMoreContext, setShowMoreContext] = useState(false);
  
  // Symptom tracking state (5 limit)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedPainLocations, setSelectedPainLocations] = useState<string[]>([]);
  const [selectedPainTypes, setSelectedPainTypes] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [customSymptomInput, setCustomSymptomInput] = useState('');
  const [showCustomSymptomInput, setShowCustomSymptomInput] = useState(false);
  const [showMoreSymptoms, setShowMoreSymptoms] = useState(false);

  // Collapsible section states
  // For first check-in (onboarding), all optional sections are collapsed by default
  // For regular check-ins, Today's Vibe is open by default
  const [isVibeSectionOpen, setIsVibeSectionOpen] = useState(!isActuallyFirstCheckIn);
  const [isContextSectionOpen, setIsContextSectionOpen] = useState(false);
  const [isSymptomsSectionOpen, setIsSymptomsSectionOpen] = useState(false);
  const [isNotesSectionOpen, setIsNotesSectionOpen] = useState(false);

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
    '☕ Too much caffeine': 'late_caffeine',
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
    '🌧️ Weather change': 'bad_air',
    '🥵 Too hot': 'heat_wave',
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
    
    // Round to 1 decimal place
    return Math.round(score * 10) / 10;
  }, [formData.mood, formData.sleep_quality, formData.pain]);

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
      const newFormData = {
        localDate: date,
        mood: null,
        sleep_quality: null,
        pain: null,
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
  const handleSave = async () => {
    console.log('🔍 SAVE BUTTON CLICKED!');
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Get ALL scheduled items for the date, not just completed ones
      const targetDate = date || new Date().toLocaleDateString('sv-SE'); // Use passed date or today
      
      // For now, skip the scheduled items API and just save mood data
      // This will fix the save error immediately
      let allScheduledItems = [];

      // Clear pain-related data if pain = 0
      const currentPain = formData.pain || 0;
      const shouldClearPainData = currentPain === 0;

      // Convert context chips from display format to slug format for database storage
      const contextChipsAsSlugs = selectedContextChips.map(chip => contextDisplayToSlug[chip] || chip);
      
      // Combine expressive mood chips (selectedTags) with contextual chips (selectedContextChips)
      const allTags = [...selectedTags, ...contextChipsAsSlugs];
      
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
        tags: allTags.length > 0 ? allTags : null, // Include both expressive mood chips and contextual chips
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

      const result = await saveDailyEntry(savePayload);
      
      if (result.ok) {
        setSaveMessage('✅ Check-in saved!');
        console.log('✅ Save successful:', result.data);
        
        // Check if this is the first check-in and show post-check-in modal
        if (isActuallyFirstCheckIn && !firstCheckInLoading) {
          try {
            const insightData = await generateFirstInsight({
              mood: formData.mood,
              sleep_quality: formData.sleep_quality,
              pain: formData.pain
            });
            
            setPostCheckinData({
              dayOneData: {
                mood: formData.mood,
                sleep_quality: formData.sleep_quality,
                pain: formData.pain
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
          // Normal behavior for subsequent check-ins
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        setSaveMessage(`❌ ${result.error}`);
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
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Daily Check-in
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {formatDate(date)}
                </p>
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
          <div className="px-6 py-6 space-y-6">
            {/* How I feel (today) */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">How I feel (today)</h3>
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

            {/* 🎯 Readiness Score Display - Compact */}
            <div className={`rounded-lg p-3 border transition-all ${getReadinessDisplay(readinessScore).bg} border-gray-200`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Today's Readiness Score</div>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getReadinessDisplay(readinessScore).color}`}>
                    {readinessScore}
                  </span>
                  <span className="text-sm text-gray-400">/10</span>
                  <span className="text-xl ml-1">{getReadinessDisplay(readinessScore).emoji}</span>
                </div>
              </div>
            </div>

            {/* Today's Vibe - Collapsible */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setIsVibeSectionOpen(!isVibeSectionOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">✨</span>
                  <h3 className="text-base font-medium text-gray-900">Today's Vibe</h3>
                  {isActuallyFirstCheckIn && (
                    <span className="text-xs text-gray-400 font-normal">Optional</span>
                  )}
                  {selectedTags.length > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {selectedTags.length} selected
                    </span>
                  )}
                  {/* Debug logging */}
                  {console.log('🔍 Today\'s Vibe - selectedTags:', selectedTags, 'length:', selectedTags.length)}
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${isVibeSectionOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Vibe content - shown when expanded */}
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

            {/* Life Factors - Collapsible */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setIsContextSectionOpen(!isContextSectionOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌍</span>
                  <h3 className="text-base font-medium text-gray-900">Life Factors</h3>
                  {isActuallyFirstCheckIn && (
                    <span className="text-xs text-gray-400 font-normal">Optional</span>
                  )}
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
              
              {/* Context chip categories - shown when expanded */}
              {isContextSectionOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                {/* Lifestyle */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Lifestyle</h4>
                  <div className="flex flex-wrap gap-2">
                    {contextCategories.lifestyle.map(chip => {
                      const isSelected = selectedContextChips.includes(chip);
                      return (
                        <button
                          key={chip}
                          onClick={() => toggleContextChip(chip)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            isSelected
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nutrition */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Nutrition</h4>
                  <div className="flex flex-wrap gap-2">
                    {contextCategories.nutrition.map(chip => {
                      const isSelected = selectedContextChips.includes(chip);
                      return (
                        <button
                          key={chip}
                          onClick={() => toggleContextChip(chip)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            isSelected
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Illness */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Illness</h4>
                  <div className="flex flex-wrap gap-2">
                    {contextCategories.illness.map(chip => {
                      const isSelected = selectedContextChips.includes(chip);
                      return (
                        <button
                          key={chip}
                          onClick={() => toggleContextChip(chip)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            isSelected
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Environment */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Environment</h4>
                  <div className="flex flex-wrap gap-2">
                    {contextCategories.environment.map(chip => {
                      const isSelected = selectedContextChips.includes(chip);
                      return (
                        <button
                          key={chip}
                          onClick={() => toggleContextChip(chip)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            isSelected
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
                </div>
              )}
            </div>

            {/* Symptoms - Collapsible */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setIsSymptomsSectionOpen(!isSymptomsSectionOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💭</span>
                  <h3 className="text-base font-medium text-gray-900">Symptoms</h3>
                  {isActuallyFirstCheckIn && (
                    <span className="text-xs text-gray-400 font-normal">Optional</span>
                  )}
                  {(() => {
                    const totalSelected = selectedSymptoms.length + customSymptoms.length + selectedPainLocations.length + selectedPainTypes.length;
                    return totalSelected > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {totalSelected} selected
                      </span>
                    );
                  })()}
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${isSymptomsSectionOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Symptoms content - shown when expanded */}
              {isSymptomsSectionOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {coreSymptoms.slice(0, showMoreSymptoms ? undefined : 6).map(symptom => {
                    const isSelected = selectedSymptoms.includes(symptom);
                    const isDisabled = !isSelected && (selectedSymptoms.length + customSymptoms.length) >= 5;
                    return (
                      <button
                        key={symptom}
                        onClick={() => toggleSymptom(symptom)}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          isSelected
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : isDisabled
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {symptom.replace('-', ' ')}
                      </button>
                    );
                  })}
                  {!showMoreSymptoms && (
                    <button
                      onClick={() => setShowMoreSymptoms(true)}
                      className="px-3 py-1.5 text-sm rounded-full border border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                    >
                      More…
                    </button>
                  )}
                </div>

                {/* Custom symptoms */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Custom symptoms</span>
                    <button
                      onClick={() => setShowCustomSymptomInput(!showCustomSymptomInput)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + Add custom
                    </button>
                  </div>
                  
                  {/* Custom symptom input */}
                  {showCustomSymptomInput && (
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={customSymptomInput}
                        onChange={(e) => setCustomSymptomInput(e.target.value)}
                        placeholder="e.g., ringing in ears"
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSymptom()}
                      />
                      <button
                        onClick={handleAddCustomSymptom}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
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
                          className="flex items-center space-x-1 px-3 py-1.5 bg-purple-100 border border-purple-300 text-purple-800 rounded-full text-sm"
                        >
                          <span>{symptom}</span>
                          <button
                            onClick={() => removeCustomSymptom(symptom)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pain details - only show if pain > 0 */}
                {formData.pain && formData.pain > 0 && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    {/* Pain locations */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Where is the pain?</h4>
                      <div className="flex flex-wrap gap-2">
                        {painLocations.map(location => {
                          const isSelected = selectedPainLocations.includes(location);
                          return (
                            <button
                              key={location}
                              onClick={() => togglePainLocation(location)}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                isSelected
                                  ? 'bg-red-100 border-red-300 text-red-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {location}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pain types */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">What type of pain?</h4>
                      <div className="flex flex-wrap gap-2">
                        {painTypes.map(type => {
                          const isSelected = selectedPainTypes.includes(type);
                          return (
                            <button
                              key={type}
                              onClick={() => togglePainType(type)}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                isSelected
                                  ? 'bg-orange-100 border-orange-300 text-orange-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
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

            {/* Save hint */}
            <div className="text-xs text-gray-500 text-center py-2">
              This will save: mood {formData.mood || 5}, sleep {formData.sleep_quality || 5}, pain {formData.pain || 0} • 
              context {selectedContextChips.length} items • 
              {selectedSymptoms.length + customSymptoms.length} symptoms
            </div>

            {/* Wearables */}
            <details className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <summary 
                className="cursor-pointer text-base text-gray-700 flex items-center justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>Wearables</span>
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
                  {/* Wearable Device Selector */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Wearable Device
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

            {/* Snapshot helper */}
            <div className="text-xs text-gray-500 text-center py-2 border-t border-gray-100">
              Auto-saves what you did (supps, meds, training, mindfulness) so you can compare against mood/sleep/pain later.
            </div>

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

            {/* Daily Log Summary - Collapsible */}
            <div>
              <details className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                <summary className="cursor-pointer text-base text-gray-700 flex items-center justify-between list-none">
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-900">Daily Log Summary</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Auto-saves what you did (supps, meds, training, mindfulness) so future-you can compare with mood/pain.
                    </p>
                  </div>
                  <ChevronDown className="w-5 h-5 transition-transform flex-shrink-0" style={{ color: '#6B7280' }} />
                </summary>
                
                <div className="mt-4 space-y-3">
                  {snapshotData ? (
                    <div className="space-y-3">
                      {/* Supplements */}
                      {snapshotData.supplements_taken_count > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Supplements ({snapshotData.supplements_taken_count})</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.supplements && snapshotData.supplements.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.supplements.map((supp: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{supp.name}</span>
                                    <span className="text-gray-500">{supp.dose} {supp.unit}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.supplements_taken_count} supplements taken today`
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Medications */}
                      {snapshotData.meds_taken_count > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Medications ({snapshotData.meds_taken_count})</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.meds && snapshotData.meds.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.meds.map((med: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{med.name}</span>
                                    <span className="text-gray-500">{med.dose} {med.unit}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.meds_taken_count} medications taken today`
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Movement */}
                      {snapshotData.movement_minutes > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Movement</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.activity && snapshotData.activity.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.activity.map((act: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{act.name}</span>
                                    <span className="text-gray-500">{act.duration_min} min</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.movement_minutes} minutes of movement`
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Mindfulness */}
                      {snapshotData.mindfulness_minutes > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Mindfulness</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.mindfulness && snapshotData.mindfulness.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.mindfulness.map((mind: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{mind.name}</span>
                                    <span className="text-gray-500">{mind.duration_min} min</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.mindfulness_minutes} minutes of mindfulness`
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Protocols */}
                      {snapshotData.protocols_active > 0 && (
                        <div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">Active Protocols ({snapshotData.protocols_active})</h4>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {snapshotData.protocols && snapshotData.protocols.length > 0 ? (
                              <ul className="space-y-1">
                                {snapshotData.protocols.map((protocol: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{protocol.name}</span>
                                    <span className="text-gray-500">{protocol.frequency}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              `${snapshotData.protocols_active} protocols active today`
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No activity logged yet for today
                    </div>
                  )}
                </div>
              </details>
            </div>

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
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isSaving ? (isActuallyFirstCheckIn ? 'Processing...' : 'Saving...') : (isActuallyFirstCheckIn ? 'Next' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      </div>

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
          dayOneData={postCheckinData.dayOneData}
          communityStats={postCheckinData.communityStats}
          personalizedInsight={postCheckinData.personalizedInsight}
        />
      )}
    </div>
  );
}
