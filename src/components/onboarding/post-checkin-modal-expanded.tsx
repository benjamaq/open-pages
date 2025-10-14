'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';
import { saveExpandedUserCondition } from '@/lib/db/userCondition';
import { TypingIndicator } from '@/components/elli/TypingIndicator';
import AddStackItemForm from '@/components/AddStackItemForm';
import { 
  BROAD_CATEGORIES, 
  CHRONIC_ILLNESS_SUBCATEGORIES, 
  getValidationMessage,
  type BroadCategory,
  type ChronicIllnessSubcategory 
} from '@/lib/constants/expanded-categories';

interface PostCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (category: string, specific: string | null) => void; // UPDATED for orchestrator
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

// Step management for two-step flow
type Step = 'category' | 'specific' | 'validation';

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
  // Two-step flow state
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<BroadCategory | null>(null);
  const [selectedSpecific, setSelectedSpecific] = useState<ChronicIllnessSubcategory | null>(null);
  const [conditionDetails, setConditionDetails] = useState('');
  const [showTypingAnimation, setShowTypingAnimation] = useState(true);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showValidationMessage, setShowValidationMessage] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('category');
      setSelectedCategory(null);
      setSelectedSpecific(null);
      setConditionDetails('');
      setShowTypingAnimation(true);
      setShowTypingIndicator(false);
      setShowValidationMessage(false);

      // Show typing animation for 1.5 seconds
      const timer = setTimeout(() => {
        setShowTypingAnimation(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate Elli's welcome message with symptom references
  const getElliWelcomeMessage = (dayOneData: any) => {
    const { pain, mood, sleep, symptoms, pain_locations, pain_types, custom_symptoms } = dayOneData;
    
    // Collect all symptoms
    const allSymptoms = [
      ...(symptoms || []),
      ...(pain_locations || []),
      ...(pain_types || []),
      ...(custom_symptoms || [])
    ].filter(Boolean);

    // Build personalized opening with symptoms
    let opening = `Hey ${userName}, `;
    
    if (allSymptoms.length > 0) {
      const symptomText = allSymptoms.length === 1 
        ? allSymptoms[0] 
        : allSymptoms.length === 2 
          ? `${allSymptoms[0]} and ${allSymptoms[1]}`
          : `${allSymptoms.slice(0, -1).join(', ')}, and ${allSymptoms[allSymptoms.length - 1]}`;
      
      opening += `I can see you're dealing with ${symptomText}`;
      
      if (pain !== null) {
        opening += `, and your pain is at ${pain}/10 today`;
      }
    } else if (pain !== null) {
      if (pain >= 8) {
        opening += `I can see you're dealing with severe pain at ${pain}/10 today`;
      } else if (pain >= 6) {
        opening += `I can see you logged pain at ${pain}/10 today - managing, but not easy`;
      } else if (pain >= 4) {
        opening += `I can see you logged pain at ${pain}/10 today - managing, but not easy`;
      } else {
        opening += `I can see today's a lighter pain day at ${pain}/10`;
      }
    } else {
      opening += `I can see you've completed your first check-in`;
    }

    // Add context based on severity
    if (pain !== null && pain >= 8) {
      opening += `. That's really severe, and I'm really sorry you're going through this.`;
    } else if (pain !== null && pain >= 6) {
      opening += `. That takes courage to manage.`;
    } else if (pain !== null && pain <= 3) {
      opening += `. I'll watch what's different about today.`;
    } else {
      opening += `.`;
    }

    // Always end with encouragement
    opening += `\n\nThe fact that you're here? That takes courage.`;

    return opening;
  };

  // Handle category selection
  const handleCategorySelect = (category: BroadCategory) => {
    setSelectedCategory(category);
    
    // If chronic illness, show subcategories
    if (category === 'Chronic pain or illness') {
      setCurrentStep('specific');
    } else {
      // Otherwise, show validation immediately
      setCurrentStep('validation');
      setShowTypingIndicator(true);
      
      setTimeout(() => {
        setShowTypingIndicator(false);
        setShowValidationMessage(true);
      }, 1500);
    }
  };

  // Handle specific condition selection
  const handleSpecificSelect = (specific: ChronicIllnessSubcategory) => {
    setSelectedSpecific(specific);
    setCurrentStep('validation');
    setShowTypingIndicator(true);
    
    setTimeout(() => {
      setShowTypingIndicator(false);
      setShowValidationMessage(true);
    }, 1500);
  };

  // Handle continue button click
  const handleContinue = async () => {
    // Save condition if provided
    if (selectedCategory) {
      try {
        await saveExpandedUserCondition(userId, {
          category: selectedCategory,
          specific: selectedSpecific,
          details: conditionDetails || null,
        });
        
        console.log('✅ Condition saved:', { selectedCategory, selectedSpecific });
      } catch (error) {
        console.error('Failed to save condition:', error);
        // Continue anyway - don't block user flow
      }
    }

    // Call onContinue with category and specific for orchestrator
    onContinue(selectedCategory || 'Something else', selectedSpecific);
  };

  // Handle going back from specific to category selection
  const handleGoBack = () => {
    setCurrentStep('category');
    setSelectedCategory(null);
    setSelectedSpecific(null);
  };

  // Handle skip
  const handleSkip = () => {
    setSelectedCategory('Something else');
    setCurrentStep('validation');
    setShowTypingIndicator(true);
    
    setTimeout(() => {
      setShowTypingIndicator(false);
      setShowValidationMessage(true);
    }, 1500);
  };

  // Show validation message if we're in validation step
  if (currentStep === 'validation' && selectedCategory) {
    const validationMessage = getValidationMessage(selectedCategory, selectedSpecific, userName, dayOneData);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative p-6 border-b border-gray-100">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Elli Avatar */}
            <div className="text-center">
              <div className="text-5xl mb-4">💙</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Typing indicator or message */}
            {showTypingIndicator ? (
              <div className="flex items-center justify-center py-8">
                <TypingIndicator />
              </div>
            ) : showValidationMessage ? (
              <div className="space-y-6">
                <TypeAnimation
                  sequence={[
                    validationMessage.title,
                    500, // Pause after title
                    validationMessage.title + '\n\n' + validationMessage.message
                  ]}
                  speed={35}
                  wrapper="div"
                  className="text-gray-700 whitespace-pre-line leading-relaxed"
                  cursor={false}
                />

                <button
                  onClick={handleContinue}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  {validationMessage.buttonText}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Show specific conditions if chronic illness selected
  if (currentStep === 'specific' && selectedCategory === 'Chronic pain or illness') {
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

            {/* Elli Avatar */}
            <div className="text-center">
              <div className="text-5xl mb-4">💙</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Which one sounds most like you?
              </h2>
            </div>

            {/* Specific Condition Buttons */}
            <div className="grid grid-cols-1 gap-3">
              {CHRONIC_ILLNESS_SUBCATEGORIES.map((condition) => (
                <button
                  key={condition}
                  onClick={() => handleSpecificSelect(condition)}
                  className="px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 transition-all text-left font-medium"
                >
                  {condition}
                </button>
              ))}
            </div>

            {/* Go Back Button */}
            <div className="text-center">
              <button
                onClick={handleGoBack}
                className="text-sm text-gray-500 hover:text-gray-700 underline flex items-center justify-center gap-1 mx-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show broad category selection (default step)
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

          {/* Elli's Welcome Message */}
          <div className="text-center">
            <div className="text-5xl mb-4">💙</div>

            {/* Typing animation effect */}
            {showTypingAnimation ? (
              <div className="flex items-center justify-center text-gray-500 h-20">
                <TypingIndicator />
              </div>
            ) : (
                <TypeAnimation
                  sequence={[getElliWelcomeMessage(dayOneData)]}
                  speed={35}
                  wrapper="div"
                  className="text-gray-700 leading-relaxed whitespace-pre-line"
                  cursor={false}
                />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Condition Capture Section */}
          <div className="border-t border-gray-200 pt-6 -mt-6">
            <p className="text-gray-800 font-medium mb-4 text-center">
              What brings you here today?
            </p>

            {/* Broad Category Buttons */}
            <div className="grid grid-cols-1 gap-3 mb-4">
              {BROAD_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 transition-all text-left font-medium"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Skip Button */}
            <div className="text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Supplement modal is now handled by OnboardingOrchestrator
}
