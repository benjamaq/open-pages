"use client"

import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import PatternCard from './PatternCard'

interface PatternItem {
  emoji: string
  title: string
  description: string
  insight: string
  borderColor: string
  bgColor: string
}

interface Props {
  patterns: PatternItem[]
}

export default function PatternCarousel({ patterns }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, duration: 25 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null)
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const AUTO_DELAY_MS = 8000 // 8 seconds per slide

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const stopAuto = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current)
    autoTimerRef.current = null
  }, [])

  const startAuto = useCallback(() => {
    if (!emblaApi) return
    stopAuto()
    autoTimerRef.current = setInterval(() => {
      emblaApi.scrollNext()
    }, AUTO_DELAY_MS)
  }, [emblaApi, stopAuto])

  useEffect(() => {
    if (!emblaApi) return
    startAuto()
    return () => {
      stopAuto()
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [emblaApi, startAuto, stopAuto])

  const handleManual = () => {
    stopAuto()
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => startAuto(), 15000)
  }

  const scrollTo = (index: number) => { emblaApi?.scrollTo(index); handleManual() }
  const scrollPrev = () => { emblaApi?.scrollPrev(); handleManual() }
  const scrollNext = () => { emblaApi?.scrollNext(); handleManual() }

  return (
    <div className="relative carousel-container" onMouseEnter={stopAuto} onMouseLeave={startAuto}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6 items-stretch">
          {patterns.map((p, idx) => (
            <div key={idx} className="shrink-0 basis-full sm:basis-3/4 md:basis-1/2 lg:basis-1/3 h-full">
              <PatternCard {...p} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        aria-label="Previous"
        onClick={scrollPrev}
        className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 bg-white shadow rounded-full w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50"
      >
        ‹
      </button>
      <button
        aria-label="Next"
        onClick={scrollNext}
        className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 bg-white shadow rounded-full w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50"
      >
        ›
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2.5 h-2.5 rounded-full ${index === selectedIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}


