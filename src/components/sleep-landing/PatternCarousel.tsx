"use client"

import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, duration: 30 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

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

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (!emblaApi) return
    const autoplay = setInterval(() => {
      emblaApi.scrollNext()
    }, 6000)
    return () => clearInterval(autoplay)
  }, [emblaApi])

  const scrollTo = (index: number) => emblaApi?.scrollTo(index)
  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6 transition-transform duration-300 ease-in-out">
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


