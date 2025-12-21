export function Sparkline({ data, color = 'rgb(34, 197, 94)' }: { 
  data: number[]
  color?: string 
}) {
  if (!data || data.length < 2) return null
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 80
    const y = 20 - ((value - min) / range) * 18
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg width="80" height="20" className="mt-1">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


