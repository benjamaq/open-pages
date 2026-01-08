import fs from 'fs'
import path from 'path'
import mjml2html from 'mjml'

export type DailyReminderVars = {
  user_name: string
  // Prefer energy/focus; keep legacy fields for backward compatibility
  energy?: number
  focus?: number
  sleep: number
  pain?: number
  mood?: number
  readiness_percent: number
  readiness_emoji: string
  readiness_message: string
  stack_lines: string
  check_in_url: string
  quick_save_url: string
  unsubscribe_url: string
}

function pct(value0to10: number): string {
  const v = Math.max(0, Math.min(10, Math.round(value0to10)))
  return `${Math.round((v / 10) * 100)}%`
}

export function renderDailyReminderHTML(vars: DailyReminderVars): string {
  const templatePath = path.resolve(process.cwd(), 'emails/templates/daily-reminder.mjml')
  let mjml = fs.readFileSync(templatePath, 'utf8')
  const energy = typeof vars.energy === 'number' ? vars.energy : (typeof vars.pain === 'number' ? vars.pain : 0)
  const focus = typeof vars.focus === 'number' ? vars.focus : (typeof vars.mood === 'number' ? vars.mood : 0)
  const replacements: Record<string, string> = {
    '{{user_name}}': vars.user_name,
    // Legacy placeholders
    '{{pain}}': String(energy),
    '{{mood}}': String(focus),
    '{{sleep}}': String(vars.sleep),
    '{{pct_pain}}': pct(energy),
    '{{pct_mood}}': pct(focus),
    '{{pct_sleep}}': pct(vars.sleep),
    // New placeholders (if template updated)
    '{{energy}}': String(energy),
    '{{focus}}': String(focus),
    '{{pct_energy}}': pct(energy),
    '{{pct_focus}}': pct(focus),
    '{{readiness_emoji}}': vars.readiness_emoji,
    '{{readiness_percent}}': String(Math.max(0, Math.min(100, Math.round(vars.readiness_percent)))) ,
    '{{readiness_message}}': vars.readiness_message,
    '{{stack_lines}}': vars.stack_lines,
    '{{check_in_url}}': vars.check_in_url,
    '{{quick_save_url}}': vars.quick_save_url,
    '{{unsubscribe_url}}': vars.unsubscribe_url,
  }
  for (const [k, v] of Object.entries(replacements)) mjml = mjml.replaceAll(k, v)
  const { html, errors } = mjml2html(mjml, { validationLevel: 'soft' })
  if (errors && errors.length) {
    // Surface warnings in logs but still return HTML (MJML often warns on harmless things)
    try { console.warn('[mjml] warnings', errors) } catch { /* noop */ }
  }
  return html
}

export function getDailyReminderSubject(userName: string): string {
  const safe = (userName || '').trim() || 'there'
  return `${safe}, ready for your 20-second check-in?`
}


