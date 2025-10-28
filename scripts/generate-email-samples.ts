import { writeFileSync } from 'fs'
import { renderDailyEmailHTMLv3 } from '../src/lib/email/daily-email-template'

function main() {
  const base = 'http://localhost:3009'

  const common = {
    userName: 'Ben',
    magicUrl: `${base}/api/checkin/magic?token=TEST123`,
    checkInUrl: `${base}/dash`,
    optOutUrl: `${base}/settings/notifications`,
  }

  const highPain = renderDailyEmailHTMLv3({
    ...common,
    pain: 8,
    mood: 3,
    sleep: 4,
    readinessScore: 35,
    readinessEmoji: '🌙',
    readinessMessage: 'Low-energy day — rest is progress.',
    insightLine: 'Your pain increased after a rough night. Be gentle with yourself today.',
    supplementList: ['Magnesium', 'Omega-3', 'Turmeric'],
  })
  writeFileSync('/tmp/email-high-pain.html', highPain)

  const goodDay = renderDailyEmailHTMLv3({
    ...common,
    pain: 2,
    mood: 8,
    sleep: 8,
    readinessScore: 85,
    readinessEmoji: '🌞',
    readinessMessage: 'High energy — great day to move.',
    insightLine: 'Your pain eased after excellent sleep — nice work staying consistent.',
    supplementList: ['Magnesium', 'Omega-3'],
  })
  writeFileSync('/tmp/email-good-day.html', goodDay)

  const mixed = renderDailyEmailHTMLv3({
    ...common,
    pain: 6,
    mood: 7,
    sleep: 5,
    readinessScore: 60,
    readinessEmoji: '💧',
    readinessMessage: 'Take it steady — light activity today.',
    insightLine: "Your mood improved despite moderate pain. Let's track what's helping.",
    supplementList: ['Magnesium', 'Omega-3', 'Sauna Protocol'],
  })
  writeFileSync('/tmp/email-mixed.html', mixed)

  // Also write final spec versions
  writeFileSync('/tmp/email-final-high-pain.html', highPain)
  writeFileSync('/tmp/email-final-good-day.html', goodDay)
  writeFileSync('/tmp/email-final-mixed.html', mixed)

  console.log('Wrote: /tmp/email-high-pain.html, /tmp/email-good-day.html, /tmp/email-mixed.html')
  console.log('Wrote (final): /tmp/email-final-high-pain.html, /tmp/email-final-good-day.html, /tmp/email-final-mixed.html')
}

main()


