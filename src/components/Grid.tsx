import { ReactNode } from 'react'

interface GridProps {
  children: ReactNode
  className?: string
}

export default function Grid({ children, className = '' }: GridProps) {
  return (
    <div className={`auto-grid ${className}`}>
      {children}
      <style jsx>{`
        .auto-grid {
          display: grid;
          grid-gap: 24px;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }
        @media (max-width: 640px) {
          .auto-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
