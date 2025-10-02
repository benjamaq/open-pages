'use client';

import { useState } from 'react';
import DayDrawer from './DayDrawer';

type TodayStripProps = {
  entry?: {
    date: string;
    mood?: number | null;
    energy?: number | null;
    pain?: number | null;
    sleep_hours?: number | null;
    readiness?: number | null;
    feeling?: string | null;
  } | null;
  onAdd: () => void;   // open Day Drawer (today)
  onEdit: () => void;  // open Day Drawer (today)
};

export default function TodayStrip({ entry, onAdd, onEdit }: TodayStripProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAdd = () => {
    setIsDrawerOpen(true);
    onAdd();
  };

  const handleEdit = () => {
    setIsDrawerOpen(true);
    onEdit();
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const formatValue = (value: number | null | undefined, suffix = '') => {
    if (value === null || value === undefined) return null;
    return `${value}${suffix}`;
  };

  const getMoodColor = (mood: number | null | undefined) => {
    if (mood === null || mood === undefined) return 'bg-gray-100 text-gray-600';
    if (mood <= 3) return 'bg-red-100 text-red-800';
    if (mood <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getEnergyColor = (energy: number | null | undefined) => {
    if (energy === null || energy === undefined) return 'bg-gray-100 text-gray-600';
    if (energy <= 3) return 'bg-red-100 text-red-800';
    if (energy <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPainColor = (pain: number | null | undefined) => {
    if (pain === null || pain === undefined) return 'bg-gray-100 text-gray-600';
    if (pain <= 3) return 'bg-green-100 text-green-800';
    if (pain <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getReadinessColor = (readiness: number | null | undefined) => {
    if (readiness === null || readiness === undefined) return 'bg-gray-100 text-gray-600';
    if (readiness < 40) return 'bg-red-100 text-red-800';
    if (readiness < 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (!entry) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-600">No check-in yet.</span>
          </div>
          <button
            onClick={handleAdd}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Add today
          </button>
        </div>

        <DayDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          date={new Date().toISOString().split('T')[0]}
          initialData={null}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-wrap">
          {/* Mood */}
          {entry.mood !== null && entry.mood !== undefined && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(entry.mood)}`}>
              Mood {entry.mood}/10
            </div>
          )}

          {/* Energy */}
          {entry.energy !== null && entry.energy !== undefined && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEnergyColor(entry.energy)}`}>
              Energy {entry.energy}/10
            </div>
          )}

          {/* Pain */}
          {entry.pain !== null && entry.pain !== undefined && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPainColor(entry.pain)}`}>
              Pain {entry.pain}/10
            </div>
          )}

          {/* Sleep */}
          {entry.sleep_hours !== null && entry.sleep_hours !== undefined && (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Sleep {entry.sleep_hours}h
            </div>
          )}

          {/* Readiness */}
          {entry.readiness !== null && entry.readiness !== undefined && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getReadinessColor(entry.readiness)}`}>
              Readiness {entry.readiness}%
            </div>
          )}

          {/* Feeling */}
          {entry.feeling && (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Feeling: {entry.feeling}
            </div>
          )}
        </div>

        <button
          onClick={handleEdit}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Edit
        </button>
      </div>

      <DayDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        date={entry.date}
        initialData={entry}
      />
    </div>
  );
}
