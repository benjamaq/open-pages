'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';
import { saveExpandedUserCondition } from '@/lib/db/userCondition';
import { TypingIndicator } from '@/components/elli/TypingIndicator';
import { 
  BROAD_CATEGORIES, 
  CHRONIC_ILLNESS_SUBCATEGORIES, 
  getValidationMessage,
  type BroadCategory,
  type ChronicIllnessSubcategory 
} from '@/lib/constants/expanded-categories';

/**
 * CategorySelectionModal
 * 
 * Simplified version of post-checkin-modal-expanded for use in OnboardingOrchestrator.
 * Handles category selection and validation WITHOUT check-in data.
 * 
 * Flow: Category → Subcategory (if needed) → Validation → Continue
 */

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (category: string, specific: string | null) => void;
  userId: string;
  userName: string;
}

type Step = 'category' | 'specific' | 'validation';

export default function CategorySelectionModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  userId,
  userName
}: CategorySelectionModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<BroadCategory | null>(null);
  const [selectedSpecific, setSelectedSpecific] = useState<ChronicIllnessSubcategory | null>(null);
  const [conditionDetails, setConditionDetails] = useState('');
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showValidationMessage, setShowValidationMessage] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('category');
      setSelectedCategory(null);
      setSelectedSpecific(null);
      setConditionDetails('');
      setShowTypingIndicator(false);
      setShowValidationMessage(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle category selection
  const handleCategorySelect = (category: BroadCategory) => {
    setSelectedCategory(category);
    
    if (category === 'Chronic pain or illness') {
      setCurrentStep('specific');
    } else {
      setCurrentStep('validation');
      setShowTypingIndicator(true);
      setTimeout(() => {
        setShowTypingIndicator(false);
        setShowValidationMessage(true);
      }, 300);
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
    }, 300);
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

  // Show validation message
  if (currentStep === 'validation' && selectedCategory) {
    const validationMessage = getValidationMessage(
      selectedCategory, 
      selectedSpecific, 
      userName,
      undefined // No check-in data yet in orchestrator flow
    );

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
            {showTypingIndicator ? (
              <div className="flex items-center justify-center py-8">
                <TypingIndicator />
              </div>
            ) : showValidationMessage && validationMessage ? (
              <div className="space-y-6">
                <TypeAnimation
                  sequence={[
                    validationMessage.title,
                    300,
                    validationMessage.title + '\n\n' + validationMessage.message
                  ]}
                  speed={15}
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

  // Show specific condition selection
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
            <div className="text-center">
              <div className="text-5xl mb-4">💙</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Which one sounds most like you, {userName}?
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {CHRONIC_ILLNESS_SUBCATEGORIES.map((condition) => (
                <button
                  key={condition}
                  onClick={() => handleSpecificSelect(condition)}
                  className="px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-purple-300 transition-all text-sm font-medium"
                >
                  {condition}
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={handleGoBack}
                className="text-sm text-gray-500 hover:text-gray-700 underline flex items-center justify-center mx-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Show broad category selection
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
            <div className="text-5xl mb-4">💙</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-800 font-medium mb-4 text-center">
            What brings you here today?
          </p>

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {BROAD_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className="px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-purple-300 transition-all text-sm font-medium"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

