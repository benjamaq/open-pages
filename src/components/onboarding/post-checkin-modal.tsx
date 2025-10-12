'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, Users, ArrowRight, CheckCircle } from 'lucide-react';

interface PostCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  dayOneData: {
    mood: number | null;
    sleep_quality: number | null;
    pain: number | null;
  };
  communityStats: {
    totalUsers: number;
    usersWithSimilarCondition: number;
    condition: string;
  };
  personalizedInsight: {
    message: string;
    type: 'pain_high' | 'pain_low' | 'mood_high' | 'mood_low';
  };
}

export default function PostCheckinModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  dayOneData, 
  communityStats, 
  personalizedInsight 
}: PostCheckinModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pain_high':
        return '🩹';
      case 'pain_low':
        return '✨';
      case 'mood_high':
        return '🚀';
      case 'mood_low':
        return '💙';
      default:
        return '📊';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pain_high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'pain_low':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'mood_high':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'mood_low':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              First Check-In Complete! 🎉
            </h2>
            <p className="text-gray-600">
              Great start! Let's build your health stack
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Timeline Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Your Journey</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Day 1 (Today)</div>
                  <div className="text-sm text-gray-600">Baseline set ✓</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Day 3</div>
                  <div className="text-sm text-gray-600">First pattern emerges</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Day 7</div>
                  <div className="text-sm text-gray-600">Weekly summary unlocked</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Day 30</div>
                  <div className="text-sm text-gray-600">Full heatmap ready</div>
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Insight Card */}
          <div className={`border-2 rounded-xl p-4 ${getInsightColor(personalizedInsight.type)}`}>
            <div className="flex items-start">
              <div className="text-2xl mr-3">
                {getInsightIcon(personalizedInsight.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Your Personal Insight</h4>
                <p className="text-sm leading-relaxed">
                  {personalizedInsight.message}
                </p>
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-amber-600 mr-2" />
              <h4 className="font-semibold text-amber-800">You're Not Alone</h4>
            </div>
            <p className="text-sm text-amber-700">
              You're one of <span className="font-semibold">{communityStats.usersWithSimilarCondition}</span> people tracking {communityStats.condition} today.
            </p>
          </div>

          {/* Your Day 1 Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Your Day 1 Summary</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{dayOneData.mood || '—'}</div>
                <div className="text-xs text-gray-600">Mood</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{dayOneData.sleep_quality || '—'}</div>
                <div className="text-xs text-gray-600">Sleep</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{dayOneData.pain || '—'}</div>
                <div className="text-xs text-gray-600">Pain</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Continue to Add Your Stack</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Next: Add your supplements and protocols
          </p>
        </div>
      </div>
    </div>
  );
}
