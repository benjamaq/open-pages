'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Heart, Moon, Zap } from 'lucide-react';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';

interface DayDetailViewProps {
  date: string;
  isOpen: boolean;
  onClose: () => void;
  todayItems?: {
    supplements: any[];
    protocols: any[];
    movement: any[];
    mindfulness: any[];
    food: any[];
    gear: any[];
  };
  moodData?: any[]; // For public profiles
  isPublicProfile?: boolean; // Flag to indicate if this is a public profile
}

interface DayData {
  mood: number | null;
  sleep_quality: number | null;
  pain: number | null;
  tags: string[] | null;
  journal: string | null;
  symptoms: string[] | null;
  pain_locations: string[] | null;
  pain_types: string[] | null;
  custom_symptoms: string[] | null;
  meds: any[] | null;
  protocols: any[] | null;
  activity: any[] | null;
  devices: any[] | null;
  wearables: any | null;
}

export default function DayDetailView({ date, isOpen, onClose, todayItems, moodData, isPublicProfile }: DayDetailViewProps) {
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load day data
  const loadDayData = async () => {
    setLoading(true);
    try {
      // For public profiles, use the passed mood data instead of making an API call
      if (isPublicProfile && moodData) {
        const dayEntry = moodData.find(entry => entry.date === date);
        console.log('🔍 DayDetailView - Public profile - Day data from moodData:', dayEntry);
        console.log('🔍 DayDetailView - Public profile - tags:', dayEntry?.tags);
        console.log('🔍 DayDetailView - Public profile - meds:', dayEntry?.meds);
        console.log('🔍 DayDetailView - Public profile - protocols:', dayEntry?.protocols);
        console.log('🔍 DayDetailView - Public profile - activity:', dayEntry?.activity);
        console.log('Public profile - devices:', dayEntry?.devices);
        setDayData(dayEntry || null);
        setLoading(false);
        return;
      }

      // For authenticated users, make API call
      const response = await fetch(`/api/mood/day?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DayDetailView - Day data loaded:', data);
        console.log('🔍 DayDetailView - API tags:', data.entry?.tags);
        console.log('🔍 DayDetailView - Day data meds:', data.entry?.meds);
        console.log('🔍 DayDetailView - Day data protocols:', data.entry?.protocols);
        console.log('🔍 DayDetailView - Day data activity:', data.entry?.activity);
        console.log('🔍 DayDetailView - Day data devices:', data.entry?.devices);
        console.log('=== WEARABLES DEBUG ===');
        console.log('Day data wearables:', data.entry?.wearables);
        console.log('Wearables device name:', data.entry?.wearables?.device);
        console.log('Wearables keys:', data.entry?.wearables ? Object.keys(data.entry.wearables) : 'No wearables');
        console.log('Wearables type:', typeof data.entry?.wearables);
        console.log('========================');
        console.log('Full entry data:', JSON.stringify(data.entry, null, 2));
        setDayData(data.entry || null);
      } else {
        console.error('Failed to load day data:', response.status, response.statusText);
        setDayData(null);
      }
    } catch (error) {
      console.error('Error loading day data:', error);
      setDayData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && date) {
      loadDayData();
    }
  }, [isOpen, date]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getMoodChips = () => {
    if (!dayData?.tags || !Array.isArray(dayData.tags)) {
      console.log('🔍 DayDetailView - No tags data:', dayData?.tags);
      return [];
    }
    console.log('🔍 DayDetailView - dayData.tags:', dayData.tags);
    console.log('🔍 DayDetailView - dayData full:', dayData);
    
    const chips = dayData.tags.map(tag => {
      const chip = CHIP_CATALOG.find(c => c.slug === tag);
      console.log(`🔍 DayDetailView - Looking for tag "${tag}":`, chip);
      return chip;
    }).filter(Boolean);
    
    console.log('🔍 DayDetailView - all found chips:', chips);
    
    // Filter for expressive mood chips only
    const moodChips = chips.filter(chip => {
      const isExpressive = chip?.category?.startsWith('expressive');
      console.log(`🔍 DayDetailView - Chip "${chip?.label}" (${chip?.slug}) - category: ${chip?.category}, isExpressive: ${isExpressive}`);
      return isExpressive;
    });
    console.log('🔍 DayDetailView - mood chips (expressive only):', moodChips);
    console.log('🔍 DayDetailView - chip categories:', chips.map(c => ({ label: c?.label, category: c?.category })));
    return moodChips;
  };

  const getPainChips = () => {
    if (!dayData?.tags || !Array.isArray(dayData.tags)) return [];
    const chips = dayData.tags.map(tag => 
      CHIP_CATALOG.find(chip => chip.slug === tag)
    ).filter(Boolean);
    
    // Filter for pain/symptom chips
    const painChips = chips.filter(chip => 
      chip?.category === 'pain' || chip?.category === 'illness'
    );
    console.log('🔍 DayDetailView - pain chips:', painChips);
    return painChips;
  };

  const getContextualChips = () => {
    if (!dayData?.tags || !Array.isArray(dayData.tags)) return [];
    const chips = dayData.tags.map(tag => 
      CHIP_CATALOG.find(chip => chip.slug === tag)
    ).filter(Boolean);
    
    // Filter for contextual chips (everything except expressive and pain)
    const contextualChips = chips.filter(chip => 
      chip?.category && 
      !chip.category.startsWith('expressive') && 
      chip.category !== 'pain' && 
      chip.category !== 'illness'
    );
    console.log('🔍 DayDetailView - contextual chips:', contextualChips);
    return contextualChips;
  };

  // Helper functions for pain descriptors
  const formatSymptom = (symptom: string) => {
    return symptom.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatPainLocation = (location: string) => {
    return location.charAt(0).toUpperCase() + location.slice(1);
  };

  const formatPainType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Calculate daily readiness score as a percentage (0-100) to match dashboard
  const calculateReadinessPct = () => {
    if (!dayData) return 0;
    const mood = dayData.mood ?? 5;
    const sleep = dayData.sleep_quality ?? 5;
    const pain = dayData.pain ?? 0;
    const painInverted = 10 - pain;
    const score = (mood * 0.2) + (sleep * 0.4) + (painInverted * 0.4); // 0-10
    return Math.round(score * 10); // 0-100
  };

  // Match dashboard descriptors
  const getReadinessMeta = (pct: number) => {
    if (pct >= 80) return { color: 'text-[#22c55e]', emoji: '☀️', message: 'Optimal capacity. Great day to tackle what matters most.' };
    if (pct >= 50) return { color: 'text-[#f59e0b]', emoji: '⛵', message: 'Balanced energy. Listen to your body and move thoughtfully today.' };
    return { color: 'text-[#ef4444]', emoji: '🏖️', message: 'Recovery focus. Prioritize rest and essential tasks only.' };
  };

  const getMoodColor = (mood: number | null) => {
    if (mood === null) return '#f3f4f6';
    if (mood <= 2) return '#ef4444';
    if (mood <= 4) return '#f59e0b';
    if (mood <= 6) return '#eab308';
    if (mood <= 8) return '#22c55e';
    return '#16a34a';
  };

  const getSleepColor = (sleep: number | null) => {
    if (sleep === null) return '#f3f4f6';
    if (sleep <= 2) return '#ef4444';
    if (sleep <= 4) return '#f59e0b';
    if (sleep <= 6) return '#eab308';
    if (sleep <= 8) return '#22c55e';
    return '#16a34a';
  };

  const getPainColor = (pain: number | null) => {
    if (pain === null) return '#f3f4f6';
    // Pain is reversed: higher = worse
    if (pain <= 2) return '#16a34a';
    if (pain <= 4) return '#22c55e';
    if (pain <= 6) return '#eab308';
    if (pain <= 8) return '#f59e0b';
    return '#ef4444';
  };

  // Check if the selected date is today
  const isToday = () => {
    const today = new Date().toLocaleDateString('sv-SE');
    return date === today;
  };

  // Get scheduled items for today
  const getScheduledItems = () => {
    if (!isToday() || !todayItems) return null;
    
    return {
      supplements: (todayItems.supplements || []).map(item => ({
        name: item.name,
        dose: item.dose || '1',
        timing: item.timing || 'daily'
      })),
      protocols: (todayItems.protocols || []).map(item => ({
        name: item.name,
        duration: item.frequency || 'daily'
      })),
      activity: (todayItems.movement || []).map(item => ({
        name: item.name,
        duration: item.dose || '30'
      })),
      devices: (todayItems.gear || []).map(item => ({
        name: item.name,
        duration: 'N/A'
      }))
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {formatDate(date)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : dayData ? (
            <div className="space-y-6">
              {/* Daily Readiness Score (match dashboard: percentage + descriptor) */}
              <div className="text-center py-4">
                <div className="flex items-center justify-center space-x-3">
                  <span className={`text-3xl font-bold ${getReadinessMeta(calculateReadinessPct()).color}`}>
                    {calculateReadinessPct()}%
                  </span>
                  <div className="text-2xl">
                    {getReadinessMeta(calculateReadinessPct()).emoji}
                  </div>
                  <div className="text-base font-medium text-gray-700">
                    Daily Readiness Score
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-900 text-center">
                  {getReadinessMeta(calculateReadinessPct()).message}
                </div>
              </div>

              {/* Mood Metrics - Smaller */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <Heart className="w-3 h-3 text-gray-600 mr-1" />
                    <span className="text-xs font-medium text-gray-700">Mood</span>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: getMoodColor(dayData.mood) }}
                  >
                    {dayData.mood || '—'}
                  </div>
                </div>
                
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <Moon className="w-3 h-3 text-gray-600 mr-1" />
                    <span className="text-xs font-medium text-gray-700">Sleep</span>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: getSleepColor(dayData.sleep_quality) }}
                  >
                    {dayData.sleep_quality || '—'}
                  </div>
                </div>
                
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <Zap className="w-3 h-3 text-gray-600 mr-1" />
                    <span className="text-xs font-medium text-gray-700">Pain</span>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: getPainColor(dayData.pain) }}
                  >
                    {dayData.pain || '—'}
                  </div>
                </div>
              </div>

              {/* How I was Feeling - Mood Chips */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <span className="text-lg mr-2">✨</span>
                  How I was Feeling
                </h3>
                {getMoodChips().length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {getMoodChips().map((chip, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm"
                      >
                        {chip?.icon} {chip?.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No mood chips selected for this day
                  </div>
                )}
              </div>

              {/* Pain & Symptoms */}
              {(getPainChips().length > 0 || dayData?.symptoms?.length || dayData?.pain_locations?.length || dayData?.pain_types?.length || dayData?.custom_symptoms?.length) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className="text-lg mr-2">🩹</span>
                    Pain & Symptoms
                  </h3>
                  
                  {/* Pain chips from CHIP_CATALOG */}
                  {getPainChips().length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {getPainChips().map((chip, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 text-sm bg-red-50 border border-red-200 text-red-800 rounded-full shadow-sm hover:shadow-md transition-shadow"
                          >
                            {chip?.icon} {chip?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  {dayData?.symptoms && dayData.symptoms.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Symptoms</h4>
                      <div className="flex flex-wrap gap-2">
                        {dayData.symptoms.map((symptom, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm"
                          >
                            {formatSymptom(symptom)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Symptoms */}
                  {dayData?.custom_symptoms && dayData.custom_symptoms.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Symptoms</h4>
                      <div className="flex flex-wrap gap-2">
                        {dayData.custom_symptoms.map((symptom, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pain Locations */}
                  {dayData?.pain_locations && dayData.pain_locations.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Pain Locations</h4>
                      <div className="flex flex-wrap gap-2">
                        {dayData.pain_locations.map((location, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm"
                          >
                            {formatPainLocation(location)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pain Types */}
                  {dayData?.pain_types && dayData.pain_types.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Pain Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {dayData.pain_types.map((type, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm"
                          >
                            {formatPainType(type)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contextual Elements */}
              {getContextualChips().length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className="text-lg mr-2">🌍</span>
                    Contextual Elements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getContextualChips().map((chip, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm"
                      >
                        {chip?.icon} {chip?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Journal */}
              {dayData.journal && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Journal & Notes</h3>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 text-sm text-gray-700">
                    {dayData.journal}
                  </div>
                </div>
              )}

              {/* Daily Snapshot */}
              {(() => {
                const scheduledItems = getScheduledItems();
                const hasHistoricalData = (dayData.meds?.length || 0) > 0 || (dayData.protocols?.length || 0) > 0 || (dayData.activity?.length || 0) > 0 || (dayData.devices?.length || 0) > 0 || (dayData.wearables && Object.keys(dayData.wearables).length > 0);
                const hasScheduledData = scheduledItems && ((scheduledItems.supplements?.length || 0) > 0 || (scheduledItems.protocols?.length || 0) > 0 || (scheduledItems.activity?.length || 0) > 0 || (scheduledItems.devices?.length || 0) > 0);
                
                if (!hasHistoricalData && !hasScheduledData) return null;

                return (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {isToday() ? 'Today\'s Schedule' : 'Daily Snapshot'}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {/* Supplements & Medications - Show scheduled items for today, historical for other days */}
                      {isToday() && scheduledItems?.supplements?.length > 0 ? (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Supplements & Medications (Scheduled)</h4>
                          <div className="text-sm text-gray-700">
                            {scheduledItems.supplements.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.name}</span>
                                <span className="text-gray-500">{item.dose} {item.timing}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (dayData.meds?.length || 0) > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Supplements & Medications</h4>
                          <div className="text-sm text-gray-700">
                            {dayData.meds?.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{typeof item === 'string' ? item : item.name}</span>
                                {typeof item === 'object' && item.dose && (
                                  <span className="text-gray-500">{item.dose} {item.timing}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Protocols - Show scheduled items for today, historical for other days */}
                      {isToday() && scheduledItems?.protocols?.length > 0 ? (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Protocols & Recovery (Scheduled)</h4>
                          <div className="text-sm text-gray-700">
                            {scheduledItems.protocols.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.name}</span>
                                <span className="text-gray-500">{item.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (dayData.protocols?.length || 0) > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Protocols & Recovery</h4>
                          <div className="text-sm text-gray-700">
                            {dayData.protocols?.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{typeof item === 'string' ? item : item.name}</span>
                                {typeof item === 'object' && item.duration && (
                                  <span className="text-gray-500">{item.duration}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activity - Show scheduled items for today, historical for other days */}
                      {isToday() && scheduledItems?.activity?.length > 0 ? (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Training & Rehab (Scheduled)</h4>
                          <div className="text-sm text-gray-700">
                            {scheduledItems.activity.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.name}</span>
                                <span className="text-gray-500">{item.duration}min</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (dayData.activity?.length || 0) > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Training & Rehab</h4>
                          <div className="text-sm text-gray-700">
                            {dayData.activity?.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{typeof item === 'string' ? item : item.name}</span>
                                {typeof item === 'object' && item.duration && (
                                  <span className="text-gray-500">{item.duration}min</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Devices - Show scheduled items for today, historical for other days */}
                      {isToday() && scheduledItems?.devices?.length > 0 ? (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Devices & Tools (Scheduled)</h4>
                          <div className="text-sm text-gray-700">
                            {scheduledItems.devices.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.name}</span>
                                <span className="text-gray-500">{item.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (dayData.devices?.length || 0) > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Devices & Tools</h4>
                          <div className="text-sm text-gray-700">
                            {dayData.devices?.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{typeof item === 'string' ? item : item.name}</span>
                                {typeof item === 'object' && item.duration && (
                                  <span className="text-gray-500">{item.duration}min</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Wearables - Only show historical data */}
                      {dayData.wearables && Object.keys(dayData.wearables).length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">
                            {dayData.wearables?.device || dayData.wearables?.Device || dayData.wearables?.wearable_device || 'Wearables'}
                          </h4>
                          <div className="text-sm text-gray-700">
                            {Object.entries(dayData.wearables)
                              .filter(([key, value]) => 
                                key !== 'device' && 
                                key !== 'Device' && 
                                key !== 'wearable_device' && 
                                value !== null && 
                                value !== undefined
                              )
                              .map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace('_', ' ')}</span>
                                <span className="text-gray-500">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* No data message */}
              {(() => {
                const scheduledItems = getScheduledItems();
                const hasHistoricalData = dayData.mood || dayData.sleep_quality || dayData.pain || dayData.journal || (dayData.meds?.length || 0) > 0 || (dayData.protocols?.length || 0) > 0 || (dayData.activity?.length || 0) > 0 || (dayData.devices?.length || 0) > 0 || (dayData.wearables && Object.keys(dayData.wearables).length > 0);
                const hasScheduledData = scheduledItems && ((scheduledItems.supplements?.length || 0) > 0 || (scheduledItems.protocols?.length || 0) > 0 || (scheduledItems.activity?.length || 0) > 0 || (scheduledItems.devices?.length || 0) > 0);
                
                if (!hasHistoricalData && !hasScheduledData) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>{isToday() ? 'No data recorded for today' : 'No data recorded for this day'}</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No data found for this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
