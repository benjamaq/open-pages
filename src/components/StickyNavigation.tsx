'use client'

import { useState, useEffect } from 'react'

interface StickyNavigationProps {
  modules: {
    journal?: boolean
    supplements?: boolean
    protocols?: boolean
    movement?: boolean
    mindfulness?: boolean
    library?: boolean
    gear?: boolean
  }
}

export default function StickyNavigation({ modules }: StickyNavigationProps) {
  const [isSticky, setIsSticky] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('[data-hero-end]')
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom
        setIsSticky(heroBottom < 0)
      }
    }

    const observerOptions = {
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)
    
    // Observe all sections
    const sections = ['overview', 'journal', 'supplements', 'protocols', 'movement', 'mindfulness', 'library', 'gear']
    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId)
      if (element) observer.observe(element)
    })

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80 // Account for sticky nav height
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

  const navItems = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'journal', label: 'Journal', show: modules.journal },
    { id: 'supplements', label: 'Supplements', show: modules.supplements },
    { id: 'protocols', label: 'Protocols', show: modules.protocols },
    { id: 'movement', label: 'Movement', show: modules.movement },
    { id: 'mindfulness', label: 'Mindfulness', show: modules.mindfulness },
    { id: 'library', label: 'Library', show: modules.library },
    { id: 'gear', label: 'Gear', show: modules.gear },
  ].filter(item => item.show)

  return (
    <nav className={`bg-white border-b border-gray-200 transition-all duration-200 z-40 ${
      isSticky ? 'fixed top-0 left-0 right-0 shadow-sm' : 'relative'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-3">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Navigation - Horizontal Scroll */}
          <div className="md:hidden w-full">
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    activeSection === item.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
