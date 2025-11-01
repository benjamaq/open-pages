interface PatternCardProps {
  emoji: string
  title: string
  description: string
  insight: string
  borderColor: string
  bgColor: string
}

export default function PatternCard({ emoji, title, description, insight, borderColor, bgColor }: PatternCardProps) {
  const words = description.split(' ')
  const first = words.slice(0, 4).join(' ')
  const rest = words.slice(4).join(' ')
  return (
    <div className={`border-2 ${borderColor} rounded-lg p-6 ${bgColor} h-full min-h-[280px] flex flex-col`}>
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <span className="text-3xl">{emoji}</span>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <p className="text-base text-gray-700 mb-4 flex-grow">
        <strong>{first}</strong>{rest ? ` ${rest}` : ''}
      </p>
      <p className="text-sm text-gray-600 italic mt-auto flex-shrink-0">Insight: {insight}</p>
    </div>
  )
}


