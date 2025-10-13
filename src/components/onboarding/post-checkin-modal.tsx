'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { saveUserCondition } from '@/lib/db/userCondition';

interface PostCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  userId: string;
  userName: string;
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

const CONDITIONS = [
  'Chronic pain',
  'Fibromyalgia',
  'CFS / ME',
  'Autoimmune condition',
  'ADHD',
  'Perimenopause',
  'Other / Not sure',
];

export default function PostCheckinModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  userId,
  userName,
  dayOneData, 
  communityStats, 
  personalizedInsight 
}: PostCheckinModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [conditionDetails, setConditionDetails] = useState('');
  const [skipped, setSkipped] = useState(false);
  const [showTypingAnimation, setShowTypingAnimation] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setSelectedCondition(null);
      setConditionDetails('');
      setSkipped(false);
      setShowTypingAnimation(true);
      
      // Show typing animation for 1.5 seconds
      const timer = setTimeout(() => {
        setShowTypingAnimation(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate Elli's welcome message based on pain level
  const getElliWelcomeMessage = (pain: number | null) => {
    if (pain === null) {
      return `I can see you've completed your first check-in. That takes courage.\n\nI'm here to help you spot patterns and find what works for you.`;
    }
    
    if (pain >= 7) {
      return `I can see you're dealing with pain at ${pain}/10 today. That's brutal, and I'm sorry you're going through this.\n\nThe fact that you're here? That takes courage.`;
    } else if (pain >= 4) {
      return `I can see you logged pain at ${pain}/10 today. Managing, but not easy.\n\nThe fact that you're here? That takes courage.`;
    } else {
      return `I can see today's a lighter pain day at ${pain}/10. I'll watch what's different.\n\nThe fact that you're here? That takes courage.`;
    }
  };

  // Generate pain-specific message
  const getPainMessage = (pain: number | null) => {
    if (pain === null) return "We'll start watching for patterns tomorrow.";
    
    if (pain >= 7) {
      return `You logged pain at ${pain}/10 today—that's brutal. Tomorrow we'll start watching: Did sleep make a difference? Did anything make it worse? Small patterns. That's all we need.`;
    } else if (pain >= 4) {
      return `You logged pain at ${pain}/10 today—managing, but not easy. Tomorrow we'll start watching: Did sleep make a difference? Did anything make it worse? Small patterns. That's all we need.`;
    } else {
      return `You logged pain at ${pain}/10 today—a lighter day. Tomorrow we'll start watching what kept it low. Small patterns. That's all we need.`;
    }
  };

  // Handle continue button click
  const handleContinue = async () => {
    // Save condition if provided
    if (!skipped && selectedCondition) {
      try {
        await saveUserCondition(userId, {
          primary: selectedCondition,
          details: conditionDetails || null,
        });
      } catch (error) {
        console.error('Failed to save condition:', error);
        // Continue anyway - don't block user flow
      }
    }
    
    onContinue();
  };

  const handleSkip = () => {
    setSkipped(true);
  };

  // Generate community message based on pain level
  const getCommunityMessage = (pain: number | null, count: number) => {
    if (pain !== null && pain >= 7) {
      return `${count} people logged severe pain today. You're in the right place.`;
    }
    return `You're one of ${count} people tracking chronic pain today.`;
  };

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
          
          {/* Elli Avatar and Welcome */}
          <div className="text-center">
            <div className="text-5xl mb-4">💙</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Hi {userName}, I'm Elli 💙
            </h2>
            
            {/* Typing animation effect */}
            {showTypingAnimation ? (
              <div className="flex items-center justify-center space-x-1 text-gray-500 h-20">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {getElliWelcomeMessage(dayOneData.pain)}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Condition Capture Section */}
          {!skipped && (
            <div className="border-t border-gray-200 pt-6 -mt-6">
              <p className="text-gray-800 font-medium mb-4 text-center">
                Mind if I ask - what brings you here?
              </p>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {CONDITIONS.map((condition) => (
                  <button
                    key={condition}
                    onClick={() => setSelectedCondition(condition)}
                    className={`
                      px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-medium
                      ${selectedCondition === condition
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                      }
                    `}
                  >
                    {condition}
                  </button>
                ))}
              </div>

              {/* Optional Details Field */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  Want to add more details? (optional)
                </label>
                <input
                  type="text"
                  value={conditionDetails}
                  onChange={(e) => setConditionDetails(e.target.value)}
                  placeholder="e.g., diagnosed 2019, mostly joint pain"
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Skip Button */}
              <div className="text-center mb-4">
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Timeline Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <span className="text-xl mr-2">📅</span>
              <h3 className="font-semibold text-gray-900">What Happens Next</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Day 1 (Today)</div>
                  <div className="text-sm text-gray-600">Baseline recorded ✓</div>
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
                <h4 className="font-semibold mb-2">💙 Today's Pain</h4>
                <p className="text-sm leading-relaxed">
                  {getPainMessage(dayOneData.pain)}
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
              {getCommunityMessage(dayOneData.pain, communityStats.usersWithSimilarCondition)}
            </p>
          </div>

          {/* Your Day 1 Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Your Day 1</h4>
            <div className="grid grid-cols-3 gap-3 text-center mb-3">
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
            <p className="text-sm text-gray-600 text-center">We'll watch how these move together.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <div className="text-center mb-4">
            <p className="text-gray-700 mb-1">
              Now let's add what you're taking so I can watch for patterns.
            </p>
            <p className="text-sm text-gray-500">
              Tomorrow takes 10 seconds. Same 3 sliders.
            </p>
          </div>
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Add What You're Taking →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
