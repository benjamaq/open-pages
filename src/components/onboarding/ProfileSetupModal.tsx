'use client';

import { useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { TypingIndicator } from '@/components/elli/TypingIndicator';

/**
 * ProfileSetupModal
 * 
 * Handles profile photo upload and mission/bio setup during onboarding.
 */

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userName: string;
  userId?: string;
}

export default function ProfileSetupModal({
  isOpen,
  onComplete,
  userName,
  userId
}: ProfileSetupModalProps) {
  const [showTyping, setShowTyping] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [mission, setMission] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  // Show typing animation for 1.5 seconds
  if (showTyping) {
    setTimeout(() => {
      setShowTyping(false);
      setShowContent(true);
    }, 1500);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const handleContinue = async () => {
    setUploading(true);
    
    try {
      let avatarUrl = null;
      
      // Upload profile photo if provided
      if (profilePhoto && userId) {
        const formData = new FormData();
        formData.append('file', profilePhoto);
        formData.append('type', 'avatar');
        formData.append('userId', userId);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const uploadData = await uploadResponse.json();
        if (uploadData.url) {
          avatarUrl = uploadData.url;
        }
      }
      
      // Update profile with avatar and/or bio
      if (avatarUrl || mission.trim()) {
        const updateData: any = {
          profile_created: true
        };
        
        if (avatarUrl) {
          updateData.avatar_url = avatarUrl;
        }
        
        if (mission.trim()) {
          updateData.bio = mission;
        }
        
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      // Still proceed even if there's an error
      onComplete();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">💙</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Elli's Message */}
          <div className="min-h-[120px]">
            {showTyping ? (
              <div className="py-4 flex justify-center">
                <TypingIndicator />
              </div>
            ) : showContent ? (
              <TypeAnimation
                sequence={[
                  `Perfect! Now let's set up your profile, ${userName}.\n\nAdd a photo so people can see who you are, and tell me what you're working on right now.`
                ]}
                speed={35}
                wrapper="div"
                className="text-gray-700 whitespace-pre-line leading-relaxed"
                cursor={false}
              />
            ) : null}
          </div>

          {/* Profile Setup Form */}
          {showContent && (
            <>
              <div className="space-y-6">
                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                          <span>Upload a photo</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            accept="image/*"
                            className="sr-only" 
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      {profilePhoto && (
                        <p className="text-xs text-green-600 mt-2">✓ {profilePhoto.name}</p>
                      )}
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Mission/Bio */}
                <div>
                  <label htmlFor="mission" className="block text-sm font-medium text-gray-700 mb-2">
                    What are you working on right now?
                  </label>
                  <textarea
                    id="mission"
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
                    placeholder="e.g., Managing chronic pain, Optimizing my sleep, Tracking my fertility journey..."
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    This helps others understand what you're tracking and why.
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={handleContinue}
                  disabled={uploading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Saving...' : 'Complete setup →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
