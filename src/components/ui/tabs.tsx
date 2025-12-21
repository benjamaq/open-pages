'use client'
import * as React from 'react'

type TabsProps = {
  value: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const [current, setCurrent] = React.useState(value)
  React.useEffect(() => setCurrent(value), [value])
  const ctx = React.useMemo(() => ({
    value: current,
    setValue: (v: string) => {
      setCurrent(v)
      onValueChange?.(v)
    }
  }), [current, onValueChange])
  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsContext = React.createContext<{ value: string; setValue: (v: string) => void } | null>(null)
function useTabs() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>')
  return ctx
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={['flex items-center gap-2', className || ''].join(' ')}>{children}</div>
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: current, setValue } = useTabs()
  const active = current === value
  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={[
        'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
        active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        className || ''
      ].join(' ')}
      aria-selected={active}
      role="tab"
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: current } = useTabs()
  if (current !== value) return null
  return <div className={className}>{children}</div>
}


