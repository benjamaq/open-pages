'use client';

import { useState, useRef } from 'react';
import type React from 'react';
import SafeType from '@/components/elli/SafeType';
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
  console.log('🔵 ProfileSetupModal LOADED - timestamp:', Date.now());
  const [showTyping, setShowTyping] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [mission, setMission] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('🔵 ProfileSetupModal RENDER');

  const handleButtonClick = (e: React.MouseEvent) => {
    try {
      console.log('🔴 UPLOAD BUTTON CLICKED', e);
      console.log('🔴 fileInputRef.current:', fileInputRef.current);
      if (!fileInputRef.current) {
        console.error('❌ FILE INPUT REF IS NULL');
        return;
      }
      fileInputRef.current.click();
      console.log('🔴 Triggered input click');
    } catch (error) {
      console.error('❌ Upload button error:', error);
    }
  };

  if (!isOpen) return null;

  // Brief thinking indicator before typing
  if (showTyping) {
    setTimeout(() => {
      setShowTyping(false);
      setShowContent(true);
    }, 300);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ File input changed');
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
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="24" y1="8" x2="24" y2="15" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="24" y1="33" x2="24" y2="40" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="8" y1="24" x2="15" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="33" y1="24" x2="40" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="13" y1="13" x2="18" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="30" y1="30" x2="35" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="35" y1="13" x2="30" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="18" y1="30" x2="13" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M24 18L28 24L24 30L20 24Z" fill="#F4B860"/>
            </svg>
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
              <SafeType
                text={`Add profile photo. And let me know what you're working on.\n\nAdd a photo so people can see who you are, and tell me what you're working on right now.`}
                speed={15}
                className="text-gray-700 whitespace-pre-line leading-relaxed"
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
                    Add profile photo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="relative inline-block">
                          <button type="button" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                            Choose photo
                          </button>
                          <input
                            ref={fileInputRef}
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                        
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
                  <label htmlFor="mission" className="block text-sm font-medium text-gray-700 mb-2">What you're working on</label>
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
