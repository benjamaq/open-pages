interface PatternCardProps {
  emoji: string
  title: string
  description: string
  insight: string
  borderColor: string
  bgColor: string
  preLabel?: string
}

export default function PatternCard({ emoji, title, description, insight, borderColor, bgColor, preLabel }: PatternCardProps) {
  const words = description.split(' ')
  const first = words.slice(0, 4).join(' ')
  const rest = words.slice(4).join(' ')
  return (
    <div className={`pattern-card min-h-[320px] h-full flex flex-col p-6 rounded-lg border-2 bg-white ${borderColor}`}>
      {preLabel && (
        <div className="text-xs text-blue-600 font-medium mb-1">{preLabel}</div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{emoji}</span>
        <h3 className="font-bold text-lg">{title}</h3>
        <span className="ml-auto text-blue-500">💙</span>
      </div>
      <p className="text-base mb-4 flex-grow leading-relaxed text-gray-700">
        <strong>{first}</strong>{rest ? ` ${rest}` : ''}
      </p>
      <p className="text-sm text-gray-600 italic mt-auto border-t pt-3">{insight}</p>
    </div>
  )
}


