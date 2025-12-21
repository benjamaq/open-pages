'use client'

export default function OnboardingBackground() {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: "url('/supps.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      aria-hidden
    />
  )
}


