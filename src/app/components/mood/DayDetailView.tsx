'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Heart, Moon, Zap } from 'lucide-react';
import { CHIP_CATALOG } from '@/lib/constants/chip-catalog';

interface DayDetailViewProps {
  date: string;
  isOpen: boolean;
  onClose: () => void;
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

export default function DayDetailView({ date, isOpen, onClose }: DayDetailViewProps) {
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load day data
  const loadDayData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mood/day?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Day data loaded:', data);
        setDayData(data.entry);
      } else {
        console.error('Failed to load day data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading day data:', error);
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
    if (!dayData?.tags) return [];
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
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
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
              {(dayData.meds?.length > 0 || dayData.protocols?.length > 0 || dayData.activity?.length > 0 || dayData.devices?.length > 0 || (dayData.wearables && Object.keys(dayData.wearables).length > 0)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Daily Snapshot</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {/* Supplements & Medications */}
                    {dayData.meds?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Supplements & Medications</h4>
                        <div className="text-sm text-gray-700">
                          {dayData.meds.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-gray-500">{item.dose} {item.timing}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Protocols */}
                    {dayData.protocols?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Protocols & Recovery</h4>
                        <div className="text-sm text-gray-700">
                          {dayData.protocols.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-gray-500">{item.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity */}
                    {dayData.activity?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Training & Rehab</h4>
                        <div className="text-sm text-gray-700">
                          {dayData.activity.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-gray-500">{item.duration}min</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Devices */}
                    {dayData.devices?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Devices & Tools</h4>
                        <div className="text-sm text-gray-700">
                          {dayData.devices.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-gray-500">{item.duration}min</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wearables */}
                    {dayData.wearables && Object.keys(dayData.wearables).length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Wearables</h4>
                        <div className="text-sm text-gray-700">
                          {Object.entries(dayData.wearables).map(([key, value]: [string, any]) => (
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
              )}

              {/* No data message */}
              {!dayData.mood && !dayData.sleep_quality && !dayData.pain && !dayData.journal && !dayData.meds?.length && !dayData.protocols?.length && !dayData.activity?.length && !dayData.devices?.length && !(dayData.wearables && Object.keys(dayData.wearables).length > 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No data recorded for this day</p>
                </div>
              )}
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
