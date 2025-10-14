'use client';

import { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { TypingIndicator } from './TypingIndicator';
import { getLatestElliMessage, dismissElliMessage, getAllElliMessages } from '@/lib/db/elliMessages';
import type { ElliMessage } from '@/lib/db/elliMessages';

interface ElliCardProps {
  userId: string;
  triggerRefresh?: number; // Change this to trigger a refresh
}

/**
 * ElliCard Component
 * Always-visible card on dashboard that shows Elli's latest message
 * Updates after check-ins, at milestones, etc.
 */
export function ElliCard({ userId, triggerRefresh }: ElliCardProps) {
  const [elliMessage, setElliMessage] = useState<ElliMessage | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showTyping, setShowTyping] = useState(true);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ElliMessage[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadElliMessage();
  }, [userId, triggerRefresh]);

  async function loadElliMessage() {
    setLoading(true);
    const message = await getLatestElliMessage(userId);
    
    if (message) {
      // Check if this is a new message (created in last 5 seconds)
      const messageAge = Date.now() - new Date(message.created_at).getTime();
      const isNew = messageAge < 5000;
      
      setIsNewMessage(isNew);
      setElliMessage(message);
      
      if (isNew) {
        // Show typing animation for new messages
        setShowTyping(true);
        setTimeout(() => setShowTyping(false), 1500);
      } else {
        // Show instantly for old messages
        setShowTyping(false);
      }
    }
    setLoading(false);
  }

  async function loadHistory() {
    if (loadingHistory || history) return;
    setLoadingHistory(true);
    try {
      const messages = await getAllElliMessages(userId, 10);
      setHistory(messages);
    } catch (err) {
      console.error('Failed to load Elli history:', err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleDismiss = async () => {
    if (elliMessage) {
      setDismissed(true);
      try {
        await dismissElliMessage(elliMessage.id);
      } catch (error) {
        console.error('Failed to dismiss message:', error);
      }
    }
  };

  if (loading || !elliMessage || dismissed) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💙</span>
          <h3 className="text-lg font-semibold text-gray-900">Elli</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowHistory(prev => !prev);
              if (!history) loadHistory();
            }}
            className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-2"
          >
            History
          </button>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="min-h-[60px]">
        {showTyping && isNewMessage ? (
          <div className="py-4">
            <TypingIndicator />
          </div>
        ) : (
          <div className="text-gray-700 whitespace-pre-line">
            {isNewMessage ? (
              <TypeAnimation
                sequence={[elliMessage.message_text]}
                speed={35}
                wrapper="p"
                cursor={false}
              />
            ) : (
              <p>{elliMessage.message_text}</p>
            )}
          </div>
        )}
      </div>
      
      {elliMessage.context?.daysOfTracking && (
        <div className="mt-4 text-sm text-gray-500">
          Based on {elliMessage.context.daysOfTracking} {elliMessage.context.daysOfTracking === 1 ? 'day' : 'days'} of tracking
        </div>
      )}

      {/* History Drawer */}
      {showHistory && (
        <div className="mt-5 border-t border-purple-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-800">Recent messages</p>
            {loadingHistory && <span className="text-xs text-gray-500">Loading…</span>}
          </div>
          {history && history.length === 0 && (
            <p className="text-sm text-gray-500">No history yet.</p>
          )}
          {history && history.length > 0 && (
            <ul className="space-y-2 max-h-56 overflow-auto">
              {history.map(msg => (
                <li key={msg.id} className="p-3 bg-white/50 rounded-md border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">{msg.message_type}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                    {msg.message_text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

