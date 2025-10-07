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
        console.log('Public profile - Day data from moodData:', dayEntry);
        setDayData(dayEntry || null);
        setLoading(false);
        return;
      }

      // For authenticated users, make API call
      const response = await fetch(`/api/mood/day?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Day data loaded:', data);
        console.log('Day data meds:', data.entry?.meds);
        console.log('Day data protocols:', data.entry?.protocols);
        console.log('Day data activity:', data.entry?.activity);
        console.log('Day data devices:', data.entry?.devices);
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

  const getSelectedChips = () => {
    if (!dayData?.tags || !Array.isArray(dayData.tags)) return [];
    return dayData.tags.map(tag => 
      CHIP_CATALOG.find(chip => chip.slug === tag)
    ).filter(Boolean);
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
              {/* Mood Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-4 h-4 text-gray-600 mr-1" />
                    <span className="text-sm font-medium text-gray-700">Mood</span>
                  </div>
                  <div 
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: getMoodColor(dayData.mood) }}
                  >
                    {dayData.mood || '—'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Moon className="w-4 h-4 text-gray-600 mr-1" />
                    <span className="text-sm font-medium text-gray-700">Sleep</span>
                  </div>
                  <div 
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: getSleepColor(dayData.sleep_quality) }}
                  >
                    {dayData.sleep_quality || '—'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 text-gray-600 mr-1" />
                    <span className="text-sm font-medium text-gray-700">Pain</span>
                  </div>
                  <div 
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: getPainColor(dayData.pain) }}
                  >
                    {dayData.pain || '—'}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {getSelectedChips().length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Context</h3>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedChips().map((chip, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-[10px] xs:text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        {chip?.icon} {chip?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Journal */}
              {dayData.journal && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Journal & Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
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
                                <span>{item.name}</span>
                                <span className="text-gray-500">{item.dose} {item.timing}</span>
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
                                <span>{item.name}</span>
                                <span className="text-gray-500">{item.duration}</span>
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
                                <span>{item.name}</span>
                                <span className="text-gray-500">{item.duration}min</span>
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
                                <span>{item.name}</span>
                                <span className="text-gray-500">{item.duration}min</span>
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
