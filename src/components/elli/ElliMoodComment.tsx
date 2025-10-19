'use client';

import { TypeAnimation } from 'react-type-animation';
import { useState, useEffect, useMemo } from 'react';
import { TypingIndicator } from './TypingIndicator';

interface CheckIn {
  mood: number;
  sleep: number;
  pain: number;
}

interface ElliMoodCommentProps {
  checkIn: CheckIn;
  previousCheckIn?: CheckIn;
}

/**
 * ElliMoodComment Component
 * Short comment that appears in Mood Tracker after check-in
 * Provides immediate, contextual feedback
 */
export function ElliMoodComment({ checkIn, previousCheckIn }: ElliMoodCommentProps) {
  const [showTyping, setShowTyping] = useState(true);
  
  // Memoize the checkIn object to prevent unnecessary re-renders
  const memoizedCheckIn = useMemo(() => checkIn, [checkIn.mood, checkIn.sleep, checkIn.pain]);
  const memoizedPreviousCheckIn = useMemo(() => previousCheckIn, [
    previousCheckIn?.mood, 
    previousCheckIn?.sleep, 
    previousCheckIn?.pain
  ]);
  
  const message = generateMoodComment(memoizedCheckIn, memoizedPreviousCheckIn);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowTyping(false), 1000);
    return () => clearTimeout(timer);
  }, [memoizedCheckIn]);

  if (!message) return null;
  
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-lg flex-shrink-0">💙</span>
      <div className="flex-1 min-h-[20px]">
        {showTyping ? (
          <div className="scale-75 origin-left py-0.5">
            <TypingIndicator />
          </div>
        ) : (
          <TypeAnimation
            sequence={[message]}
            speed={90}
            wrapper="p"
            className="text-gray-700"
            cursor={false}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Generate contextual mood comment based on check-in data
 * Following Elli's voice: warm, supportive, forward-looking (not apologetic)
 * This should be concise and complement the detailed symptom analysis below
 */
function generateMoodComment(checkIn: CheckIn, previousCheckIn?: CheckIn): string {
  const { mood, sleep, pain } = checkIn;
  
  // Best day - low pain, high mood
  if (pain <= 3 && mood >= 7) {
    return "What a great day! Low pain and high mood - I'm tracking what made today different.";
  }
  
  // Rough day - high pain or high pain + low mood
  if (pain >= 8 || (pain >= 7 && mood <= 3)) {
    return `Pain at ${pain}/10 today. Hope you have a good day regardless.`;
  }
  
  // Improvement from yesterday
  if (previousCheckIn && pain < previousCheckIn.pain - 2) {
    return `Nice improvement! Pain dropped from ${previousCheckIn.pain}/10 to ${pain}/10.`;
  }
  
  // Worsening from yesterday
  if (previousCheckIn && pain > previousCheckIn.pain + 2) {
    return `Pain increased from ${previousCheckIn.pain}/10 to ${pain}/10 today. I'm tracking what's different.`;
  }
  
  // Sleep correlation - good sleep
  if (sleep >= 7 && pain <= 5) {
    return `Great sleep (${sleep}/10) and manageable pain (${pain}/10) - that's a winning combination.`;
  }
  
  // Sleep correlation - poor sleep
  if (sleep <= 5 && pain >= 7) {
    return `I notice the connection between poor sleep (${sleep}/10) and higher pain (${pain}/10).`;
  }
  
  // Default acknowledgment - concise and forward-looking
  return `Pain at ${pain}/10 today. Hope you have a good day.`;
}

