const fs = require('fs')
const path = require('path')
const mjml2html = require('mjml')

function compile(templatePath, outPath, vars) {
  let mjml = fs.readFileSync(templatePath, 'utf8')
  mjml = mjml
    .replace(/\{\{check_in_url\}\}/g, vars.check_in_url)
    .replace(/\{\{quick_save_url\}\}/g, vars.quick_save_url)
    .replace(/\{\{unsubscribe_url\}\}/g, vars.unsubscribe_url)
    .replace(/\{\{user_name\}\}/g, vars.user_name)
    .replace(/\{\{pain\}\}/g, String(vars.pain))
    .replace(/\{\{mood\}\}/g, String(vars.mood))
    .replace(/\{\{sleep\}\}/g, String(vars.sleep))
    .replace(/\{\{bar_pain\}\}/g, vars.bar_pain)
    .replace(/\{\{bar_mood\}\}/g, vars.bar_mood)
    .replace(/\{\{bar_sleep\}\}/g, vars.bar_sleep)
    .replace(/\{\{readiness_emoji\}\}/g, vars.readiness_emoji)
    .replace(/\{\{readiness_percent\}\}/g, String(vars.readiness_percent))
    .replace(/\{\{readiness_message\}\}/g, vars.readiness_message)
    .replace(/\{\{stack_lines\}\}/g, vars.stack_lines)
    .replace(/\{\{pct_pain\}\}/g, vars.pct_pain)
    .replace(/\{\{pct_mood\}\}/g, vars.pct_mood)
    .replace(/\{\{pct_sleep\}\}/g, vars.pct_sleep)
  const { html, errors } = mjml2html(mjml, { validationLevel: 'soft' })
  if (errors && errors.length) {
    console.error('MJML validation warnings/errors:', errors)
  }
  fs.writeFileSync(outPath, html)
  console.log('Wrote', outPath)
}

function main() {
  const template = path.resolve(__dirname, '../emails/templates/daily-reminder.mjml')
  const base = 'http://localhost:3009'
  const mkBars = (p, m, s) => ({
    pct_pain: `${Math.round((Math.max(0, Math.min(10, p)) / 10) * 100)}%`,
    pct_mood: `${Math.round((Math.max(0, Math.min(10, m)) / 10) * 100)}%`,
    pct_sleep: `${Math.round((Math.max(0, Math.min(10, s)) / 10) * 100)}%`,
  })
  const mkStack = (arr) => arr.map((x) => x).join('<br/>')

  const scenarios = [
    {
      out: '/tmp/mjml-daily-high-pain.html',
      user_name: 'Ben', pain: 8, mood: 3, sleep: 4,
      readiness_emoji: '🌙', readiness_percent: 35, readiness_message: 'Low-energy day, rest is progress',
      stack_lines: '🧴 Magnesium<br/>🐟 Omega-3<br/>🧪 Turmeric'
    },
    {
      out: '/tmp/mjml-daily-good-day.html',
      user_name: 'Ben', pain: 2, mood: 8, sleep: 8,
      readiness_emoji: '🌞', readiness_percent: 85, readiness_message: 'High energy — great day to move.',
      stack_lines: '🧴 Magnesium<br/>🐟 Omega-3'
    },
    {
      out: '/tmp/mjml-daily-mixed.html',
      user_name: 'Ben', pain: 6, mood: 7, sleep: 5,
      readiness_emoji: '💧', readiness_percent: 60, readiness_message: 'Take it steady — light activity today.',
      stack_lines: '🧴 Magnesium<br/>🐟 Omega-3<br/>🔥 Sauna Protocol'
    }
  ]

  for (const sc of scenarios) {
    const vars = {
      check_in_url: `${base}/dash`,
      quick_save_url: `${base}/api/checkin/magic?token=TEST123`,
      unsubscribe_url: `${base}/settings/notifications`,
      user_name: sc.user_name,
      pain: sc.pain, mood: sc.mood, sleep: sc.sleep,
      ...mkBars(sc.pain, sc.mood, sc.sleep),
      readiness_emoji: sc.readiness_emoji,
      readiness_percent: sc.readiness_percent,
      readiness_message: sc.readiness_message,
      stack_lines: sc.stack_lines,
    }
    compile(template, sc.out, vars)
  }
}

main()


