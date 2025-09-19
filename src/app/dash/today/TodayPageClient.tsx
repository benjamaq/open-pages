'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Profile {
  id: string
  slug: string
  display_name: string
}

interface StackItem {
  id: string
  name: string
  dose: string | null
  timing: string | null
  brand: string | null
  notes: string | null
  frequency: string
  time_preference: string
  schedule_days: number[]
}

interface Protocol {
  id: string
  name: string
  description: string | null
  frequency: string
  time_preference: string
  schedule_days: number[]
}

interface TodayPageClientProps {
  profile: Profile
  stackItems: StackItem[]
  protocols: Protocol[]
  currentDate: string
}

export default function TodayPageClient({ 
  profile, 
  stackItems, 
  protocols, 
  currentDate 
}: TodayPageClientProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const toggleCompletion = (itemId: string, type: 'stack' | 'protocol') => {
    const key = `${type}-${itemId}`
    setCompletedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const isCompleted = (itemId: string, type: 'stack' | 'protocol') => {
    return completedItems.has(`${type}-${itemId}`)
  }

  // Group items by time preference
  const morningStackItems = stackItems.filter(item => item.time_preference === 'morning')
  const afternoonStackItems = stackItems.filter(item => item.time_preference === 'afternoon')
  const eveningStackItems = stackItems.filter(item => item.time_preference === 'evening')
  const anytimeStackItems = stackItems.filter(item => item.time_preference === 'anytime')

  const morningProtocols = protocols.filter(item => item.time_preference === 'morning')
  const afternoonProtocols = protocols.filter(item => item.time_preference === 'afternoon')
  const eveningProtocols = protocols.filter(item => item.time_preference === 'evening')
  const anytimeProtocols = protocols.filter(item => item.time_preference === 'anytime')

  const totalItems = stackItems.length + protocols.length
  const completedCount = completedItems.size
  const completionPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

  const getEncouragementMessage = () => {
    if (completionPercentage >= 90) return "Amazing work today! You're taking excellent care of yourself. 🌟"
    if (completionPercentage >= 70) return "Great progress today! You're building healthy habits. 💪"
    if (completionPercentage >= 50) return "Nice work! Every step forward counts. 🌱"
    if (completionPercentage >= 25) return "You're making progress! Be kind to yourself. 💚"
    return "Today is a fresh start. Small steps lead to big changes. ✨"
  }

  const ActivityCard = ({ 
    item, 
    type, 
    isCompleted 
  }: { 
    item: StackItem | Protocol
    type: 'stack' | 'protocol'
    isCompleted: boolean 
  }) => (
    <div className={`border rounded-lg p-4 transition-all ${
      isCompleted 
        ? 'bg-green-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-medium ${isCompleted ? 'text-green-900 line-through' : 'text-gray-900'}`}>
            {item.name}
            {type === 'stack' && (item as StackItem).dose && (
              <span className="text-sm text-gray-600 ml-1">({(item as StackItem).dose})</span>
            )}
          </h3>
          {type === 'stack' && (item as StackItem).brand && (
            <p className="text-sm text-gray-600 mt-1">{(item as StackItem).brand}</p>
          )}
          {type === 'protocol' && (item as Protocol).description && (
            <p className="text-sm text-gray-600 mt-1">{(item as Protocol).description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {item.frequency} • {item.time_preference}
          </p>
        </div>
        
        <button
          onClick={() => toggleCompletion(item.id, type)}
          className={`p-2 rounded-full transition-colors ${
            isCompleted
              ? 'text-green-600 hover:text-green-700'
              : 'text-gray-400 hover:text-green-600'
          }`}
        >
          <svg className="w-5 h-5" fill={isCompleted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  )

  const TimeSection = ({ 
    title, 
    stackItems: sectionStackItems, 
    protocols: sectionProtocols,
    icon 
  }: { 
    title: string
    stackItems: StackItem[]
    protocols: Protocol[]
    icon: React.ReactNode 
  }) => {
    const hasItems = sectionStackItems.length > 0 || sectionProtocols.length > 0
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          {icon}
          <h3 className="text-lg font-medium text-gray-900 ml-2">{title}</h3>
          <span className="ml-2 text-sm text-gray-500">
            ({sectionStackItems.length + sectionProtocols.length})
          </span>
        </div>
        
        {hasItems ? (
          <div className="space-y-3">
            {sectionStackItems.map((item) => (
              <ActivityCard 
                key={item.id} 
                item={item} 
                type="stack" 
                isCompleted={isCompleted(item.id, 'stack')} 
              />
            ))}
            {sectionProtocols.map((item) => (
              <ActivityCard 
                key={item.id} 
                item={item} 
                type="protocol" 
                isCompleted={isCompleted(item.id, 'protocol')} 
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No activities scheduled for this time</p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Navigation */}
        <nav className="border-b border-gray-200" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/dash" className="hover:opacity-90 transition-opacity">
                <img 
                  src="/BIOSTACKR LOGO 2.png" 
                  alt="Biostackr" 
                  className="h-16 w-auto"
                  style={{ width: '280px' }}
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Dashboard Button */}
              <Link 
                href="/dash" 
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Dashboard
              </Link>
              
              <button 
                onClick={async () => {
                  const { createClient } = await import('../../../lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/'
                }}
                className="text-sm font-medium hover:text-gray-700 transition-colors"
                style={{ color: '#5C6370' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Today's Protocol</h1>
          <p className="text-gray-600 mt-2">
            Your personalized daily wellness routine for {formatDate(currentDate)}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <Link
              href="/dash"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Overview
            </Link>
            <Link
              href="/dash/stack"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Stack
            </Link>
            <Link
              href="/dash/protocols"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Protocols
            </Link>
            <Link
              href="/dash/uploads"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Uploads
            </Link>
            <Link
              href="/dash/today"
              className="border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Today's Protocol
            </Link>
            <Link
              href={`/u/${profile.slug}`}
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Public Profile
            </Link>
          </nav>
        </div>

        {/* Progress Card */}
        {totalItems > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Today's Progress</h2>
                <p className="text-gray-600 mt-1">
                  {completedCount} of {totalItems} activities completed
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {completionPercentage}%
                </div>
                <p className="text-sm text-gray-500">Complete</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-md border border-blue-200">
              <p className="text-blue-800 text-sm font-medium">
                {getEncouragementMessage()}
              </p>
            </div>
          </div>
        )}

        {/* Schedule Sections */}
        {totalItems > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimeSection
              title="Morning"
              stackItems={morningStackItems}
              protocols={morningProtocols}
              icon={
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />

            <TimeSection
              title="Afternoon"
              stackItems={afternoonStackItems}
              protocols={afternoonProtocols}
              icon={
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />

            <TimeSection
              title="Evening"
              stackItems={eveningStackItems}
              protocols={eveningProtocols}
              icon={
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              }
            />

            <TimeSection
              title="Anytime"
              stackItems={anytimeStackItems}
              protocols={anytimeProtocols}
              icon={
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities scheduled for today</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add scheduling to your stack items and protocols to see your daily routine here
            </p>
            <div className="mt-6 space-x-3">
              <Link
                href="/dash/stack"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Manage Stack
              </Link>
              <Link
                href="/dash/protocols"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Manage Protocols
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
